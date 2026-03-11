from pydantic import BaseModel


class StartSessionResponse(BaseModel):
    session_id: str


class AnswerRequest(BaseModel):
    session_id: str
    question_id: str
    answer: str
