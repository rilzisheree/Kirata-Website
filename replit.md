# kirata's bio site

Personal site showing what I'm up to in real-time — PC presence (apps/games), Discord status, Spotify recent tracks, visit counter.

## Running stuff

- `pnpm --filter @workspace/bio run dev` — frontend
- `pnpm --filter @workspace/api-server run dev` — API
- `pnpm run typecheck` — typecheck everything
- `pnpm run build` — full build

## Stack

- pnpm monorepo, Node 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind
- API: Express 5
- Validation: Zod
- API hooks: Orval codegen from OpenAPI spec

## Where things live

- `artifacts/bio/` — React frontend
- `artifacts/api-server/` — Express API
- `lib/api-zod/` — Zod schemas (codegen)
- `lib/api-client-react/` — React Query hooks (codegen)
- `scripts/pc-agent/` — PowerShell agent that runs on my PC

## Env vars needed

- `PRESENCE_SECRET` — shared secret between the PC agent and the API
- `SESSION_SECRET` — express session secret
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` — for Spotify recent tracks
- `VITE_DISCORD_ID` — Discord user ID for Lanyard presence

## Deployed on Railway

API handles both the backend routes and serves the built frontend in production.
