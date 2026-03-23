# Arpith Binsa — Photography & Gear Shop
# Project for B204A-App-Web-Development-Ws1225

## Live Demo
https://arpith-binsa.onrender.com

## Prerequisites
- Node.js installed
- MongoDB Atlas account (or use the live demo)

## Run Locally

### Option 1 — With Docker
1. Install Docker from docker.com
2. Clone the repo:
   git clone https://github.com/Arpith-binsa/B204A-App-Web-Development-WS1225-.git
3. Create a `.env` file in the root:
   MONGO_URI=(Cant Share Due to Security Reasons)
   JWT_SECRET=(Cant Share)
   PORT=3000
   Use the Credentials Shown in Private Youtube Video

4. Build and run:
   docker build -t arpith-binsa .
   docker run -p 3000:3000 --env-file .env arpith-binsa
5. Open http://localhost:3000

### Option 2 — Without Docker
1. Clone the repo
2. Run: npm install
3. Create .env file as above
4. Run: node server.js
5. Open http://localhost:3000

## Test Admin Account
Register an account then contact me to upgrade to admin.
Or Use the Credentials i Show in the Youtube Video to Login

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/products
- POST /api/products (admin only)
- DELETE /api/products/:id (admin only)
- GET /api/orders/my-orders
- POST /api/orders
- POST /api/contact