import json
import logging
from functools import lru_cache

from pydantic import ValidationError

from app.config import GEMINI_API_KEY, GEMINI_MODEL
from app.schemas.ai_insights import AIInsightsResponse, StudyPlanStep

try:
    from google import genai
    from google.genai import types as genai_types
except ImportError:
    genai = None
    genai_types = None


logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_genai_client():
    if genai is None or not GEMINI_API_KEY:
        return None
    return genai.Client(api_key=GEMINI_API_KEY)


def _fallback_steps(analysis: dict) -> list[StudyPlanStep]:
    weak_topics = analysis.get("weak_topics") or []
    focus = ", ".join(weak_topics[:2]) if weak_topics else "recent mistakes"
    difficulty = analysis.get("max_difficulty", 0)

    return [
        StudyPlanStep(
            step=1,
            title="Review missed concepts",
            action=f"Revisit notes and examples for {focus}.",
        ),
        StudyPlanStep(
            step=2,
            title="Targeted practice",
            action=f"Practice 8-10 questions on those topics around difficulty level {difficulty}.",
        ),
        StudyPlanStep(
            step=3,
            title="Retest and reflect",
            action="Take another short quiz, check what still goes wrong, and repeat only the weak areas.",
        ),
    ]


def _fallback_response(analysis: dict, generated_by: str) -> AIInsightsResponse:
    return AIInsightsResponse(
        weak_topics=list(analysis.get("weak_topics") or []),
        max_difficulty=int(analysis.get("max_difficulty") or 0),
        study_plan=_fallback_steps(analysis),
        generated_by=generated_by,
    )


def _build_prompt(analysis: dict) -> str:
    weak_topics = analysis.get("weak_topics") or []
    topic_accuracy = {
        topic: {
            "correct": stats["correct"],
            "total": stats["total"],
        }
        for topic, stats in (analysis.get("topic_accuracy") or {}).items()
    }

    payload = {
        "weak_topics": weak_topics,
        "topic_accuracy": topic_accuracy,
        "max_difficulty": analysis.get("max_difficulty", 0),
    }

    return (
        "You are generating a personalized learning plan for a student after an adaptive test.\n"
        "Return exactly 3 study steps. Keep each action concrete, concise, and tailored to the weak topics.\n"
        "Do not mention the JSON schema or add extra keys.\n\n"
        f"Student performance:\n{json.dumps(payload, ensure_ascii=True, indent=2)}"
    )


def generate_ai_insights(analysis: dict) -> AIInsightsResponse:
    client = get_genai_client()
    if client is None or genai_types is None:
        return _fallback_response(analysis, generated_by="fallback")

    config = genai_types.GenerateContentConfig(
        temperature=0.2,
        response_mime_type="application/json",
        response_json_schema=AIInsightsResponse.model_json_schema(),
        system_instruction=(
            "Produce a three-step study plan tailored to the student's weak topics and current level. "
            "Keep titles short and actions specific."
        ),
    )

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[{"role": "user", "parts": [{"text": _build_prompt(analysis)}]}],
            config=config,
        )
    except Exception as exc:
        logger.warning("Gemini AI insights request failed: %s", exc, exc_info=True)
        return _fallback_response(analysis, generated_by="fallback_error")

    try:
        parsed = json.loads(response.text or "")
        parsed["generated_by"] = f"gemini:{GEMINI_MODEL}"
        return AIInsightsResponse.model_validate(parsed)
    except (json.JSONDecodeError, ValidationError, TypeError, ValueError) as exc:
        logger.warning("Gemini AI insights parsing failed: %s", exc, exc_info=True)
        return _fallback_response(analysis, generated_by="fallback_parse")


def format_study_plan_text(insights: AIInsightsResponse) -> str:
    return "\n".join(
        f"{item.step}. {item.title}: {item.action}"
        for item in insights.study_plan
    )
