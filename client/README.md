# Client (React + TypeScript + Vite)

This frontend is now a plain React TypeScript app using Vite.

## Commands

- `npm run dev` - start dev server on port `3000`
- `npm run build` - typecheck + production build
- `npm run preview` - preview built assets

## Environment

Create `.env.local` from `.env.example`:

- `VITE_WS_URL=ws://localhost:5000`

If unset, the app falls back to `ws(s)://<current-host>:5000`.
