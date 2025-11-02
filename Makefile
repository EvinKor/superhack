.PHONY: help install dev test fmt lint clean

help:
	@echo "AI Proposal Assistant - Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Run development server"
	@echo "  make test       - Run tests"
	@echo "  make fmt        - Format code"
	@echo "  make lint       - Lint code"
	@echo "  make clean      - Clean generated files"

install:
	pip install -r requirements.txt

dev:
	uvicorn ai_proposal.server:app --reload --host 0.0.0.0 --port 8000

test:
	pytest tests/ -v --cov=ai_proposal --cov-report=term-missing

fmt:
	black ai_proposal/ tests/
	ruff --fix ai_proposal/ tests/

lint:
	ruff ai_proposal/ tests/
	black --check ai_proposal/ tests/

clean:
	rm -rf output/proposals/*.md
	rm -rf __pycache__ .pytest_cache .coverage
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

