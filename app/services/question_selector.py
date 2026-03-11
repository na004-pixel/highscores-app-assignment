from app.services.adaptive_engine import sigmoid


def select_question(questions, theta, asked_ids):
    """
    Select question maximizing information p(1-p).
    """
    candidates = [q for q in questions if str(q["_id"]) not in asked_ids]

    if not candidates:
        return None

    def info(q):
        p = sigmoid(theta - q["difficulty"])
        return p * (1 - p)

    return max(candidates, key=info)
