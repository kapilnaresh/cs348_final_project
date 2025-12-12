from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, engine
from .routers_parlays import router as parlays_router
from .routers_reference import router as reference_router
from .routers_reports import router as reports_router
from .routers_seed import router as seed_router


Base.metadata.create_all(bind=engine)

app = FastAPI(title="NBA Parlay Tracker API")

# Allow frontend dev server to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parlays_router)
app.include_router(reference_router)
app.include_router(reports_router)
app.include_router(seed_router)

