// ./assets/js/catalog.js

import { db, collection, getDocs } from './firebase-config.js';
import CommonFunctions from './script.js';

const CatalogFunctions = {
    allProducts: [],
    currentFilters: {
        category: 'all',
        brand: 'all',
        minPrice: 0,
        maxPrice: 10000,
        sortBy: 'popular'
    },
    
    async loadProducts() {
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            this.allProducts = [];
            querySnapshot.forEach((doc) => {
                this.allProducts.push({ id: doc.id, ...doc.data() });
            });
            this.filteredProducts = [...this.allProducts];
            this.renderProducts(this.filteredProducts);
            this.updateProductsCount(this.filteredProducts.length);
        } catch (error) {
            console.error("Ошибка загрузки товаров:", error);
        }
    },
    
    renderProducts(products) {
        const productsGrid = document.querySelector('.products-grid');
        if (!productsGrid) return;
        
        if (products.length === 0) {
            productsGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Товаров не найдено</p>';
            return;
        }
        
        productsGrid.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product.id}" data-price="${product.price}">
                <button class="product-card__favourite" data-product-id="${product.id}">
                    <img src="./assets/img/product-cart-favoruite-icon.png" alt="В избранное">
                </button>
                <div class="product-card__image">
                    <a href="product-info.html?id=${product.id}">
                        <img src="${product.image || './assets/img/product-cart-img1.png'}" alt="${product.name}">
                    </a>
                </div>
                <div class="product-card__content">
                    <h3 class="product-card__title">
                        <a href="product-info.html?id=${product.id}">${product.name}</a>
                    </h3>
                    <div class="product-card__rating">
                        <div class="stars">
                            ${this.generateStars(product.rating || 4)}
                        </div>
                        <span class="rating-count">(${product.reviews || 0})</span>
                    </div>
                    <div class="product-card__footer">
                        <span class="product-card__price">${product.price.toLocaleString()} ₽</span>
                        <button class="btn btn--cart" data-product-id="${product.id}">
                            <img src="./assets/img/product-cart-btn-basket-icon.png" alt="В корзину">
                            В корзину
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        this.initAddToCart();
        this.initFavorites();
    },
    
    generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += i <= rating ? 
                '<img src="./assets/img/product-cart-active-star-icon.png" alt="★">' : 
                '<img src="./assets/img/product-cart-notactive-star-icon.png" alt="☆">';
        }
        return stars;
    },
    
    updateProductsCount(count) {
        const productsCount = document.querySelector('.products-count');
        if (productsCount) productsCount.textContent = `Найдено товаров: ${count}`;
    },
    
    applyFilters() {
        let filtered = [...this.allProducts];
        
        if (this.currentFilters.category && this.currentFilters.category !== 'all') {
            filtered = filtered.filter(p => p.category === this.currentFilters.category);
        }
        if (this.currentFilters.brand && this.currentFilters.brand !== 'all') {
            filtered = filtered.filter(p => p.brand === this.currentFilters.brand);
        }
        filtered = filtered.filter(p => p.price >= this.currentFilters.minPrice && p.price <= this.currentFilters.maxPrice);
        
        this.renderProducts(filtered);
        this.updateProductsCount(filtered.length);
    },
    
    initFilters() {
        const categoryRadios = document.querySelectorAll('input[name="category"]');
        categoryRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.currentFilters.category = e.target.value;
                    this.applyFilters();
                }
            });
        });
        
        const brandRadios = document.querySelectorAll('input[name="brand"]');
        brandRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.currentFilters.brand = e.target.value;
                    this.applyFilters();
                }
            });
        });
    },
    
    initSorting() {
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sortBy = e.target.value;
                this.applyFilters();
            });
        }
    },
    
    initAddToCart() {
        document.querySelectorAll('.btn--cart').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const productId = button.dataset.productId;
                const product = this.allProducts.find(p => p.id === productId);
                try {
                    await CommonFunctions.addToCart(productId, 1);
                    alert(`Товар "${product?.name}" добавлен в корзину!`);
                } catch (error) {
                    console.error('Ошибка:', error);
                }
            });
        });
    },
    
    initFavorites() {
        document.querySelectorAll('.product-card__favourite').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const productId = button.dataset.productId;
                try {
                    const isActive = button.classList.contains('active');
                    if (isActive) {
                        await CommonFunctions.removeFromFavorites(productId);
                        button.classList.remove('active');
                        button.querySelector('img').src = './assets/img/product-cart-favoruite-icon.png';
                    } else {
                        await CommonFunctions.addToFavorites(productId);
                        button.classList.add('active');
                        button.querySelector('img').src = './assets/img/product-cart-favoruite-icon-active.png';
                    }
                } catch (error) {
                    alert('Необходимо авторизоваться');
                }
            });
        });
    },
    
    init: async function() {
        await this.loadProducts();
        this.initFilters();
        this.initSorting();
    }
};

document.addEventListener('DOMContentLoaded', async function() {
    await CatalogFunctions.init();
});

export default CatalogFunctions;