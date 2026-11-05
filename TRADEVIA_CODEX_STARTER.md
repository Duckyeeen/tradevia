# TRADEVIA | Codex Starter Pack
## Đồ án môn Kỹ thuật Thương mại Điện tử

Tài liệu khởi động để đưa vào Codex khi triển khai TRADEVIA. Dự án chạy localhost, hướng tới demo MVP end-to-end.

## 1. Project context

TRADEVIA là nền tảng B2B Service Marketplace giúp doanh nghiệp tìm kiếm dịch vụ, năng lực cung ứng và đối tác phù hợp.

### MVP flow
1. Đăng nhập bằng tài khoản demo.
2. Xem feed theo ngành nghề/tag.
3. Xem Supplier Profile.
4. Tạo Buyer Request.
5. Xem nhà cung cấp matching.
6. Xem matching score và breakdown.
7. Gửi Connection Request.

### In scope
- Mock login; Personal/Business account.
- Business profile và industry tags.
- Feed/tag filter.
- Supplier Profile.
- Buyer Request create/list.
- Rule-based matching.
- Matching score/breakdown.
- Connection Request/status.
- Dữ liệu mẫu, backend local.

### Out of scope
Real email verification, payments, realtime chat, external company verification, AI/ML matching, cloud deployment, complex admin.

## 2. Technology decisions
- Frontend: React + Vite
- Backend: Node.js + Express
- Data: JSON file for demo; SQLite only if approved
- Version control: Git + GitHub
- Coding assistant: Codex
- Browser test: Chrome/Edge; Safari may be used for additional checks
- Must work on macOS Apple Silicon and Windows

Codex must inspect the existing repository before changing anything. Do not replace a working stack or overwrite existing work without approval.

## 3. Suggested folder structure

```text
tradevia/
├── client/
│   └── src/
│       ├── modules/
│       │   ├── account/
│       │   ├── feed/
│       │   ├── suppliers/
│       │   ├── requests/
│       │   ├── matching/
│       │   └── connections/
│       ├── services/
│       ├── components/
│       ├── data/
│       ├── App.jsx
│       └── main.jsx
├── server/
│   ├── routes/
│   ├── services/
│   ├── data/
│   ├── utils/
│   └── app.js
├── .gitignore
├── README.md
└── package.json
```

This is a proposal, not permission to move/delete existing files.

## 4. Team ownership

| Member | Role | Ownership |
|---|---|---|
| Member 1 (you) | Project Lead + Lead Developer | Backend APIs, matching service, API contract, integration/review |
| Member 2 | Account & Industry Tags | `client/src/modules/account/` |
| Member 3 | Feed & Search | `client/src/modules/feed/` |
| Member 4 | Supplier Profile & Buyer Request | `client/src/modules/suppliers/`, `client/src/modules/requests/` |
| Member 5 | Matching UI, Connections & QA | `client/src/modules/matching/`, `client/src/modules/connections/` |

Do not edit `App.jsx`, routing, root package configuration, shared models, or global styles unless assigned. Keep each module in its owned folder.

## 5. Data contract

Use camelCase consistently.

### Supplier
```json
{
  "id": "supplier-001",
  "companyName": "Example Manufacturing",
  "industryTags": ["manufacturing", "electronics"],
  "services": ["contract manufacturing", "sourcing"],
  "businessModel": "B2B",
  "capacity": "medium",
  "location": "Da Nang",
  "certifications": ["ISO 9001"],
  "description": "Example supplier description"
}
```

### Buyer Request
```json
{
  "id": "request-001",
  "buyerId": "buyer-001",
  "title": "Find an electronics manufacturer",
  "description": "Looking for a qualified manufacturing partner",
  "industryTags": ["electronics"],
  "requiredServices": ["contract manufacturing"],
  "desiredCapacity": "medium",
  "location": "Vietnam",
  "complianceRequirements": ["ISO 9001"],
  "businessModel": "B2B"
}
```

### Connection
```json
{
  "id": "connection-001",
  "requestId": "request-001",
  "buyerId": "buyer-001",
  "supplierId": "supplier-001",
  "status": "pending",
  "createdAt": "ISO-8601 timestamp"
}
```

### Matching result
```json
{
  "supplierId": "supplier-001",
  "score": 82,
  "breakdown": {
    "industryTags": 90,
    "services": 85,
    "capacity": 80,
    "location": 75,
    "compliance": 80,
    "businessModel": 85
  },
  "missingData": []
}
```

## 6. Matching rules

Use deterministic, explainable rule-based matching, not AI.

| Criterion | Weight |
|---|---:|
| Industry / Tags | 25% |
| Services / Capabilities | 25% |
| Scale / Capacity | 20% |
| Location | 10% |
| Compliance / Certifications | 10% |
| Business Model | 10% |
| **Total** | **100%** |

Rules:
- Normalize each criterion to 0–100.
- Weighted total is 0–100.
- Return total score, breakdown, and `missingData`.
- Missing information must be shown as unknown/not provided, not silently treated as a match.
- Sort results by score descending.
- Keep algorithm in a dedicated backend service.
- Seed sample data with visibly different match results.

## 7. API contract

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Server check |
| GET | `/api/suppliers` | List suppliers |
| GET | `/api/suppliers/:id` | Supplier detail |
| GET | `/api/requests` | List requests |
| POST | `/api/requests` | Create request |
| POST | `/api/matching` | Match suppliers |
| GET | `/api/connections` | List connections |
| POST | `/api/connections` | Create connection |

Matching request:
```json
{ "requestId": "request-001" }
```

Matching response:
```json
{
  "requestId": "request-001",
  "results": [
    {
      "supplierId": "supplier-001",
      "score": 82,
      "breakdown": {
        "industryTags": 90,
        "services": 85,
        "capacity": 80,
        "location": 75,
        "compliance": 80,
        "businessModel": 85
      },
      "missingData": []
    }
  ]
}
```

Keep response shapes stable. If a change is needed, notify the team and update this contract first.

## 8. Git workflow

Branches:
- `feature/backend-matching` — Member 1
- `feature/account` — Member 2
- `feature/feed` — Member 3
- `feature/supplier-request` — Member 4
- `feature/matching-connection` — Member 5

```bash
git clone <repository-url>
cd tradevia
git checkout -b feature/your-module
git status
git add .
git commit -m "feat: implement module"
git push -u origin feature/your-module
```

For updates:
```bash
git checkout feature/your-module
git pull
```

Rules: never commit `node_modules`, `.env`, credentials, or API keys. Review `git diff`, make focused commits, ask before editing shared files, and do not discard another member's work during conflicts.

## 9. Setup

Install Git, Node.js LTS/npm, VS Code, GitHub access, and Codex.

```bash
git --version
node -v
npm -v
```

Use actual scripts in `package.json`; do not assume commands exist before checking.

Typical split setup:
```bash
cd client
npm install
npm run dev
```

In another terminal:
```bash
cd server
npm install
npm run dev
```

Codex must document the exact commands created for macOS and Windows.

## 10. Codex prompt: initial scaffold

```text
You are helping build TRADEVIA, a localhost-only B2B Service Marketplace demo
for an Electronic Commerce Engineering course.

Before making changes:
1. Inspect the repository and report current files, stack, and scripts.
2. Do not overwrite or delete existing work.
3. If empty, scaffold React + Vite frontend and Node.js + Express backend.
4. Use JSON-file storage for demo unless a database already exists.
5. Follow TRADEVIA_CODEX_STARTER.md folder structure and contracts.
6. Create README setup/run instructions for macOS and Windows.
7. Add .gitignore; never include node_modules, .env, credentials, or build output.
8. Implement only the skeleton: frontend app shell, Express server,
   /api/health, and sample data files.
9. Do not implement all product features yet.
10. Keep code modular and beginner-friendly.

After changes, list files created/modified, explain architecture,
give exact install/run commands, run available checks and report actual results,
and identify manual setup still needed.
```

## 11. Codex prompt: backend and matching

```text
Work on TRADEVIA backend only. Inspect existing code first and preserve it.
Implement:
GET /api/health
GET /api/suppliers
GET /api/suppliers/:id
GET /api/requests
POST /api/requests
POST /api/matching
GET /api/connections
POST /api/connections

Use the agreed camelCase contract and existing JSON/database storage.
Validate required fields and return useful HTTP status codes.
Keep routes and business logic modular.
Implement deterministic matching weights: tags 25%, services 25%,
capacity 20%, location 10%, compliance 10%, business model 10%.
Return total score, breakdown, and missingData.
Do not treat missing data as a successful match.
Do not add auth, payments, chat, AI matching, or deployment.

Afterward list changed files, explain endpoint shapes, run checks,
give manual test steps, and report assumptions or unfinished work.
```

## 12. Codex prompt: frontend module

```text
Implement one TRADEVIA frontend module.

Module: [MODULE NAME]
Allowed files: [EXACT FOLDER/FILES]
Requirements: [FEATURE LIST]

Inspect existing app, components, styles, and API services first.
Preserve existing work. Do not edit App.jsx, routing, root package config,
or another member's module unless explicitly authorized.
Use React + Vite and keep code beginner-friendly.
Follow the shared data contract.
If API is not ready, use an isolated mock-data adapter.
Include relevant loading, empty, and error states.
Do not add unrelated features.

Afterward list changed files, explain integration, give test steps,
run available checks, report actual results, and list dependencies/blockers.
```

## 13. Codex prompt: integration review

```text
Act as TRADEVIA integration reviewer. Inspect repository and changes.
Do not perform broad rewrites.

Check:
1. Frontend/backend run commands.
2. API fields and response shapes match.
3. Imports and routes work.
4. Modules respect ownership and have not overwritten others' work.
5. Matching score and breakdown are consistent.
6. Main flow works: demo login -> tag feed -> supplier profile ->
   create buyer request -> matching results -> connection request.
7. No secrets, node_modules, or absolute local paths are committed.
8. Avoid macOS/Windows compatibility problems.

Fix only clear integration blockers. Explain before changing shared files.
Run checks and report actual results.
List remaining bugs by blocker/high/low priority.
```

## 14. Acceptance checklist

- [ ] Frontend and backend run on localhost.
- [ ] Project runs on Mac and at least one Windows machine.
- [ ] README has setup instructions.
- [ ] Demo login works.
- [ ] Business profile and tags appear.
- [ ] Feed/tag filter works.
- [ ] Supplier profile opens.
- [ ] Buyer Request can be created.
- [ ] Matching returns ranked suppliers.
- [ ] Score and breakdown are shown.
- [ ] Connection Request can be submitted.
- [ ] Main flow has no blocker.
- [ ] Seed data and mock fallback are ready.

## 15. Team operating rules

- Each task has one owner, scope, and acceptance criteria.
- Members report: completed, next, blocker.
- If blocked for 15–20 minutes, share error/log, command, file, and attempted fixes.
- Use mock data to unblock frontend work.
- Integrate early; do not wait for every module to finish.
- During Devday 14:00–20:00, prioritize the main flow over polish.
- Freeze features before final testing.
