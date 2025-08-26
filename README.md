# learnCJK.dev

Minimal web app to explore CJK character forms and composition. It exposes a typed Python API (FastAPI) and a Bulma UI written in TypeScript (no framework).

## Stack
- Backend: Python 3.12, FastAPI, Uvicorn, OpenCC, cjkradlib
- Frontend: Bulma (via npm), TypeScript (no framework), vanilla DOM APIs
- Tooling: Makefile, npm scripts, virtualenv

## Project Structure
```
api/                # Core lookup library (dataclasses + logic)
  interface.py      # Form/Composition/CharacterInfo types
  lookup.py         # get_info() + markdown rendering
backend/
  server/
    main.py         # FastAPI app, static mount
  api/
    ...             # Python API (lookup library)
frontend/
  html/             # HTML pages and includes (index.html, header.html, footer.html)
  css/              # styles.css and bulma.min.css (copied from npm)
  js/               # compiled TypeScript output (main.js)
  ts/               # TypeScript sources (main.ts)
Makefile            # Dev shortcuts
requirements.txt    # Python dependencies
package.json        # TypeScript + Bulma dev deps and scripts
AGENTS.md           # Contributor guide
```

## Requirements
- Python 3.12+
- Node.js 18+ (only for building the web assets)
- Optional system libs for OpenCC if your platform needs them (e.g., Debian/Ubuntu: `apt-get install -y build-essential cmake pkg-config libopencc-dev`)

## Setup
```
# One-shot setup (venv + pip + npm + build web)
make setup

# Or manual:
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
npm install
npm run build:web
```

## Run Locally
```
# Build web assets then start both servers (frontend + backend)
make dev
# Frontend: http://localhost:5173 (proxies /api → http://localhost:8000)

# Alternatively (assumes web assets already built) — API only
make run
# Open http://localhost:8000
```

## Makefile Commands
- `make setup`: venv + pip install + npm install + build frontend
- `make web`: build TypeScript and copy Bulma to `frontend/css/bulma.min.css`
- `make run`: start API with reload at `http://localhost:8000`
- `make dev`: run TypeScript watcher and API together (Ctrl+C to stop)
- `make clean`: remove venv, node_modules, Python caches, built css/js

## NPM Scripts
- `npm run build:ts`: compile `web/ts` → `web/js`
- `npm run build:css`: copy Bulma CSS from `node_modules` → `web/css/bulma.min.css`
- `npm run build:web`: build both TS and CSS
- `npm run watch:web`: TypeScript watch mode

## API
- `GET /healthz` → `{ "status": "ok" }`
- `GET /api/lookup?char=漢` → structured JSON with forms, composition, and variants

Example:
```
curl 'http://localhost:8000/api/lookup?char=漢'
```

## Static Site
- In dev, a small Node server serves the frontend at `http://localhost:5173` and proxies `/api/*` to the backend at `http://localhost:8000`.
- Edit `frontend/ts/*.ts` and run `make dev` (includes TS watcher, frontend server, and API). Refresh browser to see changes.
- Common header/footer are included via placeholders in `frontend/html/index.html`:
  - `<div data-include="/static/html/header.html"></div>`
  - `<div data-include="/static/html/footer.html"></div>`
  The include loader in `frontend/ts/main.ts` fetches and injects these at runtime using `fetch` (no extra npm dependency).

### Client-side Router
- Frontend navigation uses a lightweight TS router (`frontend/ts/router.ts`) with History API.
- Character pages are at `/char/:ch` (e.g., `/char/漢`). The frontend dev server serves `index.html` for any `/char/*` path so direct loads and refreshes work; the router then reads the URL and performs the lookup.

### Dev Server Controls
- Start only the frontend server: `npm run serve:web` (defaults to port `5173`).
- Configure ports/env:
  - `FRONTEND_PORT=5173 npm run serve:web` to change the frontend port.
  - `BACKEND_URL=http://localhost:8000 npm run serve:web` to adjust API proxy target.

## Troubleshooting
- OpenCC install issues: install system libs noted above, then `pip install -r requirements.txt`.
- Import errors in `api.lookup`: ensure `api/__init__.py` exists (it’s included).
- Node not found: install Node 18+; rerun `npm install` and `make web`.
- Clean rebuild: `make clean && make setup`.

## Contributing
- See AGENTS.md for contributor guidelines, style, and testing notes.
