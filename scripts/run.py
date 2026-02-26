#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional

from utils import (
    CLOUD_ENV_FILE,
    LOCAL_ENV_FILE,
    Logger,
    PROJECT_ROOT,
    load_simple_env,
    run_command,
)


BACKEND_DIR = PROJECT_ROOT / "apps" / "server"
CLIENT_DIR = PROJECT_ROOT / "apps" / "web"
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
TF_DIR = PROJECT_ROOT / "infra" / "terraform"
DOCKER_COMPOSE_FILE = PROJECT_ROOT / "infra" / "docker" / "docker-compose.local.yml"
PID_FILE = PROJECT_ROOT / ".pids"


def detect_mode(force_cloud: bool, force_local: bool) -> str:
    if force_cloud and force_local:
        raise ValueError("Use only one of --cloud or --local.")

    if force_cloud:
        return "cloud"
    if force_local:
        return "local"

    cloud_env = load_simple_env(CLOUD_ENV_FILE)
    return "cloud" if cloud_env.get("ENABLE_CLOUD", "false").lower() == "true" else "local"


def save_pid_state(state: Dict[str, object]) -> None:
    PID_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def load_pid_state() -> Dict[str, object]:
    if not PID_FILE.exists():
        return {}
    try:
        return json.loads(PID_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def start_process(command: List[str], cwd: Path, env: Optional[Dict[str, str]] = None) -> subprocess.Popen:
    return subprocess.Popen(
        command,
        cwd=str(cwd),
        env=env,
        shell=False,
    )


def stop_pid(pid: int) -> None:
    try:
        if os.name == "nt":
            run_command(["taskkill", "/F", "/PID", str(pid)], check=False)
        else:
            os.kill(pid, signal.SIGTERM)
    except Exception:
        pass


def docker_compose_up() -> None:
    if not DOCKER_COMPOSE_FILE.exists():
        Logger.warning("Local docker compose file missing; skipping Redis startup.")
        return
    run_command(
        ["docker", "compose", "-f", str(DOCKER_COMPOSE_FILE), "up", "-d"],
        cwd=PROJECT_ROOT,
    )


def docker_compose_down() -> None:
    if not DOCKER_COMPOSE_FILE.exists():
        return
    run_command(
        ["docker", "compose", "-f", str(DOCKER_COMPOSE_FILE), "down"],
        cwd=PROJECT_ROOT,
        check=False,
    )


def get_terraform_output(name: str) -> str:
    result = run_command(
        ["terraform", "output", "-raw", name],
        cwd=TF_DIR,
        capture=True,
        check=False,
    )
    return (result.stdout or "").strip()


def start_cloud(desired_count: int) -> None:
    cloud_env = load_simple_env(CLOUD_ENV_FILE)
    cloudflare_branch = cloud_env.get("CLOUDFLARE_PAGES_BRANCH", "main")

    Logger.header("Starting Cloud Mode")
    run_command(
        [
            sys.executable,
            str(SCRIPTS_DIR / "deploy.py"),
            "--desired-count",
            str(desired_count),
            "--cloudflare-branch",
            cloudflare_branch,
        ],
        cwd=PROJECT_ROOT,
    )

    ws_endpoint = get_terraform_output("websocket_endpoint")
    frontend_env = dict(os.environ)
    frontend_env.update(cloud_env)
    if ws_endpoint:
        frontend_env["VITE_WS_URL"] = ws_endpoint
        Logger.success(f"Resolved websocket URL: {ws_endpoint}")
    elif cloud_env.get("VITE_WS_URL", "").strip():
        Logger.warning("Terraform websocket_endpoint missing; falling back to VITE_WS_URL in apps/env/.env.cloud.")
    else:
        Logger.warning("Unable to resolve websocket endpoint and VITE_WS_URL is unset.")

    frontend_proc = start_process(["npm", "run", "dev", "--", "--mode", "cloud"], CLIENT_DIR, env=frontend_env)
    save_pid_state(
        {
            "mode": "cloud",
            "frontend_pid": frontend_proc.pid,
        }
    )
    Logger.success("Frontend started in cloud mode.")
    Logger.info("Press Ctrl+C to stop frontend process.")

    try:
        frontend_proc.wait()
    except KeyboardInterrupt:
        Logger.warning("Interrupt received, stopping frontend.")
        stop_pid(frontend_proc.pid)


def start_local() -> None:
    local_env = load_simple_env(LOCAL_ENV_FILE)

    Logger.header("Starting Local Mode")
    docker_compose_up()

    backend_env = dict(os.environ)
    backend_env.update(local_env)
    backend_env["REDIS_URL"] = local_env.get(
        "BACKEND_REDIS_URL",
        local_env.get("REDIS_URL", "redis://127.0.0.1:6379"),
    )
    backend_env["CORS_ORIGIN"] = local_env.get(
        "BACKEND_CORS_ORIGIN",
        local_env.get("CORS_ORIGIN", "*"),
    )
    backend_env["PORT"] = local_env.get(
        "BACKEND_PORT",
        local_env.get("PORT", "5000"),
    )
    backend_env["BOARD_STORAGE_DIR"] = local_env.get(
        "BACKEND_BOARD_STORAGE_DIR",
        local_env.get("BOARD_STORAGE_DIR", "./data/boards"),
    )
    backend_env["AUTOSAVE_DEBOUNCE_MS"] = local_env.get(
        "BACKEND_AUTOSAVE_DEBOUNCE_MS",
        local_env.get("AUTOSAVE_DEBOUNCE_MS", "750"),
    )

    frontend_env = dict(os.environ)
    frontend_env.update(local_env)
    frontend_env["VITE_WS_URL"] = local_env.get(
        "VITE_WS_URL",
        "ws://localhost:5000",
    )

    backend_proc = start_process(["npm", "run", "dev"], BACKEND_DIR, env=backend_env)
    frontend_proc = start_process(["npm", "run", "dev", "--", "--mode", "local"], CLIENT_DIR, env=frontend_env)

    save_pid_state(
        {
            "mode": "local",
            "backend_pid": backend_proc.pid,
            "frontend_pid": frontend_proc.pid,
        }
    )

    Logger.success("Backend and frontend started in local mode.")
    Logger.info("Press Ctrl+C to stop all local services.")

    try:
        while True:
            backend_alive = backend_proc.poll() is None
            frontend_alive = frontend_proc.poll() is None
            if not backend_alive and not frontend_alive:
                break
            time.sleep(1)
    except KeyboardInterrupt:
        Logger.warning("Interrupt received, stopping local services.")
    finally:
        stop_pid(backend_proc.pid)
        stop_pid(frontend_proc.pid)
        docker_compose_down()
        if PID_FILE.exists():
            PID_FILE.unlink()


def stop_services(force_cloud: bool, force_local: bool) -> None:
    state = load_pid_state()
    state_mode = state.get("mode")
    if not force_cloud and not force_local and state_mode in {"local", "cloud"}:
        mode = str(state_mode)
    else:
        mode = detect_mode(force_cloud, force_local)
    Logger.header(f"Stopping ({mode})")

    backend_pid = state.get("backend_pid")
    frontend_pid = state.get("frontend_pid")
    if isinstance(backend_pid, int):
        stop_pid(backend_pid)
        Logger.success(f"Stopped backend PID {backend_pid}")
    if isinstance(frontend_pid, int):
        stop_pid(frontend_pid)
        Logger.success(f"Stopped frontend PID {frontend_pid}")

    if mode == "local":
        docker_compose_down()
        Logger.success("Stopped local docker dependencies.")
    else:
        run_command(
            [sys.executable, str(SCRIPTS_DIR / "deploy.py"), "--stop"],
            cwd=PROJECT_ROOT,
            check=False,
        )
        Logger.success("Sent cloud stop (ECS desired_count=0).")

    if PID_FILE.exists():
        PID_FILE.unlink()


def run_setup(cloud: bool) -> None:
    command = [sys.executable, str(SCRIPTS_DIR / "setup.py")]
    if cloud:
        command.append("--cloud")
    run_command(command, cwd=PROJECT_ROOT)


def run_deploy(args: argparse.Namespace) -> None:
    command = [sys.executable, str(SCRIPTS_DIR / "deploy.py")]
    if args.stop:
        command.append("--stop")
    if args.destroy:
        command.append("--destroy")
    if args.full:
        command.append("--full")
        command.extend(["--cloudflare-branch", args.cloudflare_branch])
    if not args.stop and not args.destroy:
        command.extend(["--desired-count", str(args.desired_count)])
    run_command(command, cwd=PROJECT_ROOT)


def main() -> None:
    parser = argparse.ArgumentParser(description="Whiteboard runtime manager")
    subparsers = parser.add_subparsers(dest="command")

    start_parser = subparsers.add_parser("start", help="Start local or cloud mode.")
    start_parser.add_argument("--cloud", action="store_true", help="Force cloud mode.")
    start_parser.add_argument("--local", action="store_true", help="Force local mode.")
    start_parser.add_argument(
        "--check-packages",
        action="store_true",
        help="Run setup before starting.",
    )
    start_parser.add_argument(
        "--desired-count",
        type=int,
        default=2,
        help="Cloud ECS desired count when starting in cloud mode.",
    )

    stop_parser = subparsers.add_parser("stop", help="Stop local/cloud services.")
    stop_parser.add_argument("--cloud", action="store_true", help="Force cloud stop.")
    stop_parser.add_argument("--local", action="store_true", help="Force local stop.")

    deploy_parser = subparsers.add_parser("deploy", help="Manage cloud resources.")
    deploy_parser.add_argument("--stop", action="store_true", help="Scale service down.")
    deploy_parser.add_argument("--destroy", action="store_true", help="Destroy all infra.")
    deploy_parser.add_argument(
        "--full",
        action="store_true",
        help="Deploy backend to AWS and frontend to Cloudflare.",
    )
    deploy_parser.add_argument(
        "--cloudflare-branch",
        default="main",
        help="Cloudflare Pages branch for --full deploy.",
    )
    deploy_parser.add_argument(
        "--desired-count",
        type=int,
        default=2,
        help="Desired count for apply mode.",
    )

    args = parser.parse_args()

    if args.command == "start":
        mode = detect_mode(args.cloud, args.local)
        if args.check_packages:
            run_setup(cloud=mode == "cloud")
        if mode == "cloud":
            start_cloud(args.desired_count)
        else:
            start_local()
        return

    if args.command == "stop":
        stop_services(args.cloud, args.local)
        return

    if args.command == "deploy":
        run_deploy(args)
        return

    parser.print_help()


if __name__ == "__main__":
    main()
