# Nexora — Employer Service Operations

A local employer workspace for service dispatch, prescribed medication schedules,
administration outcomes, data integrity verification and reporting. Next.js,
Tailwind and Radix UI connect to FastAPI and SQLite. Exactly five deterministic
agents own the workflows; no paid APIs, remote inference or model downloads are
required. Packages are downloaded only during installation.

## What is implemented

| Agent | Responsibility and bound workflow |
| --- | --- |
| Employer Intake & Routing | Account-owned employer workspaces, client intake, validated request routing |
| Medication & Compliance | One prescribed scheduled dose per record; exact dose/unit matching; immutable recorded outcomes |
| Service Execution | Client-linked services, worker assignment, validated status transitions |
| Data Integrity & Audit | Pre-write and pre-commit verification, version conflicts, transaction rollback, hash-linked before/after history |
| Reporting & Insights | Service counts and adherence calculated from verified employer records |

The agent registry is in backend/agents.py. Authenticated writes enter
POST /api/operations and execute synchronously through registered tools.
POST /api/agents/dispatch is an explicitly read-only free-text planning endpoint;
it cannot create clinical or operational records. GET /api/agents lists the five
roles, tool bindings and fallbacks.

The dashboard includes Overview, Services, Medications, Clients, Agents, Audit
trail and Insights. It supports light/dark themes, mobile and collapsible
navigation, keyboard-accessible Radix dialogs, real sign-in, loading states,
errors and explicit refresh. Agent states reflect recent persisted actions or
the latest audit/report result, not simulated background workers.

## Start locally (Windows PowerShell)

Use Python 3.10+ and Node.js 22+. Open two terminals from the repository.

Backend:

~~~powershell
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements-dev.txt
$env:JWT_SECRET = 'replace-with-a-long-random-private-secret'
.\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
~~~

Frontend:

~~~powershell
cd frontend
npm ci
npm run dev
~~~

Open http://localhost:3000. Create an account, create an employer workspace,
add a client, and then dispatch a service or schedule a prescribed dose.

The API runs at http://localhost:8000, with interactive schemas at /docs and
the process/database health check at /api/health. Browser requests default to
that local API. Set NEXT_PUBLIC_API_URL before building the frontend to change it.
CORS_ORIGINS is a comma-separated list of trusted browser origins and defaults
to http://localhost:3000.

On macOS/Linux use python3, venv/bin/python and export JWT_SECRET=... .
With no JWT_SECRET, the API generates a temporary secret and tokens become
invalid after restart. Supply a private stable secret for normal use. Tokens
expire after one hour. The browser stores its token for the current tab session.

## Medication and data integrity contract

- Enter an existing prescribed dose, unit, route, prescriber, instructions and
  scheduled time. Browser-local times are converted to explicit UTC timestamps.
- Dosages are finite positive Decimals with up to four decimal places, stored
  as strings to avoid floating-point drift. The application does not determine
  clinically appropriate doses or check drug interactions.
- An outcome is given, missed or refused. Given must exactly match the recorded
  order's dose and unit; missed/refused must record zero administered dose.
- Each scheduled dose accepts one outcome. The outcome and its order then become
  immutable. Create a new schedule for the next dose; recurrence and correction
  workflows are not implemented.
- Updates require the current version and cannot reassign the client. Stale
  writes return HTTP 409. Duplicate request IDs return 409; the form keeps the
  same ID when retrying so a lost response cannot silently duplicate a write.
- Operational transactions acquire SQLite's write lock before reading versions.
  The audit agent checks schemas, references, record snapshots, medication
  outcomes and the hash chain before mutation and again before commit.
  Failure rolls back the record and audit event together.
- Reports use one consistent database snapshot. Integrity failure blocks
  reporting instead of displaying potentially corrupted metrics.
- Audit events include actor, timestamp, request ID and complete before/after
  snapshots. The UI shows the most recent 50; verification covers all events.
  Hash linking detects corruption, but is not a substitute for trusted backups
  or protection against someone who controls and rewrites the entire database.

Adherence = due scheduled doses recorded given / all scheduled doses due now.
Cancelled doses are excluded. No due doses displays a dash, not a fabricated
percentage. This is a record-based operational measure, not clinical certification.

## Storage and compatibility

SQLite defaults to backend/nexora.db when the API is launched from backend.
Accounts own separate employer workspaces; every operational write and dashboard
read checks ownership. Workforce assignment currently records a worker name;
shared memberships, worker availability and external dispatch integrations are
outside this implementation.

Schema creation is additive. Legacy user/wiki/document tables and existing
database files are retained; old unsecured wiki/document APIs and the simulated
frontend are retired. Existing bcrypt password hashes remain readable.
POST /api/chat returns 410. No medication tables existed in the original commit,
so medication tracking was added rather than migrated.

Back up an existing database before deployment changes. If the old PostgreSQL
Compose stack was used, export and migrate its records before adopting SQLite.
The refactor does not delete or automatically convert PostgreSQL volumes.

## Verification

~~~powershell
cd backend
.\venv\Scripts\python.exe -m unittest discover -s tests -v
.\venv\Scripts\python.exe -m compileall -q agents.py ai_engine.py main.py operations.py auth.py models.py schemas.py database.py
.\venv\Scripts\python.exe -m pip check
cd ../frontend
npm run typecheck
npm run build
~~~

Tests use isolated temporary databases. Coverage includes all five routing
contracts, API authentication, employer isolation, medication update history,
invalid doses, duplicate outcomes, stale versions, simultaneous writes, rollback,
audit corruption, and the integrated service → medication → audit → reporting
workflow. See docs/VERIFICATION.md for results and browser checks.

## Containers

~~~powershell
$env:JWT_SECRET = 'replace-with-a-long-random-private-secret'
docker compose config --quiet
docker compose up --build
~~~

Compose runs the frontend and API with a persistent SQLite named volume.
Ports 3000 and 8000 are bound to host loopback. The API listens on all interfaces
inside its container; backend health gates frontend startup. Docker build
contexts exclude local databases, environments and caches.
Do not use docker compose down -v if you want to retain the database.

Local workflows and Compose configuration were verified. Container startup was
not verified because the host Docker daemon was unavailable.

## Sequential delivery

Phase 1 was written and passed its eight tests, Python compilation, strict
TypeScript checking and production build before Phase 2 began. Its historical
audit is retained in docs/PHASE_1_AUDIT.md. Phase 2 added transactional records and
passed the integrated suite before the Phase 3 UI replacement. Phase 4 verified
the local workflow, browser behavior and final build.
