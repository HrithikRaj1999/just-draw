#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from utils import CLOUD_ENV_FILE, Logger, PROJECT_ROOT, run_command


TF_DIR = PROJECT_ROOT / "infra" / "terraform"
BACKEND_DIR = PROJECT_ROOT / "apps" / "server"
CLIENT_DIR = PROJECT_ROOT / "apps" / "web"
DEPLOY_ENV_FILE = CLOUD_ENV_FILE


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if key and value and not os.getenv(key):
            os.environ[key] = value


def terraform_init() -> None:
    run_command(["terraform", "init", "-input=false"], cwd=TF_DIR)


def terraform_apply(var_pairs: list[str] | None = None) -> None:
    command = ["terraform", "apply", "-auto-approve"]
    merged_vars = [f"aws_region={aws_region()}"]
    if var_pairs:
        merged_vars.extend(var_pairs)
    for var in merged_vars:
        command.extend(["-var", var])
    run_command(command, cwd=TF_DIR)


def terraform_destroy() -> None:
    run_command(["terraform", "destroy", "-auto-approve"], cwd=TF_DIR)


def terraform_output_raw(name: str) -> str:
    result = run_command(
        ["terraform", "output", "-raw", name],
        cwd=TF_DIR,
        capture=True,
        check=False,
    )
    return (result.stdout or "").strip()


def require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def aws_region() -> str:
    return os.getenv("AWS_REGION", "us-east-1")


def ensure_aws_auth() -> None:
    run_command(["aws", "sts", "get-caller-identity"], capture=True)


def ecr_login(region: str, registry_host: str) -> None:
    password = run_command(
        ["aws", "ecr", "get-login-password", "--region", region],
        capture=True,
    ).stdout
    if not password:
        raise RuntimeError("Unable to get ECR login password.")

    subprocess.run(
        ["docker", "login", "--username", "AWS", "--password-stdin", registry_host],
        input=password,
        text=True,
        check=True,
    )


def build_and_push_backend_image(ecr_repo_url: str) -> str:
    if not ecr_repo_url:
        raise RuntimeError("ECR repository URL is empty.")

    region = aws_region()
    registry_host = ecr_repo_url.split("/")[0]
    image_tag = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    image_uri = f"{ecr_repo_url}:{image_tag}"

    Logger.step(f"Building backend image: {image_uri}")
    run_command(["docker", "build", "-t", image_uri, "."], cwd=BACKEND_DIR)

    Logger.step("Logging in to ECR")
    ecr_login(region, registry_host)

    Logger.step("Pushing backend image")
    run_command(["docker", "push", image_uri], cwd=PROJECT_ROOT)
    return image_uri


def deploy_frontend_to_cloudflare(project_name: str, branch: str) -> None:
    ws_endpoint = terraform_output_raw("websocket_endpoint")
    if not ws_endpoint:
        raise RuntimeError("Unable to resolve websocket_endpoint from Terraform outputs.")

    env = dict(os.environ)
    env["VITE_WS_URL"] = ws_endpoint
    Logger.success(f"Using VITE_WS_URL for frontend build: {ws_endpoint}")

    Logger.step("Installing frontend dependencies")
    run_command(["npm", "ci"], cwd=CLIENT_DIR, env=env)

    Logger.step("Building frontend")
    run_command(["npm", "run", "build", "--", "--mode", "cloud"], cwd=CLIENT_DIR, env=env)

    env["CLOUDFLARE_ACCOUNT_ID"] = require_env("CLOUDFLARE_ACCOUNT_ID")
    env["CLOUDFLARE_API_TOKEN"] = require_env("CLOUDFLARE_API_TOKEN")

    Logger.step("Deploying frontend to Cloudflare Pages")
    run_command(
        [
            "npx",
            "wrangler",
            "pages",
            "deploy",
            "dist",
            "--project-name",
            project_name,
            "--branch",
            branch,
        ],
        cwd=CLIENT_DIR,
        env=env,
    )


def deploy_full_stack(desired_count: int, cloudflare_branch: str) -> None:
    Logger.header("Full Deploy: AWS Backend + Cloudflare Frontend")
    ensure_aws_auth()

    Logger.step("Ensuring infrastructure exists (initial apply with desired_count=0)")
    terraform_apply(["desired_count=0"])

    ecr_url = terraform_output_raw("ecr_repository_url")
    image_uri = build_and_push_backend_image(ecr_url)

    Logger.step("Applying infrastructure with latest backend image")
    terraform_apply(
        [
            f"desired_count={desired_count}",
            f"container_image={image_uri}",
        ]
    )

    ws_endpoint = terraform_output_raw("websocket_endpoint")
    if ws_endpoint:
        Logger.success(f"Backend WebSocket endpoint: {ws_endpoint}")

    cf_project = require_env("CLOUDFLARE_PAGES_PROJECT_NAME")
    deploy_frontend_to_cloudflare(cf_project, cloudflare_branch)
    Logger.success("Full deploy finished.")


def main() -> None:
    load_env_file(DEPLOY_ENV_FILE)

    parser = argparse.ArgumentParser(description="Cloud deployment control")
    parser.add_argument("--stop", action="store_true", help="Scale ECS service down.")
    parser.add_argument("--destroy", action="store_true", help="Destroy AWS infrastructure.")
    parser.add_argument(
        "--desired-count",
        type=int,
        default=2,
        help="Desired ECS count for apply mode.",
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Deploy backend to AWS and frontend to Cloudflare in one command.",
    )
    parser.add_argument(
        "--cloudflare-branch",
        default=os.getenv("CLOUDFLARE_PAGES_BRANCH", "main"),
        help="Cloudflare Pages branch name for deployment.",
    )
    args = parser.parse_args()

    Logger.header("Cloud Deployment")
    terraform_init()

    if args.destroy:
        Logger.warning("Destroying AWS infrastructure...")
        terraform_destroy()
        Logger.success("Terraform destroy complete.")
        return

    if args.stop:
        Logger.step("Scaling ECS service to zero tasks.")
        terraform_apply(["desired_count=0"])
        Logger.success("Cloud service scaled down.")
        return

    if args.full:
        deploy_full_stack(args.desired_count, args.cloudflare_branch)
        return

    Logger.step(f"Applying AWS infrastructure with desired_count={args.desired_count}")
    terraform_apply([f"desired_count={args.desired_count}"])
    ws_endpoint = terraform_output_raw("websocket_endpoint")
    if ws_endpoint:
        Logger.success(f"WebSocket endpoint: {ws_endpoint}")


if __name__ == "__main__":
    main()
