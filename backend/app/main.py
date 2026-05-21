from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import AppConfig
from app.api.routes import router
from app.auth.routes import router as auth_router

def create_app() -> FastAPI:
    app = FastAPI(title="WallCraft", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=AppConfig.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)
    app.include_router(auth_router)
    return app

app = create_app()