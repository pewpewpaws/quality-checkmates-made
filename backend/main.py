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


from backend.models.schemas import (
    RequirementStatement,
    RequirementStatus,
    DualKeySignOff,
    ProjectDocumentContext,
    IssueCard
)
from backend.services.rubric_engine import rubric_engine


def preload_demo_datasets():
    """Preload representative industry projects with isolated requirements for instant 3-minute pitch readiness."""
    
    # 1. Project: Default / 800V BMS
    bms_reqs = [
        RequirementStatement(
            id="REQ-BMS-001",
            project_id="default_project",
            text="The battery management system shall periodically transmit telemetry data to the central cloud repository as appropriate.",
            category="Automotive BMS",
            section="Section 4.2 - Telemetry",
            status=RequirementStatus.FLAGGED_TBD,
            issues=[
                IssueCard(
                    issue_type="Ambiguity",
                    severity="Major",
                    evidence_quote="as appropriate",
                    explanation="The phrase 'as appropriate' is ambiguous and does not provide clear criteria for when the battery management system should transmit telemetry data.",
                    suggested_action="Clarify exact transmission policy or state trigger",
                    start_offset=105,
                    end_offset=119,
                    is_grounded=True,
                ),
                IssueCard(
                    issue_type="Unverifiability",
                    severity="Major",
                    evidence_quote="periodically",
                    explanation="The term 'periodically' is not verifiable, as it does not specify the exact time interval or sampling rate for transmission.",
                    suggested_action="Specify exact transmission interval in ms (e.g. every 1000ms)",
                    start_offset=36,
                    end_offset=48,
                    is_grounded=True,
                )
            ],
            sign_off=DualKeySignOff(
                requirement_id="REQ-BMS-001",
                state=RequirementStatus.FLAGGED_TBD
            )
        ),
        RequirementStatement(
            id="REQ-BMS-002",
            project_id="default_project",
            text="The thermal management module should quickly reduce power consumption and warn the driver if temperature is critical.",
            category="Automotive BMS",
            section="Section 4.5 - Thermal Safety",
            status=RequirementStatus.PROVISIONAL_PM,
            sign_off=DualKeySignOff(
                requirement_id="REQ-BMS-002",
                state=RequirementStatus.PROVISIONAL_PM,
                pm_author="Alex Mercer (PM)",
                pm_target_val="Derate by 50% power when pack temp exceeds 58°C"
            )
        ),
        RequirementStatement(
            id="REQ-BMS-003",
            project_id="default_project",
            text="The high-voltage contactor controller shall disconnect the traction battery within 10ms upon detecting an ASIL-D crash trigger or pyrotechnic fuse trip.",
            category="Automotive BMS",
            section="Section 6.1 - High Voltage Safety",
            status=RequirementStatus.LOCKED_BASELINE,
            sign_off=DualKeySignOff(
                requirement_id="REQ-BMS-003",
                state=RequirementStatus.LOCKED_BASELINE,
                pm_author="Alex Mercer (PM)",
                pm_target_val="<= 10ms disconnection latency",
                tech_lead_approver="Dr. Aris Thorne (Lead Systems Engineer)",
                hardware_rationale="Meets ISO 26262 ASIL-D high-voltage disconnect timing requirement on hardware test bench.",
                signed_off_at=None
            )
        )
    ]

    # 2. Project: Aerospace Flight Control (DO-178C)
    if "proj-flight" not in store._projects:
        store.create_project(
            project_id="proj-flight",
            project_name="Commercial Fly-By-Wire Flight Computer",
            domain="Aerospace Avionics (DO-178C / Level-A)",
            description="Triple-modular redundant primary flight control computer for fly-by-wire commercial transport aircraft."
        )
        store.add_document("proj-flight", ProjectDocumentContext(
            id="DOC-AERO-001",
            title="Flight Control Safety Charter",
            content="Pitch authority limit: -10 deg to +25 deg. Actuator slew rate >= 40 deg/sec. Total sidestick latency <= 25ms.",
            category="Avionics Specification"
        ))

    aero_reqs = [
        RequirementStatement(
            id="REQ-AERO-001",
            project_id="proj-flight",
            text="The primary flight control computer shall command elevator pitch trim actuators within [TBD: latency_ms] upon sidestick displacement.",
            category="Flight Dynamics",
            section="Section 3.1 - Pitch Control",
            status=RequirementStatus.FLAGGED_TBD,
            sign_off=DualKeySignOff(requirement_id="REQ-AERO-001", state=RequirementStatus.FLAGGED_TBD)
        ),
        RequirementStatement(
            id="REQ-AERO-002",
            project_id="proj-flight",
            text="The stall warning system should activate stick-shaker vibration when angle-of-attack exceeds critical threshold for more than 200ms.",
            category="Flight Dynamics",
            section="Section 3.4 - Stall Protection",
            status=RequirementStatus.PROVISIONAL_PM,
            sign_off=DualKeySignOff(
                requirement_id="REQ-AERO-002",
                state=RequirementStatus.PROVISIONAL_PM,
                pm_author="Sarah Jenkins (PM)",
                pm_target_val="AoA threshold = 14.5° in clean configuration"
            )
        ),
        RequirementStatement(
            id="REQ-AERO-003",
            project_id="proj-flight",
            text="The triple-redundant autopilot disengage override shall transfer manual authority to pilot controls within 15ms of disconnect button actuation.",
            category="Flight Control",
            section="Section 5.2 - Override Safety",
            status=RequirementStatus.LOCKED_BASELINE,
            sign_off=DualKeySignOff(
                requirement_id="REQ-AERO-003",
                state=RequirementStatus.LOCKED_BASELINE,
                pm_author="Sarah Jenkins (PM)",
                pm_target_val="15ms transfer window",
                tech_lead_approver="Col. Marcus Vance (Chief Flight Architect)",
                hardware_rationale="Verified on Iron Bird test bench with MIL-STD-1553B bus compliance."
            )
        )
    ]

    # 3. Project: Medical Infusion Device (IEC 62304)
    if "proj-med" not in store._projects:
        store.create_project(
            project_id="proj-med",
            project_name="Precision Smart Infusion Pump",
            domain="Medical Devices (IEC 62304 / Class III)",
            description="Dual-channel precision syringe and volumetric infusion pump with anti-free-flow clamp and ultrasonic air-in-line detection."
        )
        store.add_document("proj-med", ProjectDocumentContext(
            id="DOC-MED-001",
            title="Infusion Safety Charter",
            content="Maximum allowable occlusion pressure: 100 kPa ± 10 kPa. Air-in-line sensor bubble detection threshold: 50 microliters.",
            category="Medical Safety Standard"
        ))

    med_reqs = [
        RequirementStatement(
            id="REQ-MED-001",
            project_id="proj-med",
            text="The infusion controller shall maintain high reliability and shut off pump flow if high pressure is detected.",
            category="Fluidics Safety",
            section="Section 2.1 - Occlusion Control",
            status=RequirementStatus.FLAGGED_TBD,
            sign_off=DualKeySignOff(requirement_id="REQ-MED-001", state=RequirementStatus.FLAGGED_TBD)
        ),
        RequirementStatement(
            id="REQ-MED-002",
            project_id="proj-med",
            text="The bolus metering module shall deliver medication within [TBD: bolus_accuracy_pct] of programmed dose.",
            category="Dosing Accuracy",
            section="Section 2.4 - Micro-Bolus",
            status=RequirementStatus.PROVISIONAL_PM,
            sign_off=DualKeySignOff(
                requirement_id="REQ-MED-002",
                state=RequirementStatus.PROVISIONAL_PM,
                pm_author="Dr. Clara Vance (PM)",
                pm_target_val="± 2.0% volumetric delivery accuracy"
            )
        ),
        RequirementStatement(
            id="REQ-MED-003",
            project_id="proj-med",
            text="The emergency battery backup module shall sustain continuous fluid delivery at 50 mL/hr for at least 120 minutes following AC mains interruption.",
            category="Power Failsafe",
            section="Section 4.1 - Power Management",
            status=RequirementStatus.LOCKED_BASELINE,
            sign_off=DualKeySignOff(
                requirement_id="REQ-MED-003",
                state=RequirementStatus.LOCKED_BASELINE,
                pm_author="Dr. Clara Vance (PM)",
                pm_target_val="120 minutes battery runtime",
                tech_lead_approver="Dr. Elena Rostova (Lead Biomedical Systems Engineer)",
                hardware_rationale="Validated across Li-ion pack aging cycle tests under full stepper motor load."
            )
        )
    ]

    # Calculate rubric scores for all demo requirements
    all_demo = [("default_project", bms_reqs), ("proj-flight", aero_reqs), ("proj-med", med_reqs)]
    for pid, req_list in all_demo:
        for r in req_list:
            rubric_engine.score_requirement(r)
        store.bulk_add(req_list, project_id=pid)

    logger.info("Preloaded pitch-ready isolated demo projects: default_project, proj-flight, proj-med.")


def init_workspaces():
    """Ensure standard project workspaces exist without injecting mock requirements."""
    if "default_project" not in store._projects:
        store.create_project(
            project_id="default_project",
            project_name="800V Automotive BMS (ISO 26262)",
            domain="Automotive Safety (ISO 26262 / ASIL-D)",
            description="Battery management system controlling high-voltage contactor isolation and thermal runaway containment."
        )
    if "proj-flight" not in store._projects:
        store.create_project(
            project_id="proj-flight",
            project_name="Commercial Fly-By-Wire Flight Computer",
            domain="Aerospace Avionics (DO-178C / Level-A)",
            description="Triple-modular redundant primary flight control computer for fly-by-wire commercial transport aircraft."
        )
    if "proj-med" not in store._projects:
        store.create_project(
            project_id="proj-med",
            project_name="Precision Smart Infusion Pump",
            domain="Medical Devices (IEC 62304 / Class III)",
            description="Dual-channel precision syringe and volumetric infusion pump with anti-free-flow clamp and ultrasonic air-in-line detection."
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Requirement Quality Copilot Backend (Live Qualcomm Cloud AI 100)...")
    init_workspaces()
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
