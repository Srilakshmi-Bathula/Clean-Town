# CleanTown

CleanTown is an event-driven smart waste management system where users can report issues, swap reusable items, and earn reward points.

## Tech Stack
* Frontend: React (Vite + TypeScript)
* Backend: Node.js + Express.js
* Database: Firebase (In-Memory mock active; swap out `db` with Firestore for prod)
* Maps: Google Maps API (`@react-google-maps/api`)

## Features
1. **Report System**: Users can report trash, full bins, or smoke (emergency). Hazards are highlighted in red.
2. **Eco-Swap**: Reusable items marketplace to claim and swap.
3. **Point System**: Earn points by contributing (50 for report, 100 for swap).
4. **Map View**: Dynamic display of issues globally.

## How to Run

1. **Start the Backend**:
   ```bash
   cd backend
   npm install
   node server.js
   ```
   *Runs on port 5000*

2. **Start the Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Runs on port 5173*

## Notes on the Data
Currently, the MVP backend uses an in-memory array to simulate Firebase so that the application can be run immediately without the user needing to set up a Firebase Service Account and paste their keys. To move to production, swap the in-memory `db` variables in `server.js` with calls to `firebase-admin` initialized in your environment.
