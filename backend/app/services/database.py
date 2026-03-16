import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://droneApp:droneApp@cluster0.mongodb.net/droneVisionApp?retryWrites=true&w=majority")

client = None
db = None

def connect_to_mongo():
    global client, db
    try:
        mongo_uri = os.getenv("MONGO_URI", MONGO_URI)
        client = MongoClient(mongo_uri)
        db = client["droneVisionApp"]
        # Test the connection
        client.admin.command("ping")
        print("=" * 80)
        print("✅ Connected to MongoDB successfully!")
        print(f"   Database: droneVisionApp")
        print(f"   Collections: sessions, analytics")
        print("=" * 80)
    except Exception as e:
        print("=" * 80)
        print(f"❌ MongoDB connection failed: {e}")
        print("=" * 80)
        raise

def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed.")

def get_db():
    return db

def get_sessions_collection():
    return db["sessions"]

def get_analytics_collection():
    return db["analytics"]