# Dockerfile для Backend (Node.js + Express + TypeScript)
# Multi-stage build для оптимізації

# ============================================================
# STAGE 1: Build - Компіляція TypeScript
# ============================================================
FROM node:20-alpine AS builder

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо package files
COPY package*.json ./
COPY tsconfig.json ./

# Встановлюємо залежності
RUN npm ci --only=production && \
    npm cache clean --force

# Копіюємо вихідний код
COPY src ./src

# Компілюємо TypeScript
RUN npm run build

# ============================================================
# STAGE 2: Production - Мінімальний runtime image
# ============================================================
FROM node:20-alpine AS production

# Встановлюємо додаткові інструменти
RUN apk add --no-cache \
    wget \
    curl \
    tini

# Створюємо непривілейованого користувача
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо package files
COPY package*.json ./

# Встановлюємо тільки production залежності
RUN npm ci --only=production && \
    npm cache clean --force

# Копіюємо скомпільований код з builder stage
COPY --from=builder /app/dist ./dist

# Створюємо директорії для uploads та logs
RUN mkdir -p /app/uploads /app/logs && \
    chown -R nodejs:nodejs /app

# Змінюємо на непривілейованого користувача
USER nodejs

# Відкриваємо порт
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health || exit 1

# Використовуємо tini для правильної обробки сигналів
ENTRYPOINT ["/sbin/tini", "--"]

# Запускаємо сервер
CMD ["node", "dist/server.js"]

# ============================================================
# STAGE 3: Development - Для розробки з hot reload
# ============================================================
FROM node:20-alpine AS development

WORKDIR /app

# Копіюємо package files
COPY package*.json ./
COPY tsconfig.json ./

# Встановлюємо всі залежності (включно з dev)
RUN npm install

# Копіюємо весь код
COPY . .

# Створюємо директорії
RUN mkdir -p /app/uploads /app/logs

# Відкриваємо порт
EXPOSE 5000

# Запускаємо dev server з hot reload
CMD ["npm", "run", "dev"]
