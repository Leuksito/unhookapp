# --- Stage 1: build del cliente (Vite) ---
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install
COPY client/ ./
RUN npm run build

# --- Stage 2: dependencias del servidor ---
FROM node:20-alpine AS server-deps
WORKDIR /app/server
# better-sqlite3 necesita compilar
RUN apk add --no-cache python3 make g++ libc6-compat
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev

# --- Stage 3: runtime ---
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV CLIENT_BUILD_DIR=/app/client/dist

# Copiar dependencias del servidor
COPY --from=server-deps /app/server/node_modules ./server/node_modules
# Copiar código del servidor
COPY server/ ./server/
# Copiar build del cliente
COPY --from=client-build /app/client/dist ./client/dist

# Volumen para la base SQLite persistente
RUN mkdir -p /app/server/data
VOLUME ["/app/server/data"]

EXPOSE 3001

WORKDIR /app/server
CMD ["node", "index.js"]