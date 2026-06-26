# 🚀 Interakt (CampusHub Pro) - Ultimate Master Guide & Documentation

Interakt is a premium, full-stack, production-ready social media platform designed for campus and community interactions. Built with state-of-the-art aesthetics, it features an immersive glassmorphic dark mode, a light mode with high-contrast legibility, real-time messaging, direct message actions, mobile-optimized layouts, an ads engine, and a god-mode admin panel with 20+ dashboards.

This project is structured as a **Monorepo** containing:
1. **Web Client** (Next.js 15 + Tailwind CSS + Framer Motion)
2. **Backend API** (Express.js + Socket.IO + JSONStore / MongoDB)
3. **Admin Dashboard** (Vite + React)
4. **Mobile App** (React Native via Expo)

---

## 📂 Repository Structure & Key Files Map

Understanding which file does what:

```text
antygravity/
├── apps/
│   ├── api/                     # Backend Express Server (Port 5005)
│   │   ├── server.js            # Main entry point (Connects Socket.IO, Express, Middlewares, Routes)
│   │   ├── routes/              # API Endpoint mappings
│   │   │   ├── authRoutes.js    # Register, Login, Profile updates, Notifications, Ads, Follow systems
│   │   │   ├── postRoutes.js    # Post creation, retrieval, search, likes, saves
│   │   │   └── messageRoutes.js # Direct message logs, deletion, reports
│   │   ├── controllers/         # Core business logic & database queries
│   │   │   ├── authController.js# JWT generation, profile edit, security layers, follow logic
│   │   │   ├── postController.js# Post processing, comments, media upload
│   │   │   └── messageController.js # Direct messages, seen list, delete logs
│   │   ├── middleware/          # Security middlewares
│   │   │   └── auth.js          # Token verification, Admin Authorization, ban verification
│   │   ├── utils/
│   │   │   ├── jsonStore.js     # local persistent JSON database simulator
│   │   │   └── activityLogger.js# Auditing database activities
│   │   └── data/                # Local database storage JSON files
│   │
│   ├── web/                     # Frontend Next.js Web Client (Port 3000)
│   │   ├── src/app/             # Next.js Pages and Routes
│   │   │   ├── page.tsx         # Home Social Feed (create & view posts)
│   │   │   ├── profile/         # Profile, dynamic posts, liked posts, cover/avatar editor
│   │   │   ├── settings/        # Theme toggles, security adjustments, notification preferences
│   │   │   ├── messages/        # Real-time direct chat, seen list, report system, delete logs
│   │   │   └── admin/           # God-mode admin dashboards
│   │   ├── src/components/      # UI & Layout components
│   │   │   ├── layout/          # Sidebar, RightSidebar, and BottomNav navigation components
│   │   │   └── ui/              # Reusable PostCards, Follow modals, theme toggles, ad banners
│   │   └── src/app/globals.css  # Global styles, scrollbars, animations, Light/Dark mode color schemes
│   │
│   ├── admin/                   # Moderation & Analytics Panel (Port 5173)
│   └── mobile/                  # React Native mobile application (Port 8081)
└── interakt-project.zip         # Clean production source code bundle
```

---

## 💾 Database Configuration (MongoDB Integration)

By default, the project runs on **JSONStore** (local JSON file database under `apps/api/data/*`) for plug-and-play local development without external dependencies. 

To connect the application to a production **MongoDB Database / MongoDB Atlas Cluster**:

### Step 1: Set MongoDB URI in environment variables
Create or open the `.env` file at `apps/api/.env` and specify your MongoDB connection string:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/interakt?retryWrites=true&w=majority
JWT_SECRET=super_secure_random_string_xyz
PORT=5005
```

### Step 2: Enable Mongoose connection inside the Backend
Open [apps/api/server.js](file:///c:/abdul/antygravity/apps/api/server.js) and uncomment the Mongoose connection block:
```javascript
// Remove comment block delimiters /* and */ around:
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};
connectDB();
```

---

## 🚀 Local Development (How to Run Everything)

### 1. Run the Backend API
```bash
cd apps/api
npm install
npm start
```
* **Runs on:** `http://localhost:5005`
* **Log file check:** If backend fails, check if Port 5005 is occupied.

### 2. Run the Next.js Web Client
```bash
cd apps/web
npm install
npm run dev
```
* **Runs on:** [http://localhost:3000](http://localhost:3000)
* **Log file check:** Run `npm run build` inside `apps/web` to check for TypeScript compilation or linting issues.

### 3. Run the Admin Dashboard
```bash
cd apps/admin
npm install
npm run dev
```
* **Runs on:** [http://localhost:5173](http://localhost:5173)

### 4. Run the Mobile App (Expo)
```bash
cd apps/mobile
npm install
npm start
```
* Scan the terminal's **QR Code** using the **Expo Go** app on your phone. Make sure both devices are on the same Wi-Fi network.

---

## 🌐 Production Deployment & Hosting Guide

GitHub Pages does not support backend deployment. We deploy the frontend and backend separately using premium hosting networks:

### Step 1: Push Project to GitHub
Initialize git inside the extracted folder (excluding node_modules/build files) and push to your GitHub repository:
```bash
git init
git add .
git commit -m "feat: first deployment"
git remote add origin https://github.com/your-username/interakt-app.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend API (Render or Railway)
Host the backend Express application on **Render.com** (Free tier Web Service) or **Railway.app**:
1. Create a new Web Service and link your GitHub repository.
2. Configure settings:
   * **Root Directory:** `apps/api`
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
3. Add Environment Variables:
   * `MONGO_URI` = (Your MongoDB Atlas URI)
   * `JWT_SECRET` = (Your custom secret key)
   * `PORT` = `5005` (Render will automatically handle public port mapping)
4. Copy the backend url provided by Render (e.g. `https://interakt-api.onrender.com`).

### Step 3: Deploy Frontend Web Client (Vercel)
Deploy the Next.js app to **Vercel.com**:
1. Connect Vercel to your GitHub account and import the repository.
2. Configure settings:
   * **Root Directory:** `apps/web`
   * **Framework Preset:** `Next.js`
   * **Build Command:** `next build`
3. Add Environment Variables:
   * **`NEXT_PUBLIC_API_URL`**: `https://interakt-api.onrender.com` (Ensure there is NO trailing slash `/`).
4. Click **Deploy**. Vercel will build and provide a production domain.

---

## 🛡️ Cybersecurity & Protection Layers

1. **Strict Rate Limiting:**
   * **Auth Routes:** Restricted to 10 attempts per 15 minutes to block brute-force attacks (`/register`, `/login`, `/forgot-password`, `/verify-reset-otp`).
   * **General Routes:** Configured for 5000 requests per 15 minutes to handle legitimate app interactions and dashboard polling.
2. **Payload Protection:** Max payload limits are capped (`express.json({ limit: '2mb' })`) to block massive buffer overflow payloads.
3. **Password Hashing:** Implemented industrial PBKDF2 hashing with unique random salts for user passwords.
4. **Route Protection:** Middlewares restrict direct queries to authorized JWT bearer headers.

---

## 🔧 Troubleshooting Guide

* **Blank Profile Page / Infinite Loader:**
  * **Cause:** The backend API server is down, or your browser is hitting rate-limits (429).
  * **Solution:** Check if `node apps/api/server.js` is running on Port 5005. If rate limit is hit, check backend rate limits in [apps/api/server.js](file:///c:/abdul/antygravity/apps/api/server.js#L107-L115).
* **Light Mode Legibility Problems:**
  * **Cause:** Text colors in white containers default to light/white.
  * **Solution:** Edit [apps/web/src/app/globals.css](file:///c:/abdul/antygravity/apps/web/src/app/globals.css) and customize `:root[data-theme='light']` CSS variables and overrides.
* **Socket.IO Chat Real-time Fails:**
  * **Cause:** Frontend Socket.io URL does not match backend server address.
  * **Solution:** Inspect variables in `apps/web/src/app/messages/page.tsx` and verify the server URL matches your deployment backend address.
