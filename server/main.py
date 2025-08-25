from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from api.lookup import get_info


app = FastAPI(title="learnCJK.dev API", version="0.1.0")

# CORS: allow all origins for simplicity in early stages
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok"}


@app.get("/api/lookup")
def api_lookup(char: str, output_format: Optional[str] = None, verbose: bool = False):
    if not char or len(char) == 0:
        raise HTTPException(status_code=400, detail="Query parameter 'char' is required")
    ci = get_info(char=char, input_lang="auto", output_format=output_format, verbose=verbose)
    # FastAPI will serialize dataclasses via asdict-like behavior if needed, but Object has attributes.
    # Convert to plain dict for stability.
    return {
        "char": ci.char,
        "detected_input_lang": ci.detected_input_lang,
        "japanese": {"char": ci.japanese.char, "same_as_input": ci.japanese.same_as_input},
        "simplified": {"char": ci.simplified.char, "same_as_input": ci.simplified.same_as_input},
        "traditional": {"char": ci.traditional.char, "same_as_input": ci.traditional.same_as_input},
        "composition": {
            "decomposition": ci.composition.decomposition,
            "jp_supercompositions": ci.composition.jp_supercompositions,
            "zh_supercompositions": ci.composition.zh_supercompositions,
            "merged_supercompositions": ci.composition.merged_supercompositions,
        },
        "variants": ci.variants,
        "md": getattr(ci, "md", None),
    }


# Static site
app.mount("/static", StaticFiles(directory="web"), name="static")


@app.get("/", response_class=HTMLResponse)
def index() -> HTMLResponse:
    try:
        with open("web/index.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>learnCJK.dev</h1><p>Static site not found.</p>", status_code=200)

