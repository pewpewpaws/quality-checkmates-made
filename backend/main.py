import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.services.qualcomm_service import QualcommService
from backend.services.storage import store
from backend.models.schemas import RequirementStatement, RequirementStatus, DualKeySignOff
from backend.api import (
    requirements_router,
    parse_router,
    analysis_router,
    chat_router,
    projects_router,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("req-quality-copilot")

qualcomm = QualcommService()


def preload_demo_datasets():
    """Preload representative industry requirements for instant 3-minute pitch readiness."""
    sample_requirements = [
        RequirementStatement(
            id="REQ-BMS-001",
            text="The battery management system shall periodically transmit telemetry data to the central cloud repository as appropriate.",
            category="Automotive BMS",
            section="Section 4.2 - Telemetry",
            status=RequirementStatus.FLAGGED_TBD,
            sign_off=DualKeySignOff(
                requirement_id="REQ-BMS-001",
                state=RequirementStatus.FLAGGED_TBD
            )
        ),
        RequirementStatement(
            id="REQ-BMS-002",
            text="The thermal management module should quickly reduce power consumption and warn the driver if temperature is critical.",
            category="Automotive BMS",
            section="Section 4.5 - Thermal Safety",
            status=RequirementStatus.FLAGGED_TBD,
            sign_off=DualKeySignOff(
                requirement_id="REQ-BMS-002",
                state=RequirementStatus.FLAGGED_TBD
            )
        ),
        RequirementStatement(
            id="REQ-IOT-003",
            text="The IoT sensor gateway shall buffer reading samples where feasible while preserving minimal memory overhead.",
            category="IoT Gateway",
            section="Section 2.1 - Ingestion",
            status=RequirementStatus.FLAGGED_TBD,
            sign_off=DualKeySignOff(
                requirement_id="REQ-IOT-003",
                state=RequirementStatus.FLAGGED_TBD
            )
        ),
        RequirementStatement(
            id="REQ-MED-004",
            text="The infusion controller shall maintain high reliability and shut off pump flow if high pressure is detected.",
            category="Medical Infusion",
            section="Section 5.1 - Pressure Safety",
            status=RequirementStatus.FLAGGED_TBD,
            sign_off=DualKeySignOff(
                requirement_id="REQ-MED-004",
                state=RequirementStatus.FLAGGED_TBD
            )
        )
    ]
    store.bulk_add(sample_requirements)
    logger.info(f"Preloaded {len(sample_requirements)} pitch-ready demo requirements into store.")


# Preload on import for immediate state availability across testing and ASGI servers
preload_demo_datasets()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Requirement Quality Copilot Backend...")
    preload_demo_datasets()
    yield
    logger.info("Shutting down Requirement Quality Copilot Backend...")


app = FastAPI(
    title="Requirement Quality Copilot API (PSE-01)",
    description="Enterprise-grade AI requirements auditor powered by Qualcomm Cloud AI 100 inference acceleration.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration for local and staged frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(requirements_router)
app.include_router(parse_router)
app.include_router(analysis_router)
app.include_router(chat_router)
app.include_router(projects_router)


@app.get("/")
async def root():
    return {
        "project": "Requirement Quality Copilot (PSE-01)",
        "hardware": "Qualcomm Cloud AI 100 via Cirrascale",
        "status": "online",
        "docs_url": "/docs"
    }


@app.get("/health")
async def health_check():
    """Verify backend and Qualcomm AI100 cluster connectivity."""
    ping_result = await qualcomm.ping()
    return {
        "backend": "healthy",
        "qualcomm_ai100": ping_result,
        "active_requirements_count": len(store.get_all())
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
