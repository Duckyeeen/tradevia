# TRADEVIA — 4-Person Work Plan

**Goal:** finish and rehearse the TRADEVIA localhost MVP in the next 3–4 hours.

**Team:** Kiên (Member 1 + Member 5), Tiến (Member 2), Danh (Member 3), Ân (Member 4).

This plan reflects the current repository. The frontend modules and all eight backend endpoints already have implementation files. The team should review, complete, connect, and verify them; avoid rebuilding working parts from scratch.

## 1. Current repository snapshot

| Area | Current state | Work still needed |
|---|---|---|
| React/Vite app | App shell and six module views exist | Review navigation, shared state, UI consistency, and full user flow |
| Account | Demo account type, company name, and tags are local to `AccountView` | Share selected account/tags with Feed and Buyer Request; finalize the business/personal rules |
| Feed | Supplier list, tag filter, and search view exist | Decide whether posts are required for this demo; connect tag behavior to the selected account and finish empty/error states |
| Supplier / Request | Detail and create-request views exist | Verify fields, client validation, API errors, and navigation to Matching |
| Matching / Connections | Matching view and connection list exist | Verify matching display, connection creation, duplicate handling, and persistence against the live API |
| Backend | Health, suppliers, requests, matching, and connections endpoints exist | Strengthen request/connection validation and add endpoint-level tests |
| Location matching (former task 3.1) | Implemented in `server/src/services/matchingService.js`; location cases are covered by tests | Treat as done unless a regression is found during final verification |
| Tests | Matching tests and client API adapter tests exist | Run both suites, then verify the end-to-end flow manually |

### Known backend gaps from the current code

- `POST /api/requests` does not currently require `buyerId` and does not fully validate non-empty string arrays or field types.
- `POST /api/connections` checks required IDs and duplicates, but should also verify that the request and supplier exist and that the buyer owns the request.
- Existing server tests focus on matching logic; add endpoint tests only for critical validation and flow cases that fit the timebox.

## 2. Responsibility map

| Owner | Role | Main folders / files |
|---|---|---|
| **Kiên (Member 1 + 5)** | Lead Developer, backend, Matching/Connections integration, QA and final demo | `server/`, `client/src/modules/matching/`, `client/src/modules/connections/`, shared integration files |
| **Tiến (Member 2)** | Account & Industry Tags | `client/src/modules/account/`; coordinate shared account state with Kiên |
| **Danh (Member 3)** | Feed & Search | `client/src/modules/feed/`; coordinate tag behavior with Tiến |
| **Ân (Member 4)** | Supplier Profile & Buyer Request | `client/src/modules/suppliers/`, `client/src/modules/requests/`; coordinate account data with Tiến |

Shared files such as `client/src/App.jsx`, `client/src/styles.css`, `client/src/services/api.js`, package files, and API contracts need Kiên’s coordination. Each owner should work in their own module and ask Kiên before editing shared files.

## 3. First priority: Tiến, Danh, and Ân finalize UI/UX

Spend the first **20–25 minutes** agreeing on one interface direction before parallel implementation. Kiên joins to confirm that the agreed flow fits the existing API and can be completed within the timebox.

### Decisions to make together

1. **Primary user flow and navigation**
   - Agree on the order of screens: Account → Feed → Supplier Profile → Buyer Request → Matching → Connections.
   - Decide how a user returns to the previous screen and how supplier/request selections are carried forward.
   - Keep the home page and navigation clear enough for a live classroom demo.

2. **Account and tag behavior**
   - A Business account has a company name and the business’s industry tags.
   - A Personal account can select multiple interest/industry tags.
   - Decide whether the business account may select one primary tag plus secondary tags, or several business tags. Record one rule and use it consistently.
   - Decide how account tags affect feed recommendations and how post/request tags are chosen.

3. **Screen content and hierarchy**
   - Account: account type, display/company name, selected tags, save/continue action.
   - Feed: search, tag filters, supplier/post cards, clear empty state.
   - Supplier Profile: company, services, capacity, location, certifications, description, request/contact action.
   - Buyer Request: required fields, optional fields, validation messages, submit confirmation.
   - Matching: overall score, six criteria, missing-data explanation, connect action.
   - Connections: supplier, request, pending status, duplicate/error message.

4. **Visual and interaction rules**
   - Agree on color palette, typography, spacing, button styles, cards, tags, and form controls.
   - Check desktop first, then ensure the layout remains usable on a narrow/mobile viewport.
   - Define loading, empty, success, and error states for every API-driven screen.
   - Use consistent Vietnamese labels in the demo UI; keep API fields in camelCase.

### UI/UX sign-off deliverables

Before starting broad code changes, produce a short shared decision note (in chat or task notes; no new design tool is required):

- One agreed user-flow diagram or numbered flow.
- A short wireframe/sketch for each of the six screens, including navigation.
- The chosen Business/Personal tag rule.
- Shared visual choices and component list.
- Acceptance bullets for each owner’s screen.

Kiên gives the final scope sign-off. If the team cannot agree within 25 minutes, use the current app layout and choose the smallest consistent behavior so implementation can continue.

## 4. Tasks by owner

### Kiên — Member 1 + Member 5

**Goal:** keep the API contract reliable, connect the existing modules, and get one repeatable demo flow working.

#### Backend/API

- Confirm `GET /api/health`, supplier list/detail, request list/create, matching, and connection list/create still match the client API adapter.
- Tighten `POST /api/requests` validation: require the fields needed by the demo, check arrays and strings, trim text, and return actionable 400 errors.
- Tighten `POST /api/connections`: verify the request and supplier exist, ensure `buyerId` matches the request owner, preserve duplicate handling (409), and use clear status codes.
- Keep JSON storage and the existing API response shapes. Do not introduce a database, auth provider, package, or broad route rewrite during this sprint.
- Protect seed data during testing; restore it if a manual API action changes the JSON files.

#### Matching and Connections integration

- Verify the selected/created `requestId` reaches Matching instead of silently using only the seed request.
- Verify each result can resolve supplier details and shows score, six-part breakdown, and `missingData` clearly.
- Verify the connect action sends the correct `requestId`, `buyerId`, and `supplierId`.
- Verify the Connections screen shows the created pending connection and handles duplicate/error responses.
- Confirm location scoring still passes; task 3.1 is complete and should not be reworked unless a failing regression is found.

#### Integration and final QA

- Coordinate changes to `App.jsx`, shared styles, API adapter, and package files.
- Run server and client tests once after module integration; run frontend build once near the end.
- Walk the full demo flow and record only blocker/high issues. Ask the owner to fix a module-local issue; fix shared integration issues directly.
- Freeze new features in the last 30 minutes. Prepare the demo account, request ID, supplier, and a short presentation sequence.

**Kiên’s completion criteria:** all core API calls return expected data/errors, the main flow is repeatable, tests/build pass, and the demo does not depend on a feature that is still being edited.

### Tiến — Member 2: Account & Industry Tags

**Goal:** make the selected demo account and tags available to the other screens.

- Review the existing `AccountView`; keep its current working UI and implement only the agreed behavior.
- Provide one Business and one Personal demo account with consistent IDs and field names.
- Apply the agreed tag rule: Business account uses the business’s industry tags; Personal account can select multiple interests.
- Make selected account/tags accessible outside the component through the smallest shared-state approach agreed with Kiên (lifted state, context, or a small adapter). Avoid introducing a state library.
- Persist only what the demo needs, using local state or localStorage if agreed; do not add real authentication.
- Tell Danh and Ân the exact object shape and tag list before they connect their screens.

**Files:** primarily `client/src/modules/account/`; coordinate any `App.jsx`/shared-state changes with Kiên.

**Completion criteria:** changing demo account changes the selected account and tags seen by Feed and Buyer Request; refresh behavior is understood and predictable.

### Danh — Member 3: Feed & Search

**Goal:** make the existing feed useful for the demo and responsive to account tags.

- Review the existing `FeedView`; retain working supplier loading, filter, and search behavior.
- Use tags from Tiến’s selected account rather than a disconnected hard-coded selection where feasible.
- Ensure filters and search compose correctly and a zero-result state is clear.
- Confirm supplier cards open the correct Supplier Profile through the existing callback.
- Use current supplier data and mock data already in the repository. Add only a small number of post fixtures if the UI/UX sign-off confirms posts are needed for the MVP; avoid building a posting backend today.
- Add or refine loading and API error states without changing the API adapter.

**Files:** primarily `client/src/modules/feed/`; coordinate shared account props and routes with Kiên and Tiến.

**Completion criteria:** the feed loads, filters/searches, reflects the chosen tags, opens supplier details, and handles loading/error/empty states.

### Ân — Member 4: Supplier Profile & Buyer Request

**Goal:** make supplier details clear and produce a valid request that continues into Matching.

#### Supplier Profile

- Review the existing `SupplierDetailView` and check every field against supplier JSON/API data.
- Display missing values as “Not provided” (or the agreed Vietnamese equivalent), not as `null` or blank placeholders.
- Provide a clear action to create a request or continue to the next relevant screen.
- Confirm supplier selection from Danh’s feed opens the same supplier ID.

#### Buyer Request

- Review the existing `CreateRequestView` and align payload fields with `POST /api/requests`.
- Populate `buyerId`, account tags, and business model from Tiến’s selected account when available.
- Validate required fields before submit; show server validation errors in understandable language.
- On success, pass the returned request object/ID to Kiên’s Matching screen.
- Keep fields to the agreed demo scope; do not add a multi-step form unless it improves completion in the timebox.

**Files:** `client/src/modules/suppliers/` and `client/src/modules/requests/`; coordinate account data and navigation with Tiến and Kiên.

**Completion criteria:** supplier profile displays real API/mock data; a valid request receives a success state and its returned ID is used by Matching.

## 5. UI/UX and delivery schedule — 3.5-hour target

Use this as a relative schedule from the start of the work session. The final 30 minutes are a buffer within the 4-hour maximum.

| Time | Focus | Owners | Exit condition |
|---|---|---|---|
| 00:00–00:25 | UI/UX decisions, tag rules, scope freeze, API/data handoff | Tiến, Danh, Ân; Kiên approves | Shared screen flow, account/tag rule, wireframes and acceptance bullets agreed |
| 00:25–01:25 | Parallel module work in existing files | All four | Each owner reports module ready for integration or names one blocker |
| 01:25–02:10 | Connect shared account state, feed/profile/request/matching/navigation | Kiên coordinates; owners fix own modules | Created request ID reaches matching; supplier and connection IDs remain consistent |
| 02:10–02:50 | Backend validation, focused tests, live API check | Kiên; other owners fix UI defects | Critical validation cases pass; main API sequence works |
| 02:50–03:20 | End-to-end demo, responsive check, defect fixes | All; Kiên triages | No blocker in the full demo flow; high issues have a fix or documented fallback |
| 03:20–03:30 | Feature freeze, seed reset, demo rehearsal | Kiên leads | Stable branch/worktree, known demo IDs, short runbook |
| 03:30–04:00 | Contingency buffer only | Relevant owner | Resolve unexpected blocker; do not start feature expansion |

If a dependency is not ready at its checkpoint, use the existing mock adapter with the same API shape and keep moving. Replace it with the live API during integration when it becomes available.

## 6. Codex credit policy

Each member has an individual allowance of **2,500 Codex credits**. Credits are a ceiling, not a spending target; do not use the full allowance just because it is available.

- **Target:** keep at least half of each member’s credits unused. Use more only when Kiên agrees that a blocker requires it.
- Before prompting, inspect the assigned module and write down the exact outcome and acceptance criteria.
- Use one focused implementation prompt per task. Include allowed files, API shape, visual decisions, and “do not rewrite unrelated modules.”
- Ask Codex to summarize changed files and unresolved items; review the diff before accepting.
- Avoid asking multiple members/Codex sessions to edit the same shared file or solve the same task.
- Do not spend credits on re-scaffolding, repeated broad repository summaries, speculative features, or polishing details before the main flow works.
- If the first implementation misses a criterion, send one targeted correction prompt with the failing case. If it still does not progress, report the blocker to Kiên and switch to the agreed fallback.
- At each checkpoint, each member reports approximate credits remaining along with done/next/blocker; prioritize finishing the flow over consuming the allowance.

## 7. Collaboration and integration rules

- Keep work inside the owner’s module. Kiên coordinates shared files and API changes.
- Preserve the agreed camelCase contract and matching response shape.
- Do not install new dependencies during the 3–4-hour sprint unless an existing requirement cannot be completed otherwise and Kiên approves.
- Do not commit `.env`, credentials, `node_modules/`, or build output.
- If blocked for 10 minutes, share the command, error/log, relevant file, and attempted fix with Kiên.
- Integrate after the first usable slice; do not wait for every visual detail to be polished.
- Freeze new features at T+2:50. Use the remaining time for bug fixes, reset data, and rehearsal.

## 8. End-of-session acceptance checklist

- [ ] Frontend starts and builds.
- [ ] Backend starts; `GET /api/health` returns `status: ok`.
- [ ] Demo account selection works and selected tags reach the feed/request flow.
- [ ] Feed search/filter works and opens the correct supplier.
- [ ] Supplier profile shows the available supplier information.
- [ ] Buyer Request validates, saves, and returns a request ID.
- [ ] Matching uses that request ID and shows ranked suppliers, score, breakdown, and missing-data messages.
- [ ] User can create a connection and see its pending status.
- [ ] Duplicate or invalid requests show understandable errors.
- [ ] Server tests, client tests, and frontend build pass.
- [ ] Seed data is reset to a known demo state and the team rehearses the presentation once.
- [ ] Each member has kept unused Codex credits; no one was asked to exhaust their allowance.

## 9. Cut scope if the 4-hour limit is at risk

Keep the primary path working: choose a demo account → browse/filter suppliers → open profile → create request → view matching → send connection. If time gets tight:

1. Use seeded/mock posts rather than building post creation or persistence.
2. Keep profile editing to the fields needed for tags and the demo identity.
3. Use mock fallback for a non-critical API that is still blocked, clearly labeled in the UI.
4. Defer animation, extra filters, additional supplier/request fixtures, and nonessential visual polish.
5. Do not defer data validation that can create an invalid request/connection, the main matching result, or one complete end-to-end rehearsal.
