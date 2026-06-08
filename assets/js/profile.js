// ./assets/js/profile.js

import { auth, onAuthStateChanged } from './firebase-config.js';
import CommonFunctions from './script.js';

const ProfileFunctions = {
    currentUser: null,
    
    async init() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                this.displayUserInfo(user);
                await this.loadOrders();
            } else {
                window.location.href = 'index.html';
            }
        });
        
        this.initLogout();
    },
    
    displayUserInfo(user) {
        const userNameElement = document.querySelector('.user-name');
        const userEmailElement = document.querySelector('.user-email');
        if (userNameElement) userNameElement.textContent = user.displayName || user.email.split('@')[0];
        if (userEmailElement) userEmailElement.textContent = user.email;
    },
    
    async loadOrders() {
        const ordersList = document.querySelector('.orders-list');
        if (!ordersList) return;
        
        const orders = await CommonFunctions.getUserOrders();
        
        if (orders.length === 0) {
            ordersList.innerHTML = `<div class="order-card" style="text-align: center; padding: 40px;">
                <p>У вас пока нет заказов</p>
                <a href="catalog.html" class="btn btn--primary" style="margin-top: 15px;">Перейти в каталог</a>
            </div>`;
            return;
        }
        
        ordersList.innerHTML = orders.map(order => {
            let statusClass = 'processing', statusText = 'В обработке', statusIcon = './assets/img/profile-processing-order-icon.png';
            if (order.status === 'delivered') {
                statusClass = 'delivered';
                statusText = 'Доставлен';
                statusIcon = './assets/img/profile-delivered-order-icon.png';
            } else if (order.status === 'canceled') {
                statusClass = 'canceled';
                statusText = 'Отменен';
                statusIcon = './assets/img/profile-cancel-order-icon.png';
            }
            
            return `<div class="order-card">
                <div class="order-header">
                    <h3 class="order-number">Заказ #${order.id.slice(-6)}</h3>
                    <div class="order-status ${statusClass}">
                        <img src="${statusIcon}" alt="${statusText}" class="status-icon">
                        <span>${statusText}</span>
                    </div>
                </div>
                <div class="order-date">
                    <img src="./assets/img/profile-calendar-icon.png" alt="Дата" class="date-icon">
                    <span>${new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
                <div class="hist-divider"></div>
                <div class="order-info-centered">
                    <p class="order-items">Товаров: ${order.items?.length || 0}</p>
                    <p class="order-total">Сумма: ${order.total?.toLocaleString() || 0} ₽</p>
                </div>
            </div>`;
        }).join('');
    },
    
    initLogout() {
        const exitLink = document.querySelector('.profile-nav__text-exit');
        if (exitLink) {
            exitLink.addEventListener('click', async (e) => {
                e.preventDefault();
                if (confirm('Вы уверены, что хотите выйти?')) {
                    await CommonFunctions.logout();
                }
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ProfileFunctions.init();
});

export default ProfileFunctions;