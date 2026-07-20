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
    """Fetch 5 days of 5-minute candle data from Yahoo Finance for the given NSE symbol."""
    try:
        import httpx
        
        # Map Indian stocks appropriately for Yahoo Finance (.NS)
        ticker_symbol = f"{symbol}.NS" if not symbol.endswith(".NS") else symbol
        
        logger.info(f"Fetching historical data for {ticker_symbol}")
        
        # Use Yahoo Finance chart API directly (more reliable than yfinance library)
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker_symbol}"
        params = {
            "range": "5d",
            "interval": "5m",
            "includePrePost": "false"
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        async_client = httpx.Client(timeout=30.0)
        response = async_client.get(url, params=params, headers=headers)
        response.raise_for_status()
        
        chart_data = response.json()
        result = chart_data.get("chart", {}).get("result", [])
        
        if not result:
            return {"status": "error", "message": f"No data found for {ticker_symbol}"}
        
        timestamps = result[0].get("timestamp", [])
        quotes = result[0].get("indicators", {}).get("quote", [{}])[0]
        
        opens = quotes.get("open", [])
        highs = quotes.get("high", [])
        lows = quotes.get("low", [])
        closes = quotes.get("close", [])
        
        candles = []
        for i in range(len(timestamps)):
            o = opens[i] if i < len(opens) else None
            h = highs[i] if i < len(highs) else None
            l = lows[i] if i < len(lows) else None
            c = closes[i] if i < len(closes) else None
            
            # Skip if any value is None
            if any(v is None for v in [o, h, l, c]):
                continue
                
            candles.append({
                "time": timestamps[i],
                "open": round(o, 2),
                "high": round(h, 2),
                "low": round(l, 2),
                "close": round(c, 2),
            })
        
        logger.info(f"Returning {len(candles)} candles for {ticker_symbol}")
        return {"status": "success", "data": candles}
    except httpx.HTTPStatusError as e:
        logger.error(f"Yahoo API HTTP error: {e.response.status_code}")
        raise HTTPException(status_code=502, detail=f"Yahoo Finance API returned {e.response.status_code}")
    except Exception as e:
        logger.error(f"Historical data error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

