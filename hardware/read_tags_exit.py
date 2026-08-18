import serial
import pymongo
from datetime import datetime, timedelta

# Configure RFID reader connection
RFID_PORT = 'COM5'  # Replace with your RFID reader's serial port
BAUD_RATE = 9600  # Common baud rate for RFID readers
TIMEOUT = 1  # Serial timeout in seconds

# MongoDB configuration
MONGO_URI = "mongodb+srv://kavanpatel4321:ssip%40123456@rfid.s3i78.mongodb.net/"  # Update if using a remote server
DATABASE_NAME = "test"
COLLECTION_NAME = "rfid_logs_exit"

def connect_to_mongo():
    """Connect to MongoDB."""
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    return db[COLLECTION_NAME]

def is_duplicate_entry(collection, rfid_tag, current_time):
    """Check if the RFID tag was scanned within the last minute."""
    one_minute_ago = current_time - timedelta(minutes=1)
    duplicate = collection.find_one({
        "rfid_tag": rfid_tag,
        "timestamp": {"$gte": one_minute_ago}
    })
    return duplicate is not None

def read_rfid_logs():
    """Read RFID data from the serial port."""
    try:
        with serial.Serial(RFID_PORT, BAUD_RATE, timeout=TIMEOUT) as ser:
            print("Waiting for RFID scans...")
            while True:
                rfid_data = ser.readline().decode('utf-8').strip().replace('\x00', '')  # Read and clean input
                if rfid_data:
                    current_time = datetime.now()
                    if not is_duplicate_entry(collection, rfid_data, current_time):
                        # Prepare log entry
                        log_entry = {
                            "rfid_tag": rfid_data,
                            "timestamp": current_time
                        }
                        # Insert log into MongoDB
                        collection.insert_one(log_entry)
                        print(f"Log saved to database: {log_entry}")
                    else:
                        print(f"Duplicate scan ignored for RFID Tag: {rfid_data}")
    except serial.SerialException as e:
        print(f"Error connecting to RFID reader: {e}")
    except KeyboardInterrupt:
        print("\nStopping RFID reader...")

if __name__ == "__main__":
    # Connect to MongoDB collection
    collection = connect_to_mongo()
    
    # Start reading RFID logs
    read_rfid_logs()
