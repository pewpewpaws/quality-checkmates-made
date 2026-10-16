from backend.api.routes_requirements import router as requirements_router
from backend.api.routes_parse import router as parse_router
from backend.api.routes_analysis import router as analysis_router
from backend.api.routes_chat import router as chat_router

__all__ = ["requirements_router", "parse_router", "analysis_router", "chat_router"]
