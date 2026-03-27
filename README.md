# 🌱 MyFarmAI - Premium AI Agricultural Ecosystem
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-success?logo=vercel)](https://farm-ai-iota.vercel.app/)
[![Database](https://img.shields.io/badge/Database-MongoDB_Atlas-green?logo=mongodb)](https://www.mongodb.com/atlas)
[![AI Model](https://img.shields.io/badge/AI-Llama_3.3_70B-blue?logo=meta)](https://groq.com/)

MyFarmAI is a PWA focused on Nigeria's agriculture ecosystem. It combines:
- AI farming assistant
- Marketplace (list, browse, cart, checkout)
- Vet/consultant connection module (`conn`)
- Push notifications for updates

---

## System Overview

### Frontend apps
1. **Main shell app (`/index.html`, `/js/app.js`)**
   - Marketplace UI, auth UI, cart, checkout, and notification setup.
   - Calls backend APIs under `/api`.
2. **Vet Connect app (`/conn`)**
   - Public booking UI (`conn/index.html` + `conn/assets/js/script.js`).
   - Admin specialist/appointment UI (`conn/admin.html` + `conn/assets/js/admin.js`).
   - Calls backend APIs under `/backend/conn/*`.
3. **AI chat iframe**
   - Embedded as an iframe (`https://my-farm-ai.vercel.app/`).
   - Receives login/logout sync via `window.postMessage` from the main shell.

### Backend app
- Location: `ai_enginr/backend`
- Entry: `server.js` -> `src/app.js`
- Stack: Node.js + Express + MongoDB (Mongoose) + Groq + Cloudinary + Web Push
- Route groups:
  - `/api/*` for main app features
  - `/backend/*` for Vet Connect compatibility endpoints

---

## How Frontend Interacts with Backend

### Main shell -> `/api`
`js/app.js` sets:
- Local: `http://localhost:3000/api`
- Production: `https://farm-ai-iota.vercel.app/api`

Main user flows:
- Auth: POST `/api/auth`
- Marketplace: GET/POST/PATCH/DELETE `/api/products*`
- Cart: GET `/api/cart`, POST `/api/cart/add`, POST `/api/cart/update`
- Checkout: POST `/api/checkout`
- Notifications: GET `/api/notifications/vapid-public-key`, POST `/api/notifications/subscribe`
- Cloudinary upload: POST `/api/upload/cloudinary`
- Consultants listing: GET `/api/consultants`

### Vet Connect (`/conn`) -> `/backend`
`conn/assets/js/script.js` and `conn/assets/js/admin.js` set:
- Local: `http://localhost:3000/backend`
- Production: `https://farm-ai-iota.vercel.app/backend`

Used flows:
- Specialists: GET `/backend/conn/professionals`
- Bookings: POST `/backend/conn/book`
- Admin appointments: GET `/backend/conn/appointments`
- Admin specialist create/update/delete:
  - POST `/backend/conn/professionals`
  - POST `/backend/conn/professionals/:id`
  - DELETE `/backend/conn/professionals/:id`
- Admin appointment delete: DELETE `/backend/conn/appointments/:id`
- Image upload for specialist: POST `/backend/conn/upload` (`image_file`)

### Main shell <-> AI iframe auth bridge
- On login/logout in main app, shell sends:
  - `{ type: 'LOGIN_SYNC', email }`
  - `{ type: 'LOGOUT' }`
- Transport: `window.postMessage`
- Purpose: single login experience across shell and AI iframe.

---

## Backend API Reference (All Endpoints)

Base host examples:
- Local: `http://localhost:3000`
- Production: `https://farm-ai-iota.vercel.app`

### Health
- `GET /`
- `GET /health`
- `GET /favicon.ico`
- `GET /favicon.png`

### Core `/api` routes
- **Auth**
  - `POST /api/auth`
- **Chat + conversations**
  - `POST /api/chat`
  - `GET /api/conversations?email=...`
  - `GET /api/history?email=...&conversationId=...`
- **Consultants**
  - `GET /api/consultants`
- **Products**
  - `GET /api/products`
  - `POST /api/products`
  - `PATCH /api/products/:id`
  - `DELETE /api/products/:id`
- **Cart**
  - `GET /api/cart?email=...`
  - `POST /api/cart/add`
  - `POST /api/cart/update`
- **Orders**
  - `POST /api/checkout`
  - `GET /api/orders?email=...`
- **Notifications**
  - `GET /api/notifications/vapid-public-key`
  - `POST /api/notifications/subscribe`
  - `POST /api/notifications/broadcast`
- **Uploads**
  - `GET /api/upload/cloudinary-status`
  - `POST /api/upload/cloudinary` (`image` form-data)
- **Admin**
  - `GET /api/admin/all`
  - `GET /api/admin/overview`
  - `PATCH /api/admin/products/:id` (requires `x-admin-key`)
  - `DELETE /api/admin/products/:id` (requires `x-admin-key`)

### Vet Connect `/backend` routes
Preferred clean endpoints:
- `GET /backend/conn/professionals`
- `GET /backend/conn/appointments`
- `POST /backend/conn/book`
- `POST /backend/conn/professionals`
- `POST /backend/conn/professionals/:id`
- `DELETE /backend/conn/professionals/:id`
- `DELETE /backend/conn/appointments/:id`
- `POST /backend/conn/upload` (`image_file` form-data)

Legacy compatible endpoints (still supported):
- `GET /backend/api.php?action=get_professionals`
- `GET /backend/api.php?action=get_appointments`
- `POST /backend/api.php` with action:
  - `book`
  - `add_professional`
  - `update_professional`
  - `delete_professional`
  - `delete_appointment`
- `POST /backend/upload.php` (`image_file` form-data)

---

## Backend Dependencies (`ai_enginr/backend`)

From `ai_enginr/backend/package.json`:
- `express`: HTTP server and routing
- `cors`: cross-origin requests
- `dotenv`: environment variable loading
- `mongoose`: MongoDB ODM
- `groq-sdk`: LLM chat completions
- `multer`: multipart/form-data file handling
- `cloudinary`: cloud image upload/storage
- `web-push`: browser push notifications
- `node-fetch`: HTTP fetch support on server

---

## Environment Variables

Minimum required for core functionality:
```env
MONGODB_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
```

Optional but recommended:
```env
# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Push notifications (VAPID)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# Admin product management protection
ADMIN_API_KEY=...
```

---

## Local Development

1. Start backend:
   ```bash
   cd ai_enginr/backend
   npm install
   npm run dev
   ```
2. Serve repo root (`/`) with a static server (Live Server or similar).
3. Open app in browser.
   - Main shell runs from root files.
   - Vet Connect runs from `/conn`.
   - Main shell targets `/api`, Vet Connect targets `/backend`.

---

## Deployment

This project is configured for Vercel-style deployment. Ensure all required env vars are set in your deployment environment.

---

Developed for the future of farming.