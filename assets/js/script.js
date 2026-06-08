import { 
    auth, 
    db,
    doc,
    getDoc,
    setDoc,
    addDoc,
    collection,
    getDocs,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    deleteDoc,
    query,
    where,
    orderBy,
    updateDoc
} from './firebase-config.js';

window.App = {
    currentUser: null,
    cart: [],
    favorites: [],
    
    init: async function() {
        console.log('App initializing...');
        this.initBurgerMenu();
        this.initModals();
        this.initButtons();
        
        onAuthStateChanged(auth, async (user) => {
            console.log('Auth state changed:', user ? 'Logged in: ' + user.email : 'Logged out');
            this.currentUser = user;
            
            if (user) {
                await this.loadUserData();
                this.updateCartCount();
                this.updateAllFavoriteIcons();
                await this.loadProductsOnHomePage();
            } else {
                this.cart = [];
                this.favorites = [];
                this.updateCartCount();
                await this.loadProductsOnHomePage();
            }
        });
    },
    
    loadProductsOnHomePage: async function() {
        try {
            const productsRef = collection(db, "products");
            const snapshot = await getDocs(productsRef);
            const products = [];
            snapshot.forEach(doc => {
                products.push({ id: doc.id, ...doc.data() });
            });
            
            // Популярные товары (первые 4)
            const popularGrid = document.getElementById('popular-grid');
            if (popularGrid && products.length > 0) {
                popularGrid.innerHTML = products.slice(0, 4).map(product => `
                    <div class="product-card">
                        <button class="product-card__favourite" data-id="${product.id}">
                            <img src="assets/img/product-cart-favoruite-icon.png" alt="В избранное">
                        </button>
                        <div class="product-card__image">
                            <a href="product-info.html?id=${product.id}">
                                <img src="${product.image || 'assets/img/product-cart-img1.png'}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150'">
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
                                <button class="btn btn--cart add-to-cart-btn" data-id="${product.id}">
                                    <img src="assets/img/product-cart-btn-basket-icon.png" alt="В корзину">
                                    В корзину
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
            
            // Хиты продаж (следующие 4)
            const hitsGrid = document.getElementById('hits-grid');
            if (hitsGrid && products.length > 4) {
                hitsGrid.innerHTML = products.slice(4, 8).map(product => `
                    <div class="product-card">
                        <button class="product-card__favourite" data-id="${product.id}">
                            <img src="assets/img/product-cart-favoruite-icon.png" alt="В избранное">
                        </button>
                        <div class="product-card__image">
                            <a href="product-info.html?id=${product.id}">
                                <img src="${product.image || 'assets/img/product-cart-img1.png'}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150'">
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
                                <button class="btn btn--cart add-to-cart-btn" data-id="${product.id}">
                                    <img src="assets/img/product-cart-btn-basket-icon.png" alt="В корзину">
                                    В корзину
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
            
            this.initHomePageButtons();
            this.updateAllFavoriteIcons();
            
        } catch (error) {
            console.error('Error loading products:', error);
        }
    },
    
    renderStars: function(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += i <= rating ? 
                '<img src="assets/img/product-cart-active-star-icon.png" alt="★">' : 
                '<img src="assets/img/product-cart-notactive-star-icon.png" alt="☆">';
        }
        return stars;
    },
    
    initHomePageButtons: function() {
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.removeEventListener('click', this.handleAddToCart);
            btn.addEventListener('click', this.handleAddToCart.bind(this));
        });
        
        document.querySelectorAll('.product-card__favourite').forEach(btn => {
            btn.removeEventListener('click', this.handleFavorite);
            btn.addEventListener('click', this.handleFavorite.bind(this));
        });
    },
    
    handleAddToCart: async function(e) {
        e.preventDefault();
        const productId = e.currentTarget.dataset.id;
        await this.addToCart(productId, 1);
    },
    
    handleFavorite: async function(e) {
        e.preventDefault();
        const btn = e.currentTarget;
        const productId = btn.dataset.id;
        const isActive = btn.classList.contains('active');
        
        if (!this.currentUser) {
            alert('Пожалуйста, войдите в аккаунт');
            const modal = document.getElementById('login-modal');
            if (modal) modal.style.display = 'flex';
            return;
        }
        
        if (isActive) {
            await this.removeFromFavorites(productId);
            btn.classList.remove('active');
            btn.querySelector('img').src = 'assets/img/product-cart-favoruite-icon.png';
        } else {
            await this.addToFavorites(productId);
            btn.classList.add('active');
            btn.querySelector('img').src = 'assets/img/product-cart-favoruite-icon-active.png';
        }
    },
    
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
    
    initButtons: function() {
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                window.location.href = 'cart.html';
            });
        }
        
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
    
    loadUserData: async function() {
        if (!this.currentUser) return;
        
        console.log('Loading user data for:', this.currentUser.uid);
        
        try {
            // Загрузка корзины
            const cartRef = doc(db, "carts", this.currentUser.uid);
            const cartDoc = await getDoc(cartRef);
            this.cart = cartDoc.exists() ? cartDoc.data().items || [] : [];
            console.log('Cart loaded:', this.cart.length);
            
            // Загрузка избранного
            const userRef = doc(db, "users", this.currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                this.favorites = userDoc.data().favorites || [];
                console.log('Favorites loaded from Firebase:', this.favorites);
            } else {
                await setDoc(doc(db, "users", this.currentUser.uid), {
                    uid: this.currentUser.uid,
                    name: this.currentUser.displayName || '',
                    email: this.currentUser.email,
                    favorites: [],
                    createdAt: new Date().toISOString()
                });
                this.favorites = [];
                console.log('Created new user document');
            }
            
            this.updateAllFavoriteIcons();
            
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    },
    
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
    
    updateAllFavoriteIcons: function() {
        console.log('Updating all favorite icons...');
        
        document.querySelectorAll('.product-card__favourite').forEach(btn => {
            const productId = btn.dataset.id;
            if (this.favorites.includes(productId)) {
                btn.classList.add('active');
                const img = btn.querySelector('img');
                if (img) img.src = 'assets/img/product-cart-favoruite-icon-active.png';
            } else {
                btn.classList.remove('active');
                const img = btn.querySelector('img');
                if (img) img.src = 'assets/img/product-cart-favoruite-icon.png';
            }
        });
        
        const favoriteBtn = document.getElementById('favorite-btn');
        if (favoriteBtn) {
            const productId = new URLSearchParams(window.location.search).get('id');
            if (productId && this.favorites.includes(productId)) {
                favoriteBtn.classList.add('active');
                const img = favoriteBtn.querySelector('img');
                if (img) img.src = 'assets/img/tovar-info-favourite-icon-active.png';
            }
        }
    },
    
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
    
    addToCart: async function(productId, quantity = 1) {
        if (!this.currentUser) {
            const modal = document.getElementById('login-modal');
            if (modal) modal.style.display = 'flex';
            alert('Для добавления в корзину необходимо авторизоваться');
            return false;
        }
        
        const product = await this.getProductById(productId);
        if (!product) {
            alert('Товар не найден');
            return false;
        }
        
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
            
            await setDoc(cartRef, { 
                userId: this.currentUser.uid, 
                items: items, 
                updatedAt: new Date().toISOString() 
            });
            
            this.cart = items;
            this.updateCartCount();
            alert(`✓ Товар "${product.name}" добавлен в корзину!`);
            return true;
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Ошибка при добавлении в корзину');
            return false;
        }
    },
    
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
    
    addToFavorites: async function(productId) {
        if (!this.currentUser) {
            const modal = document.getElementById('login-modal');
            if (modal) modal.style.display = 'flex';
            alert('Для добавления в избранное необходимо авторизоваться');
            return false;
        }
        
        if (this.favorites.includes(productId)) {
            return true;
        }
        
        this.favorites.push(productId);
        
        try {
            const userRef = doc(db, "users", this.currentUser.uid);
            await updateDoc(userRef, { favorites: this.favorites });
            console.log('Favorites saved:', this.favorites);
            alert('✓ Товар добавлен в избранное');
            this.updateAllFavoriteIcons();
            return true;
        } catch (error) {
            console.error('Error adding to favorites:', error);
            return false;
        }
    },
    
    removeFromFavorites: async function(productId) {
        if (!this.currentUser) return false;
        
        this.favorites = this.favorites.filter(id => id !== productId);
        
        try {
            const userRef = doc(db, "users", this.currentUser.uid);
            await updateDoc(userRef, { favorites: this.favorites });
            console.log('Favorites after remove:', this.favorites);
            alert('✓ Товар удален из избранного');
            this.updateAllFavoriteIcons();
            return true;
        } catch (error) {
            console.error('Error removing from favorites:', error);
            return false;
        }
    },
    
    isFavorite: function(productId) {
        return this.favorites.includes(productId);
    },
    
    getFavorites: async function() {
        if (!this.currentUser) return [];
        
        const favoritesProducts = [];
        for (const id of this.favorites) {
            const product = await this.getProductById(id);
            if (product) favoritesProducts.push(product);
        }
        return favoritesProducts;
    },
    
    createOrder: async function() {
        if (!this.currentUser) {
            alert('Необходимо авторизоваться');
            return false;
        }
        
        await this.getCart(); // Обновляем корзину
        
        if (this.cart.length === 0) {
            alert('Корзина пуста');
            return false;
        }
        
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const order = {
            userId: this.currentUser.uid,
            userEmail: this.currentUser.email,
            userName: this.currentUser.displayName || this.currentUser.email.split('@')[0],
            items: [...this.cart],
            total: total,
            status: 'processing',
            createdAt: new Date().toISOString()
        };
        
        console.log('Creating order:', order);
        
        try {
            const docRef = await addDoc(collection(db, "orders"), order);
            console.log('Order created with ID:', docRef.id);
            
            await this.clearCart();
            alert('✓ Заказ успешно оформлен!');
            return true;
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Ошибка при оформлении заказа: ' + error.message);
            return false;
        }
    },
    
    getUserOrders: async function() {
        if (!this.currentUser) return [];
        
        console.log('Getting orders for user:', this.currentUser.uid);
        
        try {
            const q = query(
                collection(db, "orders"),
                where("userId", "==", this.currentUser.uid),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            const orders = [];
            snapshot.forEach(doc => {
                orders.push({ id: doc.id, ...doc.data() });
            });
            console.log('Orders loaded:', orders.length);
            return orders;
        } catch (error) {
            console.error('Error getting orders:', error);
            return [];
        }
    },
    
    logout: async function() {
        try {
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
});