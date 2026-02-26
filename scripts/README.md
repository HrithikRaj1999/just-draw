# Runtime Scripts

Unified commands:

- `python scripts/setup.py`
- `python scripts/run.py start`
- `python scripts/run.py stop`
- `python scripts/run.py deploy`
- `python scripts/run.py deploy --full`

Mode source:

- `apps/env/.env.local`
  - `ENABLE_CLOUD=false` -> local backend + frontend + local Redis
- `apps/env/.env.cloud`
  - `ENABLE_CLOUD=true` -> Terraform AWS backend stack + local frontend against cloud websocket

Production one-command deploy:

- `python scripts/deploy.py --full`
- or `npm run cloud:deploy:full`

Credentials can be provided via shell env or `apps/env/.env.cloud`.

PowerShell wrappers:

- `scripts/start-application.ps1`
- `scripts/stop-application.ps1`

Bash wrappers:

- `scripts/start-application.sh`
- `scripts/stop-application.sh`
