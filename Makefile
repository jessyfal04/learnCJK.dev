SHELL := /bin/bash
PY=python
VENVDIR=.venv

.PHONY: venv pip npm web install run dev watch-web test fmt setup clean

venv:
	$(PY) -m venv $(VENVDIR)
	. $(VENVDIR)/bin/activate; pip install -U pip

pip:
	. $(VENVDIR)/bin/activate; pip install -r requirements.txt

npm:
	npm install

web:
	npm run build:web

install: venv pip npm web

setup: install ## Full setup: venv + pip + npm + web build

run:
	. $(VENVDIR)/bin/activate; python -m uvicorn server.app:app --reload --host 0.0.0.0 --port 8000 --reload-dir backend --reload-dir frontend --reload-dir server

watch-web:
	npm run watch:web

dev:
	@echo "Starting unified Python server + TS watcher (Ctrl+C to stop)"
	. $(VENVDIR)/bin/activate; python server/dev.py

test:
	@echo "Add pytest and tests/ then run: pytest -q"

fmt:
	@echo "If using black & ruff: black . && ruff check --fix ."


clean:
	rm -rf $(VENVDIR) node_modules frontend/js/*.js frontend/js/*.js.map frontend/css/bulma.min.css
	find . -type d -name "__pycache__" -prune -exec rm -rf {} +
	find . -type f -name "*.py[co]" -delete
	rm -rf .pytest_cache .mypy_cache
