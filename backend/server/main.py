from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.api.char import get_info


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
def api_lookup(char: str, output_format: Optional[str] = None):
    if not char or len(char) == 0:
        raise HTTPException(status_code=400, detail="Query parameter 'char' is required")
    ci = get_info(char=char, input_lang="auto", output_format=output_format)
    # Use the dataclass helper to produce a plain serializable dict
    return ci.to_dict()


# Note: Frontend is served by a separate Node dev server in dev.
