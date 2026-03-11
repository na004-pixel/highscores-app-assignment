from collections import defaultdict


def analyze_performance(answers, questions):
    """
    Extract structured insights from test results.
    """

    topic_stats = defaultdict(lambda: {"correct": 0, "total": 0})

    difficulty_reached = 0

    q_lookup = {str(q["_id"]): q for q in questions}

    for a in answers:
        q = q_lookup[a["question_id"]]

        topic = q["topic"]
        topic_stats[topic]["total"] += 1

        if a["correct"]:
            topic_stats[topic]["correct"] += 1

        difficulty_reached = max(difficulty_reached, q["difficulty"])

    weaknesses = []

    for topic, stats in topic_stats.items():
        acc = stats["correct"] / stats["total"]

        if acc < 0.6:
            weaknesses.append(topic)

    return {
        "weak_topics": weaknesses,
        "topic_accuracy": topic_stats,
        "max_difficulty": difficulty_reached,
    }
