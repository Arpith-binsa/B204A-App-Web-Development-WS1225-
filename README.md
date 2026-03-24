# Arpith Binsa — Photography & Gear Shop
# Project for B204A App & Web Development (WS1225)

## Live Demo
https://arpith-binsa.onrender.com

Note: The live demo is hosted on Render's free tier. If the site takes 
30-50 seconds to load on first visit, this is normal — the server spins 
down after inactivity and needs a moment to wake up.

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB Atlas
- Payment: PayPal Sandbox
- Deployment: Render

## Test Credentials
Use these to log in and test the site without registering:

Site Login:
- Email: testuser@test.com
- Password: Test1234

PayPal Sandbox Buyer credentials are shown in the private YouTube video 
submitted alongside this report.

## Run Locally

### Option 1 — With Docker
1. Install Docker from docker.com
2. Clone the repo:
   git clone https://github.com/Arpith-binsa/B204A-App-Web-Development-WS1225-.git
3. Create a `.env` file in the project root:
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=any_random_string
   PORT=3000
   
   Note: You will need your own free MongoDB Atlas account to get a 
   connection string. Alternatively just use the live demo above.

4. Build the Docker image:
   docker build -t arpith-binsa .

5. Run the container:
   docker run -p 3000:3000 --env-file .env arpith-binsa

6. Open http://localhost:3000

### Option 2 — Without Docker
1. Clone the repo:
   git clone https://github.com/Arpith-binsa/B204A-App-Web-Development-WS1225-.git
2. Install dependencies:
   npm install
3. Create a `.env` file as described above
4. Seed the database with initial products:
   node seed.js
5. Start the server:
   node server.js
6. Open http://localhost:3000

## Admin Access
To access the add product page you need an admin account.
The test account above is a regular user.
Admin credentials are shown in the private YouTube video.

## API Endpoints

### Authentication
- POST /api/auth/register — Register a new user
- POST /api/auth/login — Login and receive JWT token
- GET /api/auth/me — Get current logged in user

### Products
- GET /api/products — Get all products (supports ?search= and ?category=)
- GET /api/products/:id — Get single product
- POST /api/products — Add new product (admin only)
- PUT /api/products/:id — Update product (admin only)
- DELETE /api/products/:id — Delete product (admin only)

### Orders
- POST /api/orders — Save order after PayPal payment
- GET /api/orders/my-orders — Get orders for logged in user

### Contact
- POST /api/contact — Save contact form submission
- GET /api/contact — Get all messages (admin only)

## Database Collections
- users — registered user accounts
- products — gear listings
- orders — confirmed purchases and bookings
- messages — contact form submissions

## Seed Database
To populate the database with initial product data:
node seed.js