FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci --only=production && \
    npm cache clean --force

COPY src ./src

RUN npm run build

FROM node:20-alpine AS production

RUN apk add --no-cache \
    wget \
    curl \
    tini

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && \
    npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/uploads /app/logs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "dist/server.js"]

FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

COPY . .

RUN mkdir -p /app/uploads /app/logs

EXPOSE 5000

CMD ["npm", "run", "dev"]
