# Cricket League Auction Software

A complete real-time auction system for a cricket league, featuring live bidding, team management, and an admin dashboard. Built with the PERN/MERN-like stack (SQLite instead of Mongo/Postgres for simplicity) and Socket.io.

## Features

- **Real-time Bidding**: Instant bid updates across all connected clients using Socket.io.
- **Admin Dashboard**: complete control to add players, start/stop auctions, and manage the process.
- **Team Management**: View team budgets, squads, and remaining purse in real-time.
- **Visuals**: Premium glassmorphism design with responsive layouts.

## Prerequisities

- Node.js (v16+)
- npm

## Setup & Running

This project consists of two parts: the backend server and the frontend client. You need to run them in **separate terminals**.

### 1. Start the Server (Backend)

The server handles the database (SQLite), API routes, and real-time socket connections.

```bash
cd server
npm install
npm start
```

*The server runs on `http://localhost:5000`*

### 2. Start the Client (Frontend)

The client is a React application built with Vite.

```bash
cd client
npm install
npm run dev
```

*The client runs on `http://localhost:5173` (usually)*

## How to Use

1.  **Open the Admin Panel**: Navigate to `/admin`.
    -   Add Players using the form.
    -   In the "Players List", click "Start" next to a player to begin the auction for them.
2.  **Open the Auction Page**: Navigate to `/` (Home).
    -   This is the public view where teams place bids.
    -   Open this in multiple tabs (or simulate multiple computers) to act as different teams.
    -   Click the team buttons to bid. Budget checks are enforced!
3.  **View Teams**: Navigate to `/teams`.
    -   See the current squad of each team and their spent/remaining budget.

## Project Structure

```
cricket-auction/
├── server/          # Backend (Node, Express, SQLite, Socket.io)
│   ├── auction.db   # SQLite Database file (auto-created)
│   └── routes/      # API Endpoints
└── client/          # Frontend (React, Vite, Tailwind-ish CSS)
    └── src/
        ├── pages/   # Application Pages
        └── socket.js# Socket connection instance
```

## Troubleshooting

-   **Port Conflicts**: Ensure ports 5000 and 5173 are free.
-   **Database**: If you want to perform a hard reset, delete the `server/auction.db` file and restart the server; it will recreate the DB and seed the teams again.
