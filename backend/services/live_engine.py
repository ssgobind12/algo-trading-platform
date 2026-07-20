from kiteconnect import KiteTicker
from backend.config import settings
import logging
from backend.strategies.nse_intraday import NSEIntradayStrategy
from backend.strategies.mcx_gold import MCXGoldStrategy
from backend.services.kite import get_kite_instance
import pandas as pd
from datetime import datetime

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
        self.kite = get_kite_instance()
        self.kite.set_access_token(access_token)
        
        # Initialize strategies
        self.strategies = [
            NSEIntradayStrategy(),
            MCXGoldStrategy()
        ]
        
        # Subscriptions
        self.tokens_to_strategies = {}
        
        # Historical data for candles
        self.historical_data = {}

    def start(self):
        self.kws.connect(threaded=True)

    def stop(self):
        self.kws.close()

    def on_ticks(self, ws, ticks):
        for tick in ticks:
            token = tick['instrument_token']
            
            # Broadcast raw tick to frontend for real-time charts
            try:
                import asyncio
                from backend.routers.ws import manager
                # Send minimal tick data
                tick_data = {
                    "type": "NEW_TICK",
                    "token": token,
                    "price": tick['last_price'],
                    "time": int(datetime.now().timestamp())
                }
                # Create a new event loop for this thread if needed or use run
                try:
                    loop = asyncio.get_event_loop()
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                loop.run_until_complete(manager.broadcast(tick_data))
            except Exception as e:
                logger.error(f"Failed to broadcast tick: {str(e)}")

            if token in self.historical_data:
                # Mock updating the candle dataframe with new tick data for simplicity
                df = self.historical_data[token]
                new_row = pd.DataFrame([{
                    'date': datetime.now(),
                    'open': tick['last_price'],
                    'high': tick['last_price'],
                    'low': tick['last_price'],
                    'close': tick['last_price'],
                    'volume': tick.get('volume_traded', 0)
                }])
                self.historical_data[token] = pd.concat([df, new_row], ignore_index=True)
                
                # Check strategies
                for strategy in self.tokens_to_strategies.get(token, []):
                    action = strategy.on_candle(self.historical_data[token])
                    if action in ["BUY", "SELL"]:
                        self.execute_order(strategy.symbol, action)

    def execute_order(self, symbol, transaction_type):
        try:
            logger.info(f"Executing {transaction_type} for {symbol}")
            order_id = self.kite.place_order(
                tradingsymbol=symbol,
                exchange=self.kite.EXCHANGE_NSE,
                transaction_type=transaction_type,
                quantity=1,
                variety=self.kite.VARIETY_REGULAR,
                order_type=self.kite.ORDER_TYPE_MARKET,
                product=self.kite.PRODUCT_MIS,
                validity=self.kite.VALIDITY_DAY
            )
            logger.info(f"Order placed: {order_id}")
            
            # Save to Database
            from backend.database import SessionLocal
            from backend.models.trade import Trade, TradeSide, TradeStatus
            db = SessionLocal()
            trade = Trade(
                user_id=1, # Default admin user
                strategy_id=1, 
                symbol=symbol,
                side=TradeSide.BUY if transaction_type == "BUY" else TradeSide.SELL,
                quantity=1,
                entry_price=0.0, # Will be updated by Kite webhook later
                status=TradeStatus.OPEN
            )
            db.add(trade)
            db.commit()
            db.refresh(trade)
            db.close()

            # Broadcast via WebSocket
            import asyncio
            from backend.routers.ws import manager
            asyncio.run(manager.broadcast({
                "type": "NEW_TRADE",
                "symbol": symbol,
                "side": transaction_type,
                "quantity": 1
            }))
        except Exception as e:
            logger.error(f"Order failed: {str(e)}")

    def on_connect(self, ws, response):
        logger.info("Successfully connected to Kite WebSocket")
        # Example token for Reliance = 738561
        tokens = [738561]
        ws.subscribe(tokens)
        ws.set_mode(ws.MODE_FULL, tokens)
        
        # Map tokens to strategies
        self.tokens_to_strategies[738561] = [self.strategies[0]]
        
        # Fetch initial historical data to seed the DataFrame
        # In a real app, you would fetch from kite.historical_data
        self.historical_data[738561] = pd.DataFrame(columns=['date', 'open', 'high', 'low', 'close', 'volume'])

    def on_close(self, ws, code, reason):
        logger.warning(f"Connection closed: {code} - {reason}")

    def on_error(self, ws, code, reason):
        logger.error(f"Connection error: {code} - {reason}")

    def on_reconnect(self, ws, attempts_count):
        logger.info(f"Reconnecting: {attempts_count}")

    def on_noreconnect(self, ws):
        logger.error("Reconnecting failed")

# Global engine instance
_engine = None

def get_engine(access_token=None):
    global _engine
    if _engine is None and access_token:
        _engine = LiveEngine(access_token)
    return _engine
