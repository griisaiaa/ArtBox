// ./assets/js/script.js - Основной файл

import { 
    auth, 
    db,
    doc,
    getDoc,
    setDoc,
    addDoc,
    collection,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    getDocs,
    query,
    where,
    orderBy
} from './firebase-config.js';

// Глобальный объект приложения
window.App = {
    currentUser: null,
    cart: [],
    favorites: [],
    auth: auth,
    db: db,
    
    // Инициализация
    init: async function() {
        console.log('App.init() started');
        this.initBurgerMenu();
        this.initModals();
        this.initButtons();
        
        // Слушаем изменения авторизации
        onAuthStateChanged(auth, async (user) => {
            console.log('Auth state changed:', user ? 'logged in' : 'logged out');
            this.currentUser = user;
            if (user) {
                await this.loadUserData();
                this.updateCartCount();
            } else {
                this.cart = [];
                this.favorites = [];
                this.updateCartCount();
            }
            
            // Диспатчим событие о смене авторизации
            window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: user } }));
        });
    },
    
    // Инициализация кнопок
    initButtons: function() {
        // Кнопка корзины
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                window.location.href = 'cart.html';
            });
        }
        
        // Кнопка избранного
        const favoritesBtn = document.getElementById('favorites-btn');
        if (favoritesBtn) {
            favoritesBtn.addEventListener('click', () => {
                if (this.currentUser) {
                    window.location.href = 'profile.html';
                } else {
                    const modal = document.getElementById('login-modal');
                    if (modal) modal.style.display = 'flex';
                }
            });
        }
    },
    
    // Бургер-меню
    initBurgerMenu: function() {
        const burger = document.getElementById('burger');
        const nav = document.getElementById('nav');
        
        if (burger && nav) {
            burger.addEventListener('click', () => {
                burger.classList.toggle('active');
                nav.classList.toggle('active');
            });
        }
        
        document.querySelectorAll('.nav__link').forEach(link => {
            link.addEventListener('click', () => {
                burger?.classList.remove('active');
                nav?.classList.remove('active');
            });
        });
    },
    
    // Модальные окна
    initModals: function() {
        const modal = document.getElementById('login-modal');
        const profileBtn = document.getElementById('profile-btn');
        const registerBtn = document.getElementById('register-btn');
        const closeBtn = document.getElementById('close-login-modal');
        
        if (profileBtn && modal) {
            profileBtn.addEventListener('click', () => {
                if (this.currentUser) {
                    window.location.href = 'profile.html';
                } else {
                    modal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                }
            });
        }
        
        if (registerBtn && modal) {
            registerBtn.addEventListener('click', () => {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                const registerTab = document.querySelector('[data-tab="register"]');
                if (registerTab) this.switchTab(registerTab);
            });
        }
        
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
        }
        
        document.querySelectorAll('.modal__tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab));
        });
        
        // Форма входа
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                
                try {
                    await signInWithEmailAndPassword(auth, email, password);
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                    window.location.href = 'profile.html';
                } catch (error) {
                    alert('Ошибка входа: ' + this.getErrorMessage(error.code));
                }
            });
        }
        
        // Форма регистрации
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('register-name').value;
                const email = document.getElementById('register-email').value;
                const password = document.getElementById('register-password').value;
                
                if (password.length < 6) {
                    alert('Пароль должен быть минимум 6 символов');
                    return;
                }
                
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    await updateProfile(userCredential.user, { displayName: name });
                    await setDoc(doc(db, "users", userCredential.user.uid), {
                        uid: userCredential.user.uid,
                        name: name,
                        email: email,
                        favorites: [],
                        createdAt: new Date().toISOString()
                    });
                    alert('Регистрация успешна!');
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                    window.location.href = 'profile.html';
                } catch (error) {
                    alert('Ошибка регистрации: ' + this.getErrorMessage(error.code));
                }
            });
        }
    },
    
    // Получение сообщения об ошибке
    getErrorMessage: function(code) {
        const errors = {
            'auth/user-not-found': 'Пользователь не найден',
            'auth/wrong-password': 'Неверный пароль',
            'auth/invalid-email': 'Неверный формат email',
            'auth/email-already-in-use': 'Email уже используется',
            'auth/weak-password': 'Пароль должен быть минимум 6 символов'
        };
        return errors[code] || 'Неизвестная ошибка';
    },
    
    // Переключение табов
    switchTab: function(activeTab) {
        document.querySelectorAll('.modal__tab').forEach(tab => {
            tab.classList.remove('modal__tab--active');
        });
        activeTab.classList.add('modal__tab--active');
        
        document.querySelectorAll('.modal__form').forEach(form => {
            form.classList.remove('modal__form--active');
        });
        
        const tabName = activeTab.getAttribute('data-tab');
        const activeForm = document.getElementById(`${tabName}-form`);
        if (activeForm) activeForm.classList.add('modal__form--active');
    },
    
    // Загрузка данных пользователя
    loadUserData: async function() {
        if (!this.currentUser) return;
        
        try {
            // Загрузка корзины
            const cartRef = doc(db, "carts", this.currentUser.uid);
            const cartDoc = await getDoc(cartRef);
            this.cart = cartDoc.exists() ? cartDoc.data().items || [] : [];
            
            // Загрузка избранного
            const userRef = doc(db, "users", this.currentUser.uid);
            const userDoc = await getDoc(userRef);
            this.favorites = userDoc.exists() ? userDoc.data().favorites || [] : [];
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    },
    
    // Обновление счетчика корзины
    updateCartCount: function() {
        const count = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartBtn = document.getElementById('cart-btn');
        
        if (cartBtn && count > 0) {
            let badge = cartBtn.querySelector('.cart-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'cart-badge';
                cartBtn.style.position = 'relative';
                cartBtn.appendChild(badge);
            }
            badge.textContent = count;
            badge.style.cssText = 'position: absolute; top: -5px; right: -5px; background: #FF6B35; color: white; border-radius: 50%; min-width: 18px; height: 18px; font-size: 10px; display: flex; align-items: center; justify-content: center; padding: 0 4px;';
        } else if (cartBtn && count === 0) {
            const badge = cartBtn.querySelector('.cart-badge');
            if (badge) badge.remove();
        }
    },
    
    // Получение товара по ID
    getProductById: async function(productId) {
        try {
            const productRef = doc(db, "products", productId);
            const productDoc = await getDoc(productRef);
            return productDoc.exists() ? { id: productDoc.id, ...productDoc.data() } : null;
        } catch (error) {
            console.error('Error getting product:', error);
            return null;
        }
    },
    
    // Добавление в корзину
    addToCart: async function(productId, quantity = 1) {
        if (!this.currentUser) {
            const modal = document.getElementById('login-modal');
            if (modal) modal.style.display = 'flex';
            alert('Для добавления в корзину необходимо авторизоваться');
            return false;
        }
        
        const product = await this.getProductById(productId);
        if (!product) return false;
        
        try {
            const cartRef = doc(db, "carts", this.currentUser.uid);
            const cartDoc = await getDoc(cartRef);
            let items = cartDoc.exists() ? cartDoc.data().items || [] : [];
            
            const existingIndex = items.findIndex(item => item.productId === productId);
            if (existingIndex !== -1) {
                items[existingIndex].quantity += quantity;
            } else {
                items.push({
                    productId: productId,
                    name: product.name,
                    price: product.price,
                    quantity: quantity,
                    image: product.image
                });
            }
            
            await setDoc(cartRef, { userId: this.currentUser.uid, items, updatedAt: new Date().toISOString() });
            this.cart = items;
            this.updateCartCount();
            alert(`Товар "${product.name}" добавлен в корзину!`);
            return true;
        } catch (error) {
            console.error('Error adding to cart:', error);
            return false;
        }
    },
    
    // Получение корзины
    getCart: async function() {
        if (!this.currentUser) return [];
        try {
            const cartRef = doc(db, "carts", this.currentUser.uid);
            const cartDoc = await getDoc(cartRef);
            this.cart = cartDoc.exists() ? cartDoc.data().items || [] : [];
            return this.cart;
        } catch (error) {
            console.error('Error getting cart:', error);
            return [];
        }
    },
    
    // Обновление товара в корзине
    updateCartItem: async function(productId, quantity) {
        if (!this.currentUser) return false;
        
        try {
            const cartRef = doc(db, "carts", this.currentUser.uid);
            const cartDoc = await getDoc(cartRef);
            let items = cartDoc.exists() ? cartDoc.data().items || [] : [];
            
            const index = items.findIndex(item => item.productId === productId);
            if (index !== -1) {
                if (quantity <= 0) {
                    items.splice(index, 1);
                } else {
                    items[index].quantity = quantity;
                }
                await setDoc(cartRef, { userId: this.currentUser.uid, items, updatedAt: new Date().toISOString() });
                this.cart = items;
                this.updateCartCount();
            }
            return true;
        } catch (error) {
            console.error('Error updating cart:', error);
            return false;
        }
    },
    
    // Очистка корзины
    clearCart: async function() {
        if (!this.currentUser) return false;
        try {
            const cartRef = doc(db, "carts", this.currentUser.uid);
            await setDoc(cartRef, { userId: this.currentUser.uid, items: [], updatedAt: new Date().toISOString() });
            this.cart = [];
            this.updateCartCount();
            return true;
        } catch (error) {
            console.error('Error clearing cart:', error);
            return false;
        }
    },
    
    // Добавление в избранное
    addToFavorites: async function(productId) {
        if (!this.currentUser) {
            const modal = document.getElementById('login-modal');
            if (modal) modal.style.display = 'flex';
            return false;
        }
        
        if (!this.favorites.includes(productId)) {
            this.favorites.push(productId);
            try {
                const userRef = doc(db, "users", this.currentUser.uid);
                await setDoc(userRef, { favorites: this.favorites }, { merge: true });
                alert('Товар добавлен в избранное');
            } catch (error) {
                console.error('Error adding to favorites:', error);
            }
        }
        return true;
    },
    
    // Удаление из избранного
    removeFromFavorites: async function(productId) {
        if (!this.currentUser) return false;
        
        this.favorites = this.favorites.filter(id => id !== productId);
        try {
            const userRef = doc(db, "users", this.currentUser.uid);
            await setDoc(userRef, { favorites: this.favorites }, { merge: true });
            alert('Товар удален из избранного');
            return true;
        } catch (error) {
            console.error('Error removing from favorites:', error);
            return false;
        }
    },
    
    // Проверка в избранном
    isFavorite: function(productId) {
        return this.favorites.includes(productId);
    },
    
    // Получение избранных товаров
    getFavorites: async function() {
        if (!this.currentUser) return [];
        
        const favoritesProducts = [];
        for (const id of this.favorites) {
            const product = await this.getProductById(id);
            if (product) favoritesProducts.push(product);
        }
        return favoritesProducts;
    },
    
    // Оформление заказа
    createOrder: async function() {
        if (!this.currentUser) {
            alert('Необходимо авторизоваться');
            return false;
        }
        if (this.cart.length === 0) {
            alert('Корзина пуста');
            return false;
        }
        
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const order = {
            userId: this.currentUser.uid,
            userEmail: this.currentUser.email,
            userName: this.currentUser.displayName,
            items: [...this.cart],
            total: total,
            status: 'processing',
            createdAt: new Date().toISOString()
        };
        
        try {
            await addDoc(collection(db, "orders"), order);
            await this.clearCart();
            alert('Заказ успешно оформлен!');
            return true;
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Ошибка при оформлении заказа');
            return false;
        }
    },
    
    // Получение заказов пользователя
    getUserOrders: async function() {
        if (!this.currentUser) return [];
        
        try {
            const q = query(
                collection(db, "orders"),
                where("userId", "==", this.currentUser.uid),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            const orders = [];
            snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
            return orders;
        } catch (error) {
            console.error('Error getting orders:', error);
            return [];
        }
    },
    
    // Выход
    logout: async function() {
        try {
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing App');
    window.App.init();
});