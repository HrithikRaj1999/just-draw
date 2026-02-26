# Local Infrastructure

`docker-compose.local.yml` starts Redis locally for socket fan-out parity with cloud.

Use:

- `docker compose -f infra/docker/docker-compose.local.yml up -d`
- `docker compose -f infra/docker/docker-compose.local.yml down`
