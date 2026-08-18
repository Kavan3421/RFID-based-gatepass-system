import serial
import serial.tools.list_ports
import pymongo
from datetime import datetime
import time

# 🎯 QR Scanner Configuration (USB on Windows)
QR_SERIAL_PORT = "COM6"  # Update this based on your system
QR_BAUD_RATE = 9600
QR_TIMEOUT = 1

# 🎯 MongoDB Configuration
MONGO_URI = "mongodb+srv://kavanpatel4321:ssip%40123456@rfid.s3i78.mongodb.net/"
DATABASE_NAME = "test"

# 🎯 Initialize MongoDB Connection
client = pymongo.MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
qrcode_logs_collection = db["qrcode_logs"]
qr_collection = db["qrcodes"]

# 🎯 Function to Process QR Code Scan
def process_qr_scan(qr_data):
    print(f"🔍 Scanned QR Code: {qr_data}")
    qr_entry = qr_collection.find_one({"qrData": qr_data})
    current_time = datetime.now()

    if qr_entry:
        if "used" not in qr_entry:
            print("✅ First scan: Granting Entry")
            qr_collection.update_one({"qrData": qr_data}, {"$set": {"used": True}})
            
            # Log QR Code Entry
            qrcode_logs_collection.insert_one(
                {"qrData": qr_data, "timestamp": current_time, "action": "entry"}
            )
        else:
            print("✅ Second scan: Granting Exit and Expiring QR Code")
            qr_collection.delete_one({"qrData": qr_data})
            
            # Log QR Code Exit
            qrcode_logs_collection.insert_one(
                {"qrData": qr_data, "timestamp": current_time, "action": "exit"}
            )
    else:
        print("❌ QR Code Not Found in Database!")

# 🎯 Read QR Code from Scanner
def read_qr_scanner():
    try:
        with serial.Serial(QR_SERIAL_PORT, QR_BAUD_RATE, timeout=QR_TIMEOUT) as qr_ser:
            print(f"📡 Waiting for QR scans on {QR_SERIAL_PORT}...")
            while True:
                qr_data = qr_ser.readline().decode(errors="ignore").strip()
                if qr_data:
                    process_qr_scan(qr_data)
    except serial.SerialException as e:
        print(f"❌ Error connecting to QR scanner: {e}")
    except KeyboardInterrupt:
        print("\n🛑 Stopping QR Scanner...")

# 🎯 Main Execution
if __name__ == "__main__":
    read_qr_scanner()
