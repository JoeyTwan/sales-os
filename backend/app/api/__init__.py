from .health import router as health_router
from .customers import router as customers_router
from .activities import router as activities_router
from .tasks import router as tasks_router
from .projects import router as projects_router
from .inbox import router as inbox_router
from .suggestions import router as suggestions_router
from .customer_ai_summary import router as customer_ai_summary_router
from .auth import router as auth_router

__all__ = ["health_router", "customers_router", "activities_router", "tasks_router", "projects_router", "inbox_router", "suggestions_router", "customer_ai_summary_router", "auth_router"]
