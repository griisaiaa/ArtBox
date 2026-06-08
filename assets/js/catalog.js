// ./assets/js/catalog.js - Страница каталога

import { db, collection, getDocs } from './firebase-config.js';

const Catalog = {
    products: [],
    filteredProducts: [],
    favorites: [],
    
    init: async function() {
        await this.loadProducts();
        this.initFilters();
        this.initSorting();
        this.initSearch();
        this.loadFavorites();
    },
    
    loadProducts: async function() {
        const snapshot = await getDocs(collection(db, "products"));
        this.products = [];
        snapshot.forEach(doc => {
            this.products.push({ id: doc.id, ...doc.data() });
        });
        this.filteredProducts = [...this.products];
        this.renderProducts();
        this.updateCount();
    },
    
    renderProducts: function() {
        const grid = document.getElementById('products-grid');
        if (!grid) return;
        
        if (this.filteredProducts.length === 0) {
            grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Товаров не найдено</p>';
            return;
        }
        
        grid.innerHTML = this.filteredProducts.map(product => `
            <div class="product-card" data-id="${product.id}">
                <button class="product-card__favourite" data-id="${product.id}">
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
                            ${this.renderStars(product.rating || 4)}
                        </div>
                        <span class="rating-count">(${product.reviews || 0})</span>
                    </div>
                    <div class="product-card__footer">
                        <span class="product-card__price">${product.price.toLocaleString()} ₽</span>
                        <button class="btn btn--cart add-to-cart" data-id="${product.id}">
                            <img src="./assets/img/product-cart-btn-basket-icon.png" alt="В корзину">
                            В корзину
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        this.initCartButtons();
        this.initFavoriteButtons();
        this.updateFavoriteIcons();
    },
    
    renderStars: function(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += i <= rating ? 
                '<img src="./assets/img/product-cart-active-star-icon.png" alt="★">' : 
                '<img src="./assets/img/product-cart-notactive-star-icon.png" alt="☆">';
        }
        return stars;
    },
    
    updateCount: function() {
        const countEl = document.getElementById('products-count');
        if (countEl) countEl.textContent = `Найдено товаров: ${this.filteredProducts.length}`;
    },
    
    initFilters: function() {
        const categoryRadios = document.querySelectorAll('input[name="category"]');
        categoryRadios.forEach(radio => {
            radio.addEventListener('change', () => this.applyFilters());
        });
        
        const applyBtn = document.getElementById('apply-filters');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyFilters());
        }
        
        const minPrice = document.getElementById('min-price');
        const maxPrice = document.getElementById('max-price');
        if (minPrice && maxPrice) {
            minPrice.addEventListener('change', () => this.applyFilters());
            maxPrice.addEventListener('change', () => this.applyFilters());
        }
    },
    
    applyFilters: function() {
        const category = document.querySelector('input[name="category"]:checked')?.value || 'all';
        const minPrice = parseInt(document.getElementById('min-price')?.value) || 0;
        const maxPrice = parseInt(document.getElementById('max-price')?.value) || 100000;
        const sortBy = document.getElementById('sort-select')?.value || 'popular';
        
        let filtered = [...this.products];
        
        if (category !== 'all') {
            filtered = filtered.filter(p => p.category === category);
        }
        
        filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice);
        
        // Сортировка
        switch(sortBy) {
            case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
            case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
            case 'name': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
        }
        
        this.filteredProducts = filtered;
        this.renderProducts();
        this.updateCount();
    },
    
    initSorting: function() {
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.applyFilters());
        }
    },
    
    initSearch: function() {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        
        const doSearch = () => {
            const term = searchInput?.value.toLowerCase() || '';
            if (term === '') {
                this.filteredProducts = [...this.products];
            } else {
                this.filteredProducts = this.products.filter(p => 
                    p.name.toLowerCase().includes(term)
                );
            }
            this.renderProducts();
            this.updateCount();
        };
        
        if (searchBtn) searchBtn.addEventListener('click', doSearch);
        if (searchInput) searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSearch();
        });
    },
    
    initCartButtons: function() {
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const productId = btn.dataset.id;
                await window.App.addToCart(productId, 1);
            });
        });
    },
    
    loadFavorites: async function() {
        if (window.App.currentUser) {
            this.favorites = window.App.favorites;
            this.updateFavoriteIcons();
        }
    },
    
    initFavoriteButtons: function() {
        document.querySelectorAll('.product-card__favourite').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const productId = btn.dataset.id;
                const isFavorite = btn.classList.contains('active');
                
                if (isFavorite) {
                    await window.App.removeFromFavorites(productId);
                    btn.classList.remove('active');
                    btn.querySelector('img').src = './assets/img/product-cart-favoruite-icon.png';
                } else {
                    await window.App.addToFavorites(productId);
                    btn.classList.add('active');
                    btn.querySelector('img').src = './assets/img/product-cart-favoruite-icon-active.png';
                }
            });
        });
    },
    
    updateFavoriteIcons: function() {
        document.querySelectorAll('.product-card__favourite').forEach(btn => {
            const productId = btn.dataset.id;
            if (this.favorites.includes(productId)) {
                btn.classList.add('active');
                btn.querySelector('img').src = './assets/img/product-cart-favoruite-icon-active.png';
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Catalog.init();
});