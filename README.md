# Guard Tracking Mini System

Stack:
- Frontend: React (Vite) + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB (Mongoose)

## Features
- Professional backend folder structure (`controllers`, `db`, `middleware`, `models`, `routes`)
- JWT auth with optional signup, login required before dashboard
- Role-based access (`user` and `admin`) with separate route hosts
- Guard check-in/check-out with timestamp and location
- Admin dashboard + attendance logs

## Project Structure
- `frontend/src/pages` - page-level screens
- `frontend/src/layouts` - layout wrappers
- `frontend/src/routes` - route protection and routing
- `frontend/src/context` - auth state and token storage
- `frontend/src/services` - API layer
- `backend/src/controllers` - business logic
- `backend/src/db` - DB bootstrap
- `backend/src/middleware` - auth + role checks
- `backend/src/models` - mongoose models
- `backend/src/routes` - auth/user/admin routes

## Backend Setup
1. Go to `backend`
2. Copy `.env.example` to `.env`
3. Update `MONGO_URI` and `JWT_SECRET`
4. Install and run:
   - `npm install`
   - `npm run dev`

Backend runs on `http://localhost:5000`.

## Frontend Setup
1. Go to `frontend`
2. Install and run:
   - `npm install`
   - User host: `npm run dev:user`
   - Admin host: `npm run dev:admin`

Frontend hosts:
- User host: `http://localhost:5173`
- Admin host: `http://localhost:5174`

Both hosts proxy API to backend.
