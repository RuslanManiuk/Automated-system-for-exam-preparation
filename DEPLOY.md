# ExamNinja - Deployment на Render (2 сервера)

## 🚀 Backend Server

### Крок 1: Створити Web Service

1. render.com → New + → Web Service
2. Підключити репо: `Automated-system-for-exam-preparation`
3. Гілка: `deploy-clean`

### Налаштування:

```
Name: examninja-backend
Region: Frankfurt (EU Central)
Root Directory: server
Build Command: npm install && npm run build
Start Command: npm start
Instance Type: Free
```

### Environment Variables:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://a7654837383_db_user:4CvH5UZDbYJwYHLg@cluster0.2ft8rbf.mongodb.net/examninja?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars_for_security_12345
JWT_EXPIRE=7d
SESSION_SECRET=your_session_secret_key_for_passport_sessions_change_in_production
FRONTEND_URL=https://examninja-frontend.onrender.com
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=https://examninja.onrender.com/api/auth/google/callback
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

⚠️ **ВАЖЛИВО:** Згенеруй нові `JWT_SECRET` та `SESSION_SECRET` для продакшену!

**Згенерувати секрети:**

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**URL:** https://examninja.onrender.com (або твій власний URL з Render)

---

## 🌐 Frontend Server (Static Site)

### Крок 2: Створити Static Site

1. render.com → New + → Static Site
2. Підключити той самий репо
3. Гілка: `deploy-clean`

### Налаштування:

```
Name: examninja-frontend
Root Directory: ./
Build Command: npm install && npm run build
Publish Directory: dist
```

### Environment Variables:

```env
VITE_API_URL=https://examninja.onrender.com/api
```

⚠️ Замість `examninja.onrender.com` використай свій URL з Render backend!

**URL:** https://examninja-frontend.onrender.com

---

## ✅ Після деплою

1. **Оновити Backend FRONTEND_URL:**

   - `FRONTEND_URL=https://examninja-frontend.onrender.com`

2. **Google Console:**

   - Origins: `https://examninja-frontend.onrender.com`
   - Redirect: `https://examninja.onrender.com/api/auth/google/callback` ⚠️ (використовуй правильний URL!)

3. **Перевірити логи:**
   - Відкрий консоль браузера (F12) → Console
   - Шукай:
     - `🔧 API Client configured` - показує який API_URL використовується
     - `🌐 API Request` - всі запити до backend
     - `📡 API Response` - відповіді від backend
     - `❌ API Error` - помилки API
   - Backend логи на Render → Logs:
     - `📨 Received request` - вхідні запити
     - `🤖 Calling Groq` - виклики AI
     - `✅ Groq API response successful` - успішні відповіді
     - `❌ Groq API error` - помилки AI

---

**Час:** 20 хвилин  
**Вартість:** $0 (обидва Free tier)
