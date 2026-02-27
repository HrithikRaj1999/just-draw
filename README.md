# Delineation

This repository now includes a new modular V2 refactor focused on:

- WebSocket-only realtime collaboration
- Low-latency drawing with smoothing
- Lazy-loaded frontend modules
- AWS backend infrastructure via Terraform
- Cloudflare Pages frontend deployment

## Project Structure

- `apps/web/`: React + TypeScript + Vite frontend (lazy-loaded V2 whiteboard UI)
- `apps/server/`: TypeScript Express + Socket.IO realtime service
- `apps/env/`: local/cloud environment profiles
- `infra/terraform/`: AWS ECS + ALB + Redis + ECR stack
- `.github/workflows/`: CI + deploy workflows (`ci.yml`, `deploy.yml`, `deploy-dev.yml`, `deploy-prod.yml`)

## Local Run

1. Edit `apps/env/.env.local` as needed.
2. Run setup:
   - `npm run setup`
3. Start local mode:
   - `npm run local`

Stop local mode:
- `npm run local:stop`

PowerShell wrappers:

- `.\scripts\start-application.ps1`
- `.\scripts\stop-application.ps1`

Bash wrappers:

- `./scripts/start-application.sh`
- `./scripts/stop-application.sh`

Open `http://localhost:3000?room=my-room` in multiple tabs/devices.

## Cloud Mode

1. Fill `apps/env/.env.cloud` with your cloud credentials/config.
2. Run setup:
   - `npm run setup:cloud`
3. Start cloud mode:
   - `npm run cloud`

Cloud mode will:

- Run Terraform apply in `infra/terraform`
- Read `websocket_endpoint` output
- Inject `VITE_WS_URL` into the frontend process
- Start frontend locally against cloud websocket backend

## One-Command Production Deploy (AWS + Cloudflare)

Command:

- `npm run cloud:deploy:full`

What it does:

1. Applies AWS infra (ECR, ECS, ALB, Redis, networking)
2. Builds backend Docker image and pushes to ECR
3. Re-applies Terraform with the new backend image
4. Builds frontend with `VITE_WS_URL` from AWS output
5. Deploys frontend `apps/web/dist` to Cloudflare Pages

Required from you (set in shell env):

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN` (if temporary creds)
- `AWS_REGION` (optional, default `us-east-1`)
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_PAGES_PROJECT_NAME`
- `CLOUDFLARE_PAGES_BRANCH` (optional, default `main`)

Deploy script auto-loads `apps/env/.env.cloud`.

Cloud stop (non-destructive):

- `npm run cloud:stop` (scales ECS `desired_count` to `0`)

Cloud destroy:

- `python scripts/run.py deploy --destroy`

## Backend Events (WebSocket Only)

- `room:join`
- `presence:update`
- `element:upsert`
- `element:delete`
- `board:replace`

Server push events:

- `room:joined`
- `board:state`
- `presence:snapshot`
- `presence:join`
- `presence:update`
- `presence:leave`

## Drawing Engine

- `perfect-freehand`: smooth stroke interpolation
- `roughjs`: shape rendering (line/arrow/rectangle/ellipse)
- Pointer events for both touch and mouse

## Terraform Deploy

1. In `infra/terraform/`, run:
   - `terraform init`
   - `terraform plan`
   - `terraform apply`
2. Use outputs:
   - `websocket_endpoint` for `VITE_WS_URL`
   - `ecr_repository_url` for backend image publishing

## Notes

- This is an initial professional-grade refactor baseline.
- Current board persistence uses file storage in container for local/dev parity.
- Production persistence can be swapped with managed storage adapters later.
