# Dockerfile для Frontend (React + Vite)
# Multi-stage build для оптимізації розміру image

# ============================================================
# STAGE 1: Build - Збірка React додатку
# ============================================================
FROM node:20-alpine AS builder

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо package files
COPY package*.json ./

# Встановлюємо залежності
RUN npm ci --only=production && \
    npm cache clean --force

# Копіюємо вихідний код
COPY . .

# Збираємо додаток
RUN npm run build

# ============================================================
# STAGE 2: Production - Запуск через Nginx
# ============================================================
FROM nginx:alpine AS production

# Встановлюємо додаткові інструменти для healthcheck
RUN apk add --no-cache curl

# Копіюємо зібраний додаток з builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Копіюємо конфігурацію Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Відкриваємо порт
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Запускаємо Nginx
CMD ["nginx", "-g", "daemon off;"]

# ============================================================
# STAGE 3: Development - Для розробки з hot reload
# ============================================================
FROM node:20-alpine AS development

WORKDIR /app

# Копіюємо package files
COPY package*.json ./

# Встановлюємо всі залежності (включно з dev)
RUN npm install

# Копіюємо весь код
COPY . .

# Відкриваємо порт Vite
EXPOSE 5173

# Запускаємо dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
