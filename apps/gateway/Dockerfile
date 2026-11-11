ARG NODE_VERSION=22

# ---------- deps (semua dependency) ----------
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---------- dev (untuk docker compose lokal) ----------
FROM deps AS dev
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start:dev"]

# ---------- build ----------
FROM deps AS build
COPY . .
RUN npm run build

# ---------- deps produksi ----------
FROM node:${NODE_VERSION}-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---------- prod ----------
FROM node:${NODE_VERSION}-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]