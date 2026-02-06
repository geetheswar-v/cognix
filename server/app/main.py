from fastapi import FastAPI
from sqlalchemy import text

from app.api.endpoints.auth import router as auth_router
from app.db.session import engine

app = FastAPI()

app.include_router(auth_router)


@app.get("/")
async def root():
    return {"message": "Cognix server is running!"}


@app.get("/health")
async def health():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "healthy"}
    except Exception:
        return {"status": "unhealthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)