# Runtime Scripts

Unified commands:

- `python scripts/setup.py`
- `python scripts/run.py start`
- `python scripts/run.py stop`
- `python scripts/run.py deploy`

Mode source:

- `.env.mode`
  - `ENABLE_CLOUD=false` -> local backend + frontend + local Redis
  - `ENABLE_CLOUD=true` -> Terraform cloud stack + local frontend against cloud websocket

PowerShell wrappers:

- `scripts/start-application.ps1`
- `scripts/stop-application.ps1`

Bash wrappers:

- `scripts/start-application.sh`
- `scripts/stop-application.sh`
