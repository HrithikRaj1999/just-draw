#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> None:
    project_root = Path(__file__).resolve().parent.parent
    run_script = project_root / "scripts" / "run.py"
    subprocess.run([sys.executable, str(run_script), "stop"], cwd=str(project_root), check=False)


if __name__ == "__main__":
    main()
