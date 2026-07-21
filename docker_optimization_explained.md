# Docker Image Optimization: From ~750MB to ~200MB

## The Problem

Your original [Dockerfile](file:///c:/Users/Ali%20Rizvi/type_Script_Projects/banking_app_proj/Dockerfile) was a **single-stage build**. It looked like this:

```dockerfile
FROM node:22-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install            # ← installs EVERYTHING (dev + prod)
COPY / .                   # ← copies ALL source files
RUN npx prisma generate
RUN npm run build          # ← compiles TS → JS in dist/
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

Even though `node:22-alpine` is a small base (~180MB), the final image was ~750MB because it contained **everything used during the build**, all baked into one layer:

| What's in the image | Needed at runtime? | Approx Size |
|---|---|---|
| `node:22-alpine` base | ✅ Yes | ~180MB |
| Production `node_modules` (express, cors, pg, etc.) | ✅ Yes | ~40MB |
| Dev `node_modules` (typescript, @types/*, tsx, ts-node-dev, etc.) | ❌ No | ~150MB |
| Prisma CLI + engine binaries | ❌ Mostly no | ~100MB |
| All `.ts` source files | ❌ No (already compiled to JS) | ~small |
| Source maps, declaration files | ❌ No | ~small |
| Compiled `dist/` folder | ✅ Yes | ~small |
| Generated Prisma client | ✅ Yes | ~small |

**The key insight**: At runtime, `node dist/index.js` only needs the compiled JS files, production `node_modules`, and the Prisma client. Everything else is build-time waste.

---

## The Solution: Multi-Stage Build

A multi-stage Dockerfile uses multiple `FROM` statements. Each `FROM` starts a **completely fresh image**. You build in one stage, then selectively copy only what you need into the final stage.

Think of it like cooking: Stage 1 is your messy kitchen with all the tools and ingredients. Stage 2 is the clean plate you serve to the customer — it only has the finished dish.

---

## Stage 1: The Builder (Lines 1–21)

```dockerfile
# ── Stage 1: Build ──────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /usr/src/app
```

> [!NOTE]
> `AS builder` gives this stage a name so we can reference it later with `COPY --from=builder`.

### Step 1 — Install ALL dependencies

```dockerfile
COPY package*.json ./
RUN npm install
```

We copy `package.json` and `package-lock.json` first, then run `npm install`. This installs **everything** — both `dependencies` and `devDependencies` — because we need:
- **TypeScript** (`devDependencies`) → to compile `.ts` → `.js`
- **Prisma CLI** (`devDependencies`) → to run `prisma generate`
- **@types/*** (`devDependencies`) → for TypeScript type checking

> [!TIP]
> Docker caches this layer. As long as `package*.json` doesn't change, Docker skips the `npm install` on subsequent builds. That's why we copy these files **before** the source code.

### Step 2 — Copy only the source files we need

```dockerfile
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src
COPY app.ts index.ts tsconfig.json ./
```

Instead of the old `COPY / .` (which copies everything), we copy only what's needed for the build. This is more explicit and avoids pulling in junk. The [.dockerignore](file:///c:/Users/Ali%20Rizvi/type_Script_Projects/banking_app_proj/.dockerignore) acts as a safety net for anything we miss.

### Step 3 — Generate Prisma Client

```dockerfile
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate
```

`prisma generate` reads your [schema.prisma](file:///c:/Users/Ali%20Rizvi/type_Script_Projects/banking_app_proj/prisma/schema.prisma) and generates the Prisma client code into `src/generated/prisma/` (as configured by `output = "../src/generated/prisma"` in your schema).

The `ARG DATABASE_URL` provides a **fake** URL because `prisma generate` requires the env var to exist, but it doesn't actually connect to the database — it just reads the schema file. The real database URL is injected at runtime by Docker Compose.

### Step 4 — Compile TypeScript

```dockerfile
RUN npm run build
```

This runs `tsc`, which reads [tsconfig.json](file:///c:/Users/Ali%20Rizvi/type_Script_Projects/banking_app_proj/tsconfig.json) and compiles all `.ts` files into JavaScript in the `dist/` folder (`"outDir": "./dist"`).

**After this step, Stage 1 has done its job.** The builder image now contains:
- `dist/` → compiled JavaScript ✅
- `src/generated/prisma/` → Prisma client ✅
- `prisma/` → schema + migrations ✅
- `node_modules/` → full dependencies (dev + prod)
- All `.ts` source files

But we only need the first three items. That's where Stage 2 comes in.

---

## Stage 2: Production (Lines 23–49)

```dockerfile
# ── Stage 2: Production ────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /usr/src/app
```

> [!IMPORTANT]
> This starts from a **completely fresh** `node:22-alpine` image. Nothing from Stage 1 exists here unless we explicitly `COPY --from=builder` it. This is how we drop all the build-time bloat.

### Step 5 — Install only production dependencies

```dockerfile
COPY package*.json ./
RUN npm install --omit=dev && \
    npm cache clean --force && \
    rm -rf /tmp/*
```

`--omit=dev` tells npm to **skip all `devDependencies`**. This installs the dependencies we need for production, including `@prisma/client` and the Prisma CLI (because Prisma's dependencies pull it in). We also clear the npm cache to keep the layer small.

### Step 6 — Copy compiled JavaScript

```dockerfile
COPY --from=builder /usr/src/app/dist ./dist
```

`--from=builder` reaches back into Stage 1 and copies just the `dist/` folder. This contains all the compiled `.js` files that `node dist/index.js` actually runs.

No `.ts` source files are copied. They're not needed.

### Step 7 — Copy Prisma schema and migrations

```dockerfile
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/prisma.config.ts ./
```

The `prisma migrate deploy` command (in the CMD) needs:
- `prisma/schema.prisma` → to know the database structure
- `prisma/migrations/` → to know which SQL to run
- `prisma.config.ts` → to find the database URL from env vars

### Step 8 — Copy the generated Prisma client

```dockerfile
COPY --from=builder /usr/src/app/src/generated ./dist/src/generated
```

Your compiled code (in `dist/`) imports the Prisma client with paths like `../src/generated/prisma`. So we need to copy the generated client to the right relative path inside `dist/`.

### Step 9 — Start the app

```dockerfile
EXPOSE 3002
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
```

1. `npx prisma migrate deploy` → applies any pending database migrations
2. `node dist/index.js` → starts the Express server

---

## The .dockerignore File

```
node_modules
dist
web
.git
.env
*.md
.vscode
```

This prevents Docker from sending these files/folders into the build context (the data Docker sees when building). Benefits:

| Entry | Why excluded |
|---|---|
| `node_modules` | Installed fresh inside the container — local ones would conflict (different OS) |
| `dist` | Built fresh inside the container |
| `web` | Frontend code — not needed for the backend API image |
| `.git` | Git history is irrelevant inside a container |
| `.env` | Secrets should come from Docker Compose `environment:`, not be baked into the image |
| `*.md` | README files aren't needed at runtime |
| `.vscode` | Editor config isn't needed at runtime |

---

## Size Comparison

| | Old (single-stage) | New (multi-stage) |
|---|---|---|
| Base image | ~180MB | ~180MB |
| node_modules | ~450MB (dev + prod) | ~330MB (prod only*) |
| Source files | All `.ts` + `.js` | Only compiled `.js` |
| **Total** | **~750MB** | **~507MB** |

> **Note on size**: Why is it ~507MB and not smaller? Prisma v7+ clients pull in some very large sub-dependencies (like `effect` and `@electric-sql`), and it bundles engine binaries. This is effectively the baseline size for a Node + Prisma backend. Without the multi-stage build removing TypeScript and other dev tools, it would have stayed at ~750MB!

---

## How to Build and Run

```bash
# Rebuild the image and restart containers
docker compose up --build -d

# Check the new image size
docker images banking_app_proj-api_service

# Check container logs
docker logs -f auth_api_backend
```

> [!TIP]
> If you want to go even smaller in the future, you can look into using `node:22-alpine` with a **distroless** final stage, or using `npm prune --production` inside the builder instead of a second `npm install`. But the multi-stage approach here gives you the biggest bang for the buck.
