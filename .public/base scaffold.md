Below is a **clean but realistic FastAPI scaffold** for the assignment.
It keeps the **adaptive engine isolated**, uses **MongoDB**, and exposes the endpoints they suggested.

The code is intentionally **small but well-structured**, which tends to score well for assignments.

---

# Project structure

```
adaptive_test/
│
├── app/
│   ├── main.py
│   ├── config.py
│   │
│   ├── db/
│   │   └── mongo.py
│   │
│   ├── models/
│   │   ├── question.py
│   │   └── session.py
│   │
│   ├── schemas/
│   │   └── api.py
│   │
│   ├── services/
│   │   ├── adaptive_engine.py
│   │   └── question_selector.py
│   │
│   └── routers/
│       └── test.py
│
└── requirements.txt
```

---

# requirements.txt

```
fastapi
uvicorn
pymongo
pydantic
python-dotenv
```

---

# app/config.py

```python
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "adaptive_test"
MAX_QUESTIONS = 10
```

---

# app/db/mongo.py

```python
from pymongo import MongoClient
from app.config import MONGO_URI, DB_NAME

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

questions_collection = db["questions"]
sessions_collection = db["sessions"]
```

---

# app/models/question.py

```python
from pydantic import BaseModel
from typing import List


class Question(BaseModel):
    id: str
    text: str
    options: List[str]
    correct_answer: str
    difficulty: float
    topic: str
    tags: List[str] = []
```

---

# app/models/session.py

```python
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
```

---

# app/schemas/api.py

```python
from pydantic import BaseModel


class StartSessionResponse(BaseModel):
    session_id: str


class AnswerRequest(BaseModel):
    session_id: str
    question_id: str
    answer: str
```

---

# app/services/adaptive_engine.py

```python
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
```

---

# app/services/question_selector.py

```python
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
```

---

# app/routers/test.py

```python
from fastapi import APIRouter, HTTPException
from uuid import uuid4

from app.db.mongo import questions_collection, sessions_collection
from app.services.adaptive_engine import update_ability
from app.services.question_selector import select_question
from app.schemas.api import AnswerRequest
from app.config import MAX_QUESTIONS

router = APIRouter()


@router.post("/session/start")
def start_session():
    session_id = str(uuid4())

    session = {
        "_id": session_id,
        "ability": 0.5,
        "asked_questions": [],
        "answers": [],
        "num_answered": 0,
    }

    sessions_collection.insert_one(session)

    return {"session_id": session_id}


@router.get("/next-question/{session_id}")
def get_next_question(session_id: str):

    session = sessions_collection.find_one({"_id": session_id})

    if not session:
        raise HTTPException(404, "Session not found")

    if session["num_answered"] >= MAX_QUESTIONS:
        return {"message": "Test complete"}

    questions = list(questions_collection.find())

    q = select_question(
        questions,
        session["ability"],
        session["asked_questions"],
    )

    if q is None:
        raise HTTPException(404, "No questions available")

    sessions_collection.update_one(
        {"_id": session_id},
        {"$push": {"asked_questions": str(q["_id"])}},
    )

    return {
        "id": str(q["_id"]),
        "text": q["text"],
        "options": q["options"],
        "difficulty": q["difficulty"],
        "topic": q["topic"],
    }


@router.post("/submit-answer")
def submit_answer(req: AnswerRequest):

    session = sessions_collection.find_one({"_id": req.session_id})
    question = questions_collection.find_one({"_id": req.question_id})

    if not session or not question:
        raise HTTPException(404, "Invalid session or question")

    correct = req.answer == question["correct_answer"]

    new_theta = update_ability(
        session["ability"],
        question["difficulty"],
        correct,
        session["num_answered"],
    )

    sessions_collection.update_one(
        {"_id": req.session_id},
        {
            "$set": {"ability": new_theta},
            "$inc": {"num_answered": 1},
            "$push": {
                "answers": {
                    "question_id": req.question_id,
                    "correct": correct,
                    "difficulty": question["difficulty"],
                }
            },
        },
    )

    return {
        "correct": correct,
        "ability": new_theta,
    }
```

---

# app/main.py

```python
from fastapi import FastAPI
from app.routers import test

app = FastAPI(title="Adaptive Testing API")

app.include_router(test.router)
```

---

# Example API flow

### 1️⃣ start session

```
POST /session/start
```

response

```
{
  "session_id": "abc123"
}
```

---

### 2️⃣ get next question

```
GET /next-question/abc123
```

---

### 3️⃣ submit answer

```
POST /submit-answer
```

```
{
  "session_id": "abc123",
  "question_id": "...",
  "answer": "B"
}
```

---

# Why this structure scores well

This design shows:

✔ separation of concerns
✔ adaptive engine isolated from API
✔ Mongo session persistence
✔ deterministic question selection
✔ simple but real IRT-style update

And the **actual adaptive logic remains ~30 lines**.

---

If you want, I can also show you **one small feature that almost guarantees your submission looks better than 90% of others** (it takes ~20 lines and makes the system feel much more “AI-driven”).
