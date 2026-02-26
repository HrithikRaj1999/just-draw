from __future__ import annotations

import os
import platform
import shutil
import subprocess
from pathlib import Path
from typing import Dict, Iterable, Optional


class Colors:
    HEADER = "\033[95m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    END = "\033[0m"
    BOLD = "\033[1m"


class Logger:
    @staticmethod
    def header(message: str) -> None:
        print(f"\n{Colors.HEADER}{Colors.BOLD}=== {message} ==={Colors.END}")

    @staticmethod
    def info(message: str) -> None:
        print(f"{Colors.BLUE}[INFO]{Colors.END} {message}")

    @staticmethod
    def step(message: str) -> None:
        print(f"{Colors.CYAN}-> {message}{Colors.END}")

    @staticmethod
    def success(message: str) -> None:
        print(f"{Colors.GREEN}[OK]{Colors.END} {message}")

    @staticmethod
    def warning(message: str) -> None:
        print(f"{Colors.WARNING}[WARN]{Colors.END} {message}")

    @staticmethod
    def error(message: str) -> None:
        print(f"{Colors.FAIL}[ERR]{Colors.END} {message}")


PROJECT_ROOT = Path(__file__).resolve().parent.parent
APPS_DIR = PROJECT_ROOT / "apps"
APPS_ENV_DIR = APPS_DIR / "env"
LOCAL_ENV_FILE = APPS_ENV_DIR / ".env.local"
CLOUD_ENV_FILE = APPS_ENV_DIR / ".env.cloud"


def is_windows() -> bool:
    return platform.system().lower() == "windows"


def command_exists(command: str) -> bool:
    return shutil.which(command) is not None


def load_simple_env(path: Path) -> Dict[str, str]:
    values: Dict[str, str] = {}
    if not path.exists():
        return values

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def upsert_env_value(path: Path, key: str, value: str) -> None:
    current = []
    if path.exists():
        current = path.read_text(encoding="utf-8").splitlines()

    updated = False
    next_lines = []
    for line in current:
        if line.startswith(f"{key}="):
            next_lines.append(f"{key}={value}")
            updated = True
        else:
            next_lines.append(line)
    if not updated:
        next_lines.append(f"{key}={value}")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(next_lines) + "\n", encoding="utf-8")


def run_command(
    command: Iterable[str],
    cwd: Optional[Path] = None,
    env: Optional[Dict[str, str]] = None,
    check: bool = True,
    capture: bool = False,
) -> subprocess.CompletedProcess:
    return subprocess.run(
        list(command),
        cwd=str(cwd) if cwd else None,
        env=env,
        check=check,
        text=True,
        capture_output=capture,
    )


def merge_env(extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    merged = dict(os.environ)
    if extra:
        merged.update(extra)
    return merged
