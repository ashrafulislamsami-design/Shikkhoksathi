# Shiksha AI • ShikkhokSathi Monorepo

Welcome to the **Shiksha AI & ShikkhokSathi** unified repository. This workspace contains the React-based Student UI and the Node.js/Express backend.

---

## 📂 Project Structure

```text
├── backend/          # Node.js + Express API Backend (Port 5000)
├── student-ui/       # React + TypeScript Frontend (Port 3000)
├── package.json      # Monorepo configuration
├── start.js          # Cross-platform concurrent runner
└── README.md         # This document
```

---

## ⚡ Prerequisites

Make sure you have the following installed on your machine:
- **Node.js**: `v18.x` or later
- **npm**: `v9.x` or later

---

## 🚀 Getting Started

To get the application up and running, follow these two simple steps from the **root folder**:

### 1. Install Dependencies
Install dependencies for both the frontend and backend using a single command:
```bash
npm run install:all
```
> **Note**: This automatically runs `npm install` inside the `backend` directory, and `npm install --legacy-peer-deps` inside `student-ui` to safely bypass peer dependency conflicts (such as TypeScript version alignments).

### 2. Start the Application
Start both the backend and frontend concurrently:
```bash
npm start
```
This runs the custom process manager (`start.js`), which:
- Starts the **Backend** in development mode (using `nodemon` on `http://localhost:5000`)
- Starts the **Frontend** development server (using `react-scripts` on `http://localhost:3000`)
- Outputs a unified, color-coded stream of logs to your terminal:
  - `[System]` messages are shown in **Yellow**
  - `[Backend]` logs are shown in **Green**
  - `[Frontend]` logs are shown in **Cyan**

To stop the servers, simply press `Ctrl + C` in your terminal. Both services will be shut down gracefully.

---

## 🛠️ Configuration & Customization

### Backend (`/backend`)
- **Port**: Default is `5000`
- **Environment**: Configured via [backend/.env](file:///d:/Projects/Current%20Situation%20-%20Sami/backups/State_20260116_022116/backend/.env)
- **Database**: Connects to the MongoDB URI specified in `.env`.
  - **In-Memory Fallback**: If the remote MongoDB connection fails or is not configured, the backend automatically spins up an in-memory database (`mongodb-memory-server`) and populates it with mock student accounts for testing.
  - **Mock Accounts**: Seeded accounts use the password `password123`.

### Student UI (`/student-ui`)
- **Port**: Default is `3000`
- **Environment**: Configured via [student-ui/.env](file:///d:/Projects/Current%20Situation%20-%20Sami/backups/State_20260116_022116/student-ui/.env)
- **API URL**: Automatically maps to `http://localhost:5000/api` for API requests.
