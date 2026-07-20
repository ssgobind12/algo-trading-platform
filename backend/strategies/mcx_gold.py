from backend.strategies.base import BaseStrategy
from backend.services.indicators import calculate_rsi, calculate_macd, calculate_ema, calculate_atr
import pandas as pd
from datetime import datetime

class MCXGoldStrategy(BaseStrategy):
    def __init__(self):
        super().__init__(name="MCX Gold", symbol="MCX_GOLD", timeframe="15min")

    def on_candle(self, candle_data: pd.DataFrame):
        """
        Trade only after 6 PM IST
        """
        # Check time
        current_time = datetime.now()
        if current_time.hour < 18:
            return "HOLD"
            
        # Add detailed strategy logic here
        return "HOLD"

    def on_tick(self, tick_data):
        pass
