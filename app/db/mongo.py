from app.config import MONGO_URI, DB_NAME

try:
    from pymongo import MongoClient
except ImportError as exc:
    message = str(exc)
    if "SON" in message and "bson" in message:
        raise RuntimeError(
            "PyMongo is being shadowed by the standalone 'bson' package. "
            "Uninstall 'bson' from the active environment and reinstall 'pymongo'."
        ) from exc
    raise

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

questions_collection = db["questions"]
sessions_collection = db["sessions"]
