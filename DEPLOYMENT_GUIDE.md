# Sheerwood College Admission Portal — Deployment Guide
## Deploying Frontend to Vercel & Backend to Render

This step-by-step guide walks you through deploying the **Sheerwood College Admission Portal** to production using:
- **Vercel** for the React + Vite Single-Page Application (Frontend)
- **Render** for the FastAPI + Python Web Service & Database (Backend)

---

## Architecture Overview

```
+------------------------------------+           +------------------------------------+
|               VERCEL               |           |               RENDER               |
|         (Frontend Hosting)         |           |         (Backend Service)          |
|                                    |           |                                    |
|  - React 18 + Vite (SPA)           |  HTTPS    |  - FastAPI (Python 3.12)           |
|  - Edge CDN distribution           | --------> |  - Uvicorn ASGI Server             |
|  - Client-side routing rewrites    |  API Req  |  - Managed PostgreSQL (or SQLite)  |
|  - URL: https://<app>.vercel.app   |           |  - URL: https://<app>.onrender.com |
+------------------------------------+           +------------------------------------+
```

---

## Prerequisites

1. A **GitHub account** with this repository pushed to your remote.
2. A **Vercel account** ([vercel.com](https://vercel.com) — free tier available).
3. A **Render account** ([render.com](https://render.com) — free tier available).
4. (Optional) An **OpenAI API Key** if enabling the Sherwood AI Assistant live completions.

---

## STEP 1: Deploy the Backend to Render (Do This First)

Deploying the backend first gives you the public Render API URL, which you will then provide to Vercel.

### Option A: 1-Click Blueprint Deployment (Recommended)

This repository includes a pre-configured `render.yaml` blueprint file.

1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** in the top right and select **Blueprint**.
3. Connect your GitHub repository (`school2` or `sheerwood-admission-portal`).
4. Render will detect `render.yaml` and automatically configure:
   - **Service Name**: `sheerwood-backend`
   - **Database**: `sheerwood-postgres` (PostgreSQL)
   - **Runtime**: Python 3.12
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Click **Apply**.
6. When prompted for environment variables, add:
   - `OPENAI_API_KEY`: *(Your key or leave blank for offline mock mode)*
7. Click **Deploy**.

---

### Option B: Manual Web Service Setup on Render

If you prefer setting it up manually:

1. In Render Dashboard, click **New +** > **Web Service**.
2. Select your GitHub repository.
3. Configure the following fields:

| Setting | Value |
| :--- | :--- |
| **Name** | `sheerwood-backend` |
| **Region** | Choose nearest to your users (e.g., *Singapore*, *Frankfurt*, *Oregon*) |
| **Branch** | `main` (or your deployment branch) |
| **Root Directory** | `backend` *(or `sheerwood-admission-portal/backend` if repo root is the parent folder)* |
| **Runtime** | `Python` |
| **Build Command** | `pip install --upgrade pip && pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` (or `Starter`) |

4. Scroll down to **Advanced** > **Health Check Path**:
   - Set to: `/api/health`

5. Add **Environment Variables** in Render:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.12.2` | Matches tested environment |
| `AUTH_MODE` | `local` | Uses local JWT/session auth; change to `cognito` if using AWS |
| `CORS_ORIGIN_REGEX` | `^https:\/\/.*\.vercel\.app$` | Automatically permits all Vercel preview & production deployments |
| `CORS_ORIGINS` | `https://your-custom-domain.com` | *(Optional)* If using a custom domain on Vercel |
| `DATABASE_URL` | *(Render Postgres Internal Connection String)* | Leave empty if using SQLite fallback |
| `OPENAI_API_KEY` | `sk-...` | Optional; for live AI responses |

6. Click **Create Web Service**.
7. Once deployed, note your public backend URL:  
   `https://sheerwood-backend.onrender.com`

8. Test the health check in your browser or terminal:
   ```bash
   curl https://sheerwood-backend.onrender.com/api/health
   # Expected response: {"status":"ok","service":"sheerwood-api"}
   ```

---

## STEP 2: Deploy the Frontend to Vercel

### Step 2.1: Import Project into Vercel

1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository.
4. In the **Configure Project** screen, configure:

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Project Name** | `sheerwood-admission-portal` | User-facing project name |
| **Framework Preset** | `Vite` | Auto-detected |
| **Root Directory** | `sheerwood-admission-portal` *(or `./` if repo root is portal)* | Click **Edit** and select the folder containing `package.json` |
| **Build Command** | `npm run build` | Default |
| **Output Directory** | `dist` | Default |
| **Install Command** | `npm install` | Default |

### Step 2.2: Add Environment Variables in Vercel

Under **Environment Variables**, add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://sheerwood-backend.onrender.com/api` | **Required**: Points all frontend requests to Render (replace with your actual Render URL + `/api`) |
| `VITE_REVIEW_MODE` | `false` | Ensures fake review mode tokens are stripped from production |

*(If using AWS Cognito instead of local auth, also add `VITE_COGNITO_AUTHORITY`, `VITE_COGNITO_CLIENT_ID`, `VITE_COGNITO_DOMAIN`, etc. See `.env.example`).*

### Step 2.3: Deploy

1. Click **Deploy**.
2. Vercel will install dependencies, compile assets via Vite, and deploy to their global Edge CDN.
3. Once complete, note your public Vercel URL (e.g. `https://sheerwood-admission-portal.vercel.app`).

> **Note on Client-Side Routing**: The included [vercel.json](file:///C:/Users/yashm/OneDrive/Desktop/Documents/school2/sheerwood-admission-portal/vercel.json) automatically directs all route requests to `/index.html`, ensuring deep links (`/login`, `/new-user-dashboard`, `/admin/dashboard`) work seamlessly on page refresh.

---

## STEP 3: Connect Frontend and Backend (CORS Verification)

1. Open your Vercel deployment URL: `https://<your-project>.vercel.app`.
2. Open Browser Developer Tools (`F12`) > **Console** & **Network** tabs.
3. Test a quick login or visit `/login`.
4. The backend already includes wildcard support for `^https:\/\/.*\.vercel\.app$`.
   - If you configure a custom apex domain (e.g., `https://admissions.sheerwoodcollege.edu`), add it to the Render backend environment variable `CORS_ORIGINS`:
     ```env
     CORS_ORIGINS=https://admissions.sheerwoodcollege.edu,https://www.sheerwoodcollege.edu
     ```

---

## STEP 4: Production Verification Checklist

Run through this quick sanity checklist once both services are live:

- [ ] **Health Check**: `https://<render-backend>/api/health` returns `{"status":"ok"}`.
- [ ] **SPA Direct Deep Links**: Navigating directly to `https://<vercel-frontend>/login` loads without 404.
- [ ] **Page Refresh**: Refreshing `/new-user-dashboard` retains state and does not crash.
- [ ] **CORS**: Network tab shows `access-control-allow-origin` headers matching your Vercel domain.
- [ ] **Parent Admission Flow**: Create a sample draft application, test document upload preview, and test mock fee payment.
- [ ] **Admin Portal**: Log in as admin (`qa.admin01@example.com` or configured admin) and verify metric counts load from the database.
- [ ] **AI Assistant**: Open the floating Sherwood chat assistant and send a question (e.g., *"What is the admission procedure for Class 5?"*).

---

## Troubleshooting Common Issues

### 1. Render Free Tier Cold Starts
- **Symptom**: First API request takes 20-40 seconds to respond.
- **Cause**: Render free tier instances spin down after 15 minutes of inactivity.
- **Remedy**: Upgrade to Render Starter ($7/month) for 24/7 uptime, or set up a free uptime monitor (e.g., UptimeRobot) to ping `/api/health` every 10 minutes.

### 2. CORS Error (`Cross-Origin Request Blocked`)
- **Symptom**: Console shows `No 'Access-Control-Allow-Origin' header is present`.
- **Cause**: Backend doesn't recognize your frontend domain.
- **Fix**: In Render Dashboard > `sheerwood-backend` > **Environment**, set:
  ```env
  CORS_ORIGINS=https://your-exact-vercel-domain.vercel.app
  CORS_ORIGIN_REGEX=^https:\/\/.*\.vercel\.app$
  ```
  Render will automatically re-deploy with updated settings.

### 3. Vercel Page Refresh Returns 404
- **Symptom**: Clicking links works, but pressing Refresh (F5) on `/admin/dashboard` gives a 404.
- **Cause**: Missing SPA rewrite configuration.
- **Fix**: Ensure [vercel.json](file:///C:/Users/yashm/OneDrive/Desktop/Documents/school2/sheerwood-admission-portal/vercel.json) is present in the frontend root with the rewrite rule pointing to `/index.html`.

### 4. Database Reset on Restart
- **Symptom**: Newly submitted applications vanish after backend restarts.
- **Cause**: Using SQLite on ephemeral file storage.
- **Fix**: Attach a Render Managed PostgreSQL database via `render.yaml` or Render dashboard, and set `DATABASE_URL`. The backend will automatically use PostgreSQL.

