# Docker інструкції для ExamNinja

## Огляд

ExamNinja використовує Docker та Docker Compose для контейнеризації всіх компонентів системи:

- **MongoDB 8.0** - База даних
- **Mongo Express** - Веб-інтерфейс для MongoDB (опціонально)
- **Backend** - Node.js + Express + TypeScript API
- **Frontend** - React + Vite SPA

## Передумови

Переконайтеся, що у вас встановлено:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) версія 20.10 або новіша
- [Docker Compose](https://docs.docker.com/compose/install/) версія 2.0 або новіша

Перевірити версії:

```powershell
docker --version
docker-compose --version
```

## Швидкий старт

### 1. Підготовка середовища

Створіть `.env` файл з прикладу:

```powershell
Copy-Item .env.example .env
```

Відредагуйте `.env` файл та додайте свої API ключі:

```env
GEMINI_API_KEY=your_actual_gemini_key
GROK_API_KEY=your_actual_grok_key
OPENROUTER_API_KEY=your_actual_openrouter_key
```

### 2. Запуск production режиму

```powershell
# Збірка та запуск всіх сервісів
docker-compose up -d

# Переглянути логи
docker-compose logs -f

# Перевірити статус
docker-compose ps
```

Додаток буде доступний за адресою:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Mongo Express**: http://localhost:8081 (login: admin, password: admin123)

### 3. Запуск development режиму (з hot reload)

```powershell
# Запуск dev режиму
docker-compose -f docker-compose.dev.yml up -d

# Переглянути логи всіх сервісів
docker-compose -f docker-compose.dev.yml logs -f

# Переглянути логи конкретного сервісу
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml logs -f backend
```

У dev режимі зміни в коді автоматично застосовуються завдяки volume mounts.

## Детальні команди

### Управління контейнерами

```powershell
# Запуск сервісів
docker-compose up -d

# Зупинка сервісів
docker-compose down

# Зупинка та видалення volumes (ВИДАЛИТЬ ВСІ ДАНІ!)
docker-compose down -v

# Перезапуск конкретного сервісу
docker-compose restart backend

# Перезбірка конкретного сервісу
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Перегляд логів

```powershell
# Всі сервіси
docker-compose logs -f

# Тільки backend
docker-compose logs -f backend

# Останні 100 рядків
docker-compose logs --tail=100 backend

# З timestamps
docker-compose logs -f -t backend
```

### Виконання команд в контейнерах

```powershell
# Відкрити shell в backend контейнері
docker-compose exec backend sh

# Виконати npm команду
docker-compose exec backend npm install new-package

# Виконати mongo команди
docker-compose exec mongodb mongosh -u admin -p examninja_secure_password_2025

# Переглянути файли в контейнері
docker-compose exec backend ls -la /app
```

### Моніторинг та діагностика

```powershell
# Статус всіх контейнерів
docker-compose ps

# Використання ресурсів
docker stats

# Інспекція контейнера
docker inspect examninja-backend

# Перевірка здоров'я сервісів
docker-compose exec backend wget -O- http://localhost:5000/api/health
```

### Робота з базою даних

```powershell
# Підключення до MongoDB shell
docker-compose exec mongodb mongosh -u admin -p examninja_secure_password_2025 examninja

# Експорт бази даних
docker-compose exec -T mongodb mongodump -u admin -p examninja_secure_password_2025 --authenticationDatabase admin --db examninja --archive > backup.archive

# Імпорт бази даних
docker-compose exec -T mongodb mongorestore -u admin -p examninja_secure_password_2025 --authenticationDatabase admin --archive < backup.archive

# Доступ через Mongo Express
# Відкрийте браузер: http://localhost:8081
```

## Структура Docker

### Volumes (Персистентні дані)

```yaml
examninja_mongodb_data      # База даних MongoDB
examninja_mongodb_config    # Конфігурація MongoDB
examninja_uploads           # Завантажені файли користувачів
examninja_backend_logs      # Логи backend сервера
```

Переглянути volumes:

```powershell
docker volume ls
docker volume inspect examninja_mongodb_data
```

### Networks

```yaml
examninja_network # Ізольована мережа для всіх сервісів
```

Переглянути networks:

```powershell
docker network ls
docker network inspect examninja_network
```

## Оптимізація та налаштування

### Multi-stage builds

Обидва Dockerfile використовують multi-stage builds для оптимізації:

1. **Builder stage** - компіляція TypeScript та збірка
2. **Production stage** - мінімальний runtime image
3. **Development stage** - з усіма dev залежностями та hot reload

### Healthchecks

Всі сервіси мають healthcheck:

```yaml
backend: /api/health endpoint
frontend: HTTP 200 на порт 5173
mongodb: mongosh ping command
```

Перевірити здоров'я:

```powershell
docker-compose ps
```

## Production deployment

### 1. Підготовка .env для production

```env
NODE_ENV=production
JWT_SECRET=generate_strong_random_secret_here
SESSION_SECRET=generate_another_strong_secret_here
MONGODB_URI=mongodb://admin:strong_password@mongodb:27017/examninja?authSource=admin
```

Використайте генератор випадкових рядків:

```powershell
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### 2. Налаштування Nginx reverse proxy (опціонально)

Для production рекомендується використовувати Nginx як reverse proxy:

```nginx
server {
    listen 80;
    server_name examninja.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. SSL/TLS з Let's Encrypt

```powershell
# Встановити Certbot
# Отримати сертифікат
certbot --nginx -d examninja.com
```

### 4. Backup стратегія

Створіть cron job для регулярних backup:

```powershell
# Backup script (backup.ps1)
$date = Get-Date -Format "yyyy-MM-dd_HH-mm"
docker-compose exec -T mongodb mongodump -u admin -p password --authenticationDatabase admin --db examninja --archive > "backup_$date.archive"

# Видалити старі backup (більше 7 днів)
Get-ChildItem -Path . -Filter "backup_*.archive" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } |
    Remove-Item
```

## Troubleshooting

### Контейнер не запускається

```powershell
# Переглянути логи
docker-compose logs backend

# Перевірити конфігурацію
docker-compose config

# Видалити та перестворити
docker-compose down
docker-compose up -d --force-recreate
```

### Проблеми з підключенням до MongoDB

```powershell
# Перевірити статус MongoDB
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Переглянути логи MongoDB
docker-compose logs mongodb

# Перезапустити MongoDB
docker-compose restart mongodb
```

### Порти вже зайняті

```powershell
# Знайти процес на порті
netstat -ano | findstr :5000

# Змінити порти в docker-compose.yml
ports:
  - "5001:5000"  # Замість 5000:5000
```

### Очистка Docker системи

```powershell
# Видалити всі невикористовувані ресурси
docker system prune -a

# Видалити volumes
docker volume prune

# Видалити все (ОБЕРЕЖНО!)
docker system prune -a --volumes
```

## Моніторинг та метрики

### Використання ресурсів

```powershell
# Реальний час
docker stats

# Одноразово
docker stats --no-stream
```

### Логування

Логи зберігаються в:

- Docker volumes: `/var/lib/docker/volumes/examninja_backend_logs/_data`
- Контейнер: `/app/logs`

Доступ до логів:

```powershell
# Через Docker
docker-compose logs -f backend

# Безпосередньо з volume
docker run --rm -v examninja_backend_logs:/logs alpine cat /logs/app.log
```

## Додаткові ресурси

- [Docker документація](https://docs.docker.com/)
- [Docker Compose документація](https://docs.docker.com/compose/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## Підтримка

Якщо виникли проблеми:

1. Перевірте логи: `docker-compose logs -f`
2. Перевірте healthcheck: `docker-compose ps`
3. Перезапустіть сервіси: `docker-compose restart`
4. Перебудуйте з нуля: `docker-compose down && docker-compose up -d --build`

---

**Дата оновлення:** 27 грудня 2025  
**Версія:** 1.0
