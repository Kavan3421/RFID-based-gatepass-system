import serial
import serial.tools.list_ports
import pymongo
import RPi.GPIO as GPIO
from datetime import datetime, timedelta
import time

# 🎯 RFID Reader Configuration (USB)
RFID_PORT = "/dev/ttyUSB0"  # Check `ls /dev/ttyUSB*` if unsure
BAUD_RATE = 9600
TIMEOUT = 1  # Serial timeout in seconds

# 🎯 QR Scanner Configuration (USB on Windows)
QR_SERIAL_PORT = "/dev/ttyACM0"  # Update this based on your system
QR_BAUD_RATE = 9600
QR_TIMEOUT = 1

# 🎯 Servo Motor GPIO Pins (Using BCM mode)
ENTRY_SERVO_PIN = 17  # GPIO pin for Entry gate servo
EXIT_SERVO_PIN = 18  # GPIO pin for Exit gate servo

# 🎯 MongoDB Configuration
MONGO_URI = "mongodb+srv://kavanpatel4321:ssip%40123456@rfid.s3i78.mongodb.net/"
DATABASE_NAME = "test"

EXIT_HOURS = [(2, 14, 30), (15, 17, 30)]

# 🎯 Initialize MongoDB Connection
client = pymongo.MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
user_collection = db["users"]
entry_collection = db["rfid_logs_entry"]
exit_collection = db["rfid_logs_exit"]
gatepass_collection = db["gatepasses"]
qrcode_logs_collection = db["qrcode_logs"]
qr_collection = db["qrcodes"]

# 🎯 Initialize GPIO for Servo Motors
GPIO.cleanup()
GPIO.setmode(GPIO.BCM)
GPIO.setup(ENTRY_SERVO_PIN, GPIO.OUT)
GPIO.setup(EXIT_SERVO_PIN, GPIO.OUT)

entry_servo = GPIO.PWM(ENTRY_SERVO_PIN, 50)  # 50Hz PWM frequency
exit_servo = GPIO.PWM(EXIT_SERVO_PIN, 50)  # 50Hz PWM frequency

entry_servo.start(0)
exit_servo.start(0)

# 🎯 Function to Move Servo


def move_servo(servo, open_angle=5, close_angle=2.5):
    """
    Moves the servo to open at 45° and then close back to 0°.

    - open_angle = 5 (corresponds to ~45°)
    - close_angle = 2.5 (corresponds to ~0°)
    """
    print("🔄 Moving Servo: Opening to 45°...")
    servo.ChangeDutyCycle(open_angle)  # Move to 45°
    time.sleep(2)  # Keep gate open for 2 seconds

    print("🔄 Moving Servo: Closing to 0°...")
    servo.ChangeDutyCycle(close_angle)  # Move back to 0°
    time.sleep(3)  # Allow time to close

    print("🛑 Stopping Servo...")
    servo.ChangeDutyCycle(0)  # Stop servo to avoid buzzing


def open_entry_gate():
    print("🚗 Opening Entry Gate...")
    move_servo(entry_servo)


def open_exit_gate():
    print("🚗 Opening Exit Gate...")
    move_servo(exit_servo)


def is_duplicate(collection, rfid_tag, current_time):
    """Check if the same RFID tag was scanned within the last minute."""
    one_minute_ago = current_time - timedelta(minutes=1)
    return (
        collection.find_one(
            {"rfid_tag": rfid_tag, "timestamp": {"$gte": one_minute_ago}}
        )
        is not None
    )


def is_exit_allowed():
    """Checks if the current time is within allowed exit hours."""
    now = datetime.now()
    for start_hour, end_hour, end_minute in EXIT_HOURS:
        if start_hour <= now.hour < end_hour or (
            now.hour == end_hour and now.minute <= end_minute
        ):
            return True
    return False


def has_valid_gate_pass(rfid_tag):
    """Checks if a valid gate pass exists within ±15 minutes of the current time."""
    now = datetime.now()
    gatepass = gatepass_collection.find_one({"rfid_tag": rfid_tag})
    if gatepass and "exit_time" in gatepass:
        exit_time = gatepass["exit_time"]
        exit_time = datetime.strptime(exit_time, "%Y-%m-%d %H:%M:%S")
        return (
            exit_time - timedelta(minutes=15)
            <= now
            <= exit_time + timedelta(minutes=15)
        )
    return False


# 🎯 Process QR Code Scan
def process_qr_scan(qr_data):
    print(f"🔍 Scanned QR Code: {qr_data}")
    qr_entry = qr_collection.find_one({"qrData": qr_data})
    current_time = datetime.now()

    if qr_entry:
        if "used" not in qr_entry:
            print("✅ First scan: Opening Entry Gate")
            open_entry_gate()
            qr_collection.update_one({"qrData": qr_data}, {"$set": {"used": True}})

            # Log QR Code Entry
            qrcode_logs_collection.insert_one(
                {"qrData": qr_data, "timestamp": current_time, "action": "entry"}
            )
        else:
            print("✅ Second scan: Opening Exit Gate and Expiring QR Code")
            open_exit_gate()
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


def process_rfid_scan(rfid_tag):
    print(f"🔍 Scanned RFID: '{rfid_tag}'")

    user = user_collection.find_one({"rfid_tag": rfid_tag})
    if not user:
        print(f"❌ Unknown RFID Tag: {rfid_tag}")
        return

    print(f"✅ User Found: {user['name']} ({rfid_tag})")

    current_time = datetime.now()

    # Check Last Entry and Last Exit
    last_entry = entry_collection.find_one(
        {"rfid_tag": rfid_tag}, sort=[("timestamp", -1)]
    )
    last_exit = exit_collection.find_one(
        {"rfid_tag": rfid_tag}, sort=[("timestamp", -1)]
    )

    # If no entry record exists or last exit is after the last entry → Allow Entry
    if not last_entry or (
        last_exit and last_exit["timestamp"] > last_entry["timestamp"]
    ):
        if not is_duplicate(entry_collection, rfid_tag, current_time):
            entry_data = {
                "rfid_tag": rfid_tag,
                "name": user["name"],
                "vehicleNumber": user["vehicleNumber"],
                "timestamp": current_time,
            }
            entry_collection.insert_one(entry_data)
            print(f"✅ Entry Logged: {user['name']} at {current_time}")
            open_entry_gate()
        else:
            print("⚠️ Duplicate Entry Ignored.")
    else:
        # Check if duplicate scan happened for exit within 1 minute
        if is_duplicate(exit_collection, rfid_tag, current_time):
            print("⚠️ Duplicate Exit Ignored.")
            return

        # If entry exists and was not followed by an exit → Allow Exit
        if is_exit_allowed() or has_valid_gate_pass(rfid_tag):
            exit_data = {
                "rfid_tag": rfid_tag,
                "name": user["name"],
                "vehicleNumber": user["vehicleNumber"],
                "timestamp": current_time,
            }
            exit_collection.insert_one(exit_data)
            print(f"✅ Exit Logged: {user['name']} at {current_time}")
            open_exit_gate()
        else:
            print("⛔ Exit Denied: Not in Exit Hours & No Valid Gate Pass!")


# 🎯 Read RFID Data from USB Reader
def read_rfid():
    try:
        with serial.Serial(RFID_PORT, BAUD_RATE, timeout=TIMEOUT) as ser:
            print("📡 Waiting for RFID scans...")
            while True:
                rfid_data = ser.readline().decode("utf-8").strip().replace("\x00", "")
                if rfid_data:
                    print(f"🔍 Scanned RFID: {rfid_data}")
                    process_rfid_scan(rfid_data)
    except serial.SerialException as e:
        print(f"❌ Error connecting to RFID reader: {e}")
    except KeyboardInterrupt:
        print("\n🛑 Stopping RFID Reader...")
        GPIO.cleanup()


# 🎯 Main Execution
if __name__ == "__main__":
    from threading import Thread

    rfid_thread = Thread(target=read_rfid)
    qr_thread = Thread(target=read_qr_scanner)

    rfid_thread.start()
    qr_thread.start()

    rfid_thread.join()
    qr_thread.join()
