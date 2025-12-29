# ExamNinja 🎯

> Розумна платформа для підготовки до іспитів з AI-підтримкою

ExamNinja - це інноваційна система для автоматизованої підготовки до іспитів, яка використовує штучний інтелект для аналізу навчальних матеріалів та створення персоналізованих інструментів навчання.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green.svg)](https://www.mongodb.com/)

## ✨ Основні можливості

### 📚 Розумний аналіз матеріалів

- **Завантаження документів**: Підтримка PDF, DOCX, PPTX, TXT форматів
- **AI-обробка**: Автоматична генерація конспектів та ключових концепцій
- **Мультимовність**: Розпізнавання та обробка різних мов

### 🃏 Інтерактивні флеш-картки

- Автоматична генерація карток з різними рівнями складності
- Режими навчання: всі картки, тільки складні, випадковий порядок
- Система оцінювання складності (легко/середньо/важко)
- Статистика прогресу по кожній сесії

### 📝 Розумні тести

- Різні типи питань: множинний вибір, так/ні, заповнення пропусків
- Адаптивне тестування з урахуванням попередніх відповідей
- AI-пояснення до правильних та неправильних відповідей
- Детальна статистика з графіками прогресу

### 💬 AI-асистент

- Інтелектуальний чат з контекстом ваших матеріалів
- Режим "Репетитор" із сократичним методом навчання
- Пояснення складних концепцій простими словами
- Генерація прикладів на запит

### 🗺️ Ментальні карти

- Автоматична візуалізація структури матеріалу
- Інтерактивна навігація по концепціях
- Виявлення зв'язків між темами
- Експорт у зображення

### 📖 Глосарій

- Автоматичне виявлення ключових термінів
- Генерація визначень простою мовою
- Приклади використання термінів
- Зв'язки між термінами

### 📊 Система прогресу

- Відстеження XP та рівнів
- Система досягнень та нагород
- Streak-календар активності
- Leaderboard користувачів

## 🛠️ Технологічний стек

### Frontend

- **React 19.2** - UI фреймворк
- **TypeScript 5.8** - типізація
- **Vite 6.2** - збірка та dev-сервер
- **Tailwind CSS** - стилізація
- **Lucide React** - іконки

### Backend

- **Node.js + Express** - сервер
- **TypeScript** - типізація
- **MongoDB + Mongoose** - база даних
- **JWT** - аутентифікація
- **Helmet** - безпека

### AI Сервіси

- **Google Gemini API** - обробка тексту, генерація контенту
- **Grok API** - додаткова AI-підтримка
- **OpenRouter** - доступ до різних AI моделей

### Обробка документів

- **pdf.js** - робота з PDF
- **Mammoth** - конвертація DOCX
- **JSZip** - робота з архівами

## 📁 Структура проекту

```
├── components/              # React компоненти
│   ├── AuthModal.tsx       # Авторизація/реєстрація
│   ├── Chat.tsx            # AI-чат
│   ├── FileUpload.tsx      # Завантаження файлів
│   ├── Flashcards.tsx      # Флеш-картки
│   ├── Glossary.tsx        # Глосарій
│   ├── Header.tsx          # Шапка сайту
│   ├── MindMap.tsx         # Ментальні карти
│   └── Quiz.tsx            # Тести
├── server/                 # Backend сервер
│   ├── src/
│   │   ├── config/         # Конфігурація (БД)
│   │   ├── middleware/     # Middleware (auth, etc.)
│   │   ├── models/         # Mongoose моделі
│   │   ├── routes/         # API роути
│   │   └── utils/          # Утиліти
│   └── package.json
├── services/               # Frontend сервіси
│   ├── apiClient.ts        # HTTP клієнт
│   ├── geminiService.ts    # Google Gemini API
│   └── grokService.ts      # Grok API
├── App.tsx                 # Головний компонент
├── index.tsx              # Entry point
├── types.ts               # TypeScript типи
└── package.json

```

## 🚀 Швидкий старт

### Передумови

Переконайтеся, що у вас встановлено:

- **Node.js** версії 20 або вище
- **npm** або **yarn**
- **MongoDB** (локально або MongoDB Atlas)
- **Git**

### 1. Клонування репозиторію

```bash
git clone https://github.com/De-Light-n/Automated-system-for-exam-preparation.git
cd Automated-system-for-exam-preparation
```

### 2. Налаштування змінних оточення

Створіть файл `.env` в кореневій директорії:

```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Grok API (опціонально)
GROK_API_KEY=your_grok_api_key_here

# OpenRouter API (опціонально)
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

Створіть файл `server/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/examninja
# Або для MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/examninja

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GROK_API_KEY=your_grok_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 3. Встановлення залежностей

#### Frontend

```bash
npm install
```

#### Backend

```bash
cd server
npm install
cd ..
```

### 4. Запуск проекту

#### Опція А: Запуск всього одночасно (рекомендовано)

```bash
npm run dev:all
```

Це запустить:

- Frontend на `http://localhost:3000`
- Backend на `http://localhost:5000`

#### Опція Б: Окремий запуск

**Frontend:**

```bash
npm run dev
```

**Backend (в окремому терміналі):**

```bash
cd server
npm run dev
```

### 5. Відкрийте браузер

Перейдіть на `http://localhost:3000`

## 📦 Доступні команди

### Frontend

```bash
npm run dev          # Запуск dev-сервера
npm run dev:all      # Запуск frontend + backend одночасно
npm run build        # Production збірка
npm run preview      # Перегляд production збірки
```

### Backend

```bash
npm run dev          # Запуск сервера з hot-reload (tsx watch)
npm run build        # Компіляція TypeScript -> JavaScript
npm run start        # Запуск скомпільованого сервера
```

## 🗄️ База даних

### MongoDB локально

1. Встановіть MongoDB Community Server
2. Запустіть MongoDB:
   ```bash
   mongod
   ```
3. База даних `examninja` створюватиметься автоматично

### MongoDB Atlas (Cloud)

1. Створіть безкоштовний акаунт на [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Створіть кластер
3. Отримайте connection string
4. Додайте його в `server/.env` як `MONGODB_URI`

## 🔑 Отримання API ключів

### Google Gemini API

1. Перейдіть на [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Увійдіть з Google акаунтом
3. Створіть новий API ключ
4. Скопіюйте та додайте в `.env`

### Grok API (xAI)

1. Зареєструйтесь на [x.ai](https://x.ai)
2. Отримайте API ключ
3. Додайте в `.env`

### OpenRouter (опціонально)

1. Зареєструйтесь на [OpenRouter](https://openrouter.ai/)
2. Створіть API ключ
3. Додайте в `.env`

## 🎨 Особливості розробки

### Архітектура

- **Монорепозиторій**: Frontend та Backend в одному проекті
- **RESTful API**: Чітка структура endpoints
- **JWT Authentication**: Безпечна авторизація
- **TypeScript**: Повна типізація коду

### API Endpoints

```
POST   /api/auth/register        # Реєстрація
POST   /api/auth/login           # Вхід
GET    /api/auth/profile         # Профіль користувача

GET    /api/materials            # Список матеріалів
POST   /api/materials            # Додати матеріал
GET    /api/materials/:id        # Отримати матеріал
DELETE /api/materials/:id        # Видалити матеріал

POST   /api/chat/message         # Відправити повідомлення
GET    /api/chat/history         # Історія чату

POST   /api/quiz/generate        # Згенерувати тест
POST   /api/quiz/submit          # Відправити результати
GET    /api/quiz/results         # Історія результатів

GET    /api/health               # Перевірка статусу сервера
```

## 🧪 Тестування

```bash
# Frontend тести (в розробці)
npm test

# Backend тести (в розробці)
cd server
npm test
```

## 📚 Документація

- [Development Workflow](DEVELOPMENT_WORKFLOW.md) - Процес розробки
- [Quick Start Guide](QUICKSTART.md) - Швидкий початок
- [Project Tickets](PROJECT_TICKETS.md) - План розробки
- [Git Profiles](GIT_PROFILES.md) - Налаштування Git

## 🤝 Внесок у проект

Ми раді будь-якому внеску! Будь ласка, дотримуйтесь наступних кроків:

1. Fork проекту
2. Створіть feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit змін (`git commit -m 'feat: add some amazing feature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Відкрийте Pull Request

### Commit Convention

Використовуємо [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - нова функціональність
- `fix:` - виправлення багів
- `docs:` - зміни в документації
- `style:` - форматування коду
- `refactor:` - рефакторинг
- `test:` - додавання тестів
- `chore:` - оновлення залежностей, конфігурації

