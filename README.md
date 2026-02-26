# Realtime Whiteboard Refactor (V2)

This repository now includes a new modular V2 refactor focused on:

- WebSocket-only realtime collaboration
- Low-latency drawing with smoothing
- Lazy-loaded frontend modules
- AWS-friendly infrastructure via Terraform

## Project Structure

- `client/`: React + TypeScript + Vite frontend (lazy-loaded V2 whiteboard UI)
- `backend/`: TypeScript Socket.IO realtime service (rooms, presence, autosave)
- `infra/terraform/`: AWS ECS + ALB + Redis + CloudFront/S3 stack

## Local Run

Use the unified scripts (mode is controlled by `.env.mode`):

1. `Copy-Item .env.mode.example .env.mode` (PowerShell)  
   or `cp .env.mode.example .env.mode` (bash)
2. `npm run setup`
3. `npm run start`

Stop all local services:

- `npm run stop`

PowerShell wrappers:

- `.\scripts\start-application.ps1`
- `.\scripts\stop-application.ps1`

Bash wrappers:

- `./scripts/start-application.sh`
- `./scripts/stop-application.sh`

Open `http://localhost:3000?room=my-room` in multiple tabs/devices.

## Cloud Mode

Set `ENABLE_CLOUD=true` in `.env.mode`, then:

1. `python scripts/setup.py --cloud`
2. `python scripts/run.py start --cloud`

This will:

- Run Terraform apply in `infra/terraform`
- Read `websocket_endpoint` output
- Update `client/.env.local` with `VITE_WS_URL`
- Start frontend locally against cloud websocket backend

Cloud stop (non-destructive):

- `python scripts/run.py stop --cloud` (scales ECS `desired_count` to `0`)

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

1. Build and push backend image to ECR.
2. In `infra/terraform/`, run:
   - `terraform init`
   - `terraform plan`
   - `terraform apply`
3. Use outputs:
   - `websocket_endpoint` for `VITE_WS_URL`
   - `cloudfront_domain_name` for frontend hosting

## Notes

- This is an initial professional-grade refactor baseline.
- Current board persistence uses file storage in container for local/dev parity.
- Production persistence can be swapped with managed storage adapters later.
