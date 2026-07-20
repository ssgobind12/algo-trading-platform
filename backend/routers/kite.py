from fastapi import APIRouter, Depends, HTTPException, Query
from backend.services.kite import get_kite_instance
from backend.config import settings
from kiteconnect import KiteConnect
import yfinance as yf
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

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
def start_engine(access_token: str = Query(default=None)):
    """Start the live trading engine. access_token is the Kite access token (optional for demo mode)."""
    engine = get_engine(access_token)
    if engine is None:
        return {"status": "info", "message": "Engine started in demo mode (no Kite access token provided). Connect Kite first via /kite/generate_session."}
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

@router.get("/historical/{symbol}")
def get_historical_data(symbol: str):
    """Fetch historical 1-minute candle data directly from Zerodha Kite for the given symbol."""
    try:
        from backend.services.kite import get_kite_instance
        from datetime import datetime, timedelta
        
        kite = get_kite_instance()
        
        # We need the user's access token from the request header in a real app,
        # but for this demo, we'll try to use the stored global one if available.
        if not kite.access_token:
            return {"status": "error", "message": "Live Engine not started (missing access token for historical data)"}
            
        # 1. Lookup instrument token dynamically
        instruments = kite.instruments(kite.EXCHANGE_NSE)
        
        # Strip BSE/NSE prefixes if frontend sent them (e.g. BSE:RELIANCE -> RELIANCE)
        clean_symbol = symbol.split(':')[-1] if ':' in symbol else symbol
        
        instrument_token = None
        for inst in instruments:
            if inst['tradingsymbol'] == clean_symbol:
                instrument_token = inst['instrument_token']
                break
                
        if not instrument_token:
            return {"status": "error", "message": f"Could not find instrument token for {clean_symbol}"}
            
        logger.info(f"Fetching Zerodha historical data for {clean_symbol} (Token: {instrument_token})")
        
        # 2. Fetch 5 days of 1-minute data
        to_date = datetime.now()
        from_date = to_date - timedelta(days=5)
        
        records = kite.historical_data(
            instrument_token=instrument_token,
            from_date=from_date.strftime('%Y-%m-%d 00:00:00'),
            to_date=to_date.strftime('%Y-%m-%d 23:59:59'),
            interval="minute", # 1-minute interval for maximum precision
            continuous=False,
            oi=False
        )
        
        if not records:
            return {"status": "error", "message": f"No historical data returned for {clean_symbol}"}
        
        # 3. Format for lightweight-charts
        candles = []
        for r in records:
            # r['date'] is a datetime object
            timestamp = int(r['date'].timestamp())
            candles.append({
                "time": timestamp,
                "open": round(r['open'], 2),
                "high": round(r['high'], 2),
                "low": round(r['low'], 2),
                "close": round(r['close'], 2),
            })
            
        logger.info(f"Returning {len(candles)} 1-min candles for {clean_symbol}")
        return {"status": "success", "data": candles}
        
    except Exception as e:
        logger.error(f"Zerodha Historical data error: {str(e)}")
        # Check for 403 Data Exception (missing subscription)
        if "DataException" in str(type(e)):
             return {"status": "error", "message": "Zerodha Historical Data API add-on required."}
        raise HTTPException(status_code=500, detail=str(e))

