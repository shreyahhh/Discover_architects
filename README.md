# Discover Architects

## Overview
Discover Architects is a web platform for architecture and interior design services. It allows users to explore design galleries, subscribe to membership plans, and for admins to manage users and their subscriptions. The site is currently a work in progress and new features are being added.

![Landing Page](https://github.com/user-attachments/assets/4a129aa3-8c93-4e00-aa3a-29d728f8a707)


## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** SQLite (via better-sqlite3)
- **Other:** Supabase (for authentication), Multer (for file uploads)


## Features
- User authentication (with Supabase)
- Admin dashboard to manage users and plans
- User dashboard to view and manage subscriptions
- Gallery for design inspiration
- Membership plans and subscription management

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

