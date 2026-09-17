from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import AppConfig
from app.api.routes import router
from app.api.pixel import router as pixel_router
from app.auth.routes import router as auth_router
from app.bot.scheduler import start_scheduler
from wallpaper_gen import  preload_backgrounds


        
        
@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    preload_backgrounds(1920, 1080)
    yield
    # shutdown
    print("Application shutting down")


def create_app() -> FastAPI:
    app = FastAPI(
        title="GenshinWallCraft",
        version="1.0.0",
        lifespan=lifespan
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=AppConfig.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)
    app.include_router(pixel_router)
    app.include_router(auth_router)
    return app


app = create_app()
