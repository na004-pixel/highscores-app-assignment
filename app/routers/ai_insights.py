from fastapi import APIRouter, HTTPException

from app.db.mongo import questions_collection, sessions_collection
from app.services.ai_insights import generate_ai_insights
from app.services.performance_analyzer import analyze_performance

router = APIRouter(prefix="/ai-insights", tags=["ai-insights"])


@router.get("/{session_id}")
def get_ai_insights(session_id: str):
    session = sessions_collection.find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    answers = session.get("answers") or []
    if not answers:
        raise HTTPException(status_code=400, detail="No answers found for session")

    questions = list(questions_collection.find())
    analysis = analyze_performance(answers, questions)
    insights = generate_ai_insights(analysis)

    return insights.model_dump(mode="json")
