from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx, os
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"], allow_headers=["*"])

class Message(BaseModel):
    model: str
    max_tokens: int
    messages: list
    system: str = ""

@app.post("/api/assistant")
async def assistant(body: Message):
    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": os.getenv("ANTHROPIC_API_KEY"),
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json=body.dict(), timeout=60
        )
        return r.json()
