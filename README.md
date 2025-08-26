# learnCJK.dev

Minimal web app to explore CJK character forms and composition. It exposes a typed Python API (FastAPI) and a Bulma UI written in TypeScript (no framework).

## Stack
- Server: Python 3.12, FastAPI, Uvicorn (serves API + frontend)
- Backend logic: OpenCC, cjkradlib
- Frontend: Bulma (via npm), TypeScript (no framework), vanilla DOM APIs
- Tooling: Makefile, npm scripts, virtualenv

## Project Structure
```
backend/
  api/
    interfaces.py   # Form/Composition/CharacterInfo dataclasses
    char.py         # get_info() core logic
server/
  app.py            # Unified FastAPI server for API + static + SPA
  dev.py            # Dev runner: tsc -w + uvicorn --reload
frontend/
  html/             # HTML pages and includes (index.html, header.html, footer.html)
  css/              # bulma.min.css copied from npm
  ts/               # TypeScript sources (main.ts, router.ts, components/)
  js/               # compiled JS output (main.js, router.js)
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
# Unified dev server (auto reloads Python; watches TS; static HTML served)
make dev
# Open http://localhost:8000

# Alternatively (one-off build) and run server with reload
make web && make run
# Open http://localhost:8000
```

## Makefile Commands
- `make setup`: venv + pip install + npm install + build frontend
- `make web`: build TypeScript and copy Bulma to `frontend/css/bulma.min.css`
- `make run`: start API with reload at `http://localhost:8000`
- `make dev`: run TypeScript watcher and API together (Ctrl+C to stop)
- `make clean`: remove venv, node_modules, Python caches, built css/js

## NPM Scripts
- `npm run build:ts`: compile `frontend/ts` → `frontend/js`
- `npm run build:css`: copy Bulma CSS from `node_modules` → `frontend/css/bulma.min.css`
- `npm run build:web`: build both TS and CSS
- `npm run watch:web`: TypeScript watch mode
- `npm run serve:web`: deprecated (use `make dev`)

## API
- `GET /healthz` → `{ "status": "ok" }`
- `GET /api/char?char=漢` → structured JSON with forms, composition, and variants
- `GET /api/lists?type=rtk|rth|rsh|hanja&field=chars|fields` → ordered list data built from CJKLearn and HanjaLevels

Example:
```
curl 'http://localhost:8000/api/char?char=漢'
curl 'http://localhost:8000/api/lists?type=rtk&field=chars'
curl 'http://localhost:8000/api/lists?type=hanja&field=fields' | head
```

## Static Site
- The unified Python server serves the frontend at `http://localhost:8000`.
- Edit `frontend/ts/*.ts` while `make dev` runs: the TS watcher recompiles to `frontend/js/`; refresh to see changes.
- Common header/footer are included via placeholders in `frontend/html/index.html`:
  - `<div data-include="/static/html/header.html"></div>`
  - `<div data-include="/static/html/footer.html"></div>`
  The include loader in `frontend/ts/main.ts` fetches and injects these at runtime using `fetch` (no extra npm dependency).

### Navigation
- No client-side router. Links navigate directly to `/char/:ch`; the page performs a single lookup on load.
- Any rendered character in the UI is a normal link to `/char/:ch`.
- The Character page shows a CJK Learn summary (keywords and per-region indices) followed by two tiles: Forms & variants (only when different/present) and Composition (decomposition + merged supercompositions).

### Dev Server Controls
- Unified server port: `PORT=8000 make run` (or `make dev`).

## Troubleshooting
- OpenCC install issues: install system libs noted above, then `pip install -r requirements.txt`.
- Import errors in `api.lookup`: ensure `api/__init__.py` exists (it’s included).
- Node not found: install Node 18+; rerun `npm install` and `make web`.
- Clean rebuild: `make clean && make setup`.

## Contributing
- See AGENTS.md for contributor guidelines, style, and testing notes.
