const ProductInfo = {
    productId: null,
    product: null,
    quantity: 1,
    
    init: async function() {
        console.log('ProductInfo initializing...');
        
        const params = new URLSearchParams(window.location.search);
        this.productId = params.get('id');
        
        if (!this.productId) {
            window.location.href = 'catalog.html';
            return;
        }
        
        if (!window.App) {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        await this.loadProduct();
        this.initQuantityControls();
        this.initAddToCart();
        this.initFavorite();
        this.initTabs();
    },
    
    loadProduct: async function() {
        try {
            this.product = await window.App.getProductById(this.productId);
            
            if (!this.product) {
                window.location.href = 'catalog.html';
                return;
            }
            
            this.renderProduct();
            this.checkFavorite();
            console.log('Product loaded:', this.product.name);
        } catch (error) {
            console.error('Error loading product:', error);
        }
    },
    
    renderProduct: function() {
        const container = document.getElementById('product-details');
        if (!container) return;
        
        container.innerHTML = `
            <div class="product-gallery">
                <div class="gallery-main">
                    <img src="${this.product.image || 'assets/img/tovar-info-main-img.png'}" alt="${this.product.name}" class="gallery-main__img" onerror="this.src='https://via.placeholder.com/400'">
                </div>
            </div>
            <div class="product-info">
                <div class="product-header">
                    <h1 class="product-title">${this.product.name}</h1>
                </div>
                <div class="product-pricing">
                    <span class="product-price">${this.product.price.toLocaleString()} ₽</span>
                    ${this.product.oldPrice ? `<span class="product-old-price">${this.product.oldPrice.toLocaleString()} ₽</span>` : ''}
                </div>
                <div class="product-quantity-row">
                    <div class="quantity-selector">
                        <span class="quantity-title">Количество:</span>
                        <div class="quantity-controls">
                            <button class="quantity-btn" id="qty-minus">-</button>
                            <span class="quantity-value" id="qty-value">1</span>
                            <button class="quantity-btn" id="qty-plus">+</button>
                        </div>
                    </div>
                    <p class="in-stock">✅ В наличии: ${this.product.inStock || 0} шт.</p>
                </div>
                <div class="product-actions">
                    <button class="btn btn--cart btn--full" id="add-to-cart-btn">
                        🛒 Добавить в корзину
                    </button>
                    <button class="product-favourite" id="favorite-btn">
                        <img src="assets/img/tovar-info-favourite-icon.png" alt="В избранное">
                    </button>
                </div>
            </div>
        `;
        
        const descPanel = document.getElementById('description');
        if (descPanel && this.product.description) {
            descPanel.innerHTML = `<p>${this.product.description}</p>`;
        }
        
        const specsPanel = document.getElementById('specifications');
        if (specsPanel && this.product.specifications) {
            let html = '<ul style="list-style: none; padding: 0;">';
            for (const [key, value] of Object.entries(this.product.specifications)) {
                html += `<li style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>${key}:</strong> ${value}</li>`;
            }
            html += '</ul>';
            specsPanel.innerHTML = html;
        }
    },
    
    initQuantityControls: function() {
        const minus = document.getElementById('qty-minus');
        const plus = document.getElementById('qty-plus');
        const value = document.getElementById('qty-value');
        
        if (minus) {
            minus.addEventListener('click', () => {
                if (this.quantity > 1) {
                    this.quantity--;
                    if (value) value.textContent = this.quantity;
                }
            });
        }
        
        if (plus) {
            plus.addEventListener('click', () => {
                const max = this.product?.inStock || 99;
                if (this.quantity < max) {
                    this.quantity++;
                    if (value) value.textContent = this.quantity;
                } else {
                    alert(`⚠️ Доступно только ${max} шт.`);
                }
            });
        }
    },
    
    initAddToCart: function() {
        const btn = document.getElementById('add-to-cart-btn');
        if (btn) {
            btn.addEventListener('click', async () => {
                await window.App.addToCart(this.productId, this.quantity);
            });
        }
    },
    
    initFavorite: function() {
        const btn = document.getElementById('favorite-btn');
        if (!btn) return;
        
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Product page favorite clicked');
            
            if (!window.App.currentUser) {
                alert('Пожалуйста, войдите в аккаунт');
                const modal = document.getElementById('login-modal');
                if (modal) modal.style.display = 'flex';
                return;
            }
            
            const isActive = newBtn.classList.contains('active');
            const img = newBtn.querySelector('img');
            
            newBtn.style.pointerEvents = 'none';
            newBtn.style.opacity = '0.5';
            
            try {
                if (isActive) {
                    const result = await window.App.removeFromFavorites(this.productId);
                    if (result) {
                        newBtn.classList.remove('active');
                        if (img) img.src = 'assets/img/tovar-info-favourite-icon.png';
                    }
                } else {
                    const result = await window.App.addToFavorites(this.productId);
                    if (result) {
                        newBtn.classList.add('active');
                        if (img) img.src = 'assets/img/tovar-info-favourite-icon-active.png';
                    }
                }
            } catch (error) {
                console.error('Error toggling favorite:', error);
            } finally {
                newBtn.style.pointerEvents = 'auto';
                newBtn.style.opacity = '1';
            }
        });
    },
    
    checkFavorite: function() {
        console.log('Checking favorite status for product:', this.productId);
        
        if (!window.App.currentUser) {
            console.log('No user logged in');
            return;
        }
        
        const checkInterval = setInterval(() => {
            if (window.App.favorites !== undefined) {
                clearInterval(checkInterval);
                const isFav = window.App.favorites.includes(this.productId);
                console.log('Is product in favorites?', isFav);
                
                const btn = document.getElementById('favorite-btn');
                if (btn && isFav) {
                    btn.classList.add('active');
                    const img = btn.querySelector('img');
                    if (img) img.src = 'assets/img/tovar-info-favourite-icon-active.png';
                }
            }
        }, 100);
        
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 3000);
    },
    
    initTabs: function() {
        const tabs = document.querySelectorAll('.tab-btn');
        const panels = document.querySelectorAll('.tab-panel');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(target).classList.add('active');
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        ProductInfo.init();
    }, 200);
});
