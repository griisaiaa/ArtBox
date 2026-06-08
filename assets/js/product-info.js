// ./assets/js/product-info.js

import { getDoc, doc } from './firebase-config.js';
import CommonFunctions from './script.js';

const ProductInfoFunctions = {
    productId: null,
    product: null,
    quantity: 1,
    
    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.productId = urlParams.get('id');
        
        if (this.productId) {
            await this.loadProduct();
            this.initQuantityControls();
            this.initAddToCart();
            this.initFavorite();
            this.initTabs();
        } else {
            window.location.href = 'catalog.html';
        }
    },
    
    async loadProduct() {
        try {
            const productRef = doc(CommonFunctions.db, "products", this.productId);
            const productDoc = await getDoc(productRef);
            
            if (productDoc.exists()) {
                this.product = { id: productDoc.id, ...productDoc.data() };
                this.displayProductInfo();
            } else {
                window.location.href = 'catalog.html';
            }
        } catch (error) {
            console.error('Ошибка загрузки товара:', error);
        }
    },
    
    displayProductInfo() {
        const product = this.product;
        
        const titleElement = document.querySelector('.product-title');
        if (titleElement) titleElement.textContent = product.name;
        
        const priceElement = document.querySelector('.product-price');
        if (priceElement) priceElement.textContent = `${product.price.toLocaleString()} ₽`;
        
        if (product.oldPrice) {
            const oldPriceElement = document.querySelector('.product-old-price');
            const discountElement = document.querySelector('.product-discount');
            if (oldPriceElement) oldPriceElement.textContent = `${product.oldPrice.toLocaleString()} ₽`;
            if (discountElement) discountElement.textContent = `-${Math.round((1 - product.price / product.oldPrice) * 100)}%`;
        }
        
        const inStockElement = document.querySelector('.in-stock');
        if (inStockElement) {
            const inStock = product.inStock || 0;
            inStockElement.textContent = `В наличии: ${inStock} шт.`;
        }
        
        const mainImg = document.querySelector('.gallery-main__img');
        if (mainImg && product.image) {
            mainImg.src = product.image;
            mainImg.alt = product.name;
        }
        
        const descriptionPanel = document.getElementById('description');
        if (descriptionPanel && product.description) {
            descriptionPanel.innerHTML = product.description.replace(/\n/g, '<br>');
        }
    },
    
    initQuantityControls() {
        const quantityValue = document.querySelector('.quantity-value');
        const minusBtn = document.querySelector('.quantity-btn:first-child');
        const plusBtn = document.querySelector('.quantity-btn:last-child');
        
        if (minusBtn) {
            minusBtn.addEventListener('click', () => {
                if (this.quantity > 1) {
                    this.quantity--;
                    if (quantityValue) quantityValue.textContent = this.quantity;
                }
            });
        }
        
        if (plusBtn) {
            plusBtn.addEventListener('click', () => {
                const maxStock = this.product?.inStock || 99;
                if (this.quantity < maxStock) {
                    this.quantity++;
                    if (quantityValue) quantityValue.textContent = this.quantity;
                } else {
                    alert(`Доступно только ${maxStock} шт.`);
                }
            });
        }
    },
    
    initAddToCart() {
        const addToCartBtn = document.querySelector('.btn--cart');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', async () => {
                try {
                    await CommonFunctions.addToCart(this.productId, this.quantity);
                    alert(`Товар "${this.product?.name}" добавлен в корзину в количестве ${this.quantity} шт.`);
                } catch (error) {
                    alert('Необходимо авторизоваться');
                }
            });
        }
    },
    
    async initFavorite() {
        const favButton = document.querySelector('.product-favourite');
        if (!favButton) return;
        
        const favorites = await CommonFunctions.getFavorites();
        const isFavorite = favorites.some(fav => fav.id === this.productId);
        
        if (isFavorite) {
            favButton.classList.add('active');
            const favImg = favButton.querySelector('img');
            if (favImg) favImg.src = './assets/img/tovar-info-favourite-icon-active.png';
        }
        
        favButton.addEventListener('click', async () => {
            try {
                const isActive = favButton.classList.contains('active');
                const img = favButton.querySelector('img');
                
                if (isActive) {
                    await CommonFunctions.removeFromFavorites(this.productId);
                    favButton.classList.remove('active');
                    if (img) img.src = './assets/img/tovar-info-favourite-icon.png';
                    alert('Товар удален из избранного');
                } else {
                    await CommonFunctions.addToFavorites(this.productId);
                    favButton.classList.add('active');
                    if (img) img.src = './assets/img/tovar-info-favourite-icon-active.png';
                    alert('Товар добавлен в избранное');
                }
            } catch (error) {
                alert('Необходимо авторизоваться');
            }
        });
    },
    
    initTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ProductInfoFunctions.init();
});

export default ProductInfoFunctions;