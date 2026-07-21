# ── Stage 1: Build ──────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# 1. Install ALL dependencies (including devDependencies for tsc, prisma CLI)
COPY package*.json ./
RUN npm install

# 2. Copy source code
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src
COPY app.ts index.ts tsconfig.json ./

# 3. Generate Prisma client
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate

# 4. Build TypeScript → dist/
RUN npm run build

# ── Stage 2: Production ────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /usr/src/app

# 5. Copy only package files and install production deps only
COPY package*.json ./
RUN npm install --omit=dev && \
    npm cache clean --force && \
    rm -rf /tmp/*

# 6. Copy the compiled JS output
COPY --from=builder /usr/src/app/dist ./dist

# 7. Copy Prisma schema + migrations (needed for migrate deploy at runtime)
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/prisma.config.ts ./

# 8. Copy the generated Prisma client (runtime files only)
COPY --from=builder /usr/src/app/src/generated ./dist/src/generated

EXPOSE 3002

# 9. Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]