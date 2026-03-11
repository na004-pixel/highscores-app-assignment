# 🚀 Quick Start

## Prerequisites

- Docker
- Docker Compose


## Env config
Set env vars

```
export GEMINI_API_KEY="your-key-here"
export GEMINI_MODEL="gemini-2.5-flash"
```


## Start everything

From the repo root:

```bash
docker compose up --build -d
```

## URLs

- frontend: `http://localhost:3000`
- admin: `http://localhost:3001`
- backend API: `http://localhost:8000`



## Create questions
Visit the [admin frontend](http://localhost:3001) and upload questions (`questions.csv` file)

## Take the test
Visit the main [frontend](http://localhost:3000) and take the test





For more detailed instructions on how to run the project, see the Run the project.md file




# Architecture
- `app`: Core adaptive loop (FastAPI)
- `frontend`: primary test frontend (SolidJS)
- `admin`: additional admin app (SolidJS) for managing questions

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



# APIs Documentation
## Questions controller
This controller is responsible for question CRUD and is shared by both the student flow and the admin UI.

Endpoints:
- `GET /questions`: list all questions
- `GET /questions/{question_id}`: fetch one question
- `POST /questions`: create one question
- `POST /questions/bulk`: bulk insert questions, used for CSV-style admin uploads
- `PUT /questions/{question_id}`: update an existing question
- `DELETE /questions/{question_id}`: delete one question
- `DELETE /questions`: delete all questions

## Test controller
This is the student test flow plus the Gemini-based personalized study plan.

Adaptive test endpoints:
- `POST /session/start`: create a new test session with default ability
- `GET /next-question/{session_id}`: select the next best-fit question for the current ability
- `POST /submit-answer`: evaluate the submitted answer and update ability
- `GET /finish/{session_id}`: return immediate result data such as final ability and topic analysis

## Ai controller
AI insights endpoint:
- `GET /ai-insights/{session_id}`: generate a 3-step personalized learning plan from weak topics and max difficulty reached

The frontend intentionally calls `/finish/{session_id}` first so score and analysis can render immediately, and then calls `/ai-insights/{session_id}` separately since the LLM call can take longer.

## Admin controller
There is no separate backend admin controller in this scaffold. The admin app uses the same `questions` endpoints above for listing, creating, updating, bulk uploading, and deleting questions.




# AI Log (Use of AI tools)
I used AI (Codex, opencode) to rapidly generate the boilerplate for FastAPI and SolidJS components. The design is fairly straightforward, so it was able to correctly implement standard FastAPI+SolidJS.

However, I had to specifically guide the AI to implement the proper IRT model rather than a basic point-addition system. Default stack choice for AI is usually NextJS/React, but I had to steer to use SolidJS. I manually structured the project as 3 independent apps (monorepo) rather than a nextjs monolith. I manually structured the separation of concerns (routers vs. services) to ensure a clean, scalable architecture.



# AI Prompting
For the study plan, the implementation uses a narrowly scoped prompt instead of a general chat-style prompt. The request sends only the data that matters for personalization:
- weak topics
- topic-level accuracy
- max difficulty reached

The Gemini call also constrains the response with a JSON schema so the model returns a predictable 3-step structure with `step`, `title`, and `action`. This reduces prompt drift, avoids extra formatting cleanup, and makes the frontend rendering deterministic.

The flow is also efficient at the product level. The app returns `/finish/{session_id}` immediately for score and analysis, and performs the slower LLM call separately via `/ai-insights/{session_id}`. That keeps the user experience responsive while still generating a personalized learning plan.





# Additional Notes
# DB
Mongo db has 2 collections: sessions and questions.

Questions pydantic schema:
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

All queries only update/find based on the id. This designs minimizes queries and network RT. This is already very fast and can be further improved by mongo indexes on id.


Total queries is of order O(qn), where q is number of questions and n is number of sessions.


For further scalability,
- partition questions by `professor_id` or `exam_id`. Works especially well in more advanced nosql DBs like dynamo and cassandra
- cache. questions are stable in a session and thus can be cached. For our purposes simple in-memory variables go a long way, and can be swapped for in-memory databases (redis, h2). This eliminates most DB queries and network RT. Queries become of order O(n)



# Choice of stack
- FastAPI was chosen because its the fastest way to build production-ready APIs in python
- I chose solidjs for its simplicity. React and nextjs are a lot more powerful but they arent needed here (yet)
- Questions sources csv so that it works seamlessly with excel. Excel is more ergonomic and reliable than manually writing JSON. The only alternative is a proper frontend for questions. that is also there as an alternative

# On the use of AI

While AI dramatically accelerated the writing of syntax, the core value of this submission lies in the architectural decisions used to orchestrate that AI. In the current era of development, AI can easily "one-shot" a file or a function, but it relies entirely on the developer to define the system boundaries. 

Here are the key philosophies I applied while guiding the AI through this project:

## 1. Treating Languages as Disposable Tools (The Polyglot Monorepo)
I have extensive experience building large applications in Next.js. The "easy" route would have been to build a Next.js monolith and force the Python/math requirements into a JS runtime, or rely entirely on Python templates. Instead, I treated languages as disposable tools tailored to specific domains: Python for the backend (where AI/math ecosystems thrive) and SolidJS for a lightweight, reactive frontend. Running a polyglot monorepo (API, User Frontend, and Admin Frontend) introduces complexity that terrifies many junior developers, but with AI handling the syntax overhead, I was free to choose the objectively correct tool for each boundary. 

## Taming the Polyglot Environment with Docker
Having three independent apps running simultaneously creates a massive orchestration problem (the "how do I start three servers?" dilemma). While my experience with Docker is limited, I recognized architecturally that Docker is the exact cure for polyglot chaos. AI can easily write a `Dockerfile` or `docker-compose.yml`, but independently recognizing *where* and *why* Docker fits into the system to prevent environment hell is a human architectural decision. 

## Enforcing "Universal Separation of Concerns"
Modern AI can generate a reasonably clean architecture on the first try. However, as an app grows, AI naturally defaults to the path of least resistance—often suggesting tightly coupled, sloppy solutions to fix bugs quickly. I acted as a "purist" for separation of concerns. I forced the AI to respect strict REST boundaries, kept the Admin app entirely isolated from the User app, and ensured business logic (like the IRT math) never bled into the API routers. The AI wrote the code, but I enforced the structural discipline.

## Comprehension Over Blind Faith
AI works flawlessly when guided correctly, but its output is never cryptic to me. Because I maintained strict architectural boundaries, I always understood exactly what the AI was generating. Even if the AI had hallucinated a port, broken a CORS policy, or messed up a math function, I possessed the system-level understanding required to hunt down the logic and ruthlessly refactor it. The AI was the engine, but I was always the driver.
