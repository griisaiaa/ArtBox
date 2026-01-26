// ./assets/js/catalog.js

// Функции специфичные для страницы каталога
const CatalogFunctions = {
    // Фильтрация по цене
    initPriceFilter: function() {
        const rangeMin = document.querySelector('.range-min');
        const rangeMax = document.querySelector('.range-max');
        const rangeSelected = document.querySelector('.range-selected');
        const minPriceInput = document.getElementById('min-price');
        const maxPriceInput = document.getElementById('max-price');
        
        if (!rangeMin || !rangeMax) return;
        
        function updateRange() {
            const minValue = parseInt(rangeMin.value);
            const maxValue = parseInt(rangeMax.value);
            
            if (minValue > maxValue) {
                rangeMin.value = maxValue;
                rangeMax.value = minValue;
                updateRange();
                return;
            }
            
            const minPercent = (minValue / rangeMin.max) * 100;
            const maxPercent = (maxValue / rangeMax.max) * 100;
            
            rangeSelected.style.left = minPercent + '%';
            rangeSelected.style.right = (100 - maxPercent) + '%';
            
            if (minPriceInput) minPriceInput.value = minValue;
            if (maxPriceInput) maxPriceInput.value = maxValue;
        }
        
        rangeMin.addEventListener('input', updateRange);
        rangeMax.addEventListener('input', updateRange);
        
        // Обновление ползунков при изменении числовых полей
        if (minPriceInput) {
            minPriceInput.addEventListener('change', function() {
                rangeMin.value = this.value;
                updateRange();
            });
        }
        
        if (maxPriceInput) {
            maxPriceInput.addEventListener('change', function() {
                rangeMax.value = this.value;
                updateRange();
            });
        }
        
        // Инициализация
        updateRange();
    },
    
    // Применение фильтров
    initFilters: function() {
        const applyFiltersBtn = document.querySelector('.filters-apply');
        
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', function() {
                // Здесь будет логика применения фильтров
                console.log('Фильтры применены');
            });
        }
    },
    
    // Сортировка товаров
    initSorting: function() {
        const sortSelect = document.getElementById('sort-select');
        
        if (sortSelect) {
            sortSelect.addEventListener('change', function() {
                // Здесь будет логика сортировки товаров
                const sortValue = this.value;
                console.log(`Товары отсортированы по: ${this.options[this.selectedIndex].text}`);
            });
        }
    },
    
    // Добавление товаров в корзину
    initAddToCart: function() {
        const addToCartButtons = document.querySelectorAll('.btn--cart');
        
        addToCartButtons.forEach(button => {
            button.addEventListener('click', function() {
                const productCard = this.closest('.product-card');
                const productName = productCard.querySelector('.product-card__title').textContent;
                const productPrice = productCard.querySelector('.product-card__price').textContent;
                
                // Здесь будет логика добавления в корзину
                console.log(`Товар "${productName}" добавлен в корзину!`);
            });
        });
    },
    
    // Инициализация всех функций каталога
    init: function() {
        this.initPriceFilter();
        this.initFilters();
        this.initSorting();
        this.initAddToCart();
    }
};

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    CatalogFunctions.init();
});