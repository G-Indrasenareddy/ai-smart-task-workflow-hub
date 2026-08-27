# AI-Assisted Smart Task & Workflow Hub

Initial monorepo setup for the AI-Assisted Smart Task & Workflow Hub application.

## Project Structure

```
ai-smart-task-workflow-hub/
├── client/              # React + Vite + Tailwind CSS frontend
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       └── utils/
├── server/              # Node.js + Express backend
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── utils/
├── .gitignore
├── package.json
└── README.md
```

## Getting Started

### 1. Install Dependencies
Run the following command from the root directory to install dependencies for the root, client, and server:
```bash
npm run install:all
```
*(Or navigate to `client` and `server` folders and run `npm install` individually)*

### 2. Development Mode
Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run client and server separately:
- **Client (Vite)**: `npm run dev:client` (Runs on http://localhost:5173)
- **Server (Express)**: `npm run dev:server` (Runs on http://localhost:5000)

## Tech Stack
- **Frontend**: React.js, Vite, Tailwind CSS, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
