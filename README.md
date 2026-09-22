# Discover Architects

## Overview
Discover Architects is a web platform for architecture and interior design services. It allows users to explore design galleries, subscribe to membership plans, and for admins to manage users and their subscriptions. The site is currently a work in progress and new features are being added.

![Landing Page](https://github.com/user-attachments/assets/4a129aa3-8c93-4e00-aa3a-29d728f8a707)


## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database & Storage:** Supabase (Postgres + Storage), accessed only from the Express backend
- **Other:** Multer (for handling uploads before they're streamed to Supabase Storage)


## Features
- User authentication (custom email/password auth, backed by Supabase Postgres)
- Admin dashboard to manage users and plans
- User dashboard to view and manage subscriptions
- Gallery for design inspiration (images stored in Supabase Storage)
- Membership plans and subscription management
- Job postings and job applications (admin-managed postings, resume upload stored in Supabase Storage) — backend/API only so far, frontend pages are a follow-up

## Database Setup (Supabase)

The Express backend is the only thing that talks to the database; it uses the
Supabase **service role** key, so the frontend never connects to Supabase
directly.

1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase SQL Editor, run the migrations in
   [`supabase/migrations`](supabase/migrations) in order
   (`0001_init.sql`, then `0002_storage.sql`). This creates all tables and
   the private `gallery` and `resumes` storage buckets.
3. Copy `backend/.env.example` to `backend/.env` and fill in `SUPABASE_URL`
   and `SUPABASE_SERVICE_ROLE_KEY` from your project's API settings.
4. There is no default admin account anymore. Create your own with:
   ```
   cd backend
   ADMIN_EMAIL=you@example.com ADMIN_USERNAME=admin ADMIN_PASSWORD='a-strong-password' npm run create-admin
   ```

## Status
This project is **in progress**. Some features may be incomplete or under development.

## UI Screenshots

<p align="center">
  <img src="https://github.com/user-attachments/assets/1249d963-bb69-4d6a-b4f3-218494e87e74" alt="Membership Benefits" width="45%" />
  <img src="https://github.com/user-attachments/assets/661b572c-0672-4959-887a-88468dcc52de" alt="Services" width="45%" />
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/66317239-71a8-4ae0-bbd5-800c36e3ca61" alt="FAQs" width="45%" />
  <img src="https://github.com/user-attachments/assets/9d0310a0-1745-473e-a31b-a8743a2fc388" alt="Exit" width="45%" />
</p>

## Admin Dashboard

<p align="center">
  <img src="https://github.com/user-attachments/assets/a36de1cd-d5cd-425b-8c83-93f902f2899d" alt="Admin Actions" width="45%" />
  <img src="https://github.com/user-attachments/assets/0f53f7d8-720e-4f57-b97d-91f798388902" alt="Admin Dashboard" width="45%" />
</p>


## How to Run the Project

### 1. Clone the Repository
```
git clone <repo-url>
cd Discover_architects-master
```

### 2. Install Dependencies
#### Frontend
```
npm install
```
#### Backend
```
cd backend
npm install
```

### 3. Start the Project
#### Start Backend
```
cd backend
npm start
```

#### Start Frontend (in a new terminal)
```
cd ..
npm start
```
- The frontend will run at [http://localhost:3000](http://localhost:3000)
- The backend will run at [http://localhost:5000](http://localhost:5000)

