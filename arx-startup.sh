#!/bin/bash
set -e

npm install --prefix backend
npm install --prefix frontend
npm run --prefix backend db:deploy
npm run --prefix frontend build
npm run --prefix backend build
npm start --prefix backend
