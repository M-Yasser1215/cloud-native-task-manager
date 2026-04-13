# Cloud Native Task Manager

A full-stack task management app deployed to the cloud with a real backend, database, and JWT authentication. Built as a portfolio project to demonstrate end-to-end system design and cloud deployment.

**Live Demo:** [cloud-native-task-manager.vercel.app](https://cloud-native-task-manager.vercel.app)

---

## 📦 Technologies

**Frontend**
- React + TypeScript
- Vite
- React Router
- Axios
- Cypress (E2E testing)

**Backend**
- Python + FastAPI
- SQLAlchemy ORM
- Pydantic (validation)
- JWT access + refresh tokens (python-jose + passlib)
- SlowAPI (rate limiting)

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
- JWT access tokens (60 min) + refresh tokens (30 days)
- Silent token refresh via Axios interceptor
- Rate limiting on auth endpoints (10 requests/minute)
- Protected routes - unauthenticated users are redirected to login

**Task Management**
- Create tasks with title, description, priority, due date, and tags
- Mark tasks as complete or incomplete
- Delete tasks
- Edit task title and description inline without a modal
- Filter by All, Active, or Completed
- Filter by tag via the sidebar
- Real-time search by title, description, or tag
- Tasks sorted by priority automatically
- Overdue highlighting for tasks past their due date

**Dashboard**
- Live stats bar showing total, completed, overdue count, and percentage
- Animated progress bar
- Modal form for creating new tasks
- Sidebar navigation with per-filter counts and tag list

**UI**
- Dark mode by default with light mode toggle
- Theme preference saved to localStorage
- Custom SVG favicon and tab title
- Mobile-first responsive layout with slide-out sidebar

**Testing**
- E2E tests with Cypress covering auth flow and full task CRUD

---

## 🏗️ Architecture

```
cloud-native-task-manager/
├── frontend/               ← React + TypeScript (Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── Verify.tsx
│   │   ├── App.tsx         ← Routing
│   │   ├── AuthContext.tsx ← Global auth state
│   │   ├── api.ts          ← Axios client with JWT + refresh interceptors
│   │   └── types.ts        ← TypeScript interfaces
│   ├── cypress/
│   │   ├── e2e/
│   │   │   ├── auth.cy.ts  ← Auth flow tests
│   │   │   └── tasks.cy.ts ← Task CRUD tests
│   │   ├── support/
│   │   │   ├── commands.ts ← Custom cy.login() command
│   │   │   └── e2e.ts      ← Global support file
│   │   └── fixtures/
│   │       └── user.json   ← Test user credentials
│   ├── public/
│   │   └── favicon.svg     ← Custom SVG favicon
│   └── vercel.json         ← Client-side routing fix
│
└── backend/                ← FastAPI (Python)
    ├── app/
    │   ├── routers/
    │   │   ├── auth.py     ← POST /auth/register, /login, /refresh
    │   │   └── tasks.py    ← GET/POST/PUT/DELETE /tasks
    │   ├── models.py       ← SQLAlchemy ORM (User, Task)
    │   ├── schemas.py      ← Pydantic request/response models
    │   ├── auth.py         ← JWT + password utilities
    │   ├── database.py     ← DB engine + session
    │   ├── config.py       ← Environment variable config
    │   └── main.py         ← App entry point, CORS, rate limiter
    ├── requirements.txt
    └── Procfile
```

---

## 🚦 Running Locally

**Prerequisites:** Python 3.11+, Node.js 22+, a PostgreSQL database (or Neon free tier)

**Backend**
```bash
cd backend
copy .env.example .env     # fill in DATABASE_URL and JWT_SECRET
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

**Cypress tests**
```bash
cd frontend
npm run cy:open   # interactive UI
npm run cy:run    # headless
```

**Environment Variables**

Backend (`.env`):
```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=your-random-secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173
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

Once the backend was running locally and tested via the auto-generated Swagger docs, I moved to the frontend. I scaffolded the React app with Vite and TypeScript, built the auth flow (register → login → protected dashboard), and set up an Axios client with request interceptors to attach the JWT token automatically and silently refresh it using a refresh token when it expires.

With both ends talking to each other locally, I deployed the database to Neon, the backend to Render, and the frontend to Vercel. This involved configuring environment variables across three separate platforms and debugging CORS, routing, and Python version issues in production.

After the core app was live, I extended it significantly: adding due dates with overdue highlighting, inline task editing, custom tags with sidebar filtering, real-time search, rate limiting on auth endpoints, a light/dark mode toggle with localStorage persistence, mobile responsiveness, and a full Cypress E2E test suite covering the auth flow and task CRUD.

---

## ✅ Completed Improvements

- Mobile responsiveness with slide-out sidebar and CSS media queries
- Email verification page (delivery blocked by hosting limitations - see Future Improvements)
- Due dates with date picker and overdue highlighting
- Inline editing for task title and description
- Task tags with sidebar filtering
- Rate limiting on auth endpoints
- Refresh token flow with silent background renewal
- Cypress E2E tests for auth flow and task CRUD
- Custom favicon and tab title
- Real-time search bar
- Light/dark mode toggle with localStorage persistence

---

## 🐛 Bugs & Fixes

**bcrypt version incompatibility**
`passlib` threw an `AttributeError` when trying to hash passwords because the installed version of `bcrypt` (v4.1+) removed the `__about__` attribute it expected. Fixed by pinning `bcrypt==4.0.1` explicitly in `requirements.txt`.

**`completed` field typed as `str` instead of `bool`**
The `TaskUpdate` Pydantic schema had `completed: Optional[str]` instead of `Optional[bool]`. This caused a 422 Unprocessable Entity error every time the checkbox was clicked. Fixed by correcting the type annotation.

**SQLAlchemy circular import**
Using `from app import models` in the routers caused a circular import that silently broke the `Task` class at import time, resulting in an `AttributeError`. Fixed by switching to direct imports: `from app.models import User, Task`.

**`get_db` swallowing exceptions**
The `get_db` dependency used a bare `except` block that swallowed all exceptions, causing FastAPI to return a 500 with no meaningful error. This made debugging nearly impossible as the real error was never surfaced. Fixed by replacing `except: db.close()` with `finally: db.close()`.

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

**New database columns not picked up on deploy**
After adding `verified`, `verification_token`, `due_date`, and `tags` columns to the models, existing rows had `NULL` values and requests failed. SQLAlchemy only creates tables from scratch - it doesn't migrate existing ones. Fixed by running `ALTER TABLE` statements manually in Neon's SQL Editor.

**Render blocking outbound SMTP**
After implementing email verification using Gmail SMTP, the registration endpoint hung indefinitely with no response. Render's free tier blocks outbound connections on both port 465 and 587. Attempted workaround with Resend (HTTPS-based) was limited by free tier restrictions. Resolved by removing live email sending and replacing it with a registration confirmation page that explains the limitation.

**Cypress tests hitting rate limits**
Running the full Cypress task test suite caused repeated logins which triggered the 10/minute rate limit on `/auth/login`, failing tests with 429 errors. Fixed by using `cy.session` to cache the login state across tests, so the login endpoint is only called once per suite rather than before every individual test.

**Cypress clearing auth state between tests**
A global `beforeEach(() => cy.clearLocalStorage())` in `cypress/support/e2e.ts` was wiping the JWT token after every test, causing every subsequent test to redirect to the login page. Fixed by moving the `clearLocalStorage` call into the auth test suite only, leaving task tests unaffected.

---



## 💭 Future Improvements

- **Email verification** - send a confirmation code or magic link to the user's email on registration. 
>Attempted during development but blocked by Render's free tier restricting outbound SMTP. The registration flow and verification page exist in the codebase - only the actual email delivery is missing. Fully implementable on a paid hosting plan or with a custom domain on Resend.
- Add drag-to-reorder tasks.
- Edit task due date and tags inline without reopening the create form.
- Add task completion statistics over time with a chart.
- Refresh token rotation - invalidate old refresh tokens on use for extra security.
- Expand Cypress test coverage to include tag filtering, search, and inline editing.