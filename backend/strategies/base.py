from abc import ABC, abstractmethod

class BaseStrategy(ABC):
    def __init__(self, name: str, symbol: str, timeframe: str):
        self.name = name
        self.symbol = symbol
        self.timeframe = timeframe

    @abstractmethod
    def on_tick(self, tick_data):
        pass

    @abstractmethod
    def on_candle(self, candle_data):
        pass
