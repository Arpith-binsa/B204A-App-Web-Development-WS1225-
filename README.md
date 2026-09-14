# Arpith Binsa — Photography service and product page
# Project for B204A App & Web Development (WS1225)

A full-stack e-commerce single-page application (SPA) built around a photography
business: users browse and buy gear, book photography services, and pay through
the PayPal Sandbox. Frontend is plain HTML/CSS/JavaScript with client-side
routing; backend is Node.js + Express.js; database is MongoDB (Mongo Database).

## Live Demo
https://arpith-binsa.onrender.com

Note: The live demo is hosted on Render's free tier. The site might take a few
moments to load if the server hasn't been active in a long time.

## Architecture (Single-Page Application)
The whole frontend is served from `public/index.html`. It uses a client-side
router (the `routes` object, `navigate()`, `history.pushState`, and a `popstate`
listener) to swap views into a single `<div id="app">` mount point without full
page reloads. The Express server has a catch-all route (`/*splat`) that returns
`index.html` for any non-API path, so deep links and refreshes work. There are
no separate per-page HTML files — every view (home, products, product detail,
services, service detail, cart, account, add-product, contact) is rendered by
JavaScript in the SPA.

## Test Credentials
Use these to log in and test the site without registering. (These are examples —
replace with your own after rotating credentials.)

Site Login (regular user):
- Email: testuser@test.com
- Password: Test1234

Admin credentials and PayPal Sandbox buyer credentials are provided separately
in the report / private video, never committed to the repo.

## Environment Variables
Copy `.env.example` to `.env` and fill in real values. Never commit `.env`
(it is git-ignored) and never paste real secrets into the report. On Render,
set these in the dashboard under the "Environment" tab.

- `MONGO_URI` — MongoDB connection string.
- `JWT_SECRET` — long random string used to sign JWTs (JSON Web Tokens).
- `PORT` — port to listen on (default 3000).
- `PAYPAL_CLIENT_ID` — PayPal Sandbox client-id (public value, served to the
  browser via `/api/config`).
- `PAYPAL_CURRENCY` — currency code (default EUR).
- `CORS_ORIGINS` — comma-separated allow-list of browser origins; leave empty
  for same-origin-only (the default, since this server also serves the frontend).

Generate a strong JWT secret with:
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## Run Locally

### Option 1 — With Docker
1. Install Docker from docker.com
2. Clone the repo:
   `git clone https://github.com/Arpith-binsa/B204A-App-Web-Development-WS1225-.git`
3. Create a `.env` file in the project root (copy from `.env.example`).
4. Build the Docker image:
   `docker build -t arpith-binsa .`
5. Run the container:
   `docker run -p 3000:3000 --env-file .env arpith-binsa`
6. Open http://localhost:3000

### Option 2 — Without Docker
1. Clone the repo (as above).
2. Install dependencies: `npm install`
3. Create a `.env` file (copy from `.env.example`).
4. Seed the database with initial products: `node seed.js`
5. Start the server: `node server.js`
6. Open http://localhost:3000

## Admin Access
To access the add-product page you need an admin account. Admin-only actions
(create/update/delete product) are enforced on the server, not just hidden in
the UI. A regular user calling those endpoints directly receives HTTP 403.
Promote a user to admin by setting `role: "admin"` on their document in MongoDB.

## Security
This project follows OWASP (Open Web Application Security Project) best practices:

- **Secrets** live only in environment variables. Nothing sensitive is
  hard-coded, and the server refuses to start if `MONGO_URI` or `JWT_SECRET`
  is missing.
- **Rate limiting** (`express-rate-limit`) on all public endpoints: a broad
  limiter across `/api`, plus stricter limiters on auth (login/register),
  the contact form, and write operations. All return graceful HTTP 429.
- **Input validation & sanitization**: every write endpoint uses a strict field
  allow-list (rejecting unexpected fields, e.g. an attempt to set `role`),
  type/length checks, and a NoSQL-injection sanitizer that strips MongoDB
  operator keys (`$`, `.`) from all input.
- **Security headers** via `helmet`, with a Content Security Policy that allows
  the PayPal SDK.
- **Access control**: passwords hashed with bcrypt; routes protected by JWT
  verification; admin-only product management enforced server-side.
- **CORS** restricted to a configurable allow-list.

## Project Structure
```
public/            Frontend SPA
  index.html       Single entry point + client-side router + all views
  cart.js          Cart helper (localStorage)
  style.css        Styles
  images/          Product and service images
models/            Mongoose schemas (User, Product, Order)
routes/            API routers (auth, products, orders, contact)
middleware/
  auth.js          JWT verification
  admin.js         Admin-role guard
  sanitize.js      NoSQL-injection sanitizer (Express 5 safe)
  rateLimiters.js  Rate limiter definitions
server.js          App entry point (helmet, CORS, sanitize, routes, SPA fallback)
Dockerfile         Container build
.env.example       Environment variable template
```
