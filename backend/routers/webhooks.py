from fastapi import APIRouter, Request, HTTPException

router = APIRouter(
    prefix="/webhooks",
    tags=["Webhooks"]
)

@router.post("/tradingview")
async def tradingview_webhook(request: Request):
    try:
        data = await request.json()
        # Expected format: {"action": "buy", "symbol": "NSE:RELIANCE", "strategy": "NSE Intraday", "price": 2500}
        
        # Logic to execute trade via Kite API
        
        return {"status": "success", "message": "Webhook received"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid webhook payload")
