# Finsathi
## Backend
cd backend && cp .env.example .env   # fill JWT_SECRET and GEMINI_API_KEY
npm install && npm run dev            # http://localhost:5000
## Frontend
cd frontend && npm install && npm run dev   # http://localhost:5173 (proxies /api to :5000)
## Deploy
Frontend: Vercel/Netlify (build: npm run build, output: dist; set /api rewrite to backend URL).
Backend: Render/Railway with the .env values. Replace db.js with a real database for production.
