import redis
import json
import time
from pymongo import MongoClient
from bson import ObjectId
import os

# --- 1. CONNECTIONS ---
# 'localhost' ki jagah service names use karein jo docker-compose mein hain
REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://mongodb:27017/')

r = redis.Redis(host=REDIS_HOST, port=6379, db=0)
client = MongoClient(MONGO_URI)

db = client['ai_assignment']
collection = db['tasks']

print("🤖 Worker is starting and waiting for tasks...")

def process_task(task):
    operation = task.get('operation', 'reverse')
    data = task.get('inputData', '')
    
    if operation == 'uppercase':
        return data.upper()
    elif operation == 'lowercase':
        return data.lower()
    elif operation == 'reverse':
        return data[::-1]
    elif operation == 'word_count':
        return str(len(data.split()))
    return "Invalid Operation"

# --- 2. MAIN LOOP ---
while True:
    try:
        # Redis se task uthana
        # blpop return karta hai (queue_name, message)
        result_raw = r.blpop('task_queue', timeout=0)
        
        if result_raw:
            source, message = result_raw
            task_data = json.loads(message)
            task_id = task_data['taskId']
            
            print(f"🔄 Processing Task ID: {task_id}")
            
            # Status update: 'running'
            collection.update_one({'_id': ObjectId(task_id)}, {'$set': {'status': 'running'}})
            
            # Processing logic
            processed_result = process_task(task_data)
            
            # Nakli delay taaki status change hota hua dikhe (UI mein maza aayega)
            time.sleep(2) 
            
            # Status update: 'success'
            collection.update_one(
                {'_id': ObjectId(task_id)}, 
                {'$set': {'status': 'success', 'result': processed_result}}
            )
            print(f"✅ Task {task_id} Completed!")
            
    except Exception as e:
        print(f"❌ Error in worker: {e}")
        time.sleep(5) # Error aane par thoda wait karein