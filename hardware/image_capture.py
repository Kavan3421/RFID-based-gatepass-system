import os
import datetime
import sys
import time

try:
    import cv2
except ImportError:
    print("[ERROR] 'opencv-python' module is missing. Please run: pip install -r requirements.txt")
    sys.exit(1)

try:
    from pymongo import MongoClient
except ImportError:
    print("[ERROR] 'pymongo' module is missing. Please run: pip install -r requirements.txt")
    sys.exit(1)

def capture_image():
    print("Script started. Monitoring database for entries...")

    # MongoDB connection setup
    try:
        client = MongoClient("mongodb+srv://kavanpatel4321:qqtbnrDPjmAWBeAH@rfid.s3i78.mongodb.net/")
        db = client["test"]  # Replace with your database name
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        sys.exit(1)

    last_processed_timestamp = None  # Track last processed log time

    while True:
        print("Checking database for new log entries...")

        # Check for the latest entry in any of the log collections
        latest_rfid_entry = db["rfid_logs_entry"].find_one(sort=[("timestamp", -1)])
        latest_rfid_exit = db["rfid_logs_exit"].find_one(sort=[("timestamp", -1)])
        latest_qr_entry = db["qrcode_logs"].find_one(sort=[("timestamp", -1)])

        # Determine the latest log entry and its source
        latest_logs = [
            (latest_rfid_entry, "rfid"),
            (latest_rfid_exit, "rfid"),
            (latest_qr_entry, "qrcode")
        ]
        latest_logs = [log for log in latest_logs if log[0] is not None]  # Filter out None values

        if not latest_logs:
            print("No logs found.")
            time.sleep(2)
            continue

        latest_log, log_source = max(latest_logs, key=lambda x: x[0]["timestamp"])

        # Skip processing if this log was already handled
        if last_processed_timestamp is not None and latest_log["timestamp"] <= last_processed_timestamp:
            print("No new logs detected.")
            time.sleep(2)
            continue

        last_processed_timestamp = latest_log["timestamp"]  # Update last processed log

        print(f"New log detected in {log_source}_logs: {latest_log}")
        user_verified = False

        if log_source == "rfid":
            user_id = latest_log.get("user_id")
            user_verified = bool(db["users"].find_one({"user_id": user_id}))
        elif log_source == "qrcode":
            qr_data = latest_log.get("qrData")
            user_verified = bool(db["qrcodes"].find_one({"qrData": qr_data}))

        if user_verified:
            print("User verified. Capturing image...")
            
            # Define the directory to save images
            save_dir = os.path.join(os.path.dirname(__file__), "..", "server", "imagesOfEntryAndExit")
            os.makedirs(save_dir, exist_ok=True)
            
            # Create a timestamped filename
            timestamp = datetime.datetime.now()
            formatted_time = timestamp.strftime("%Y-%m-%d_%H-%M-%S")
            filename = f"{formatted_time}.jpg"
            filepath = os.path.join(save_dir, filename)

            # Open the camera and capture an image
            cap = cv2.VideoCapture(0)  # 0 for default camera
            ret, frame = cap.read()

            if ret:
                cv2.imwrite(filepath, frame)
                print(f"Image saved at {filepath}")
            else:
                print("Failed to capture image from camera")

            # Release camera properly
            cap.release()
        else:
            print("User verification failed. Skipping image capture.")

        time.sleep(2)  # Adjust the interval as needed

# Start the continuous monitoring
if __name__ == "__main__":
    capture_image()
