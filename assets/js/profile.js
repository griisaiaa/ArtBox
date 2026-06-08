// assets/js/profile.js - Полностью исправленный

const Profile = {
    currentUser: null,
    orders: [],
    
    init: async function() {
        console.log('Profile initializing...');
        
        if (!window.App) {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        if (!window.App.currentUser) {
            console.log('No user, redirecting...');
            window.location.href = 'index.html';
            return;
        }
        
        this.currentUser = window.App.currentUser;
        this.displayUserInfo();
        await this.loadOrders();
        this.initEvents();
    },
    
    displayUserInfo: function() {
        const nameEl = document.querySelector('.user-name');
        const emailEl = document.querySelector('.user-email');
        if (nameEl) nameEl.textContent = this.currentUser.displayName || this.currentUser.email.split('@')[0];
        if (emailEl) emailEl.textContent = this.currentUser.email;
        console.log('User info displayed');
    },
    
    loadOrders: async function() {
        console.log('Loading orders...');
        const container = document.getElementById('orders-list');
        if (!container) return;
        
        try {
            this.orders = await window.App.getUserOrders();
            console.log('Orders received:', this.orders.length);
            
            if (this.orders.length === 0) {
                container.innerHTML = `
                    <div class="order-card" style="text-align: center; padding: 40px;">
                        <p>📦 У вас пока нет заказов</p>
                        <p style="margin-top: 10px; color: #666;">Добавьте товары в корзину и оформите заказ</p>
                        <a href="catalog.html" class="btn btn--primary" style="margin-top: 20px;">Перейти в каталог</a>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = this.orders.map(order => `
                <div class="order-card" data-order-id="${order.id}">
                    <div class="order-header">
                        <h3 class="order-number">Заказ #${order.id.slice(-6)}</h3>
                        <div class="order-status ${order.status === 'processing' ? 'processing' : 'delivered'}">
                            <span>${order.status === 'processing' ? '🔄 В обработке' : '✅ Доставлен'}</span>
                        </div>
                    </div>
                    <div class="order-date">
                        <span>📅 ${new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                        <span style="margin-left: 15px;">🕐 ${new Date(order.createdAt).toLocaleTimeString('ru-RU')}</span>
                    </div>
                    <div class="order-items-list" style="margin: 15px 0; padding: 10px; background: #f9f9f9; border-radius: 8px;">
                        ${order.items.map(item => `
                            <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                                <span>${item.name} x ${item.quantity} шт.</span>
                                <span>${(item.price * item.quantity).toLocaleString()} ₽</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-info-centered">
                        <p class="order-items">📦 Всего товаров: ${order.items?.length || 0}</p>
                        <p class="order-total">💰 Итого: ${(order.total || 0).toLocaleString()} ₽</p>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading orders:', error);
            container.innerHTML = '<div class="order-card" style="text-align: center; padding: 40px;"><p>❌ Ошибка загрузки заказов</p></div>';
        }
    },
    
    showFavorites: async function() {
        console.log('Showing favorites...');
        const container = document.getElementById('profile-main');
        
        try {
            const favorites = await window.App.getFavorites();
            console.log('Favorites loaded:', favorites.length);
            
            container.innerHTML = `
                <h2 class="profile-section-title">❤️ Избранное (${favorites.length})</h2>
                <div class="favorites-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;">
                    ${favorites.map(product => `
                        <div class="product-card">
                            <div class="product-card__image">
                                <a href="product-info.html?id=${product.id}">
                                    <img src="${product.image || 'assets/img/product-cart-img1.png'}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150'">
                                </a>
                            </div>
                            <div class="product-card__content">
                                <h3 class="product-card__title">
                                    <a href="product-info.html?id=${product.id}">${product.name}</a>
                                </h3>
                                <div class="product-card__footer">
                                    <span class="product-card__price">${product.price.toLocaleString()} ₽</span>
                                    <button class="btn btn--cart remove-fav-btn" data-id="${product.id}">🗑 Удалить</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            if (favorites.length === 0) {
                const grid = container.querySelector('.favorites-grid');
                if (grid) {
                    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">У вас пока нет избранных товаров<br><a href="catalog.html" class="btn btn--primary" style="margin-top: 15px;">Перейти в каталог</a></p>';
                }
            }
            
            // Добавляем обработчики для кнопок удаления
            document.querySelectorAll('.remove-fav-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const productId = btn.dataset.id;
                    await window.App.removeFromFavorites(productId);
                    await this.showFavorites();
                    // Обновляем счетчик в боковом меню
                    this.updateFavoritesCount();
                });
            });
            
        } catch (error) {
            console.error('Error showing favorites:', error);
            container.innerHTML = '<h2 class="profile-section-title">❤️ Избранное</h2><p>Ошибка загрузки избранного</p>';
        }
    },
    
    updateFavoritesCount: async function() {
        const count = window.App.favorites.length;
        const favNavItem = document.querySelector('.profile-nav__item[data-section="favorites"] .profile-nav__text');
        if (favNavItem && count > 0) {
            favNavItem.innerHTML = `Избранное (${count})`;
        } else if (favNavItem) {
            favNavItem.innerHTML = 'Избранное';
        }
    },
    
    showSettings: function() {
        console.log('Showing settings...');
        const container = document.getElementById('profile-main');
        container.innerHTML = `
            <h2 class="profile-section-title">⚙️ Настройки профиля</h2>
            <div class="settings-form" style="background: white; padding: 25px; border-radius: 8px;">
                <div class="form-group">
                    <label>👤 Имя</label>
                    <input type="text" id="settings-name" class="form-input" value="${this.currentUser.displayName || ''}">
                </div>
                <div class="form-group">
                    <label>📧 Email</label>
                    <input type="email" class="form-input" value="${this.currentUser.email}" disabled>
                </div>
                <button class="btn btn--primary" id="save-settings-btn">💾 Сохранить изменения</button>
            </div>
        `;
        
        document.getElementById('save-settings-btn')?.addEventListener('click', async () => {
            const newName = document.getElementById('settings-name').value;
            if (newName && this.currentUser) {
                const { updateProfile } = await import('./firebase-config.js');
                await updateProfile(this.currentUser, { displayName: newName });
                alert('✓ Имя обновлено!');
                this.displayUserInfo();
            }
        });
    },
    
    initEvents: function() {
        console.log('Initializing events...');
        
        const navItems = document.querySelectorAll('.profile-nav__item');
        navItems.forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                console.log('Section clicked:', section);
                
                // Убираем активный класс со всех
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                // Показываем соответствующий контент
                if (section === 'orders') {
                    const container = document.getElementById('profile-main');
                    container.innerHTML = '<h2 class="profile-section-title">📦 Мои заказы</h2><div class="orders-list" id="orders-list"></div>';
                    await this.loadOrders();
                } else if (section === 'favorites') {
                    await this.showFavorites();
                } else if (section === 'settings') {
                    this.showSettings();
                }
            });
        });
        
        // Обработка выхода
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

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        Profile.init();
    }, 300);
});