# 🎓 StudySync – The Intelligent Peer Collaboration Hub

StudySync is a state-of-the-art platform designed to transform how students collaborate, schedule, and study together. By combining vision-based AI with advanced constraint-satisfaction math, StudySync takes the friction out of group coordination.

![Premium Design](https://img.shields.io/badge/Aesthetics-Neubrutalist-ff6b6b?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Backend-Django_&_FastAPI-092E20?style=for-the-badge&logo=django)
![Tech Stack](https://img.shields.io/badge/Frontend-React_&_TypeScript-61DAFB?style=for-the-badge&logo=react)
![AI Engine](https://img.shields.io/badge/AI-Google_Gemini_2.5-blue?style=for-the-badge&logo=google-cloud)

---

## 🌟 Key Features

### ⚡ Magic Timetable Sync
Forget manual entry. Upload a photo of your college timetable, and our **Vision AI (Gemini 1.5 Flash)** will automatically parse it, extracting every class and populating your availability in seconds.

### 🧠 CSP-Based Group Scheduler
Finding a meeting time for 5 people is a mathematical nightmare. StudySync's **External AI Engine** uses Constraint Satisfaction Problem (CSP) algorithms to analyze every member's busy slots (including live Google Calendar events) to find the absolute "Perfect Match" for your next session.

### 🎥 Collaborative Study Rooms
Integrated with **LiveKit**, StudySync provides shared video and audio rooms tailored for study circles, featuring high-fidelity communication and real-time synchronization.

### 👥 Intellectual Matchmaking
Pass the **AI-Driven Skill Verification** tests to prove your expertise. Our matching engine then connects you with peers based on learning styles (Visual, Auditory, Kinesthetic) and academic goals.

---

## 🛠 Tech Stack

- **Frontend**: React, TypeScript, Vite, Neubrutalist UI (Vanilla CSS).
- **Backend (Core)**: Django REST Framework (Python 3.13).
- **AI Microservice**: FastAPI (Port 8002) for heavy CSP calculations.
- **Database**: PostgreSQL (Primary) + Cloudinary (Multimedia).
- **Real-time**: LiveKit SDK for signaling and video.
- **Auth**: Google OAuth 2.0 via `django-allauth`.

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Google AI Studio API Key (Gemini)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. AI Engine (Scheduler) Setup
```bash
cd ai_engine
# Install FastAPI and Uvicorn
pip install fastapi uvicorn
uvicorn scheduler:app --port 8002
```

---

## 🔑 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgres://...
GEMINI_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
CLOUDINARY_CLOUD_NAME=...
LIVEKIT_URL=...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
```

---

## 📂 Project Structure

```text
StudySync/
├── ai_engine/          # CSP Scheduling Microservice (FastAPI)
├── backend/            # Django REST API (Core Logic)
│   ├── study/          # Group, Sessions, and Resource management
│   ├── users/          # Custom User Profile and AI Matching
├── frontend/           # React TypeScript Web App
│   ├── src/components/ # Neubrutalist UI System
│   ├── src/services/  # API Bridge
└── .antigravity/       # AI Assistant Context
```

---

## 🤝 Contributing
Built with ❤️ for students, by students. Feel free to open a PR or raise an issue!

team morpheus :)
---
*© 2026 StudySync Team. Professional, Premium, and Intelligent.*
