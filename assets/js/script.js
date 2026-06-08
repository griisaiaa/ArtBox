// ./assets/js/script.js - Полная версия с Firebase

import { 
    auth, 
    db,
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc,
    query, 
    where, 
    orderBy,
    getDoc,
    setDoc,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from './firebase-config.js';

const CommonFunctions = {
    currentUser: null,
    
    initBurgerMenu: function() {
        const burger = document.getElementById('burger');
        const nav = document.getElementById('nav');
        
        if (burger && nav) {
            burger.addEventListener('click', function() {
                burger.classList.toggle('active');
                nav.classList.toggle('active');
            });
        }
        
        const navLinks = document.querySelectorAll('.nav__link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (burger && nav) {
                    burger.classList.remove('active');
                    nav.classList.remove('active');
                }
            });
        });
    },
    
    initModals: function() {
        const loginModal = document.getElementById('login-modal');
        const profileBtn = document.getElementById('profile-btn');
        const registerBtn = document.getElementById('register-btn');
        const closeLoginModal = document.getElementById('close-login-modal');
        
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            if (user) {
                console.log('Пользователь авторизован:', user.email);
            } else {
                console.log('Пользователь не авторизован');
            }
        });
        
        if (profileBtn && loginModal) {
            profileBtn.addEventListener('click', () => {
                if (this.currentUser) {
                    window.location.href = 'profile.html';
                } else {
                    loginModal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                }
            });
        }
        
        if (registerBtn && loginModal) {
            registerBtn.addEventListener('click', () => {
                loginModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                const registerTab = document.querySelector('[data-tab="register"]');
                if (registerTab) {
                    this.switchTab(registerTab);
                }
            });
        }
        
        if (closeLoginModal && loginModal) {
            closeLoginModal.addEventListener('click', () => {
                loginModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
        }
        
        if (loginModal) {
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    loginModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
        }
        
        const tabs = document.querySelectorAll('.modal__tab');
        tabs.forEach(tab => {
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
                    loginModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                    window.location.href = 'profile.html';
                } catch (error) {
                    alert('Ошибка входа: ' + error.message);
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
                
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    await updateProfile(userCredential.user, { displayName: name });
                    await setDoc(doc(db, "users", userCredential.user.uid), {
                        uid: userCredential.user.uid,
                        name: name,
                        email: email,
                        createdAt: new Date().toISOString()
                    });
                    alert('Регистрация успешна!');
                    loginModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                    window.location.href = 'profile.html';
                } catch (error) {
                    alert('Ошибка регистрации: ' + error.message);
                }
            });
        }
    },
    
    switchTab: function(activeTab) {
        const tabs = document.querySelectorAll('.modal__tab');
        tabs.forEach(tab => tab.classList.remove('modal__tab--active'));
        activeTab.classList.add('modal__tab--active');
        
        const forms = document.querySelectorAll('.modal__form');
        forms.forEach(form => form.classList.remove('modal__form--active'));
        
        const tabName = activeTab.getAttribute('data-tab');
        const activeForm = document.getElementById(`${tabName}-form`);
        if (activeForm) activeForm.classList.add('modal__form--active');
    },
    
    async addToCart(productId, quantity = 1) {
        if (!this.currentUser) {
            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                loginModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
            throw new Error('Необходимо авторизоваться');
        }
        
        const cartRef = doc(db, "carts", this.currentUser.uid);
        const cartDoc = await getDoc(cartRef);
        let items = cartDoc.exists() ? cartDoc.data().items || [] : [];
        
        const existingItem = items.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            const product = await this.getProductById(productId);
            if (product) {
                items.push({
                    productId: productId,
                    name: product.name,
                    price: product.price,
                    quantity: quantity,
                    image: product.image
                });
            }
        }
        
        await setDoc(cartRef, {
            userId: this.currentUser.uid,
            items: items,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    },
    
    async getProductById(productId) {
        const productRef = doc(db, "products", productId);
        const productDoc = await getDoc(productRef);
        if (productDoc.exists()) {
            return { id: productDoc.id, ...productDoc.data() };
        }
        return null;
    },
    
    async getUserOrders() {
        if (!this.currentUser) return [];
        const q = query(collection(db, "orders"), where("userId", "==", this.currentUser.uid), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const orders = [];
        querySnapshot.forEach((doc) => orders.push({ id: doc.id, ...doc.data() }));
        return orders;
    },
    
    async getFavorites() {
        if (!this.currentUser) return [];
        const userRef = doc(db, "users", this.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const favorites = userDoc.data().favorites || [];
            const products = [];
            for (const productId of favorites) {
                const product = await this.getProductById(productId);
                if (product) products.push(product);
            }
            return products;
        }
        return [];
    },
    
    async addToFavorites(productId) {
        if (!this.currentUser) throw new Error('Необходимо авторизоваться');
        const userRef = doc(db, "users", this.currentUser.uid);
        const userDoc = await getDoc(userRef);
        let favorites = userDoc.exists() ? userDoc.data().favorites || [] : [];
        if (!favorites.includes(productId)) {
            favorites.push(productId);
            await updateDoc(userRef, { favorites: favorites });
        }
    },
    
    async removeFromFavorites(productId) {
        if (!this.currentUser) return;
        const userRef = doc(db, "users", this.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            let favorites = userDoc.data().favorites || [];
            favorites = favorites.filter(id => id !== productId);
            await updateDoc(userRef, { favorites: favorites });
        }
    },
    
    async logout() {
        await signOut(auth);
        window.location.href = 'index.html';
    },
    
    init: function() {
        this.initBurgerMenu();
        this.initModals();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    CommonFunctions.init();
});

export default CommonFunctions;