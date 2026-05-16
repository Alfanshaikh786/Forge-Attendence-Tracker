# MongoDB Setup for ForgeTrack

Use this when you want to run ForgeTrack with MongoDB Atlas instead of Supabase.

## Required environment variables

Copy `backend/.env.example` to `backend/.env` and fill in:

- `MONGODB_URI` - your Atlas connection string
- `MONGODB_DB` - database name, for example `forgetrack`
- `JWT_SECRET` - long random secret for auth tokens
- `CLIENT_ORIGIN` - frontend URL, usually `http://localhost:5173`

## Atlas Network Access

Before running the seed script or starting the backend against Atlas, add the current public IP to Atlas Network Access.

- Current workspace IP: `152.57.63.6`
- In Atlas: Security > Network Access > Add IP Address
- If your IP changes later, repeat this step or temporarily allow access from your current location

## Seed data

The backend seed script now creates placeholder data so you can connect the app before you have real records.

Run:

```bash
cd backend
npm install
npm run seed
```

This seeds:

- 1 mentor account
- 1 sample student login
- 5 students
- 3 sessions
- sample attendance rows
- 1 material record

## Connection check

Start the backend and open:

- `GET /api/health`
- `GET /api/db-status`

If the database is connected, `/api/db-status` will return collection counts.
