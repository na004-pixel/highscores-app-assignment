# Highscores App Assignment

This doc is for running the project. I would reccomend to use the Docker path as its fastest and most convenient way. For additional explanations, see the main README file.



## Docker quick start (Reccomended)

Use this path if you want the full stack started by Docker. You do not need to install Python packages or Node packages on your machine for this flow.

### Prerequisites

- Docker
- Docker Compose

### Start everything

From the repo root:

```bash
export GEMINI_API_KEY="your-key-here"
export GEMINI_MODEL="gemini-2.5-flash"
docker compose up --build -d
```

This will:

- pull `mongo:7`
- install backend dependencies inside the backend image
- install frontend dependencies inside the frontend image
- install admin dependencies inside the admin image
- start MongoDB, the FastAPI API, the frontend, and the admin app
- pass `GEMINI_API_KEY` and `GEMINI_MODEL` into the backend container if they are exported in your shell

### URLs

- frontend: `http://localhost:3000`
- admin: `http://localhost:3001`
- backend API: `http://localhost:8000`

### Useful commands

View running containers:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f mongo app frontend admin
```

Stop everything:

```bash
docker compose down
```

Stop everything and remove Mongo data:

```bash
docker compose down -v
```

### Docker files

- [docker-compose.yml](/home/ansarimn/Downloads/highscores-app-assignment/docker-compose.yml)
- [Dockerfile.app](/home/ansarimn/Downloads/highscores-app-assignment/Dockerfile.app)
- [frontend/Dockerfile](/home/ansarimn/Downloads/highscores-app-assignment/frontend/Dockerfile)
- [admin/Dockerfile](/home/ansarimn/Downloads/highscores-app-assignment/admin/Dockerfile)

## Manual

Use this path only if you want to run each app directly on your machine without Docker for the app processes.

### Prerequisites

- Python 3.13+
- Node.js 22+
- npm
- Docker or a local MongoDB installation

### 1. Install backend dependencies

```bash
python3 -m pip install -r requirements.txt
```

Important:

- Do not install the standalone `bson` package.
- If you already have it installed, remove it and reinstall `pymongo`:

```bash
python3 -m pip uninstall -y bson
python3 -m pip install --force-reinstall pymongo
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 3. Install admin dependencies

```bash
cd admin
npm install
cd ..
```

### 4. Start MongoDB

If you want Mongo via Docker:

```bash
docker run -d \
  --name highscores-mongo \
  -p 127.0.0.1:27017:27017 \
  -v /tmp/highscores-mongo:/data/db \
  mongo:7
```

If the container already exists:

```bash
docker start highscores-mongo
```

### 5. Start the backend

From the repo root:

```bash
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 6. Start the primary frontend

```bash
cd frontend
npm run dev
```

Runs on:

- `http://localhost:3000`

### 7. Start the admin app

```bash
cd admin
npm run dev
```

Runs on:

- `http://localhost:3001`

## Question Upload CSV Format

The admin CSV upload expects these columns:

```text
text,topic,difficulty,option1,option2,option3,option4,correct_answer,tags
```

Example:

```csv
text,topic,difficulty,option1,option2,option3,option4,correct_answer,tags
"What is 2+2?",Arithmetic,0.1,3,4,5,6,4,"addition,basic"
```

Notes:

- `tags` must be comma-separated
- `correct_answer` must match one of the option values exactly

## Troubleshooting

### Backend fails with `cannot import name 'SON' from 'bson'`

Your Python environment has the wrong `bson` package installed.

Fix:

```bash
python3 -m pip uninstall -y bson
python3 -m pip install --force-reinstall pymongo
```

### Backend starts but requests hang or fail with Mongo timeout

MongoDB is not running on the configured URI.

Default backend config expects:

```text
mongodb://localhost:27017
```

### Browser shows CORS errors

The backend is configured for:

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3001`

If you change ports, update backend CORS config in [app/main.py](/home/ansarimn/Downloads/highscores-app-assignment/app/main.py).
