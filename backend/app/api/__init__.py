from .health import router as health_router
from .customers import router as customers_router
from .activities import router as activities_router
from .tasks import router as tasks_router
from .inbox import router as inbox_router
from .suggestions import router as suggestions_router

__all__ = ["health_router", "customers_router", "activities_router", "tasks_router", "inbox_router", "suggestions_router"]
