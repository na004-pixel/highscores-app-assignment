from pydantic import BaseModel
from typing import List


class AnswerRecord(BaseModel):
    question_id: str
    correct: bool
    difficulty: float


class UserSession(BaseModel):
    id: str
    ability: float = 0.5
    asked_questions: List[str] = []
    answers: List[AnswerRecord] = []
    num_answered: int = 0
