// cart.js — shared across all pages

function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || {};
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(id, name, price, image, qty = 1) {
    const cart = getCart();
    const cleanImage = image.replace(/^(\.\.\/)+/, '');
    
    if (cart[id]) {
        cart[id].qty += qty;
    } else {
        cart[id] = { id, name, price, image: cleanImage, qty: qty };
    }
    saveCart(cart);
    updateCartCount();
    showCartFeedback();
}

function removeFromCart(id) {
    const cart = getCart();
    delete cart[id];
    saveCart(cart);
    updateCartCount();
}

function updateQty(id, qty) {
    const cart = getCart();
    if (qty <= 0) {
        delete cart[id];
    } else {
        cart[id].qty = qty;
    }
    saveCart(cart);
    updateCartCount();
}

function clearCart() {
    localStorage.removeItem('cart');
    updateCartCount();
}

function getCartTotal() {
    const cart = getCart();
    return Object.values(cart).reduce((a, b) => a + b.price * b.qty, 0);
}

function getCartCount() {
    const cart = getCart();
    return Object.values(cart).reduce((a, b) => a + b.qty, 0);
}

function updateCartCount() {
    const count = getCartCount();
    const badges = document.querySelectorAll('.cart-count');
    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    });
}

function showCartFeedback() {
    const feedback = document.getElementById('cart-feedback');
    if (!feedback) return;
    feedback.style.opacity = '1';
    feedback.style.transform = 'translateY(0)';
    setTimeout(() => {
        feedback.style.opacity = '0';
        feedback.style.transform = 'translateY(-10px)';
    }, 2000);
}

// run on every page load
document.addEventListener('DOMContentLoaded', updateCartCount);