require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

const USER_ID = '69c0ced5b2455e9541f30ec9';

const orders = [
    {
        user: USER_ID,
        items: [
            { name: 'Sony A7 III', price: 1299, qty: 1, image: 'images/products/a7m3_1.jpg' }
        ],
        total: 1299,
        paypalOrderId: 'SANDBOX-TEST-001',
        status: 'confirmed',
        createdAt: new Date('2026-03-10')
    },
    {
        user: USER_ID,
        items: [
            { name: 'Sony 50mm f1.8', price: 179, qty: 1, image: 'images/products/50mm_1.jpg' },
            { name: 'Sony NP-FZ100 Battery', price: 69, qty: 2, image: 'images/products/battery_1.jpg' }
        ],
        total: 317,
        paypalOrderId: 'SANDBOX-TEST-002',
        status: 'confirmed',
        createdAt: new Date('2026-03-15')
    },
    {
        user: USER_ID,
        items: [
            { name: 'Sports Photography Booking', price: 350, qty: 1, image: 'images/services/football1.jpg' }
        ],
        total: 350,
        paypalOrderId: 'SANDBOX-TEST-003',
        status: 'confirmed',
        createdAt: new Date('2026-03-18')
    },
    {
        user: USER_ID,
        items: [
            { name: 'Wedding Photography Booking', price: 1500, qty: 1, image: 'images/services/wedding1.jpg' }
        ],
        total: 1500,
        paypalOrderId: 'SANDBOX-TEST-004',
        status: 'confirmed',
        createdAt: new Date('2026-03-20')
    }
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
    await Order.insertMany(orders);
    console.log('Orders seeded successfully');
    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});