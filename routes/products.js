const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');

const VALID_CATEGORIES = ['camera', 'lens', 'stabiliser', 'bag', 'accessory'];

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

// GET ALL PRODUCTS
router.get('/', async (req, res) => {
    try {
        let { search, category } = req.query;
        const query = {};

        if (search) {
            search = String(search).trim().slice(0, 100);
            query.name = { $regex: escapeRegex(search), $options: 'i' };
        }

        if (category) {
            if (!VALID_CATEGORIES.includes(category)) {
                return res.status(400).json({ message: 'Invalid category' });
            }
            query.category = category;
        }

        const products = await Product.find(query).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET ONE PRODUCT
router.get('/:id', async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ADD PRODUCT
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, description, price, category, image, specs } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
            return res.status(400).json({ message: 'Invalid name' });
        }
        if (!description || typeof description !== 'string' || description.trim().length === 0 || description.length > 500) {
            return res.status(400).json({ message: 'Invalid description' });
        }
        if (price == null || typeof price !== 'number' || price <= 0) {
            return res.status(400).json({ message: 'Invalid price' });
        }
        if (!category || !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        const productData = {
            name: name.trim(),
            description: description.trim(),
            price,
            category,
            image: image && typeof image === 'string' ? image.trim().slice(0, 200) : ''
        };

        if (specs && typeof specs === 'object' && !Array.isArray(specs)) {
            const cleanSpecs = {};
            for (const [k, v] of Object.entries(specs)) {
                if (typeof k === 'string' && typeof v === 'string' && k.length <= 50 && v.length <= 200) {
                    cleanSpecs[k.trim()] = v.trim();
                }
            }
            productData.specs = cleanSpecs;
        }

        const product = new Product(productData);
        await product.save();
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// UPDATE PRODUCT
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const { name, description, price, category, image, specs } = req.body;
        const update = {};

        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
                return res.status(400).json({ message: 'Invalid name' });
            }
            update.name = name.trim();
        }
        if (description !== undefined) {
            if (typeof description !== 'string' || description.trim().length === 0 || description.length > 500) {
                return res.status(400).json({ message: 'Invalid description' });
            }
            update.description = description.trim();
        }
        if (price !== undefined) {
            if (typeof price !== 'number' || price <= 0) {
                return res.status(400).json({ message: 'Invalid price' });
            }
            update.price = price;
        }
        if (category !== undefined) {
            if (!VALID_CATEGORIES.includes(category)) {
                return res.status(400).json({ message: 'Invalid category' });
            }
            update.category = category;
        }
        if (image !== undefined) {
            update.image = typeof image === 'string' ? image.trim().slice(0, 200) : '';
        }
        if (specs !== undefined && typeof specs === 'object' && !Array.isArray(specs)) {
            const cleanSpecs = {};
            for (const [k, v] of Object.entries(specs)) {
                if (typeof k === 'string' && typeof v === 'string' && k.length <= 50 && v.length <= 200) {
                    cleanSpecs[k.trim()] = v.trim();
                }
            }
            update.specs = cleanSpecs;
        }

        const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE PRODUCT
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
