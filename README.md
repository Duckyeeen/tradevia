# TRADEVIA

> A B2B marketplace demo that helps businesses discover suppliers, describe their needs, and evaluate partner fit using explainable matching.

TRADEVIA is a project for the Electronic Commerce Engineering course, designed to run locally. The repository currently has no screenshots, `LICENSE` file, or official release, so this README does not include placeholder images or unverified license/version badges.

## Overview

The demo flow is:

```text
Choose a demo account → Feed → Supplier Profile → Buyer Request
→ Matching Results → Connection Request
```

The frontend includes demo screens for Account, Feed, Supplier Profile, Buyer Request, Matching, and Connections. The backend provides eight APIs for health, suppliers, requests, matching, and connections. Matching uses deterministic rules and returns an overall score, a criteria breakdown, and `missingData`.

### Current Status and Limitations

- Suppliers, Buyer Requests, and Connections are read from and written to JSON files in `server/data/`.
- The frontend API adapter supports `auto`, `live`, and `mock` modes. By default, `auto` falls back to mock data when the backend cannot be reached.
- Client-side mock data is stored in memory and is reset when the page reloads.
- Login is a mock flow; it does not authenticate real users.
- Accounts and posts are not persisted through the backend API.
- Payments, real-time chat, external business verification, and cloud deployment are not implemented.

## Screenshots

The repository does not currently contain demo screenshots. Add real screenshots to `docs/screenshots/` after the team finalizes the interface, then embed them here.

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | React 19, Vite 6 |
| Backend | Node.js, Express 4 |
| Demo data storage | JSON files |
| Matching | Rule-based JavaScript; no AI or external APIs |
| Tests | Node.js built-in test runner (`node:test`) |
| Version control | Git, GitHub |

## Getting Started

### Prerequisites

- Node.js LTS and npm. The team should use the same Node.js major version.
- Git.
- Chrome or Edge for checking the interface.

Verify your installation:

```sh
git --version
node --version
npm --version
```

### Clone the Repository

```sh
git clone https://github.com/Duckyeeen/tradevia.git
cd tradevia
```

The following steps work in macOS Terminal, Windows PowerShell, and Command Prompt. Open two terminals in the `tradevia/` repository directory.

### Install Dependencies and Run the Backend

Terminal 1:

```sh
cd server
npm install
npm run dev
```

The backend runs at `http://localhost:3000` by default. Keep this terminal open.

### Install Dependencies and Run the Frontend

Terminal 2:

```sh
cd client
npm install
npm run dev
```

Open the Vite URL printed in the terminal, usually `http://localhost:5173`. Vite proxies `/api` requests to the backend at `http://127.0.0.1:3000`.

Run `npm install` once in each directory after cloning. If that directory's `package.json` changes, run the install command again from that directory.

### Optional Configuration

You do not need a `.env` file by default. To change the API mode or proxy target, copy `client/.env.example` to `client/.env`.

macOS:

```sh
cp client/.env.example client/.env
```

Windows PowerShell:

```powershell
Copy-Item client/.env.example client/.env
```

Available values:

```dotenv
VITE_API_MODE=auto
VITE_API_PROXY_TARGET=http://127.0.0.1:3000
VITE_API_TIMEOUT_MS=8000
```

- `auto`: use the real backend and fall back to mock data if the backend is unreachable.
- `live`: use only the real backend and return an error if it cannot be reached.
- `mock`: always use mock data in the browser.

Restart Vite after changing `.env`. Do not commit `client/.env`.

## Tests and Build

Run the backend and matching unit tests:

```sh
cd server
npm test
```

Run the frontend API adapter tests:

```sh
cd client
npm test
```

Build the frontend:

```sh
cd client
npm run build
```

Check the backend at `http://localhost:3000/api/health`. A successful response looks like:

```json
{"status":"ok","service":"tradevia-api"}
```

## API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Check backend status |
| `GET` | `/api/suppliers` | List suppliers; supports `?tag=electronics` |
| `GET` | `/api/suppliers/:id` | Get supplier details |
| `GET` | `/api/requests` | List Buyer Requests |
| `POST` | `/api/requests` | Create a Buyer Request |
| `POST` | `/api/matching` | Run matching with `{ "requestId": "request-001" }` |
| `GET` | `/api/connections` | List connections; filter by `buyerId` or `supplierId` |
| `POST` | `/api/connections` | Create a connection with `requestId`, `buyerId`, and `supplierId` |

Matching returns an overall score from 0 to 100, a breakdown across six criteria, and a list of missing data:

| Criterion | Weight |
|---|---:|
| Industry tags | 25% |
| Services / capabilities | 25% |
| Capacity | 20% |
| Location | 10% |
| Compliance / certifications | 10% |
| Business model | 10% |

See [TRADEVIA_CODEX_STARTER.md](TRADEVIA_CODEX_STARTER.md) for the detailed data contract and matching rules.

## Repository Structure

```text
client/
  src/modules/       Account, Feed, Supplier, Request, Matching, Connections
  src/services/      API client, error handling, and mock adapter
  src/data/          Client-side demo data
  tests/             API adapter tests
server/
  src/services/      Matching rules and criteria configuration
  src/utils/         Data normalization and JSON file access
  src/tests/         Matching unit tests
  data/              suppliers.json, requests.json, connections.json
TRADEVIA_CODEX_STARTER.md
TRADEVIA_REMAINING_WORK.md
```

## Team Workflow

- Work on your assigned branch and keep `main` stable.
- Check `git status` and `git diff` before committing.
- Do not commit `node_modules/`, `client/.env`, credentials, or the frontend build output in `client/dist/`.
- Keep changes within your assigned module. Coordinate with the Lead Developer before changing the API contract, package configuration, or shared files.
- Use camelCase consistently and update the contract when the team agrees to a schema change.

See [TRADEVIA_REMAINING_WORK.md](TRADEVIA_REMAINING_WORK.md) for assignments, module dependencies, and the demo acceptance checklist.
