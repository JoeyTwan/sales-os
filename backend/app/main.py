from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import health_router, customers_router, activities_router, tasks_router, inbox_router, suggestions_router
from .database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Sales OS API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(customers_router)
app.include_router(activities_router)
app.include_router(tasks_router)
app.include_router(inbox_router)
app.include_router(suggestions_router)


@app.get("/")
async def root():
    return {"message": "Welcome to Sales OS API"}
