# restaurant-R-QR4

Minimal QR redirect service that looks up a restaurant by `qrId` and redirects
based on its plan.

## Endpoints
- `GET /health`
- `GET /r/:restaurantId`

## Setup
1. `npm install`
2. Create `.env` from `.env.example`
3. `npx prisma generate`
4. `npm start`
