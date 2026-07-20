from fastapi import APIRouter, Depends, HTTPException
from backend.services.kite import get_kite_instance
from backend.config import settings
from kiteconnect import KiteConnect

router = APIRouter(
    prefix="/kite",
    tags=["Kite"]
)

@router.get("/login_url")
def get_login_url():
    kite = get_kite_instance()
    return {"login_url": kite.login_url()}

@router.post("/generate_session")
def generate_session(request_token: str):
    kite = get_kite_instance()
    try:
        data = kite.generate_session(request_token, api_secret=settings.KITE_API_SECRET)
        return {"access_token": data["access_token"], "public_token": data["public_token"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

from backend.services.live_engine import get_engine

@router.post("/start_engine")
def start_engine(access_token: str):
    engine = get_engine(access_token)
    try:
        engine.start()
        return {"status": "success", "message": "Live Trading Engine started."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop_engine")
def stop_engine():
    engine = get_engine()
    if engine:
        engine.stop()
        return {"status": "success", "message": "Live Trading Engine stopped."}
    return {"status": "info", "message": "Engine is not running."}
