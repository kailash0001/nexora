# Phase 1 audit and verification

Baseline: commit d47ee80. Reviewed the Python API, ORM, schemas, authentication,
retrieval engine, frontend store/routes/components, manifests and container setup.

## Findings

- No medication, patient/client, employer, service-job or operational audit tables
  existed. No medication records or migrations were present to preserve.
- One generic RAG/chat chain existed, plus a separate browser chat simulation.
  There were no specialized agent definitions or orphan agent configuration files.
- No paid provider SDK or required commercial API key was found. The landing page
  advertised fictional subscription tiers; these are UI content, not dependencies.
- SentenceTransformers loaded/downloaded a model at import. Its fallback used
  process-randomized hashes, yielding incompatible stored/query vectors.
- PostgreSQL/pgvector and Redis were in Compose but not used by application tools;
  the PostgreSQL driver was absent. The API bound to loopback inside its container.
- Frontend auth/MFA/OAuth, uploads, editing, analytics and audit downloads were
  demonstrations. Backend CRUD lacked consistent authorization and tenant checks.
- TypeScript errors were ignored; a missing search callback and nullable user
  references were exposed after restoring checks.
- Passlib was incompatible with the resolved bcrypt version, breaking password
  hashing. Direct bcrypt now preserves the stored bcrypt hash format.

## Phase 1 changes

- Exactly five immutable agent definitions, typed envelopes/results, explicit
  routing, bound tools, topology assertions and non-writing fallback handlers.
- Generic chat chain and browser fabricated replies removed; the retired endpoint
  returns 410. The existing assistant screen calls the structured dispatcher.
- Retrieval is deterministic local token hashing. Existing source records and
  stored embeddings are untouched; searches re-encode text consistently.
- Removed unused heavy model/document dependencies, remote font fetching and
  unused Compose services. Existing database volumes were not removed.
- Added health/schema endpoints and repeatable tests; restored build type checks.

## Phase 1 gate

- Eight backend tests passed, including all five routes, invalid contracts, audit
  failure, API/OpenAPI/health, password hashing and cross-process retrieval stability.
- Python source compilation passed.
- Frontend strict typecheck and production build passed.
- Docker Compose configuration validated. Container execution could not be tested:
  the Docker daemon is unavailable on this host.

Medication mutation/persistence, authenticated employer isolation, real metrics
and employer dashboard replacement belong to subsequent phases. Phase 1 returns
explicit unavailable/planning states; no clinical success or data preservation
claim can be inferred from these planning tests.
