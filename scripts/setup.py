#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from utils import (
    Logger,
    MODE_ENV_EXAMPLE,
    MODE_ENV_FILE,
    PROJECT_ROOT,
    command_exists,
    ensure_file_from_example,
    load_simple_env,
    run_command,
)


BACKEND_DIR = PROJECT_ROOT / "backend"
CLIENT_DIR = PROJECT_ROOT / "client"
TF_DIR = PROJECT_ROOT / "infra" / "terraform"


def require_commands(commands: list[str]) -> None:
    missing = [command for command in commands if not command_exists(command)]
    if missing:
        Logger.error(f"Missing required command(s): {', '.join(missing)}")
        sys.exit(1)


def setup_env_files() -> None:
    Logger.header("Environment Files")
    ensure_file_from_example(MODE_ENV_EXAMPLE, MODE_ENV_FILE)
    ensure_file_from_example(BACKEND_DIR / ".env.example", BACKEND_DIR / ".env")
    ensure_file_from_example(CLIENT_DIR / ".env.example", CLIENT_DIR / ".env.local")
    Logger.success("Environment templates verified.")


def setup_node_deps() -> None:
    Logger.header("Installing Dependencies")
    for app_dir in [BACKEND_DIR, CLIENT_DIR]:
        Logger.step(f"npm install in {app_dir.name}")
        run_command(["npm", "install", "--no-audit", "--no-fund"], cwd=app_dir)
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

    mode_env = load_simple_env(MODE_ENV_FILE)
    enable_cloud = args.cloud or mode_env.get("ENABLE_CLOUD", "false").lower() == "true"

    required = ["python", "npm", "node"]
    if enable_cloud:
        required.append("terraform")
    require_commands(required)

    setup_env_files()
    setup_node_deps()
    if enable_cloud:
        setup_terraform()

    Logger.header("Setup Complete")
    Logger.info("Run: python scripts/run.py start")


if __name__ == "__main__":
    main()
