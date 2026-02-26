# Client (React + TypeScript + Vite)

This frontend is now a plain React TypeScript app using Vite.

## Commands

- `npm run dev` - start dev server on port `3000`
- `npm run build` - typecheck + production build
- `npm run preview` - preview built assets

## Environment

This app reads env from `apps/env` (configured via `vite.config.ts`).

- Local mode file: `apps/env/.env.local`
- Cloud mode file: `apps/env/.env.cloud`
- Primary frontend key: `VITE_WS_URL`

If unset, the app falls back to `ws(s)://<current-host>:5000`.
