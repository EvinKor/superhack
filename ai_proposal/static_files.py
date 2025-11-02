"""Serve static demo files."""

from fastapi import APIRouter
from fastapi.responses import HTMLResponse
from pathlib import Path


router = APIRouter()


@router.get("/demo", response_class=HTMLResponse, tags=["Demo"])
async def serve_demo():
    """Serve the main demo dashboard HTML."""
    demo_path = Path("demo/index.html")
    if demo_path.exists():
        return HTMLResponse(content=demo_path.read_text(encoding='utf-8'))
    else:
        return HTMLResponse(
            content="<h1>Demo page not found</h1><p>Please ensure demo/index.html exists.</p>",
            status_code=404
        )


@router.get("/proposal-generator", response_class=HTMLResponse, tags=["Demo"])
@router.get("/generator", response_class=HTMLResponse, tags=["Demo"])
async def serve_proposal_generator():
    """Serve the proposal generator interface."""
    generator_path = Path("demo/proposal-generator.html")
    if generator_path.exists():
        return HTMLResponse(content=generator_path.read_text(encoding='utf-8'))
    else:
        return HTMLResponse(
            content="<h1>Proposal Generator not found</h1><p>Please ensure demo/proposal-generator.html exists.</p>",
            status_code=404
        )

