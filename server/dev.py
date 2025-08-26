from __future__ import annotations

import os
import signal
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent


def which_tsc() -> str | None:
    local = ROOT / "node_modules" / ".bin" / ("tsc.cmd" if os.name == "nt" else "tsc")
    if local.exists():
        return str(local)
    return "tsc"  # hope it's on PATH


def main() -> int:
    env = os.environ.copy()

    # Start TypeScript watcher
    tsc = which_tsc()
    ts_watch = subprocess.Popen(
        [tsc, "-w", "-p", str(ROOT / "frontend" / "tsconfig.json")],
        cwd=str(ROOT),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )

    # Start uvicorn with reload
    uvicorn_cmd = [sys.executable, "-m", "uvicorn", "server.app:app", "--reload", "--host", "0.0.0.0", "--port", "8000",
                   "--reload-dir", str(ROOT / "backend"), "--reload-dir", str(ROOT / "frontend"), "--reload-dir", str(ROOT / "server")]
    api = subprocess.Popen(uvicorn_cmd, cwd=str(ROOT), env=env)

    def _terminate_all(signum, _frame):
        for p in (ts_watch, api):
            try:
                p.terminate()
            except Exception:
                pass
        for p in (ts_watch, api):
            try:
                p.wait(timeout=5)
            except Exception:
                try:
                    p.kill()
                except Exception:
                    pass
        sys.exit(0)

    signal.signal(signal.SIGINT, _terminate_all)
    signal.signal(signal.SIGTERM, _terminate_all)

    # Stream TypeScript watcher logs to stdout to aid debugging
    try:
        while True:
            line = ts_watch.stdout.readline()
            if not line:
                break
            sys.stdout.buffer.write(b"[tsc] " + line)
            sys.stdout.flush()
    finally:
        _terminate_all(signal.SIGTERM, None)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

