from fastapi import APIRouter
from app.api.v1.endpoints import auth, cases, scripts, training, learning, multimodal

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(cases.router)
api_router.include_router(scripts.router)
api_router.include_router(training.router)
api_router.include_router(learning.router)
api_router.include_router(multimodal.router)
