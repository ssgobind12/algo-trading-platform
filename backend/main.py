from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend.routers import auth, kite, ws, webhooks

# We will create tables via Alembic ideally, but for now we can do this:
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SS Gobind Algo Trading API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Should be restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(kite.router)
app.include_router(ws.router)
app.include_router(webhooks.router)

@app.get("/")
def read_root():
    return {"message": "SS Gobind Algo Trading API is running."}
