#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from utils import (
    APPS_ENV_DIR,
    CLOUD_ENV_FILE,
    LOCAL_ENV_FILE,
    Logger,
    PROJECT_ROOT,
    command_exists,
    run_command,
)


BACKEND_DIR = PROJECT_ROOT / "apps" / "server"
CLIENT_DIR = PROJECT_ROOT / "apps" / "web"
TF_DIR = PROJECT_ROOT / "infra" / "terraform"
NPM_COMMAND = "npm.cmd" if os.name == "nt" else "npm"

DEFAULT_LOCAL_PROFILE = """ENABLE_CLOUD=false
BACKEND_PORT=5000
BACKEND_CORS_ORIGIN=*
BACKEND_REDIS_URL=redis://127.0.0.1:6379
BACKEND_BOARD_STORAGE_DIR=./data/boards
BACKEND_AUTOSAVE_DEBOUNCE_MS=750
VITE_WS_URL=ws://localhost:5000
"""

DEFAULT_CLOUD_PROFILE = """ENABLE_CLOUD=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_PAGES_PROJECT_NAME=
CLOUDFLARE_PAGES_BRANCH=main
TF_VAR_project_name=realtime-drawing-tool
TF_VAR_environment=prod
TF_VAR_socket_allowed_origin=
VITE_WS_URL=
"""


def require_commands(commands: list[str]) -> None:
    missing = [command for command in commands if not command_exists(command)]
    if missing:
        Logger.error(f"Missing required command(s): {', '.join(missing)}")
        sys.exit(1)


def ensure_file(path: Path, content: str) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def setup_env_files() -> None:
    Logger.header("Environment Files")
    APPS_ENV_DIR.mkdir(parents=True, exist_ok=True)
    ensure_file(LOCAL_ENV_FILE, DEFAULT_LOCAL_PROFILE)
    ensure_file(CLOUD_ENV_FILE, DEFAULT_CLOUD_PROFILE)
    Logger.success("Central env files verified in apps/env.")


def setup_node_deps() -> None:
    Logger.header("Installing Dependencies")
    for app_dir in [BACKEND_DIR, CLIENT_DIR]:
        Logger.step(f"npm install in {app_dir.name}")
        run_command([NPM_COMMAND, "install", "--no-audit", "--no-fund"], cwd=app_dir)
    Logger.success("Backend and client dependencies installed.")


def setup_terraform() -> None:
    Logger.header("Terraform Bootstrap")
    run_command(["terraform", "init", "-input=false"], cwd=TF_DIR)
    Logger.success("Terraform initialized.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Setup project prerequisites")
    parser.add_argument(
        "--cloud",
        action="store_true",
        help="Also initialize Terraform for cloud mode.",
    )
    args = parser.parse_args()

    enable_cloud = args.cloud

    required = ["python", "npm", "node"]
    if enable_cloud:
        required.extend(["terraform", "aws", "docker"])
    require_commands(required)

    setup_env_files()
    setup_node_deps()
    if enable_cloud:
        setup_terraform()

    Logger.header("Setup Complete")
    Logger.info("Run local: npm run local")
    Logger.info("Run cloud: npm run cloud")


if __name__ == "__main__":
    main()
