# Repository Guidelines

## Project Structure & Module Organization
- `backend/api/interface.py`: Dataclasses for `Form`, `Composition`, `CharacterInfo`.
- `backend/api/lookup.py`: Core lookup using `cjkradlib` + `OpenCC` (+ markdown render).
- `backend/server/main.py`: FastAPI app, exposes `/api/lookup` and `/healthz`, serves `frontend/`.
- `frontend/html/`: HTML pages and includes (index.html, header.html, footer.html); `frontend/ts/` TypeScript; `frontend/js/` compiled JS; `frontend/css/` styles.
- `requirements.txt`, `package.json`, `Makefile`: deps and commands.

## Build, Test, and Development Commands
- Setup: `make setup` (venv + pip + npm + build web).
- Dev (watch TS + API): `make dev` → http://localhost:8000
- Only API: `make run` (reloads on Python edits)
- Only TS watch: `make watch-web`
- Build frontend once: `make web` (or `npm run build:web`)
- Clean: `make clean` (venv, node_modules, caches, built css/js)
- Quick API check: `curl 'http://localhost:8000/api/lookup?char=漢'`

## Coding Style & Naming Conventions
- Python: PEP 8, 4-space indent; typed functions; relative imports.
- Naming: files `snake_case.py`; functions `snake_case`; classes `PascalCase`.
- Frontend: no framework; typed DOM in `web/ts/`; compiled to `web/js/`.
- Formatting (optional): use `black` (88 cols) + `ruff`; format only touched files to keep diffs small.

## Testing Guidelines
- Framework: pytest. Place tests under `tests/` (e.g., `tests/test_lookup.py`).
- Cover: language detection paths (SC/TC/JP), converter present/absent, markdown render.
- API tests: use `httpx.AsyncClient` against FastAPI app in `server/main.py`.
- Run: `pytest -q`.

## Commit & Pull Request Guidelines
- Commits: imperative, concise subject (<=72 chars). Example: `server: add /healthz route`.
- Use prefixes when helpful: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`.
- PRs: include purpose, how to verify (commands and sample I/O), screenshots of UI when relevant.

## Security & Configuration Tips
- OpenCC is optional; code guards converter failures. Do not broaden exception scopes.
- CORS is permissive in dev. Restrict origins before production.
- Do not commit secrets; `.venv/` and `node_modules/` are ignored.

## Architecture Overview
- Flow: detect script → derive JP/SC/TC forms → merge composition/variants → optional markdown.
- Serving: FastAPI provides JSON and static files from `frontend/` under `/static`.
- HTML includes: pages may include common fragments via `<div data-include="/static/html/header.html">` and `/static/html/footer.html`. The loader in `frontend/ts/main.ts` fetches and injects these at runtime (no extra deps).

## Documentation Policy
- Any code changes that affect usage or structure must update both this AGENTS.md and README.md to keep docs in sync.
