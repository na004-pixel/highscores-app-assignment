# Architecture
- `app`: Core adaptive loop (FastAPI)
- `frontend`: primary test frontend (SolidJS)
- `admin`: additional admin app (SolidJS) for managing questions

## DB
Mongo db has 2 collections: sessions and questions.

Questions pydantic schemna:
```
class QuestionResponse(BaseModel):
    id: str
    text: str
    options: List[str]
    correct_answer: str
    difficulty: float
    topic: str
    tags: List[str]
```

Sessions maintains score, ability and list of asked questions

```
{
  "_id": session_id,
  "ability": 0.5,
  "asked_questions": [],
  "answers": [],
  "num_answered": 0,
}
```

All queries only update/find based on the id. This designs minimzes queries and network RT. This is already very fast and can be further improved by mongo indexes on id.


Total queries is of order O(qn), where q is number of questions and n is number of sessions.


For further scalability,
- partition questions by `professor_id` or `exam_id`. Works especially well in moree advanced nosql DBs like dynamo and cassandra
- cache. questions are stable in a session and thus can be cached. For our purposes simple in-memory variables go a long way, and can be swapped for in-memory databases (redis, h2). This eliminates most DB queries and network RT. Queries become of order O(n)



# Choice of 




# How the Adaptive Algorithm Works

The core logic (located in `app/services/adaptive_engine.py`) is based on Item Response Theory (IRT). Instead of adding or subtracting a fixed number, it uses a sigmoid function to calculate the *probability* of a student getting a question right, and updates their score based on the outcome.

## Update ability
When a student answers, their ability score is updated using this formula:
* **Correct answer:** `ability + learning_rate * (1 - expected_probability)`
* **Incorrect answer:** `ability + learning_rate * (0 - expected_probability)`

*Why this works:* The ability score changes the fastest when the result is unexpected (e.g., getting a hard question right, or an easy question wrong). I also implemented a decaying learning rate (`base_lr / sqrt(answered)`) so that the score makes large jumps at the beginning, but fine-tunes and converges smoothly onto their true ability by the end of the test.

## Selecting the Next Question  
The engine (in `app/services/question_selector.py`) selects the next question by maximizing "information gain" `p * (1 - p)`. 

In plain English: the algorithm calculates the available question that the student has exactly a 50/50 chance of getting right based on their current ability. This ensures the system is always serving questions right at the edge of the user's proficiency level.



# Overview of APIs
## Questions controller
## AI controller
## Admin controller