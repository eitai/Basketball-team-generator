#!/bin/bash
set -e

npm install --prefix backend
npm install --prefix frontend
npm run --prefix backend db:deploy
npm run --prefix frontend build
npm run --prefix backend build

# Start backend on port 3001 in background
PORT=3001 npm start --prefix backend &

# Wait for backend to be ready
sleep 3

# Start vite preview on Arxentra's assigned PORT, proxying /api/* to backend
npm run preview --prefix frontend -- --host --port "${PORT:-4173}"
