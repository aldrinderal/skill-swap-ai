# 🚀 Skill Swap AI

> **"Learn a Skill. Teach a Skill. Grow Together."**

A full-stack **MERN Stack** (MongoDB, Express, React, Node.js) web application designed for students and self-learners to exchange skills. Users register skills they want to teach and skills they want to learn, discover compatible skill partners through intelligent matching, connect, and conduct structured **30-minute peer-to-peer video sessions** with built-in real-time chat.

---

## 📑 Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Folder Structure](#folder-structure)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [REQUIRED API KEYS & CREDENTIALS](#required-api-keys--credentials)
7. [Environment Variables Setup](#environment-variables-setup)
8. [MongoDB Atlas Setup Guide](#mongodb-atlas-setup-guide)
9. [Google OAuth Setup Guide](#google-oauth-setup-guide)
10. [Running the Application](#running-the-application)
11. [Real-Time Video & Chat Setup](#real-time-video--chat-setup)
12. [Two-User Testing Procedure](#two-user-testing-procedure)
13. [Step-by-Step Project Roadmap](#step-by-step-project-roadmap)

---

## ✨ Features

- **Authentication & Authorization**: Secure email/password authentication using bcrypt hashing & JWT tokens, plus Google OAuth Sign-In.
- **Skill Registration & Profile**: Register skills to teach, skills to learn, proficiency level, bio, and availability (weekdays/weekends, preferred time).
- **Skill Discovery & Partner Matching**: Search for partners with reciprocal skill compatibility (User A wants to learn what User B teaches, and vice versa).
- **Connection Request Flow**: Send, accept, or reject connection requests with live status updates.
- **Peer-to-Peer Video/Audio Calling**: WebRTC-powered high-quality video calling with camera, microphone, and screen-sharing controls.
- **Real-Time In-Meeting Chat**: Socket.IO-powered real-time text chat synchronized between meeting participants.
- **Enforced 30-Minute Meeting Limit**: Synced countdown timer with automatic termination, status tracking, and database persistence.
- **Dashboard & Admin Metrics**: Real-time stats showing active users, skill profiles, pending requests, accepted connections, and completed sessions.

---

## 🛠️ Tech Stack

### Frontend
- **React 19** (Modern component-based UI)
- **Vite** (Next-generation lightning-fast frontend tooling)
- **Tailwind CSS** (Utility-first styling with custom educational design system)
- **React Router DOM** (Client-side routing with protected routes)
- **Axios** (HTTP client with JWT request interceptors)
- **Socket.IO Client** (Real-time WebSockets for signaling & chat)
- **Lucide React** (Modern, clean icon set)

### Backend
- **Node.js** (JavaScript runtime)
- **Express.js** (REST API framework)
- **MongoDB Atlas & Mongoose** (NoSQL cloud database and schema modeling)
- **JWT (jsonwebtoken)** (Stateless token-based authentication)
- **bcryptjs** (Industry-standard password hashing)
- **Socket.IO** (Real-time bidirectional event-based communication)
- **CORS & Dotenv** (Cross-origin resource sharing & secret environment management)

---

## 📁 Folder Structure

```text
skillswap-ai/
│
├── client/                     # Frontend React + Vite application
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Cards, Modals)
│   │   ├── pages/              # Page views (Home, Login, Register, Profile, etc.)
│   │   ├── layouts/            # Page layouts (MainLayout, AuthLayout)
│   │   ├── hooks/              # Custom React hooks (useAuth, useSocket, etc.)
│   │   ├── services/           # Axios instance & API service calls
│   │   ├── context/            # React Context providers (AuthContext, SocketContext)
│   │   ├── utils/              # Helper functions (time formatting, date utils)
│   │   ├── App.jsx             # Main application component
│   │   ├── main.jsx            # Application DOM mount
│   │   └── index.css           # Tailwind CSS directives & global tokens
│   ├── index.html              # HTML root template with Inter font
│   ├── vite.config.js          # Vite configuration
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   ├── postcss.config.js       # PostCSS configuration
│   ├── .env.example            # Client environment template
│   └── package.json            # Frontend dependencies
│
├── server/                     # Backend Node.js + Express API
│   ├── controllers/            # Route controllers (auth, skills, meetings, etc.)
│   ├── models/                 # Mongoose database schemas (User, Meeting, etc.)
│   ├── routes/                 # Express API routes
│   ├── middleware/             # Auth check, admin check & error middleware
│   ├── services/               # Matching logic & business services
│   ├── sockets/                # Socket.IO handlers (WebRTC signaling & chat)
│   ├── config/                 # Database connection (db.js)
│   ├── utils/                  # Token generation, helpers
│   ├── server.js               # Express application & Socket.IO server entry
│   ├── .env.example            # Backend environment template
│   └── package.json            # Backend dependencies
│
├── .env.example                # Master environment variable template
├── .gitignore                  # Git ignore rules for node_modules & secrets
├── README.md                   # Complete beginner guide & documentation
└── package.json                # Root orchestration scripts
```

---

## 📋 Prerequisites

Before starting, install the following software on your computer:

1. **Node.js**: Version 18.0.0 or newer (Run `node -v` in your terminal to verify).
   - Download from: [https://nodejs.org/](https://nodejs.org/) (LTS recommended)
2. **VS Code** (or your favorite code editor):
   - Download from: [https://code.visualstudio.com/](https://code.visualstudio.com/)
3. **MongoDB Atlas Account** (Free M0 Sandbox):
   - Sign up at: [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
4. **Google Cloud Console Account** (Optional for Google OAuth):
   - Free account at: [https://console.cloud.google.com/](https://console.cloud.google.com/)

---

## 📦 Installation

To install all dependencies for both the frontend and backend, follow these steps:

### 1. Root dependencies
```bash
npm install
```

### 2. Client dependencies
```bash
cd client
npm install
```

### 3. Server dependencies
```bash
cd ../server
npm install
```

*(Alternatively, you can return to the root folder at any time).*

---

## 🔑 REQUIRED API KEYS & CREDENTIALS

> **IMPORTANT SECURITY RULE:**  
> Never expose `MONGO_URI`, `JWT_SECRET`, or `GOOGLE_CLIENT_SECRET` in frontend code. All secrets remain strictly inside `server/.env`.

Here is the exact step-by-step breakdown of every external service and key:

### 1. MongoDB Atlas Connection String (`MONGO_URI`)
- **Website to visit**: [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
- **Account type**: Free "M0" Shared Cluster (Forever free, 512MB storage).
- **Billing method required?**: **NO** credit card required.
- **Where to put it**: In `server/.env` under `MONGO_URI=`.
- **Format**: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/skillswap?retryWrites=true&w=majority`

### 2. JWT Secret (`JWT_SECRET`)
- **Website to visit**: None! You generate this yourself.
- **What it is**: A secure random string used to sign and verify JSON Web Tokens.
- **Where to put it**: In `server/.env` under `JWT_SECRET=`.
- **Example value**: Any long secure string (e.g. `skillswap_super_secret_jwt_key_2026_xYz987!`).

### 3. Google OAuth 2.0 (`GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`)
- **Website to visit**: [https://console.cloud.google.com/](https://console.cloud.google.com/)
- **Cost**: **100% Free** for standard Google Sign-In authentication.
- **Billing method required?**: **NO** billing account is required for basic OAuth authentication.
- **Where to put it**:
  - `GOOGLE_CLIENT_ID` goes in **both** `server/.env` and `client/.env` (prefixed as `VITE_GOOGLE_CLIENT_ID`).
  - `GOOGLE_CLIENT_SECRET` goes **ONLY** in `server/.env`. **NEVER** in the client.

### 4. Video / Audio Calling (WebRTC + Socket.IO)
- **Website to visit**: None! We use native browser WebRTC with our Node.js Socket.IO server as the signaling layer, plus free public Google STUN servers (`stun:stun.l.google.com:19302`).
- **Cost**: **Free** peer-to-peer connection without third-party paid video subscriptions.

---

## 🖥️ Backend Setup (Phase 3)

The backend is built with **Node.js, Express, MongoDB/Mongoose, and CORS**.

### 1. Installation & Running
Navigate into the `server` directory, install packages, and start the development server:

```bash
cd server
npm install
npm run dev
```

### 2. Backend Environment Variables (`server/.env`)
Create a file named `.env` inside `server/`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/skillswap
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
```

> **IMPORTANT SECURITY NOTE:**  
> Never upload or commit `server/.env` to GitHub. It is already added to `.gitignore`. Keep your database credentials and JWT secrets strictly private.

### 3. Verification Endpoints
Once the backend is running, verify it with the following endpoints:

- **Root API Endpoint**: `GET http://localhost:5000/`  
  Response: `Skill Swap AI API is running`
- **Health Check Endpoint**: `GET http://localhost:5000/api/health`  
  Expected JSON Response:
  ```json
  {
    "success": true,
    "message": "Skill Swap AI backend is running"
  }
  ```
- **404 Route Handler**: `GET http://localhost:5000/api/nonexistent`  
  Expected JSON Response:
  ```json
  {
    "success": false,
    "message": "API route not found"
  }
  ```

---

## ⚙️ Environment Variables Setup

### 1. Backend Configuration (`server/.env`)

Create a file named `.env` inside the `server/` directory:

```env
# Server Port & URLs
PORT=5000
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

# MongoDB Database Connection
MONGO_URI=mongodb+srv://<your_username>:<your_password>@cluster0.mongodb.net/skillswap?retryWrites=true&w=majority

# JWT Token Secret
JWT_SECRET=skillswap_super_secret_jwt_key_2026_xYz987!

# Google OAuth Web Client ID (Google Identity Services - Phase 6)
GOOGLE_CLIENT_ID=
```

### 2. Frontend Configuration (`client/.env`)

Create a file named `.env` inside the `client/` directory:

```env
# Backend API Base URL
VITE_API_URL=http://localhost:5000/api

# Google OAuth Web Client ID (Google Identity Services - Phase 6)
VITE_GOOGLE_CLIENT_ID=
```

---

## 🍃 MongoDB Atlas Setup Guide

Follow these steps to create your free cloud database:

1. **Sign in** to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Click **Create** to deploy a database cluster.
3. Select the **M0 (Free)** tier.
4. Choose your cloud provider (AWS/GCP) and select the region closest to you.
5. Click **Create Cluster**.
6. **Set up Database Security**:
   - Go to **Database Access** → Click **Add New Database User**.
   - Choose **Password** authentication.
   - Enter a username (e.g. `skilluser`) and a secure password (avoid symbols like `@`, `#`, `/` in password to prevent URL-encoding issues).
   - Grant role: `Read and write to any database`. Click **Add User**.
7. **Configure Network Access**:
   - Go to **Network Access** → Click **Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`) so you can connect from your local development machine.
   - Click **Confirm**.
8. **Obtain Connection String**:
   - Go to **Databases** → Click **Connect** next to your cluster.
   - Select **Drivers** (Node.js).
   - Copy the connection string format:
     `mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`
   - Replace `<username>` and `<password>` with your database user credentials.
   - Add `/skillswap_ai` before the `?` to set the database name:
     `mongodb+srv://skilluser:mypassword@cluster0.mongodb.net/skillswap_ai?retryWrites=true&w=majority`
   - Paste this into `server/.env` as `MONGO_URI`.

---

## 🌐 Google OAuth Setup Guide (Google Identity Services)

Follow these step-by-step instructions to create your Google OAuth Web Client ID for Skill Swap AI:

> [!NOTE]
> You must generate this Client ID manually in your Google Cloud Console. Antigravity does not generate real Google credentials for you. Once you obtain your Client ID, paste it into your `.env` files.

### 1. Open Google Cloud Console
- Go to the [Google Cloud Console](https://console.cloud.google.com/) and sign in with your Google account.

### 2. Create or Select a Project
- Click on the project dropdown at the top navigation bar.
- Click **New Project**.
- Enter Project name: `Skill Swap AI` (or choose an existing project).
- Click **Create**.

### 3. Configure Google Auth Platform / OAuth Consent Screen
- In the navigation menu (left sidebar), go to **APIs & Services** → **OAuth consent screen** (or **Google Auth Platform** in newer consoles).
- Under **User Type**, select **External** and click **Create**.
- **App information**:
  - **App name**: `Skill Swap AI`
  - **User support email**: Select your email address.
  - **Developer contact information**: Enter your email address.
- Click **Save and Continue**.
- **Scopes**:
  - For Sign in with Google (GIS), the basic default scopes (`email`, `profile`, `openid`) are automatically included.
  - **DO NOT** request sensitive scopes like Gmail, Google Drive, YouTube, or Calendar.
  - Click **Save and Continue**.
- **Test Users** (if in Testing mode):
  - Add your Google email address as a test user so you can log in during development.
  - Click **Save and Continue**.

### 4. Create Web Application OAuth Client
- In the left sidebar, navigate to **APIs & Services** → **Credentials** (or **Clients** in Google Auth Platform).
- Click **+ CREATE CREDENTIALS** at the top → select **OAuth client ID**.
- Under **Application type**, select **Web application**.
- **Name**: `Skill Swap AI Web Client`.
- Scroll down to **Authorized JavaScript origins**:
  - Click **+ ADD URI**.
  - Enter the local development origin:
    ```
    http://localhost:5173
    ```
  - *(Note: Do not add a trailing slash `/` to the origin).*
- *(Note: For Google Identity Services popup/button authentication, Authorized redirect URIs are not required).*
- Click **Create**.

### 5. Copy and Save Your Client ID
- A modal will appear showing **OAuth client created**.
- Copy the **Client ID** (it looks like `1234567890-abcdefg123456.apps.googleusercontent.com`).
- Add the Client ID to both environment files:
  - **Backend** (`server/.env`):
    ```env
    GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
    ```
  - **Frontend** (`client/.env`):
    ```env
    VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
    ```
- **Restart Servers**:
  - Stop and restart both backend (`npm run server`) and frontend (`npm run dev`) so the new environment variables take effect!

---

## 🏃 Running the Application

You can start the frontend and backend servers together or in separate terminals:

### Option A: Run Both Together from Root
From the project root folder:
```bash
npm run dev
```
*(This starts both the Express server on port 5000 and the Vite dev server on port 5173 simultaneously).*

---

### Option B: Run in Separate Terminals (Recommended for Beginners)

**Terminal 1 — Backend Server:**
```bash
cd server
npm run dev
```
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

**Terminal 2 — Frontend Client:**
```bash
cd client
npm run dev
```
- **Frontend App**: [http://localhost:5173](http://localhost:5173)

---

## 📹 Real-Time Video & Chat Setup

Skill Swap AI uses a high-performance, cost-free communication architecture:
1. **Signaling Layer**: Handled by **Socket.IO** on our Node.js server.
   - Exchange WebRTC `offer`, `answer`, and ICE candidates between paired peers.
   - Handles room management (`join-room`, `leave-room`).
2. **Media Stream Layer**: Handled by browser-native **WebRTC (RTCPeerConnection)**.
   - Direct peer-to-peer audio and video transmission.
   - Camera toggle, mic toggle, and screen share.
3. **In-Meeting Chat**: Sent through WebSocket rooms in real time and automatically archived to MongoDB so participants never miss meeting notes.
4. **30-Minute Enforced Timer**: Synchronized between the client timer and backend timestamp validation to ensure fair, structured peer exchanges.

---

## 🧪 Two-User Testing Procedure

Once the full flow is active, follow this test to verify the complete application:

1. Open **Browser Window 1** (e.g. Chrome) and navigate to `http://localhost:5173`.
2. Open **Browser Window 2** (e.g. Incognito Window or Firefox) and navigate to `http://localhost:5173`.
3. In Window 1, register **User A** (e.g., `rahul@example.com`).
4. In Window 2, register **User B** (e.g., `priya@example.com`).
5. **Skill Registration**:
   - User A registers: *Teach: Web Development (MERN)*, *Learn: UI/UX Design*.
   - User B registers: *Teach: UI/UX Design*, *Learn: Web Development (MERN)*.
6. **Matching & Connection**:
   - User A navigates to **Find Skills**. User B appears with the **"Great Skill Match"** badge.
   - User A sends a connection request to User B.
   - User B opens **Requests**, sees User A's pending request, and clicks **Accept**.
7. **30-Minute Meeting Session**:
   - Both users see each other in **My Skill Partners** and click **Start 30-Minute Session**.
   - Allow camera and microphone permissions when prompted.
   - Verify that User A can see and hear User B, and vice-versa.
   - Send messages in the chat panel to verify real-time messaging.
   - Watch the 30:00 countdown timer.
   - Conclude or test timer expiration to ensure redirect to `/meeting-ended` with meeting statistics saved to MongoDB.

---

## 🗺️ Step-by-Step Project Roadmap

- [x] **PHASE 1: Project Setup** *(Completed)*
  - Monorepo folder layout (`client/`, `server/`, root scripts).
  - React 19 + Vite + Tailwind CSS + Lucide React frontend initialized.
  - Node.js + Express + Mongoose + Socket.IO backend initialized.
  - Environment variable templates (`.env.example`) and `.gitignore` safety.
  - Health check endpoint `/api/health` and live status verification.
- [x] **PHASE 2: React Frontend & Routes** *(Completed)*
  - Modern UI design system with Tailwind CSS & Google Inter font.
  - Complete navigation with responsive mobile hamburger drawer.
  - Interactive pages: Home, Skills, Register Skills, Requests, Connections, Profile, Meeting UI, Meeting Ended, Admin, Login, Register.
  - Centralized AuthContext & Axios service abstraction.
- [x] **PHASE 3: Express Backend & API Architecture** *(Completed)*
  - Node.js + Express backend modularized with controllers, routes, and middleware.
  - MongoDB database connection foundation (`connectDB()`) with graceful error handling.
  - Endpoints: `GET /` and `GET /api/health` with CORS support for `http://localhost:5173`.
  - Centralized error handler and 404 handler middleware.
- [x] **PHASE 4: MongoDB Connection & Schemas** *(Completed)*
  - Connected to cloud MongoDB Atlas database (`skillswap_ai`).
  - Mongoose models created: `User`, `SkillProfile`, `ConnectionRequest`, `Meeting`, `Message`.
  - Schema validations, normalized email, enums, ObjectId refs, and compound search indexes.
  - Verification endpoint: `GET /api/database-test` inspecting real Mongoose readyState.
- [x] **PHASE 5: User Registration & JWT Authentication** *(Completed)*
  - Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
  - Password hashing with bcryptjs (salt rounds = 10).
  - JWT token generation & verification (7d expiration).
  - Auth middleware `protect` enforcing Bearer token verification.
  - React AuthContext session verification on startup, localStorage token persistence, and ProtectedRoute guards.
- [x] **PHASE 6: Google OAuth Authentication** *(Completed)*
  - Google Identity Services (GIS) Web integration with "Continue with Google" button.
  - Server-side cryptographic token verification (`POST /api/auth/google`) using `google-auth-library`.
  - Single User model storage with Google `sub` ID and safe account-linking policy.
- [x] **PHASE 7: Skill Registration Flow & User Skill Profile** *(Completed)*
  - Reusable skill categories & filterable dropdowns.
  - CRUD endpoints: `POST /api/skills`, `GET /api/skills/me`, `PUT /api/skills/me`, `DELETE /api/skills/me`.
  - User profile view on `/profile` with registered skills, active details, delete confirmation modal, and no-profile fallback.
  - Interactive "Your Skill Profile" card on `/home`.
- [x] **PHASE 8: Skill Search & Reciprocal Matching** *(Completed)*
  - Case-insensitive MongoDB search across `skillToLearn` and `skillToTeach`.
  - Multi-filter query system (`skill`, `experienceLevel`, `availability`, `preferredSession`).
  - Rule-based partner matching algorithm (Score 2: "Perfect Skill Swap", Score 1: "Can Teach You", Score 0: excluded).
  - Clean public skill profile viewing at `/skills/user/:userId` with strictly sanitized public data.
  - Current user exclusion from search and recommended matches.
  - Debounced search input, dynamic results counter, and responsive UI cards.
- [x] **PHASE 9: Connection Requests & Connection Management** *(Completed)*
  - `ConnectionRequest` and `Connection` models with canonical ordering and duplicate prevention.
  - Endpoints: send request, view received & sent requests, accept, reject, cancel, and remove connection.
  - Relationship status detection (`not_connected`, `request_sent`, `request_received`, `connected`).
  - Frontend interactive flows on `/requests`, `/connections`, `/skills/user/:userId`, `UserCard`, `Navbar`, and `Home`.
- [x] **PHASE 10: Real-Time Socket.IO Communication Foundation** *(Completed)*
  - Integrated Socket.IO with Express HTTP server using `http.createServer`.
  - JWT socket authentication middleware verifying Bearer tokens.
  - Multi-tab online/offline user tracking via in-memory `Set` mapping.
  - Private user rooms (`user:<userId>`) for targeted event delivery.
  - Real-time events: `user:online`, `user:offline`, `connection:request`, `connection:accepted`, `connection:rejected`.
  - Frontend `SocketContext`, `useSocket`, subtle `SocketStatus` indicator, and toast notifications.
- [x] **PHASE 11: WebRTC Peer-to-Peer Audio/Video & Meeting Foundation** *(Completed)*
  - Peer-to-peer audio/video streaming via native WebRTC `RTCPeerConnection`.
  - Camera & microphone mute/unmute toggles with audio-only fallback.
  - Server-authoritative 30-minute meeting timer with refresh protection and warning alerts.
  - In-meeting real-time chat with typing indicator and MongoDB message persistence.
  - Call invitation/rejection lifecycle with `IncomingCallModal` and `/connections` button.
- [x] **PHASE 12: Screen Sharing & Advanced Meeting Controls** *(Completed)*
  - Native browser screen capture using `navigator.mediaDevices.getDisplayMedia()`.
  - Seamless track replacement via `RTCRtpSender.replaceTrack()` without PeerConnection renegotiation.
  - Browser-native stop sharing listener (`displayTrack.onended`) with automatic camera restoration.
  - Camera and microphone state preservation during and after screen sharing.
  - Room-scoped Socket.IO signaling (`screen:share:start`, `screen:share:stop`) and remote fullscreen toggle.
- [x] **PHASE 13: AI Skill Matching & Personalized Recommendations** *(Completed)*
  - Semantic skill normalization and related skills ontology mapping.
  - Deterministic reciprocal and complementary skill compatibility engine.
  - Optional AI-assisted matching (Gemini / OpenAI / Groq) with server-side secrets and zero-crash fallback.
  - Dedicated `/recommendations` page with filters, refresh button, and "Your Skill Path" guidance.
  - Embedded "Skill Matches For You" card carousel on the Home/Dashboard page.
  - Real-time connection request integration and active connection filtering.
- [ ] **PHASE 14: Post-Meeting Feedback & Ratings**
- [ ] **PHASE 15: User Dashboard & Statistics**
- [ ] **PHASE 16: Admin Dashboard & Protected Stats**
- [ ] **PHASE 17: Security Hardening & Error Handling**
- [ ] **PHASE 18: Responsive Design Polish**
- [ ] **PHASE 19: Comprehensive Testing & Verification**
- [ ] **PHASE 20: Deployment Preparation**
