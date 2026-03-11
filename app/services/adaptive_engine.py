import math


def sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x))


def update_ability(theta, difficulty, correct, n_answers, base_lr=0.4):
    """
    1PL IRT-style update with shrinking step size.
    """
    lr = base_lr / math.sqrt(n_answers + 1)

    answer = 1 if correct else 0
    p = sigmoid(theta - difficulty)
    
    return theta + lr * (answer - p)
