from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class BrokerToken(Base):
    __tablename__ = "broker_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    broker_name = Column(String, default="zerodha")
    access_token = Column(String)
    public_token = Column(String, nullable=True)
    expires_at = Column(DateTime(timezone=True))
    
    user = relationship("User")
