# Interakt - The Ultimate Campus Social Network 🚀

Welcome to the official repository of **Interakt by project x²**. 

Interakt is a next-generation, high-performance, full-stack campus social networking platform designed exclusively for students. Engineered with a premium, aesthetic, "god-level" UI, it offers lightning-fast real-time chat, global and private networking, secure authentication, and a feature-rich administrative dashboard (God Mode).

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Features](#2-core-features)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Directory Structure](#5-directory-structure)
6. [Frontend Architecture (Web)](#6-frontend-architecture-web)
7. [Backend Architecture (API)](#7-backend-architecture-api)
8. [Database Schemas](#8-database-schemas)
9. [API Endpoints Documentation](#9-api-endpoints-documentation)
10. [Real-time Communication (WebSockets)](#10-real-time-communication-websockets)
11. [Security Implementations](#11-security-implementations)
12. [Progressive Web App (PWA)](#12-progressive-web-app-pwa)
13. [Deployment Guide](#13-deployment-guide)
14. [Environment Variables](#14-environment-variables)
15. [Administrative Panel (God Mode)](#15-administrative-panel-god-mode)
16. [Future Roadmap & Scaling](#16-future-roadmap--scaling)

---

## 1. Project Overview

**Interakt** bridges the gap between students by providing an exclusive, secure, and beautiful platform to interact. 

Unlike generic social media, Interakt restricts access strictly to verified college students using a highly secure College UID verification system. The platform integrates a global public feed, real-time messaging, deep user customization, and strict moderation tools ensuring a toxic-free, engaging environment for campuses. 

With a recent architectural upgrade, the platform is now a **Progressive Web App (PWA)**, meaning users can directly install the app from their mobile browser without the need for an App Store, experiencing a native, full-screen mobile app directly from the web.

---

## 2. Core Features

### 🌟 For Users
* **Exclusive Access:** Registration strictly governed by a pre-approved whitelist of College UIDs.
* **Real-time Global & Private Chat:** Powered by Socket.IO, enabling instant message delivery.
* **Social Feed (Explore & Notice):** Share updates, memes, study materials, and college notices.
* **Dynamic Premium System:** Temporary (1-hour, 1-day, 7-days) and permanent premium badges.
* **Progressive Web App (PWA):** One-click "Install App" to add Interakt natively to any Android/iOS device.
* **Profile Customization:** Emojis, Avatars, Bio, and Private Accounts.
* **Trending Users & Tags:** Algorithmic ranking of the most active users and topics.
* **Forgot Password via OTP:** Highly secure, admin-assisted OTP generation with brute-force protection.
* **Dynamic Ads:** Interactive, native-feeling sponsored posts and banners.

### 🛡️ For Administrators (God Mode)
* **Comprehensive Dashboard:** Real-time metrics of Users, Posts, Reports, and System Health.
* **Department-Wise Management:** Isolated controls for Users, Posts, Reports, and Advertisements.
* **Ban Management:** Issue temporary or permanent bans to toxic users.
* **Premium Management:** Grant or revoke premium status with dynamic durations.
* **Security Logs (Audit Trail):** Every administrative and critical user action is logged securely in the database.
* **OTP Request Panel:** Admins can view pending password reset OTPs to securely share them with users in person.

---

## 3. Technology Stack

Interakt leverages a modern, highly scalable MERN-adjacent stack, substituting React for Next.js and adding real-time infrastructure.

### Frontend
* **Framework:** Next.js 15 (App Router)
* **Library:** React 19
* **Styling:** Tailwind CSS, Framer Motion (Micro-animations)
* **Icons:** Lucide React
* **State Management:** React Hooks, Context API (`AuthProvider`)
* **Data Fetching:** Axios
* **Real-time:** Socket.IO-Client

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js
* **Real-time:** Socket.IO
* **Database:** MongoDB (Mongoose ODM)
* **Security:** Helmet, Express Rate Limit, JWT, bcrypt (replaced by Mongoose middleware)
* **Deployment:** Render (Backend), Netlify (Frontend)

---

## 4. System Architecture

Interakt follows a decoupled **Monorepo** structure. The frontend and backend exist in the same repository but operate entirely independently, communicating strictly over REST APIs and WebSockets.

* **Client-Side Rendering (CSR):** The Next.js frontend primarily uses "use client" directives to ensure high interactivity, smooth Framer Motion animations, and real-time state management.
* **Stateless Backend:** The Node.js server uses JWT for authentication, keeping the server stateless and horizontally scalable.
* **WebSocket Layer:** A persistent, authenticated Socket.IO connection handles live chat, typing indicators, and immediate feed updates.
* **Database Layer:** A NoSQL MongoDB cluster hosted on MongoDB Atlas provides flexible, fast data retrieval.

---

## 5. Directory Structure

```text
interakt/
├── apps/
│   ├── web/                     # Next.js Frontend
│   │   ├── public/              # Static assets, PWA Manifest, SW
│   │   ├── src/
│   │   │   ├── app/             # App Router Pages (login, register, messages, explore)
│   │   │   ├── components/      # Reusable UI components
│   │   │   │   ├── layout/      # Sidebar, RightSidebar, MobileHeader
│   │   │   │   ├── providers/   # AuthProvider context
│   │   │   │   └── admin/       # God Mode dashboard components
│   │   │   └── styles/          # Tailwind configurations
│   │   └── package.json
│   │
│   ├── api/                     # Node.js/Express Backend
│   │   ├── controllers/         # Business logic (auth, posts, admin)
│   │   ├── models/              # MongoDB Schemas (User, Post, Message, etc.)
│   │   ├── routes/              # Express API Routes
│   │   ├── utils/               # Helpers (ActivityLogger)
│   │   ├── server.js            # Main entry point & Socket.IO config
│   │   └── package.json
│   │
│   └── mobile/                  # React Native / Expo (Deprecated/Placeholder)
├── README.md
└── .gitignore
```

---

## 6. Frontend Architecture (Web)

The frontend is built for maximum aesthetic appeal and performance.

### Core Layout (`ClientLayout.tsx`)
A unified responsive shell that adapts to Desktop and Mobile:
* **Desktop:** Three-column layout (Left Navigation, Center Feed, Right Sidebar with Ads & PWA Install).
* **Mobile:** Bottom navigation bar and top header with a "by project x²" branding signature. Drawers for Left/Right sidebars ensure maximum screen real-estate for the feed.

### Progressive Web App (PWA)
Interakt bypasses traditional App Stores.
* **`manifest.json`:** Defines app name, standalone display mode, background color (`#0a0a0a`), and theme color (`#8b5cf6`).
* **Service Worker (`sw.js`):** Intercepts network requests and caches core assets.
* **Install Trigger:** The "Install App" button captures the browser's `beforeinstallprompt` event and triggers the native OS installation dialog.

### Theming & Animations
* **Colors:** Deep dark mode (Backgrounds: `#0a0a0a`, `#111111`) accented with vibrant gradients (Purple `#8b5cf6` to Pink `#ec4899`).
* **Animations:** Extensively uses `framer-motion` for page transitions, hover states, and smooth drawer openings.

---

## 7. Backend Architecture (API)

The backend is a robust Express server designed to handle thousands of concurrent students securely.

### Initialization & Middleware
1. **Security Headers:** `helmet` locks down XSS, Sniffing, and Frame embedding.
2. **Rate Limiting:** Global rate limit of 5000 requests per 15 minutes, with stricter in-memory limiters for login attempts.
3. **CORS:** Strictly restricted to frontend production URLs.
4. **Body Parsing:** Express JSON parsing limited to 2MB to prevent payload attacks.

### Real-time Engine
Socket.IO is tightly integrated into the Express `server` instance.
* **Authentication:** A custom `io.use()` middleware validates the JWT token before allowing a WebSocket connection, ensuring only verified students can join chat rooms.
* **Rooms:** Users automatically join a `global_room` and their own `userId` room for direct messages.

---

## 8. Database Schemas

Interakt is 100% MongoDB powered.

### 1. User (`User.js`)
* Core fields: `username`, `email`, `password`, `uid`, `phone`
* Profile fields: `name`, `nickname`, `emoji`, `avatar`, `bio`
* Social fields: `followers`, `following`
* System fields: `role` ('user' or 'admin'), `isPremium`, `premiumUntil`, `bannedUntil`

### 2. Post (`Post.js`)
* Fields: `text`, `media`, `author` (Ref: User), `likes`, `views`, `tags`
* **TTL / Query Constraint:** Posts older than 24 hours are excluded from feeds dynamically using `$gte` queries to maintain freshness.

### 3. Message (`Message.js`)
* Fields: `sender` (Ref: User), `receiver` (Ref: User), `text`, `chatId` (e.g., 'global_room')
* Similar to Posts, messages are fetched using strict 24-hour timestamp constraints.

### 4. AllowedUid (`AllowedUid.js`)
* Fields: `uid` (String, Unique), `used` (Boolean), `registeredUser` (Ref: User)
* Prevents outsiders from joining. A UID can only be used once.

### 5. OtpRequest (`OtpRequest.js`)
* Fields: `userId`, `otp`, `expiresAt`, `attempts`, `verified`
* Handles secure offline password resets. Automatically invalidates after 3 failed attempts (brute-force protection).

### 6. ActivityLog (`ActivityLog.js`)
* Fields: `userId`, `username`, `action`, `details`, `ip`, `timestamp`
* An unalterable audit trail for all critical security and admin events.

---

## 9. API Endpoints Documentation

### Authentication (`/api/auth`)
* `POST /register`: Validates College UID against `AllowedUid`, sanitizes inputs, creates user.
* `POST /login`: Validates credentials, checks rate limits, returns JWT.
* `GET /me`: Returns the authenticated user's profile (stripped of passwords).
* `POST /forgot-password`: Generates an OTP request for Admin approval.
* `POST /verify-reset-otp`: Validates OTP and updates password.

### Posts (`/api/posts`)
* `GET /`: Fetches latest posts (last 24 hours).
* `POST /`: Creates a new post.
* `POST /:id/like`: Toggles like status.

### Messages (`/api/messages`)
* `GET /global`: Fetches last 24 hours of global chat history.
* `GET /conversations`: Returns a list of users the current user has chatted with.

### Admin (`/api/admin`)
*(All routes strictly require 'admin' role)*
* `GET /users`: List all users.
* `POST /users/:id/ban`: Temporarily or permanently ban a user.
* `POST /premium`: Grant premium status for specific durations.
* `GET /logs`: Fetch system audit logs.
* `GET /otp-requests`: View pending OTPs to share with students.

---

## 10. Real-time Communication (WebSockets)

Interakt utilizes Socket.IO for seamless interactivity.

### Connection Flow
1. Client establishes connection passing `auth: { token }`.
2. Server validates JWT.
3. Client emits `join_chat` with `chatId` (either `global_room` or a User ID).
4. Server assigns the socket to the requested Room.

### Event Definitions
* `send_message`: Client sends a payload (`chatId`, `text`). Server saves to MongoDB and broadcasts.
* `receive_message`: Server pushes new message to all clients in the target room.
* `user_typing` / `user_stop_typing`: Broadcasts typing indicators to active rooms.

---

## 11. Security Implementations

Security is a first-class citizen in Interakt:

1. **Input Sanitization:** All user inputs (usernames, bios) are stripped of HTML tags `<[^>]*>` to prevent XSS.
2. **MongoDB Data Integrity:** Mongoose schemas strictly define data types. Legacy JSON files were completely eradicated.
3. **Infinite Loop Prevention:** Removed dangerous `pre('find')` hooks in Mongoose that caused `400 Bad Request` Stack Overflows on Render. Replaced with direct `$gte` query injection in controllers.
4. **Brute Force Protection:** 
   * Login: Exponential backoff after 5 failed attempts per IP.
   * OTPs: Permanent invalidation after 3 failed attempts.
5. **Private Accounts:** Profile endpoints dynamically mask usernames (`User_xxx`) and avatars for private accounts unless followed.
6. **JWT Validation:** Tokens are strictly verified against `JWT_SECRET`. Google Auth tokens validate issuer (`iss`), audience (`aud`), and expiration (`exp`).

---

## 12. Progressive Web App (PWA)

Interakt bypasses Google Play and App Store restrictions entirely.

* **Trigger:** The "Install App" button in the Right Sidebar intercepts the browser's `beforeinstallprompt` event.
* **Execution:** Calling `.prompt()` opens the OS-level installation dialog.
* **Result:** The web app is installed natively. It gets a home screen icon, runs independently of the browser UI, and feels indistinguishable from a native app (Insta Lite style).

---

## 13. Deployment Guide

Interakt is optimized for cloud deployment.

### Backend (Render)
1. Connect GitHub repository to Render Web Service.
2. Set Root Directory to `apps/api`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Configure Environment Variables (See below).

### Frontend (Netlify)
1. Connect GitHub repository to Netlify.
2. Set Base Directory to `apps/web`.
3. Build Command: `npm run build`
4. Publish Directory: `.next`
5. Ensure Next.js integration is enabled.

---

## 14. Environment Variables

### Backend (`apps/api/.env`)
```env
PORT=5005
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/interakt
JWT_SECRET=super_secure_random_string
ADMIN_SECRET=secret_key_to_grant_first_admin
GOOGLE_CLIENT_ID=your_google_oauth_client_id
FRONTEND_URL=https://interakt-app.netlify.app
```

### Frontend (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=https://interakt-api.onrender.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

---

## 15. Administrative Panel (God Mode)

The "God Mode" panel is the ultimate control center, split into specialized departments:

* **User Management:** Search, view, ban, and promote users. Lock accounts to private.
* **Premium Department:** Grant visually striking premium badges with strict expiration timers (1 Hour, 1 Day, etc.).
* **Content Moderation:** Delete toxic posts instantly. Review user-submitted reports.
* **Ad Management:** Create, toggle, and track impressions/clicks for sponsored posts.
* **Security & OTPs:** Monitor the `ActivityLog` for unauthorized access attempts. Provide physical offline password reset codes via the OTP panel.

---

## 16. Future Roadmap & Scaling

Interakt is built to scale. Future milestones include:

1. **Redis Integration:** Offloading Socket.IO state and Rate Limiting to Redis for multi-instance scaling.
2. **S3 / Cloudinary:** Migrating local avatar/media uploads to managed object storage.
3. **WebRTC:** Enabling voice and video rooms within the campus network.
4. **Push Notifications:** Integrating Firebase Cloud Messaging (FCM) for offline PWA notifications.
5. **AI Moderation:** Integrating LLMs to auto-flag and filter toxic messages (`auto filter hoke cute hoo jaye`).

---

**Developed with ❤️ by project x²**
