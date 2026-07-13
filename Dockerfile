FROM node:22-alpine

WORKDIR /usr/src/app

# 1. Install dependencies (cached unless package.json changes)
COPY package*.json ./
RUN npm install

# 2. Copy ALL source code (shielded by .dockerignore)
COPY / .

# 3. Generate Prisma client AFTER source is copied
#    so COPY can't overwrite the generated output
#    ARG provides DATABASE_URL only during build (prisma generate just reads the schema, no DB connection)
#    The real URL is injected at runtime by docker-compose environment
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate

# 4. Build TypeScript
RUN npm run build

EXPOSE 3002

# 5. Start
CMD ["sh","-c","npx prisma migrate deploy && npm start"]