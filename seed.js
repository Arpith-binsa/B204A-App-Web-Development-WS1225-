require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
    {
        name: 'Sony A7 III',
        description: 'Full-frame mirrorless. My primary shooting body for everything from sports to portraits.',
        price: 1299,
        category: 'camera',
        image: 'images/products/a7m3_1.jpg',
        specs: { Brand: 'Sony', Sensor: '24.2MP Full-Frame', ISO: '100-51200', Video: '4K 30fps', Weight: '650g' }
    },
    {
        name: 'Sony 200-600mm G',
        description: 'My go-to for sports and action. Reaches far without losing sharpness.',
        price: 1548,
        category: 'lens',
        image: 'images/products/200600_1.jpg',
        specs: { Brand: 'Sony', 'Focal Length': '200-600mm', Aperture: 'f/5.6-6.3', Mount: 'Sony E-Mount', Weight: '2115g' }
    },
    {
        name: 'Sony 50mm f1.8',
        description: 'Lightweight and sharp. Perfect for portraits, fashion and everyday shooting.',
        price: 179,
        category: 'lens',
        image: 'images/products/50mm_1.jpg',
        specs: { Brand: 'Sony', 'Focal Length': '50mm', Aperture: 'f/1.8', Mount: 'Sony E-Mount', Weight: '186g' }
    },
    {
        name: 'DJI RS3 Mini',
        description: 'Compact gimbal that keeps footage buttery smooth without the bulk.',
        price: 299,
        category: 'stabiliser',
        image: 'images/products/dji_1.jpg',
        specs: { Brand: 'DJI', Payload: '2kg', Battery: '10 hours', Weight: '795g' }
    },
    {
        name: 'Kentfaith Backpack',
        description: 'Carries all my gear comfortably on location. Well built and well organised.',
        price: 89,
        category: 'bag',
        image: 'images/products/kentfaith_1.jpg',
        specs: { Brand: 'Kentfaith', Material: 'Nylon', Capacity: '25L' }
    },
    {
        name: 'Sony SF-G 128GB SD Card',
        description: 'Fast and reliable. Essential for high speed shooting and 4K video.',
        price: 189,
        category: 'accessory',
        image: 'images/products/sdcard_1.jpg',
        specs: { Brand: 'Sony', Capacity: '128GB', 'Read Speed': '300MB/s', 'Write Speed': '299MB/s' }
    },
    {
        name: 'Sony NP-FZ100 Battery',
        description: 'Official Sony battery for the A7 series. Always carry a spare on shoots.',
        price: 69,
        category: 'accessory',
        image: 'images/products/battery_1.jpg',
        specs: { Brand: 'Sony', Capacity: '2280mAh', Compatible: 'A7 III, A7R IV, A9' }
    }
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log('Products seeded successfully');
    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});