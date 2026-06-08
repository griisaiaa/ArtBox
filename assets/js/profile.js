// ./assets/js/profile.js - Страница профиля

import { onAuthStateChanged } from './firebase-config.js';

const Profile = {
    currentUser: null,
    
    init: function() {
        console.log('Profile.init() started');
        
        // Проверяем, что App уже инициализирован
        if (!window.App) {
            console.log('Waiting for App to initialize...');
            setTimeout(() => this.init(), 100);
            return;
        }
        
        // Используем onAuthStateChanged из Firebase
        onAuthStateChanged(window.App.auth, async (user) => {
            console.log('Profile: auth state changed', user ? 'user logged in' : 'no user');
            
            if (user) {
                this.currentUser = user;
                this.displayUserInfo();
                await this.loadOrders();
                this.initEvents();
            } else {
                console.log('No user, redirecting to index');
                window.location.href = 'index.html';
            }
        });
    },
    
    displayUserInfo: function() {
        const nameEl = document.getElementById('user-name');
        const emailEl = document.getElementById('user-email');
        if (nameEl) nameEl.textContent = this.currentUser.displayName || this.currentUser.email.split('@')[0];
        if (emailEl) emailEl.textContent = this.currentUser.email;
    },
    
    loadOrders: async function() {
        console.log('Loading orders...');
        const orders = await window.App.getUserOrders();
        const container = document.getElementById('orders-list');
        
        if (!container) return;
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="order-card" style="text-align: center;"><p>У вас пока нет заказов</p><a href="catalog.html" class="btn btn--primary">Перейти в каталог</a></div>';
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <h3 class="order-number">Заказ #${order.id.slice(-6)}</h3>
                    <div class="order-status processing">
                        <span>${order.status === 'processing' ? 'В обработке' : 'Доставлен'}</span>
                    </div>
                </div>
                <div class="order-date">
                    <span>${new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
                <div class="order-info-centered">
                    <p class="order-items">Товаров: ${order.items?.length || 0}</p>
                    <p class="order-total">Сумма: ${(order.total || 0).toLocaleString()} ₽</p>
                </div>
            </div>
        `).join('');
    },
    
    showFavorites: async function() {
        console.log('Showing favorites...');
        const container = document.getElementById('profile-main');
        const favorites = await window.App.getFavorites();
        
        container.innerHTML = `
            <h2 class="profile-section-title">Избранное</h2>
            <div class="favorites-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;">
                ${favorites.map(product => `
                    <div class="product-card">
                        <div class="product-card__image">
                            <a href="product-info.html?id=${product.id}">
                                <img src="${product.image || './assets/img/product-cart-img1.png'}" alt="${product.name}">
                            </a>
                        </div>
                        <div class="product-card__content">
                            <h3 class="product-card__title">${product.name}</h3>
                            <div class="product-card__footer">
                                <span class="product-card__price">${product.price.toLocaleString()} ₽</span>
                                <button class="btn btn--cart remove-fav" data-id="${product.id}">Удалить</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        if (favorites.length === 0) {
            const grid = container.querySelector('.favorites-grid');
            if (grid) grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">У вас пока нет избранных товаров</p>';
        }
        
        document.querySelectorAll('.remove-fav').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = btn.dataset.id;
                await window.App.removeFromFavorites(id);
                this.showFavorites();
            });
        });
    },
    
    showSettings: function() {
        console.log('Showing settings...');
        const container = document.getElementById('profile-main');
        container.innerHTML = `
            <h2 class="profile-section-title">Настройки</h2>
            <div class="settings-form" style="background: white; padding: 25px; border-radius: 8px;">
                <div class="form-group">
                    <label>Имя</label>
                    <input type="text" id="settings-name" class="form-input" value="${this.currentUser.displayName || ''}">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" class="form-input" value="${this.currentUser.email}" disabled>
                </div>
                <button class="btn btn--primary" id="save-settings">Сохранить</button>
            </div>
        `;
        
        document.getElementById('save-settings')?.addEventListener('click', async () => {
            const newName = document.getElementById('settings-name').value;
            if (newName && this.currentUser) {
                const { updateProfile } = await import('./firebase-config.js');
                await updateProfile(this.currentUser, { displayName: newName });
                alert('Имя обновлено!');
                this.displayUserInfo();
            }
        });
    },
    
    initEvents: function() {
        console.log('Initializing events...');
        const navItems = document.querySelectorAll('.profile-nav__item');
        navItems.forEach(item => {
            item.addEventListener('click', async (e) => {
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                const section = item.dataset.section;
                console.log('Section clicked:', section);
                
                if (section === 'orders') {
                    window.location.reload();
                } else if (section === 'favorites') {
                    await this.showFavorites();
                } else if (section === 'settings') {
                    this.showSettings();
                }
            });
        });
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (confirm('Вы уверены, что хотите выйти?')) {
                    await window.App.logout();
                }
            });
        }
    }
};

// Ждем загрузки DOM и инициализации App
document.addEventListener('DOMContentLoaded', () => {
    console.log('Profile: DOM loaded');
    // Даем время на инициализацию App
    setTimeout(() => {
        Profile.init();
    }, 200);
});