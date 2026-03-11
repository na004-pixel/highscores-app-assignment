from app.services.ai_insights import format_study_plan_text, generate_ai_insights


def generate_study_plan(analysis):
    return format_study_plan_text(generate_ai_insights(analysis))
