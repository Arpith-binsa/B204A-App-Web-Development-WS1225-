const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    items: [{
        name: String,
        price: Number,
        qty: Number,
        image: String
    }],
    total: {
        type: Number,
        required: true
    },
    paypalOrderId: {
        type: String
    },
    status: {
        type: String,
        default: 'confirmed'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', OrderSchema);