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
        # Map Indian stocks appropriately for Yahoo Finance (.NS)
        ticker_symbol = f"{symbol}.NS" if not symbol.endswith(".NS") else symbol
        
        logger.info(f"Fetching historical data for {ticker_symbol}")
        
        # Download data - yfinance returns multi-level columns for single ticker too
        data = yf.download(ticker_symbol, period="5d", interval="5m", progress=False)
        
        if data.empty:
            return {"status": "error", "message": f"No data found for {ticker_symbol}"}
        
        # Flatten multi-level columns if present
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.get_level_values(0)
        
        candles = []
        for index, row in data.iterrows():
            # Safely extract values - handle both Series and scalar
            open_val = float(row['Open']) if not isinstance(row['Open'], pd.Series) else float(row['Open'].iloc[0])
            high_val = float(row['High']) if not isinstance(row['High'], pd.Series) else float(row['High'].iloc[0])
            low_val = float(row['Low']) if not isinstance(row['Low'], pd.Series) else float(row['Low'].iloc[0])
            close_val = float(row['Close']) if not isinstance(row['Close'], pd.Series) else float(row['Close'].iloc[0])
            
            # Skip NaN values
            if any(np.isnan(v) for v in [open_val, high_val, low_val, close_val]):
                continue
                
            candles.append({
                "time": int(index.timestamp()),
                "open": round(open_val, 2),
                "high": round(high_val, 2),
                "low": round(low_val, 2),
                "close": round(close_val, 2),
            })
        
        logger.info(f"Returning {len(candles)} candles for {ticker_symbol}")
        return {"status": "success", "data": candles}
    except Exception as e:
        logger.error(f"Historical data error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
