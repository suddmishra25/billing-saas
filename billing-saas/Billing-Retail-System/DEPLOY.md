# Deploy: Vercel (frontend) + Render (backend + PostgreSQL)

## Architecture

| Piece | Host | URL example |
|-------|------|-------------|
| React (Vite) | **Vercel** | `https://your-billing.vercel.app` |
| Spring Boot API | **Render Web Service** | `https://billing-api.onrender.com` |
| PostgreSQL | **Render PostgreSQL** | private connection string |

The browser calls the Render API with `Authorization: Bearer` (CORS must allow your Vercel origin).

---

## 1. Prerequisites

- Git repo on GitHub/GitLab (connected to Vercel and Render)
- This app lives under `billing-saas/Billing-Retail-System/` (backend + `client/`)

---

## 2. Render — PostgreSQL

1. [Render Dashboard](https://dashboard.render.com) → **New** → **PostgreSQL**
2. Name it (e.g. `billing-db`), region near your users, create DB
3. Open the database → **Connections** → copy:
   - **Internal Database URL** (for the API service on Render)
   - Convert to JDBC, e.g.  
     `postgres://user:pass@dpg-xxxx-a/dbname`  
     → `jdbc:postgresql://dpg-xxxx-a/dbname` (drop credentials from URL; set user/password separately)

---

## 3. Render — Spring Boot Web Service

### Option A — Docker (recommended)

1. **New** → **Web Service** → connect repo
2. **Root Directory:** `billing-saas/Billing-Retail-System`
3. **Environment:** Docker
4. **Instance type:** Free or paid (free tier sleeps; cold starts ~30s)
5. **Health Check Path:** `/api/v1.0/login` is POST-only — use `/uploads/` (404 is ok) or add a simple health endpoint later. Render default `/` may return 401/404; set **Health Check** to disabled or `/` if you add actuator.

6. **Environment variables** (minimum):

| Key | Value |
|-----|--------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://HOST:5432/dbname` |
| `SPRING_DATASOURCE_USERNAME` | from Render Postgres |
| `SPRING_DATASOURCE_PASSWORD` | from Render Postgres |
| `JWT_SECRET_KEY` | long random string (≥ 32 chars) |
| `JWT_EXPIRATION` | `86400000` |
| `APP_CORS_ALLOWED_ORIGINS` | `https://YOUR-VERCEL-APP.vercel.app` |
| `APP_PUBLIC_BASE_URL` | `https://YOUR-API.onrender.com` (no trailing slash) |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `update` (first deploy); consider `validate` later |

Render injects **`PORT`** — the app uses `server.port=${PORT:8080}`.

### Option B — Native Java

- **Build command:** `./mvnw -DskipTests clean package`
- **Start command:** `java -jar target/Billingsoftware-0.0.1-SNAPSHOT.jar`
- Same env vars as above.

### Uploads on Render

Logo/banner files go to local disk `uploads/`. On Render this is **ephemeral** (lost on redeploy) unless you attach a **Persistent Disk** and point `uploads` there (custom config) or move to S3.

---

## 4. Vercel — React frontend

1. [Vercel](https://vercel.com) → **Add New Project** → import repo
2. **Root Directory:** `billing-saas/Billing-Retail-System/client`
3. **Framework Preset:** Vite
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Environment variable** (Production + Preview):

| Name | Value |
|------|--------|
| `VITE_API_ORIGIN` | `https://YOUR-API.onrender.com` (no `/api/v1.0`, no trailing slash) |

7. Deploy. `client/vercel.json` rewrites all routes to `index.html` for React Router.

---

## 5. Wire CORS and test

1. After first Vercel deploy, copy the exact origin (e.g. `https://billing-xxx.vercel.app`)
2. Set `APP_CORS_ALLOWED_ORIGINS` on Render to that URL (comma-separated if you also use `http://localhost:5173` locally)
3. Redeploy API if needed
4. Open Vercel site → login → create client/invoice
5. If login fails: browser DevTools → **Network** → check blocked CORS or wrong `VITE_API_ORIGIN`

---

## 6. Local dev vs production

| | Local | Production |
|---|--------|------------|
| Frontend | `npm run dev` → :5173 | Vercel |
| API | :8080 | Render |
| `VITE_API_ORIGIN` | unset (defaults localhost) | Render URL |
| CORS | `http://localhost:5173` | Vercel URL |

Optional: `client/.env.local`:

```env
VITE_API_ORIGIN=http://localhost:8080
```

---

## 7. Custom domain (optional)

- **Vercel:** add domain → update `APP_CORS_ALLOWED_ORIGINS` on Render
- **Render:** add custom domain on API → update `VITE_API_ORIGIN` and `APP_PUBLIC_BASE_URL` on Render/Vercel

---

## 8. Security checklist

- Generate a new `JWT_SECRET_KEY` for production
- Do not commit `application.properties` with real DB passwords (repo may gitignore it)
- Use Render **secret** env vars for password and JWT
- Enable HTTPS only (Vercel + Render default)

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| CORS error | `APP_CORS_ALLOWED_ORIGINS` must match browser URL exactly (scheme + host, no path) |
| API calls go to localhost | Redeploy Vercel after setting `VITE_API_ORIGIN` |
| 502 on Render | Check logs; DB URL wrong or app crash on startup (JWT secret &lt; 32 chars) |
| Broken logo URLs | Set `APP_PUBLIC_BASE_URL` to public API URL |
| Free tier slow first load | Render free service spins down |