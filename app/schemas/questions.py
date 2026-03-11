from pydantic import BaseModel
from typing import List, Optional


class QuestionCreate(BaseModel):
    text: str
    options: List[str]
    correct_answer: str
    difficulty: float
    topic: str
    tags: List[str] = []


class QuestionUpdate(BaseModel):
    text: Optional[str] = None
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    difficulty: Optional[float] = None
    topic: Optional[str] = None
    tags: Optional[List[str]] = None


class QuestionResponse(BaseModel):
    id: str
    text: str
    options: List[str]
    correct_answer: str
    difficulty: float
    topic: str
    tags: List[str]
