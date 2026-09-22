# Sahayak AI - Real-Time Help for People in Trouble 🚨

Sahayak AI is a production-grade, real-world emergency assistance web platform designed to empower individuals in distress. The system helps users quickly communicate an emergency, analyze situations using hybrid AI, broadcast real-time GPS locations to trusted contacts, and receive life-saving safety guidance in multiple languages (including English and Telugu).

---

## 1. Project Architecture & Technologies

### Backend
* **Python 3.12 / 3.14**: FastAPI asynchronous web framework.
* **SQLAlchemy 2.0**: Object-relational mapping and database abstraction.
* **PyMySQL / SQLite**: Seamless dual database configuration. Connects automatically to MySQL (`sahayak_ai`), and gracefully falls back to local SQLite if MySQL is offline during local development.
* **Authentication**: JWT tokens (`python-jose`) and secure salted bcrypt password hashing (`bcrypt`).
* **WebSockets**: Live emergency event broadcasting channel (`/ws/alerts`).

### AI & Speech
* **Hybrid Situational AI Service**: High-speed, 0ms latency NLP heuristic decision engine classifying emergencies across:
  * Medical Emergency
  * Accident
  * Fire
  * Harassment / Personal Danger
  * Crime / Threat
  * Missing Person
  * Natural Disaster
  * Other Urgent Situations
* **Multilingual Speech & Voice**: Browser Web Speech API for speech-to-text and text-to-speech in both **English (`en-IN`)** and **Telugu (`te-IN`)**.
* **External AI Expansion**: Ready-to-connect Google Gemini / OpenAI integration configurable via `.env`.

### Frontend
* Pure modern **HTML5, CSS3, Vanilla JavaScript (ES6+)**.
* **Responsive Design**: Optimized for smartphones, tablets, laptops, and desktops.
* **Interactive Maps**: Leaflet.js and OpenStreetMap integration for emergency markers and GPS display.
* **Accidental Trigger Prevention**: Deliberate SOS confirmation flow to avoid false alarms.

---

## 2. Directory Structure

```text
SahayakAI/
│
├── backend/
│   ├── main.py                  # FastAPI app, static serving, CORS, lifespan
│   ├── database.py              # SQLAlchemy engine & session manager
│   ├── config.py                # Environment configuration via Pydantic
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py              # User model with role-based access
│   │   ├── emergency_contact.py # Emergency contacts
│   │   ├── emergency.py         # Emergency incidents & GPS coordinates
│   │   └── incident.py          # AI analysis and recommendations
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py              # Auth & profile schemas
│   │   ├── emergency.py         # SOS request/response schemas
│   │   └── contact.py           # Contact schemas
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py              # Register, login (JWT)
│   │   ├── users.py             # User profile endpoints
│   │   ├── emergency.py         # Trigger SOS, AI analyze, resolve
│   │   ├── contacts.py          # CRUD emergency contacts
│   │   ├── incidents.py         # User incident history
│   │   └── admin.py             # Admin analytics & system feeds
│   │
│   ├── services/
│   │   ├── ai_service.py        # Modular AI engine (NLP + external LLM)
│   │   ├── emergency_service.py # SOS dispatch workflow
│   │   ├── notification_service.py # SMS / WhatsApp alerts dispatch
│   │   └── location_service.py  # Nearby stations & helpline numbers
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── auth.py              # Bcrypt hashing & JWT verification
│   │   └── seed.py              # Bootstraps admin account
│   │
│   └── requirements.txt         # Production backend dependencies
│
├── frontend/
│   ├── index.html               # Public emergency portal & helplines
│   ├── login.html               # Secure login
│   ├── register.html            # User onboarding
│   ├── dashboard.html           # SOS button, AI assistant, voice input
│   ├── emergency.html           # Active SOS status, Leaflet map, cancel alarm
│   ├── contacts.html            # Add, edit, remove trusted contacts
│   ├── history.html             # Past emergency log and AI insights
│   ├── profile.html             # Profile management
│   ├── admin.html               # Administrator monitoring command center
│   │
│   ├── css/
│   │   └── style.css            # Emergency color tokens & responsive styles
│   │
│   └── js/
│       ├── api.js               # Centralized fetch API wrapper
│       ├── auth.js              # Navbar and session management
│       ├── voice.js             # Speech recognition & synthesis (English/Telugu)
│       ├── location.js          # Browser geolocation handler
│       ├── dashboard.js         # SOS flow & voice assistant controller
│       ├── emergency.js         # Live incident & Leaflet map renderer
│       ├── contacts.js          # Contacts CRUD controller
│       ├── history.js           # Incident history controller
│       └── admin.js             # Admin analytics controller
│
├── database/
│   └── schema.sql               # MySQL creation script
│
├── .env.example                 # Environment variable template
├── .env                         # Local runtime config
├── .gitignore                   # Ignored files
├── README.md                    # Complete project documentation
├── run.bat                      # One-click Windows runner
└── test_workflow.py             # End-to-end automated verification script
```

---

## 3. MySQL Database Setup

1. Open your MySQL Command Line Client or MySQL Workbench:
```sql
CREATE DATABASE IF NOT EXISTS sahayak_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Run the SQL schema script located at `database/schema.sql`:
```cmd
mysql -u root -p sahayak_ai < database\schema.sql
```

*(Note: FastAPI also includes automatic table generation upon startup, so tables are created automatically if you connect a fresh database).*

---

## 4. Windows Installation & Startup

### Method A: One-Click Startup (Recommended)
Double click `run.bat` or run:
```cmd
run.bat
```

### Method B: Manual Step-by-Step Commands

1. Navigate to the project directory:
```cmd
cd E:\SahayakAI
```

2. Create a virtual environment:
```cmd
python -m venv venv
```

3. Activate the virtual environment:
```cmd
venv\Scripts\activate
```

4. Install the required dependencies:
```cmd
pip install -r backend\requirements.txt "pydantic[email]"
```

5. Start the backend and frontend server:
```cmd
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## 5. Web Addresses & API Documentation

* **User Portal / Web App**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
* **Interactive API Documentation (Swagger)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Alternative API Documentation (ReDoc)**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 6. Pre-Configured Test Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| **System Administrator** | `admin@sahayak.ai` | `Admin@12345` | Complete Admin Dashboard (`/admin.html`), System Analytics, All Emergencies |
| **Test User** | `tester_emergency@example.com` | `UserPass@123` | Dashboard, SOS dispatch, Contacts, History |

---

## 7. Verifying the Complete Workflow

You can run the end-to-end test script anytime:
```cmd
venv\Scripts\python test_workflow.py
```

### Complete User Journey Tested:
1. Open [http://127.0.0.1:8000](http://127.0.0.1:8000)
2. Register an account or sign in with `tester_emergency@example.com` / `UserPass@123`.
3. Go to **Emergency Contacts** and add trusted contacts with phone numbers.
4. Go to **Dashboard**:
   - Speak or type an emergency: *"Severe vehicle collision on highway, car crash with trapped driver"* in English or Telugu.
   - Click **Analyze Situation with AI**: The system categorizes it as `Accident` with `CRITICAL` severity and step-by-step guidance.
5. Click **SOS**:
   - Location is captured via GPS coordinates.
   - Emergency record is created in MySQL.
   - Registered contacts are queued for notification.
   - Live Leaflet map renders with the distress marker.
6. Open **Incident History**: The event is visible with AI details and timestamps.
7. Open **Admin Portal** (`admin@sahayak.ai`):
   - View real-time active emergencies, total user count, and category breakdown.
8. Click **I Am Safe / Resolve Emergency**: The incident is securely closed.

---

## 8. Safety & Ethical Safeguards

* **No False Claims**: The application never states that police or ambulances have been dispatched unless an official 911/112 API has confirmed the dispatch.
* **Direct Helplines**: Provides prominent one-tap dialing buttons for **112 (National Emergency)**, **108 (Ambulance)**, **100 (Police)**, and **101 (Fire)**.
* **False Alarm Prevention**: SOS activation requires deliberate interaction and offers an immediate cancellation button.
* **Data Protection**: Passwords are saved only as salted bcrypt hashes. Admin view does not expose private passwords.
