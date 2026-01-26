
const CommonFunctions = {
    // Бургер-меню
    initBurgerMenu: function() {
        const burger = document.getElementById('burger');
        const nav = document.getElementById('nav');
        
        if (burger && nav) {
            burger.addEventListener('click', function() {
                burger.classList.toggle('active');
                nav.classList.toggle('active');
            });
        }
        
        // Закрытие меню при клике на ссылку
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
    
    // Модальные окна
    initModals: function() {
        const loginModal = document.getElementById('login-modal');
        const profileBtn = document.getElementById('profile-btn');
        const registerBtn = document.getElementById('register-btn');
        const closeLoginModal = document.getElementById('close-login-modal');
        
        // Открытие модального окна входа
        if (profileBtn && loginModal) {
            profileBtn.addEventListener('click', function() {
                loginModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            });
        }
        
        // Открытие модального окна регистрации (если кнопка есть на странице)
        if (registerBtn && loginModal) {
            registerBtn.addEventListener('click', function() {
                loginModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                
                // Переключение на вкладку регистрации
                const registerTab = document.querySelector('[data-tab="register"]');
                if (registerTab) {
                    CommonFunctions.switchTab(registerTab);
                }
            });
        }
        
        // Закрытие модального окна
        if (closeLoginModal && loginModal) {
            closeLoginModal.addEventListener('click', function() {
                loginModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            });
        }
        
        // Закрытие модального окна при клике вне его
        if (loginModal) {
            loginModal.addEventListener('click', function(e) {
                if (e.target === loginModal) {
                    loginModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
        }
        
        // Переключение между вкладками входа и регистрации
        const tabs = document.querySelectorAll('.modal__tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                CommonFunctions.switchTab(this);
            });
        });
        
        // Обработка форм
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                // Здесь должна быть логика входа
                // После успешного входа перенаправляем на страницу профиля
                window.location.href = 'profile.html';
            });
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', function(e) {
                e.preventDefault();
                // Здесь должна быть логика регистрации
                // После успешной регистрации перенаправляем на страницу профиля
                window.location.href = 'profile.html';
            });
        }
    },
    
    // Переключение вкладок в модальных окнах
    switchTab: function(activeTab) {
        const tabs = document.querySelectorAll('.modal__tab');
        // Убираем активный класс у всех вкладок
        tabs.forEach(tab => {
            tab.classList.remove('modal__tab--active');
        });
        
        // Добавляем активный класс к текущей вкладке
        activeTab.classList.add('modal__tab--active');
        
        // Скрываем все формы
        const forms = document.querySelectorAll('.modal__form');
        forms.forEach(form => {
            form.classList.remove('modal__form--active');
        });
        
        // Показываем активную форму
        const tabName = activeTab.getAttribute('data-tab');
        const activeForm = document.getElementById(`${tabName}-form`);
        if (activeForm) {
            activeForm.classList.add('modal__form--active');
        }
    },
    
    // Инициализация всех общих функций
    init: function() {
        this.initBurgerMenu();
        this.initModals();
    }
};

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    CommonFunctions.init();
});