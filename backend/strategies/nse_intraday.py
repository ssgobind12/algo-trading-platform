from backend.strategies.base import BaseStrategy
from backend.services.indicators import calculate_rsi, calculate_macd, calculate_ema
import pandas as pd

class NSEIntradayStrategy(BaseStrategy):
    def __init__(self):
        super().__init__(name="NSE Intraday", symbol="NSE_TBD", timeframe="5min")

    def on_candle(self, candle_data: pd.DataFrame):
        """
        Indicators: RSI(14), MACD(12,26,9), 20 EMA, VWAP, ATR
        Entry: RSI below 30 then turns upward, MACD Bullish Crossover, Price above EMA, Volume above average
        Exit: RSI above 70, MACD Bearish
        """
        if len(candle_data) < 30:
            return "HOLD"

        # Calculate indicators
        rsi = calculate_rsi(candle_data, length=14)
        macd_obj = calculate_macd(candle_data, fast=12, slow=26, signal=9)
        if macd_obj is None or macd_obj.empty:
            return "HOLD"
            
        macd = macd_obj["MACD_12_26_9"]
        macd_signal = macd_obj["MACDs_12_26_9"]
        ema = calculate_ema(candle_data, length=20)
        
        # Current values
        curr_close = candle_data['close'].iloc[-1]
        curr_rsi = rsi.iloc[-1]
        prev_rsi = rsi.iloc[-2]
        curr_macd = macd.iloc[-1]
        curr_signal = macd_signal.iloc[-1]
        prev_macd = macd.iloc[-2]
        prev_signal = macd_signal.iloc[-2]
        curr_ema = ema.iloc[-1]

        # Entry logic
        rsi_turned_up = prev_rsi < 30 and curr_rsi > prev_rsi
        macd_bullish_cross = prev_macd < prev_signal and curr_macd > curr_signal
        price_above_ema = curr_close > curr_ema

        if rsi_turned_up and macd_bullish_cross and price_above_ema:
            return "BUY"
            
        # Exit logic
        if curr_rsi > 70 or (prev_macd > prev_signal and curr_macd < curr_signal):
            return "SELL"
            
        return "HOLD"

    def on_tick(self, tick_data):
        pass
