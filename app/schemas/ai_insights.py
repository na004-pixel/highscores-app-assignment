from pydantic import BaseModel, Field


class StudyPlanStep(BaseModel):
    step: int = Field(..., ge=1, le=3)
    title: str
    action: str


class AIInsightsResponse(BaseModel):
    weak_topics: list[str]
    max_difficulty: int
    study_plan: list[StudyPlanStep]
    generated_by: str
