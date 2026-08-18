import serial

# Configure the QR Scanner Port for Windows
QR_SERIAL_PORT = "COM6"  # Update this based on your system
QR_BAUD_RATE = 9600
QR_TIMEOUT = 1

def test_qr_scanner():
    """Test QR Scanner by reading data and displaying it."""
    try:
        with serial.Serial(QR_SERIAL_PORT, QR_BAUD_RATE, timeout=QR_TIMEOUT) as qr_ser:
            print(f"📡 Waiting for QR scans on {QR_SERIAL_PORT}...")
            while True:
                qr_data = qr_ser.readline().decode(errors="ignore").strip()
                if qr_data:
                    print(f"✅ Scanned QR Code: {qr_data}")
    except serial.SerialException as e:
        print(f"❌ Error connecting to QR scanner: {e}")
    except KeyboardInterrupt:
        print("\n🛑 Stopping QR Scanner Test...")

if __name__ == "__main__":
    test_qr_scanner()
