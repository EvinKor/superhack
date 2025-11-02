"""FastAPI application factory and server configuration."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from .config import settings
from .routes import router
from .static_files import router as static_router
from . import __version__


# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info(f"Starting AI Proposal Assistant v{__version__}")
    logger.info(f"Output directory: {settings.OUTPUT_DIR}")
    logger.info(f"ML Selection: {'enabled' if settings.ENABLE_ML_SELECTION else 'disabled'}")
    logger.info(f"LLM Polish: {'enabled' if settings.ENABLE_LLM_POLISH else 'disabled'}")
    
    from .data_store import data_store
    catalog = data_store.get_catalog()
    slas = data_store.get_slas()
    tiers = data_store.get_tiers()
    logger.info(f"Loaded: {len(catalog)} services, {len(slas)} SLAs, {len(tiers)} tiers")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Proposal Assistant")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="AI Proposal Assistant",
        description="Automated MSP proposal generation with ML-powered service selection",
        version=__version__,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc"
    )
    
    # Add middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    
    # Include routes
    app.include_router(router, prefix="/api/v1")
    app.include_router(static_router)
    
    @app.get("/")
    async def root():
        """Root endpoint with API information."""
        return {
            "name": "AI-Powered MSP Platform",
            "version": __version__,
            "demo": "/demo",
            "docs": "/docs",
            "status": "/api/v1/status",
            "health": "/api/v1/health",
            "modules": {
                "proposal_assistant": "POST /api/v1/proposals/generate (🟢 Live AI)",
                "predictive_pricing": "GET /api/v1/ai/predictive-pricing (🟡 Demo)",
                "growth_dashboard": "GET /api/v1/dashboard/growth (🟡 Demo)",
                "msp_integration": "GET /api/v1/integration/msp-sync (🟡 Demo)"
            }
        }
    
    return app


# Application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "ai_proposal.server:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    )

