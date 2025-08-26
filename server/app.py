from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, Response
from fastapi.staticfiles import StaticFiles

from backend.api.char import get_info
from backend.api.list import get_list


ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT / "frontend"
HTML_DIR = FRONTEND_DIR / "html"
JS_DIR = FRONTEND_DIR / "js"
TS_DIR = FRONTEND_DIR / "ts"
CSS_DIR = FRONTEND_DIR / "css"


def _tsc_bin() -> Optional[str]:
    # Prefer local install
    local = ROOT / "node_modules" / ".bin" / ("tsc.cmd" if os.name == "nt" else "tsc")
    if local.exists():
        return str(local)
    # Fallback to PATH
    return "tsc"


def ensure_css() -> None:
    """Best-effort: ensure bulma.min.css is present under frontend/css."""
    CSS_DIR.mkdir(parents=True, exist_ok=True)
    target = CSS_DIR / "bulma.min.css"
    if target.exists():
        return
    # Try to copy from node_modules
    nm_bulma_min = ROOT / "node_modules" / "bulma" / "css" / "bulma.min.css"
    nm_bulma = ROOT / "node_modules" / "bulma" / "css" / "bulma.css"
    try:
        if nm_bulma_min.exists():
            shutil.copyfile(nm_bulma_min, target)
        elif nm_bulma.exists():
            shutil.copyfile(nm_bulma, target)
    except Exception:
        # Ignore copy errors; user can run npm run build:css
        pass


def ensure_ts_built() -> None:
    """Compile TS if main.js is missing or older than any TS source.

    Previous logic only compared main.ts vs main.js; here we consider the newest
    .ts file under frontend/ts to trigger rebuilds when dependencies change.
    """
    JS_DIR.mkdir(parents=True, exist_ok=True)
    js_main = JS_DIR / "main.js"
    if not TS_DIR.exists():
        return
    try:
        newest_ts_mtime = 0.0
        for p in TS_DIR.rglob("*.ts"):
            try:
                m = p.stat().st_mtime
                if m > newest_ts_mtime:
                    newest_ts_mtime = m
            except OSError:
                continue
        js_mtime = js_main.stat().st_mtime if js_main.exists() else 0.0
    except OSError:
        newest_ts_mtime, js_mtime = 0.0, 0.0

    if (not js_main.exists()) or newest_ts_mtime > js_mtime:
        try:
            subprocess.run([_tsc_bin(), "-p", str(FRONTEND_DIR / "tsconfig.json")], cwd=str(ROOT), check=True)
        except Exception:
            # Keep serving last-built JS if compilation fails
            pass


app = FastAPI(title="learnCJK.dev", version="0.2.0")


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok"}


@app.get("/api/char")
def api_char(char: str, output_format: Optional[str] = None):
    if not char:
        raise HTTPException(status_code=400, detail="Query parameter 'char' is required")
    ci = get_info(char=char, input_lang="auto", output_format=output_format)
    return ci.to_dict()


@app.get("/api/lists")
def api_lists(type: str, field: str):
    try:
        return get_list(type=type, field=field)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="lists.json not found. Generate it with cjk_list_to_json.py")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Pre-build assets opportunistically
ensure_css()


@app.get("/")
def index() -> Response:
    index_path = HTML_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return HTMLResponse("<h1>learnCJK.dev</h1><p>index.html not found.</p>")


@app.get("/index.html")
def index_html() -> FileResponse:
    return FileResponse(HTML_DIR / "index.html")

@app.get("/char")
def page_char() -> FileResponse:
    return FileResponse(HTML_DIR / "char.html")

@app.get("/lists")
def page_lists() -> FileResponse:
    return FileResponse(HTML_DIR / "lists.html")


@app.get("/char/{_path:path}")
def spa_char(_path: str) -> FileResponse:
    # SPA fallback: serve char.html for /char/*
    return FileResponse(HTML_DIR / "char.html")


@app.get("/static/js/main.js")
def static_main_js() -> FileResponse:
    # Ensure TS compiled on demand
    ensure_ts_built()
    return FileResponse(JS_DIR / "main.js")


# Static mount for everything else under /static → ./frontend
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR), html=False), name="static")


if __name__ == "__main__":
    # Convenience run: uvicorn with reload
    import uvicorn

    uvicorn.run(
        "server.app:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8000")),
        reload=True,
        reload_dirs=[str(ROOT / "backend"), str(ROOT / "server"), str(ROOT / "frontend")],
    )
