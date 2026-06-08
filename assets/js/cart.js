// ./assets/js/cart.js - Страница корзины

const Cart = {
    items: [],
    
    init: async function() {
        console.log('Cart.init() started');
        
        // Ждем инициализации App
        if (!window.App) {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        await this.loadCart();
        this.renderCart();
        this.initEvents();
    },
    
    loadCart: async function() {
        this.items = await window.App.getCart();
        console.log('Cart loaded:', this.items.length, 'items');
    },
    
    renderCart: function() {
        const container = document.getElementById('cart-items');
        const totalEl = document.getElementById('cart-total');
        
        if (!container) return;
        
        if (this.items.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 60px;"><h3>Корзина пуста</h3><a href="catalog.html" class="btn btn--primary">Перейти в каталог</a></div>';
            if (totalEl) totalEl.innerHTML = '0 ₽';
            return;
        }
        
        container.innerHTML = this.items.map(item => `
            <div class="cart-item" data-id="${item.productId}">
                <div class="cart-item__image">
                    <img src="${item.image || './assets/img/product-cart-img1.png'}" alt="${item.name}">
                </div>
                <div class="cart-item__info">
                    <h3>${item.name}</h3>
                    <p>${item.price.toLocaleString()} ₽</p>
                </div>
                <div class="cart-item__quantity">
                    <button class="qty-minus" data-id="${item.productId}">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-plus" data-id="${item.productId}">+</button>
                </div>
                <div class="cart-item__total">
                    ${(item.price * item.quantity).toLocaleString()} ₽
                </div>
                <button class="cart-item__remove" data-id="${item.productId}">✕</button>
            </div>
        `).join('');
        
        const total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (totalEl) totalEl.innerHTML = `${total.toLocaleString()} ₽`;
    },
    
    initEvents: function() {
        document.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.dataset.id;
                const item = this.items.find(i => i.productId === id);
                if (item && item.quantity > 1) {
                    await window.App.updateCartItem(id, item.quantity - 1);
                    await this.loadCart();
                    this.renderCart();
                    this.initEvents();
                }
            });
        });
        
        document.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.dataset.id;
                const item = this.items.find(i => i.productId === id);
                if (item) {
                    await window.App.updateCartItem(id, item.quantity + 1);
                    await this.loadCart();
                    this.renderCart();
                    this.initEvents();
                }
            });
        });
        
        document.querySelectorAll('.cart-item__remove').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.dataset.id;
                await window.App.updateCartItem(id, 0);
                await this.loadCart();
                this.renderCart();
                this.initEvents();
            });
        });
        
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', async () => {
                await window.App.createOrder();
                await this.loadCart();
                this.renderCart();
                this.initEvents();
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Cart: DOM loaded');
    setTimeout(() => {
        Cart.init();
    }, 200);
});