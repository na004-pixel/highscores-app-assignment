from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ai_insights, test, questions

app = FastAPI(title="Adaptive Testing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(test.router)
app.include_router(questions.router)
app.include_router(ai_insights.router)
