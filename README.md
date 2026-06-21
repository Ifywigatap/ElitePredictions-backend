# Elite Predictions Backend

Backend API powering the Elite Predictions platform.

## Overview

Elite Predictions Backend provides:

* User Authentication
* VIP Subscription Management
* Match Predictions
* Live Scores
* AI-Powered Insights
* Payment Processing
* Webhooks
* Real-time Updates via Socket.io
* Firestore Database Integration

## Tech Stack

### Backend

* Node.js
* Express.js
* Socket.io

### Database

* Firebase Firestore

### Authentication

* Firebase Authentication

### Storage

* Firebase Storage

### Hosting

* Render

### Frontend

* React
* Vite
* Vercel

## Features

### Authentication

* User registration
* User login
* JWT authentication
* Firebase Authentication integration

### Predictions

* Daily predictions
* VIP predictions
* Match analysis
* Prediction history

### Live Scores

* Real-time score updates
* WebSocket broadcasting

### Payments

* Paystack integration
* Subscription verification
* VIP plan activation

### AI Features

* AI-powered match insights
* Automated prediction assistance

## Project Structure

```text
Backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   ├── cron.js
│   └── liveScoreEmitter.js
│
├── server.js
├── package.json
├── .env
└── README.md
```

## Installation

### Clone Repository

```bash
git clone https://github.com/Ifywigatap/ElitePredictions-backend.git
cd ElitePredictions-backend
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create:

```text
.env
```

Example:

```env
NODE_ENV=development

PORT=5000

FRONTEND_URL=http://localhost:5173

JWT_SECRET=your-secret

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

PAYSTACK_SECRET_KEY=

FOOTBALL_API_KEY=

OPENAI_API_KEY=
OPENAI_ENABLED=false

REDIS_ENABLED=false
```

## Running Locally

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

## API Endpoints

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
```

### Predictions

```http
GET  /api/predictions
POST /api/predictions
```

### VIP

```http
GET /api/vip
```

### Scores

```http
GET /api/scores
```

### AI

```http
POST /api/ai/analyze
```

### Payments

```http
POST /api/payments/initialize
POST /api/payments/verify
```

### Plans

```http
GET /api/plans
```

### Health Check

```http
GET /api/health
```

## Deployment

### Frontend

Deploy on Vercel.

### Backend

Deploy on Render.

### Firebase Services

* Firebase Authentication
* Firestore Database
* Firebase Storage

## Environment Variables for Render

```env
NODE_ENV=production

FRONTEND_URL=https://elite-predictions-frontend.vercel.app

JWT_SECRET=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

PAYSTACK_SECRET_KEY=

FOOTBALL_API_KEY=

OPENAI_API_KEY=

OPENAI_ENABLED=false

REDIS_ENABLED=false
```

## Health Check

```http
GET /api/health
```

Expected Response:

```json
{
  "status": "UP",
  "database": "Connected to Firestore"
}
```

## License

Proprietary software owned by Elite Predictions.

© Elite Predictions. All rights reserved.
