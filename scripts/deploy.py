#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from utils import Logger, PROJECT_ROOT, run_command


TF_DIR = PROJECT_ROOT / "infra" / "terraform"


def terraform_init() -> None:
    run_command(["terraform", "init", "-input=false"], cwd=TF_DIR)


def terraform_apply(extra_args: list[str] | None = None) -> None:
    command = ["terraform", "apply", "-auto-approve"]
    if extra_args:
        command.extend(extra_args)
    run_command(command, cwd=TF_DIR)


def terraform_output_json() -> dict:
    result = run_command(
        ["terraform", "output", "-json"],
        cwd=TF_DIR,
        capture=True,
    )
    return json.loads(result.stdout or "{}")


def terraform_destroy() -> None:
    run_command(["terraform", "destroy", "-auto-approve"], cwd=TF_DIR)


def main() -> None:
    parser = argparse.ArgumentParser(description="Cloud deployment control")
    parser.add_argument("--stop", action="store_true", help="Scale cloud service down.")
    parser.add_argument(
        "--destroy",
        action="store_true",
        help="Destroy cloud infrastructure.",
    )
    parser.add_argument(
        "--desired-count",
        type=int,
        default=2,
        help="Desired ECS count for apply mode.",
    )
    args = parser.parse_args()

    Logger.header("Cloud Deployment")
    terraform_init()

    if args.destroy:
        Logger.warning("Destroying cloud infrastructure...")
        terraform_destroy()
        Logger.success("Terraform destroy complete.")
        return

    if args.stop:
        Logger.step("Scaling ECS service to zero tasks.")
        terraform_apply(["-var", "desired_count=0"])
        Logger.success("Cloud service scaled down.")
        return

    Logger.step(f"Applying infrastructure with desired_count={args.desired_count}")
    terraform_apply(["-var", f"desired_count={args.desired_count}"])
    outputs = terraform_output_json()
    ws_endpoint = outputs.get("websocket_endpoint", {}).get("value", "")
    cf_domain = outputs.get("cloudfront_domain_name", {}).get("value", "")
    if ws_endpoint:
        Logger.success(f"WebSocket endpoint: {ws_endpoint}")
    if cf_domain:
        Logger.success(f"CloudFront domain: https://{cf_domain}")


if __name__ == "__main__":
    main()
