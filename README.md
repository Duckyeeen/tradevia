# TRADEVIA

Localhost MVP for a B2B sourcing and service marketplace, built for the Electronic Commerce Engineering project.

## Requirements

- Node.js LTS and npm (use the same Node.js major version across the team)
- Git
- A current browser such as Chrome or Edge

Check your installation:

```sh
git --version
node --version
npm --version
```

## Run locally

Open two terminals from the repository root.

Terminal 1 — backend:

```sh
cd server
npm install
npm run dev
```

The API starts at `http://localhost:3000`. Check `http://localhost:3000/api/health` for the server status.
After editing backend code, stop the server with `Ctrl+C` and run `npm run dev` again.

Terminal 2 — frontend:

```sh
cd client
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). The Vite development server forwards `/api` requests to the backend.

These commands work in macOS Terminal, Windows PowerShell, and Windows Command Prompt. Run `npm install` once in each folder after cloning; repeat it only when that folder's `package.json` changes.

## Project structure

```text
client/   React + Vite application
server/   Express API and JSON demo data
TRADEVIA_CODEX_STARTER.md   Product scope, team ownership, and API contract
```

The current scaffold contains only the app shell, health endpoint, and seed data. Account, feed, supplier, request, matching, and connection features are planned modules.

## Team workflow

- Work on your assigned feature branch; keep `main` stable.
- Check `git status` and `git diff` before committing.
- Do not commit `node_modules`, `.env`, credentials, or local build output.
- Keep module changes within the ownership and data contract in `TRADEVIA_CODEX_STARTER.md`.
