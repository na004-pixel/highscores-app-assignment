from fastapi import APIRouter, HTTPException
from uuid import uuid4

try:
    from bson import ObjectId
except ImportError as exc:
    message = str(exc)
    if "SON" in message and "bson" in message:
        raise RuntimeError(
            "PyMongo is being shadowed by the standalone 'bson' package. "
            "Uninstall 'bson' from the active environment and reinstall 'pymongo'."
        ) from exc
    raise

from app.db.mongo import questions_collection, sessions_collection
from app.services.adaptive_engine import update_ability
from app.services.question_selector import select_question
from app.services.performance_analyzer import analyze_performance
from app.schemas.api import AnswerRequest
from app.config import MAX_QUESTIONS

router = APIRouter()


@router.post("/session/start")
def start_session():
    session_id = str(uuid4())

    session = {
        "_id": session_id,
        "ability": 0.5,
        "asked_questions": [],
        "answers": [],
        "num_answered": 0,
    }

    sessions_collection.insert_one(session)

    return {"session_id": session_id}


@router.get("/next-question/{session_id}")
def get_next_question(session_id: str):

    session = sessions_collection.find_one({"_id": session_id})

    if not session:
        raise HTTPException(404, "Session not found")

    if session["num_answered"] >= MAX_QUESTIONS:
        return {"message": "Test complete"}

    questions = list(questions_collection.find())

    q = select_question(
        questions,
        session["ability"],
        session["asked_questions"],
    )

    if q is None:
        raise HTTPException(404, "No questions available")

    sessions_collection.update_one(
        {"_id": session_id},
        {"$push": {"asked_questions": str(q["_id"])}},
    )

    return {
        "id": str(q["_id"]),
        "text": q["text"],
        "options": q["options"],
        "difficulty": q["difficulty"],
        "topic": q["topic"],
    }


@router.post("/submit-answer")
def submit_answer(req: AnswerRequest):

    session = sessions_collection.find_one({"_id": req.session_id})
    try:
        question_object_id = ObjectId(req.question_id)
    except Exception:
        raise HTTPException(400, "Invalid question ID")

    question = questions_collection.find_one({"_id": question_object_id})

    if not session or not question:
        raise HTTPException(404, "Invalid session or question")

    correct = req.answer == question["correct_answer"]

    new_theta = update_ability(
        session["ability"],
        question["difficulty"],
        correct,
        session["num_answered"],
    )

    sessions_collection.update_one(
        {"_id": req.session_id},
        {
            "$set": {"ability": new_theta},
            "$inc": {"num_answered": 1},
            "$push": {
                "answers": {
                    "question_id": req.question_id,
                    "correct": correct,
                    "difficulty": question["difficulty"],
                }
            },
        },
    )

    return {
        "correct": correct,
        "ability": new_theta,
    }


@router.get("/finish/{session_id}")
def finish_test(session_id: str):

    session = sessions_collection.find_one({"_id": session_id})
    if not session:
        raise HTTPException(404, "Session not found")

    questions = list(questions_collection.find())

    analysis = analyze_performance(
        session["answers"],
        questions,
    )

    return {
        "ability": session["ability"],
        "analysis": analysis,
    }
