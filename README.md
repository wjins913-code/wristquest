# WristQuest 💪 — 손목 건강 퀘스트

A gamified wrist-health assessment web app. Players complete three short
challenges — a PRWE-based **survey**, a 30-second **typing test**, and a
**mouse-tracking** mini-game — and receive a graded report with
personalized stretching/strengthening quests.

- Frontend: **React + Vite + Tailwind CSS + Framer Motion + Recharts**
- Backend: **FastAPI + SQLite**
- Single-process deploy: FastAPI serves the built React app on port 8000.

> ⚠️ WristQuest is for educational/wellness use only and is not a medical
> diagnostic tool. Persistent pain should be evaluated by a clinician.

---

## Project Structure

```
wristquest/
├── frontend/            # Vite + React app
│   └── src/components/
│       ├── Survey.jsx
│       ├── TypingTest.jsx
│       ├── MouseTracking.jsx
│       └── Results.jsx
├── backend/             # FastAPI + SQLite
│   ├── main.py
│   ├── database.py
│   └── requirements.txt
└── README.md
```

---

## Local Development

### 1. Backend

```bash
cd wristquest/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The SQLite database `wristquest.db` is created automatically on first
startup. Endpoints:

- `GET  /api/health`
- `GET  /api/assessments?limit=20`
- `GET  /api/assessments/{id}`
- `POST /api/assessments`

### 2. Frontend (dev)

In a second terminal:

```bash
cd wristquest/frontend
npm install
npm run dev
```

The dev server starts on `http://localhost:5173` and proxies `/api/*`
calls to the FastAPI server on `:8000`.

---

## Production Build (single-process)

Build the React app, then serve it through FastAPI:

```bash
# Build static assets into frontend/dist
cd wristquest/frontend
npm install
npm run build

# Start FastAPI (auto-serves frontend/dist if it exists)
cd ../backend
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

Open `http://<host>:8000/`.

---

## Deploy to EC2 (Amazon Linux 2023 / Ubuntu 22.04)

```bash
# 1. SSH into the instance and install dependencies
sudo dnf install -y python3.11 python3.11-pip git   # Amazon Linux 2023
# sudo apt-get install -y python3 python3-venv git   # Ubuntu

# Node 20 (Amazon Linux 2023)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# 2. Clone the repo
git clone <your-repo-url> wristquest && cd wristquest

# 3. Build the frontend
cd frontend
npm ci
npm run build
cd ..

# 4. Set up the backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 5. Run with uvicorn (or behind systemd / nginx)
uvicorn main:app --host 0.0.0.0 --port 8000
```

Open port **8000** in your EC2 security group (or front it with Nginx +
HTTPS on 443).

### systemd unit (optional)

`/etc/systemd/system/wristquest.service`:

```ini
[Unit]
Description=WristQuest FastAPI
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/wristquest/backend
ExecStart=/home/ec2-user/wristquest/backend/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wristquest
```

### Optional: Nginx reverse proxy (port 80 → 8000)

```nginx
server {
  listen 80;
  server_name _;
  client_max_body_size 5m;

  location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

---

## Scoring Logic (TL;DR)

| Stage           | Inputs                                           | Output (0–100)        |
| --------------- | ------------------------------------------------ | --------------------- |
| Survey          | PRWE pain (5) + function (5) + lifestyle penalty | **Pain Score**        |
| Typing Test     | WPM, error rate, keystroke-interval std-dev      | **Function Score**    |
| Mouse Tracking  | Reaction ms, click offset px, path deviation     | **Stability Score**   |
| Overall         | Pain · 35% + Function · 35% + Stability · 30%    | grade S / A / B / C   |

Grades:

- **S (90–100)** Wrist Warrior 💪
- **A (75–89)** Steady Handler 🙌
- **B (60–74)** Caution Zone ⚠️
- **C (<60)** Rest & Recover 🏥

Each grade unlocks a tailored quest list (maintenance → strengthening →
recovery + clinician referral).

---

## Database

SQLite, single file at `backend/wristquest.db`. Table:

```sql
CREATE TABLE assessments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp       TEXT NOT NULL,
  pain_score      REAL NOT NULL,
  function_score  REAL NOT NULL,
  stability_score REAL NOT NULL,
  overall_score   REAL NOT NULL,
  grade           TEXT NOT NULL,
  survey_data     TEXT NOT NULL, -- JSON
  typing_data     TEXT NOT NULL, -- JSON
  mouse_data      TEXT NOT NULL  -- JSON
);
```

To inspect: `sqlite3 backend/wristquest.db "SELECT id, grade, overall_score FROM assessments ORDER BY id DESC;"`
