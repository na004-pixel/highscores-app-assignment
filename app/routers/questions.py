from fastapi import APIRouter, HTTPException
from typing import List

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

from app.schemas.questions import QuestionCreate, QuestionUpdate
from app.db.mongo import questions_collection

router = APIRouter()


def serialize_question(q):
    return {
        "id": str(q["_id"]),
        "text": q["text"],
        "options": q["options"],
        "correct_answer": q["correct_answer"],
        "difficulty": q["difficulty"],
        "topic": q["topic"],
        "tags": q.get("tags", []),
    }


@router.get("/questions")
def list_questions():
    questions = list(questions_collection.find())
    return [serialize_question(q) for q in questions]


@router.get("/questions/{question_id}")
def get_question(question_id: str):
    try:
        q = questions_collection.find_one({"_id": ObjectId(question_id)})
    except:
        raise HTTPException(400, "Invalid question ID")
    
    if not q:
        raise HTTPException(404, "Question not found")
    
    return serialize_question(q)


@router.post("/questions")
def create_question(question: QuestionCreate):
    doc = question.model_dump()
    result = questions_collection.insert_one(doc)
    return {"id": str(result.inserted_id)}


@router.post("/questions/bulk")
def bulk_create_questions(questions: List[QuestionCreate]):
    docs = [q.model_dump() for q in questions]
    if not docs:
        return {"inserted": 0}
    result = questions_collection.insert_many(docs)
    return {"inserted": len(result.inserted_ids)}


@router.put("/questions/{question_id}")
def update_question(question_id: str, question: QuestionUpdate):
    try:
        q = questions_collection.find_one({"_id": ObjectId(question_id)})
    except:
        raise HTTPException(400, "Invalid question ID")
    
    if not q:
        raise HTTPException(404, "Question not found")
    
    update_data = {k: v for k, v in question.model_dump().items() if v is not None}
    
    questions_collection.update_one(
        {"_id": ObjectId(question_id)},
        {"$set": update_data}
    )
    
    return {"message": "Updated successfully"}


@router.delete("/questions/{question_id}")
def delete_question(question_id: str):
    try:
        result = questions_collection.delete_one({"_id": ObjectId(question_id)})
    except:
        raise HTTPException(400, "Invalid question ID")
    
    if result.deleted_count == 0:
        raise HTTPException(404, "Question not found")
    
    return {"message": "Deleted successfully"}


@router.delete("/questions")
def delete_all_questions():
    result = questions_collection.delete_many({})
    return {"deleted": result.deleted_count}
