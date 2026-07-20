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

import yfinance as yf
import pandas as pd

@router.get("/historical/{symbol}")
def get_historical_data(symbol: str):
    try:
        # Map Indian stocks appropriately for Yahoo Finance (.NS)
        ticker_symbol = f"{symbol}.NS" if not symbol.endswith(".NS") else symbol
        
        # We only need it for the dashboard chart visual
        data = yf.download(ticker_symbol, period="5d", interval="5m")
        if data.empty:
            return {"status": "error", "message": "No data found"}
            
        candles = []
        for index, row in data.iterrows():
            candles.append({
                "time": int(index.timestamp()),
                "open": float(row['Open'].iloc[0] if isinstance(row['Open'], pd.Series) else row['Open']),
                "high": float(row['High'].iloc[0] if isinstance(row['High'], pd.Series) else row['High']),
                "low": float(row['Low'].iloc[0] if isinstance(row['Low'], pd.Series) else row['Low']),
                "close": float(row['Close'].iloc[0] if isinstance(row['Close'], pd.Series) else row['Close']),
            })
        return {"status": "success", "data": candles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
