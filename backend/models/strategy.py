from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class Strategy(Base):
    __tablename__ = "strategies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    description = Column(String)
    is_active = Column(Boolean, default=False)
    symbol = Column(String)
    timeframe = Column(String) # '5min', '15min'
    max_trades = Column(Integer, default=5)
    risk_per_trade = Column(Float, default=1.0) # percentage
    
    user = relationship("User")
