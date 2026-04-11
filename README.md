# 🗂️ Cloud Native Task Manager

A full-stack task management app deployed to the cloud with a real backend, database, and JWT authentication. Built as a portfolio project to demonstrate end-to-end system design and cloud deployment.

🔗 **Live Demo:** [cloud-native-task-manager.vercel.app](https://cloud-native-task-manager.vercel.app)

---

## 📦 Technologies

**Frontend**
- React + TypeScript
- Vite
- React Router
- Axios

**Backend**
- Python + FastAPI
- SQLAlchemy ORM
- Pydantic (validation)
- JWT (python-jose + passlib)

**Database**
- PostgreSQL (hosted on Neon)

**Cloud / Deployment**
- Frontend → Vercel
- Backend → Render
- Database → Neon (serverless PostgreSQL)

---

## 🦄 Features

**Authentication**
- Register and login with email + password
- Passwords hashed with bcrypt
- JWT tokens stored in localStorage and attached to every API request
- Protected routes - unauthenticated users are redirected to login

**Task Management**
- Create tasks with a title, optional description, and priority (low / medium / high)
- Mark tasks as complete or incomplete
- Delete tasks
- Filter tasks by All, Active, or Completed
- Tasks sorted by priority automatically

**Dashboard**
- Live stats bar showing total tasks, completed count, and percentage
- Animated progress bar
- Modal form for creating new tasks
- Sidebar navigation with per-filter counts

---

## 🏗️ Architecture

```
cloud-native-task-manager/
├── frontend/               ← React + TypeScript (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── App.tsx         ← Routing
│   │   ├── AuthContext.tsx ← Global auth state
│   │   ├── api.ts          ← Axios client with JWT interceptors
│   │   └── types.ts        ← TypeScript interfaces
│   └── vercel.json         ← Client-side routing fix
│
└── backend/                ← FastAPI (Python)
    ├── app/
    │   ├── routers/
    │   │   ├── auth.py     ← POST /auth/register, POST /auth/login
    │   │   └── tasks.py    ← GET/POST/PUT/DELETE /tasks
    │   ├── models.py       ← SQLAlchemy ORM (User, Task)
    │   ├── schemas.py      ← Pydantic request/response models
    │   ├── auth.py         ← JWT + password utilities
    │   ├── database.py     ← DB engine + session
    │   ├── config.py       ← Environment variable config
    │   └── main.py         ← App entry point + CORS
    ├── requirements.txt
    └── Procfile
```

---

## 🚦 Running Locally

**Prerequisites:** Python 3.11+, Node.js 22+, a PostgreSQL database (or Neon free tier)

**Backend**
```bash
cd backend
cp .env.example .env       # fill in DATABASE_URL and JWT_SECRET
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

API runs at `http://localhost:8000` - interactive docs at `http://localhost:8000/docs`

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

**Environment Variables**

Backend (`.env`):
```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=your-random-secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173
```

Frontend (`.env`):
```
VITE_API_URL=http://localhost:8000
```

---

## ☁️ Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploys on push to `main` |
| Backend | Render | Free tier, cold starts after inactivity |
| Database | Neon | Serverless PostgreSQL, free tier |

> **Note:** Render's free tier spins down after 15 minutes of inactivity. The first request after a sleep may take ~30 seconds to respond. This is expected behaviour on the free plan.

---

## 👩🏽‍🍳 The Process

I started by designing the database schema - a `users` table and a `tasks` table with a foreign key relationship. From there I built the FastAPI backend, wiring up SQLAlchemy models, Pydantic schemas for validation, and JWT auth from scratch using `python-jose` and `passlib`.

Once the backend was running locally and tested via the auto-generated Swagger docs, I moved to the frontend. I scaffolded the React app with Vite and TypeScript, built the auth flow (register -> login -> protected dashboard), and set up an Axios client with request interceptors to attach the JWT token automatically.

With both ends talking to each other locally, I deployed the database to Neon, the backend to Render, and the frontend to Vercel. This involved configuring environment variables across three separate platforms and debugging CORS, routing, and Python version issues in production.

---

## 🐛 Bugs & Fixes

**bcrypt version incompatibility**
`passlib` threw an `AttributeError` when trying to hash passwords because the installed version of `bcrypt` (v4.1+) removed the `__about__` attribute it expected. Fixed by pinning `bcrypt==4.0.1` explicitly in `requirements.txt`.

**`completed` field typed as `str` instead of `bool`**
The `TaskUpdate` Pydantic schema had `completed: Optional[str]` instead of `Optional[bool]`. This caused a 422 Unprocessable Entity error every time the checkbox was clicked. Fixed by correcting the type annotation.

**SQLAlchemy circular import**
Using `from app import models` in the routers caused a circular import that silently broke the `Task` class at import time, resulting in an `AttributeError`. Fixed by switching to direct imports: `from app.models import User, Task`.

**Node.js too old for Vite**
`npm create vite@latest` failed with a `SyntaxError` about `styleText` not being exported from `node:util`. The installed Node.js version was v21.5.0 - below the required `>=22.12.0`. Fixed by upgrading Node.js to the latest LTS.

**`.env` accidentally pushed to GitHub**
The `.env` file containing the live Neon database credentials was committed and pushed. Fixed by immediately rotating the database password on Neon, removing `.env` from git tracking with `git rm --cached`, and adding it to `.gitignore`.

**VSCode Pyright import errors**
VSCode flagged all `from app.x import y` imports as unresolved because Pyright couldn't find the `app` package root. Fixed by adding a `pyrightconfig.json` with `extraPaths: ["./"]` pointing to the `backend/` folder.

**Render deploying with Python 3.14**
Render defaulted to Python 3.14 which couldn't build `pydantic-core` from source (requires Rust toolchain on a read-only filesystem). Fixed by setting the `PYTHON_VERSION=3.11.9` environment variable in Render's dashboard.

**CORS blocking all requests**
The frontend on Vercel was blocked by CORS because the `CORS_ORIGINS` environment variable on Render was missing the `https://` prefix. Fixed by setting the full origin URL correctly.

**Vercel returning 404 on all routes**
Navigating directly to `/login` or `/register` returned a 404 because Vercel tried to find those as static files. Fixed by adding a `vercel.json` rewrite rule to serve `index.html` for all routes, letting React Router handle navigation client-side.

---

## 💭 Future Improvements

- **Mobile responsiveness** - the app is currently designed for desktop browsers only. A full responsive redesign using CSS media queries and a mobile-first layout would make it usable across all screen sizes and devices.
- **Email verification** - send a confirmation code or magic link to the user's email on registration to verify they own the address before activating the account. Could be implemented using SMTP (e.g. Gmail, SendGrid, or Resend).
- Add due dates to tasks with a date picker and overdue highlighting.
- Edit task title and description inline without a modal.
- Add task categories or tags for better organisation.
- Rate limiting on auth endpoints to prevent brute force attacks.
- Refresh token flow so users aren't logged out after JWT expiry.
- End-to-end tests with Cypress covering the auth flow and task CRUD.
~~- Change Favicon and Tab name to match the app.~~ ✅
