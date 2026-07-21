# Containerizing Your React App (Vite + Nginx)

## The Key Difference from Your Backend

Your backend container runs **Node.js at runtime** — it's a live server executing JavaScript.

Your React app is different. When you run `npm run build`, Vite compiles everything into **static files** (HTML, CSS, JS bundles) inside a `dist/` folder. These files don't need Node.js to run. They just need a web server to serve them to browsers.

So the approach is:

```
Stage 1 (builder):  Node → install deps → npm run build → produces dist/
Stage 2 (production): Nginx → copy dist/ → serve static files
```

You don't even need Node.js in the final image. Just **Nginx** (a tiny, fast web server) serving your built files. This makes the final image ~25MB.

---

## Step-by-Step

### 1. Create `web/Dockerfile`

```dockerfile
# ── Stage 1: Build ──────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (cached layer)
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build
# After this, dist/ contains your static files (index.html, assets/, etc.)

# ── Stage 2: Serve with Nginx ──────────────────────
FROM nginx:alpine AS production

# Copy the built static files to Nginx's default serve directory
COPY --from=builder /app/dist /usr/share/nginx/html

# (Optional) Copy custom Nginx config — explained below
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**What's happening:**

| Stage | What it does | What's in the image |
|---|---|---|
| **builder** | Installs deps, runs `tsc -b && vite build` | Everything (~500MB) |
| **production** | Just Nginx + your `dist/` folder | ~25MB total |

The `nginx:alpine` base image is only ~7MB. Your built React files are a few MB. That's it.

---

### 2. Create `web/.dockerignore`

```
node_modules
dist
.git
*.md
```

Same idea as your backend — don't send `node_modules` into the build context. They'll be installed fresh inside the container.

---

### 3. The Nginx SPA Problem

When you use React Router (which you do), URLs like `/login` or `/me` are handled client-side. But if someone refreshes the page at `/login`, Nginx tries to find a file called `/login` on disk — which doesn't exist — and returns **404**.

To fix this, create `web/nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # For any route that doesn't match a real file, serve index.html
    # This lets React Router handle the routing client-side
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Then uncomment the `COPY nginx.conf` line in your Dockerfile:

```dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

> [!IMPORTANT]
> Without this config, refreshing on any route other than `/` will give a 404. This is the #1 gotcha when containerizing SPAs.

---

### 4. Add to `docker-compose.yml`

Add a new service alongside your existing `postgres_db` and `api_service`:

```yaml
  web_app:
    build:
      context: ./web
    container_name: auth_web_frontend
    ports:
      - "5173:80"      # Maps your usual localhost:5173 → Nginx port 80 inside container
    depends_on:
      - api_service
```

> [!NOTE]
> `context: ./web` tells Docker to use the `web/` folder as the build context, so it looks for `web/Dockerfile` automatically.

---

### 5. The Environment Variable Challenge

This is the tricky part. In your [Home.tsx](file:///c:/Users/Ali%20Rizvi/type_Script_Projects/banking_app_proj/web/src/pages/Home.tsx) and [Login.tsx](file:///c:/Users/Ali%20Rizvi/type_Script_Projects/banking_app_proj/web/src/pages/Login.tsx), you have:

```ts
const baseUrl: string = "http://localhost:3002/api";
```

This is **hardcoded**. In Vite, you'd normally use `import.meta.env.VITE_API_URL`, but here's the catch:

**Vite inlines environment variables at build time**, not at runtime. So you can't pass them via `docker-compose.yml` `environment:` like you do with the backend. By the time the container runs, the JS is already compiled with the values baked in.

You have three options (pick one):

#### Option A: Build-time ARG (simplest)

```dockerfile
# In your web/Dockerfile, builder stage:
ARG VITE_API_URL=http://localhost:3002/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build
```

```yaml
# In docker-compose.yml:
web_app:
  build:
    context: ./web
    args:
      VITE_API_URL: http://localhost:3002/api
```

And in your React code, replace the hardcoded URL:
```ts
const baseUrl = import.meta.env.VITE_API_URL;
```

> Downside: Changing the URL requires a rebuild.

#### Option B: Nginx reverse proxy (cleanest)

Instead of calling `http://localhost:3002/api` from the browser, call `/api` (relative path). Then configure Nginx to proxy `/api` requests to the backend:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to the backend container
    location /api/ {
        proxy_pass http://api_service:3002;
    }
}
```

And in your React code:
```ts
const baseUrl = "/api";  // no more hardcoded localhost!
```

> [!TIP]
> This is the **best approach** because:
> - No CORS needed anymore (same origin!)
> - No hardcoded URLs
> - No environment variable gymnastics
> - Works in any deployment environment without rebuilding

---

## Final Structure

```
banking_app_proj/
├── Dockerfile              ← backend (already done)
├── docker-compose.yml      ← orchestrates everything
├── .dockerignore            ← backend exclusions
├── web/
│   ├── Dockerfile          ← frontend (you'll create)
│   ├── .dockerignore       ← frontend exclusions
│   ├── nginx.conf          ← SPA routing + optional API proxy
│   ├── package.json
│   └── src/
```

---

## Build & Test

```bash
# Build and start everything
docker compose up --build -d

# Check image sizes
docker images

# You should see:
# - banking_app_proj-api_service    ~200MB  (your backend)
# - banking_app_proj-web_app        ~25MB   (your frontend!)
# - postgres:16-alpine              ~240MB  (database)
```

---

## Quick Summary

| Concept | Backend (Node) | Frontend (React) |
|---|---|---|
| Runtime | Node.js executes JS | Nginx serves static files |
| Final base image | `node:22-alpine` (~180MB) | `nginx:alpine` (~7MB) |
| What's copied to production | `dist/` + `node_modules` (prod) | `dist/` only (no node_modules!) |
| Final size | ~200MB | ~25MB |
| Env vars | Runtime (from docker-compose) | Build-time (baked into JS) |
