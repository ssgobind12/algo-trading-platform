from kiteconnect import KiteTicker
from backend.config import settings
import logging

logger = logging.getLogger(__name__)

class LiveEngine:
    def __init__(self, access_token):
        self.kws = KiteTicker(settings.KITE_API_KEY, access_token)
        self.kws.on_ticks = self.on_ticks
        self.kws.on_connect = self.on_connect
        self.kws.on_close = self.on_close
        self.kws.on_error = self.on_error
        self.kws.on_reconnect = self.on_reconnect
        self.kws.on_noreconnect = self.on_noreconnect
        self.subscribers = [] 

    def on_ticks(self, ws, ticks):
        pass

    def on_connect(self, ws, response):
        logger.info("Successfully connected to Kite WebSocket")

    def on_close(self, ws, code, reason):
        logger.warning(f"Connection closed: {code} - {reason}")

    def on_error(self, ws, code, reason):
        logger.error(f"Connection error: {code} - {reason}")

    def on_reconnect(self, ws, attempts_count):
        logger.info(f"Reconnecting: {attempts_count}")

    def on_noreconnect(self, ws):
        logger.error("Reconnecting failed")

    def connect(self):
        self.kws.connect(threaded=True)
