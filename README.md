# 🚗 SurveilEye — RFID & QR Code Vehicle Surveillance System

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38BDF8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Raspberry Pi](https://img.shields.io/badge/Hardware-Raspberry_Pi-C51A4A?style=flat-square&logo=raspberry-pi)](https://www.raspberrypi.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

An advanced **RFID & QR Code-based Vehicle Access Control and Gate Pass Surveillance System**. **SurveilEye** automates vehicle entry/exit monitoring with **RFID tag authentication**, **embedded logo QR code visitor passes**, **servo-motor barrier control**, and **real-time admin surveillance logging**.

---

## ✨ Features & Capabilities

### 🛡️ Core Security Features
- **RFID-Based Automated Access Control** – Registered vehicles tap their RFID tag at barrier scanners for automated verification and servo barrier opening.
- **Visitor QR Pass Generator with Centered Logo** – Visitors generate a custom gate pass with entry reasons and time slots. The pass renders a high-density QR code with the official **SurveilEye logo embedded at the center**.
- **Canvas Image Download** – Downloaded pass PNG images composite the centered logo directly onto an in-memory HTML5 canvas for printing or mobile presentation.
- **Camera Surveillance & Real-Time Logging** – Entry and exit transactions record exact timestamps, user details, and captured gate photos.
- **Dual Portal (User & Admin)** – Dedicated dashboards for individual vehicle owners and security administrators.

### 🎨 Modern UI & Design System
- **High-Contrast Light & Dark Theme** – Full glassmorphism interface with dark mode and vibrant light mode support.
- **Persistent Theme Preference** – Theme selection is stored in `localStorage` and synchronized across tabs without hydration flashes.
- **Custom Interactive Calendar Picker (`CalendarPicker.jsx`)** – Clean date selection with a 3x4 custom Month Grid view, decade navigation, and direct year typing (supports any year).
- **Custom Time Slot Duration Picker (`TimePicker.jsx`)** – Quick preset slot selection (`Morning`, `Afternoon`, `Evening`, `Full Day`) alongside stacked, spacious Start/End time selectors.
- **Smart Auth Routing** – Navigating to `/admin` intelligently redirects logged-in admins to `/admin/dashboard` or unauthenticated visitors to `/admin/auth`.

---

## 🏗️ Architecture & Project Structure

The project features a **Next.js 16 (App Router)** full-stack codebase alongside Raspberry Pi Python hardware controllers.

```
SSIP/
├── next-app/                    # Next.js 16 Full-Stack Application
│   ├── app/                     # Next.js App Router Pages & API Routes
│   │   ├── (user)/              # User Portal Pages
│   │   │   ├── dashboard/       # Vehicle Status & Live Gate Overview
│   │   │   ├── gatepass/        # Visitor QR Code Pass Generator
│   │   │   ├── databydate/      # Personal RFID Movement History
│   │   │   ├── contact/         # Support & Feedback Form
│   │   │   └── profile/         # User Account & RFID Information
│   │   ├── admin/               # Admin Portal Pages
│   │   │   ├── dashboard/       # Command Center & System Overview
│   │   │   ├── users/           # User Management (Enrollment & RFID Assignment)
│   │   │   ├── databydate/      # Complete RFID Movement Logs Search
│   │   │   ├── passbydate/      # Visitor Gate Pass Records Search
│   │   │   └── profile/         # Admin Account Details
│   │   └── api/                 # Next.js REST API Backend Endpoints
│   │       ├── user/            # Auth, Gatepass, Data Query APIs
│   │       └── admin/           # Admin Auth, User Management, Logs APIs
│   ├── components/              # Reusable React UI Components
│   │   ├── navigation/Navbar.jsx# Responsive Navigation Bar
│   │   ├── ui/CalendarPicker.jsx# Custom Interactive Calendar Picker
│   │   ├── ui/TimePicker.jsx    # Custom Time Duration Slot Selector
│   │   └── theme/               # Theme Context & LocalStorage Provider
│   ├── public/                  # Static Assets (Original logo.png)
│   └── store/                   # Redux Toolkit Global State (User & Admin Slices)
│
├── hardware/                    # Raspberry Pi Automation Scripts
│   ├── read_tags_entry.py       # Entry RFID Reader & Gate Barrier Trigger
│   ├── read_tags_exit.py        # Exit RFID Reader & Gate Barrier Trigger
│   ├── main2.py                 # Dual Servo Motor Controller
│   └── image_capture.py         # Pi Camera / USB Camera Image Logger
│
└── Screenshots/                 # Application Screenshots & Documentation Assets
```

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Lucide Icons, Redux Toolkit
- **Backend & Database**: Next.js Serverless API Routes, MongoDB, Mongoose ODM, JWT Authentication
- **Hardware Integration**: Raspberry Pi GPIO, MFRC522 RFID Readers, Servo Motors, USB/Pi Camera Modules
- **QR Code & Canvas**: QRCode.react, HTML5 Canvas API

---

## 🚀 Getting Started & Setup Guide

### 1️⃣ Prerequisites
- **Node.js**: v18.0.0 or higher
- **Package Manager**: npm or yarn
- **Database**: MongoDB connection URI (Local MongoDB instance or MongoDB Atlas)

---

### 2️⃣ Web Application Setup (`next-app`)

1. **Navigate to the `next-app` directory**:
   ```bash
   cd next-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file inside the `next-app/` directory:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/surveileye?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret_key_here
   ADMIN_JWT_SECRET=your_admin_jwt_secret_key_here
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

5. **Build for Production**:
   ```bash
   npm run build
   npm run start
   ```

---

### 3️⃣ Hardware Setup (`hardware/`)

1. **Connect Raspberry Pi Peripherals**:
   - Wire the RFID MFRC522 Readers to the SPI bus pins on the Raspberry Pi.
   - Connect Servo Motors to GPIO PWM pins.
   - Connect the Camera Module.

2. **Execute Python Automation Scripts**:
   ```bash
   cd hardware
   python3 read_tags_entry.py
   python3 read_tags_exit.py
   ```

---

## 📸 Screenshots

| User Dashboard | QR Visitor Pass |
|:---:|:---:|
| ![User Dashboard](Screenshots/UserDashboard.jpg) | ![QR Code Visitor Pass](Screenshots/GatePass.jpg) |

| Admin Command Center | RFID History Logs |
|:---:|:---:|
| ![Admin Dashboard](Screenshots/AdminDashboard.jpg) | ![Admin History Section](Screenshots/AdminHistory.jpg) |

---

## 📜 License

This project is open-source and available under the **MIT License**.

---

## 🤝 Contributing & Contact

<<<<<<< HEAD
Contributions, issues, and feature requests are welcome!
- Connect on [LinkedIn](https://www.linkedin.com/in/kavan-patel-763319251/)
- Created by **Team SurveilEye**
=======
---

## 👤 Created By

**Kavan Patel**  
🔗 [LinkedIn](https://www.linkedin.com/in/kavan-patel-763319251/)  
🌐 [Portfolio](https://kavanpatel.me)
>>>>>>> cc9a915abc52fa1bf5616cd8d9c0c9d2e395137c
