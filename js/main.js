// main.js - оптимизированная версия
(function() {
    'use strict';
    
    // Утилиты
    const utils = {
        // Дебаунс функция
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        // Проверка слабых устройств
        isLowPerformanceDevice() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
                   window.innerWidth < 768;
        },
        
        // Оптимизация анимаций
        optimizeAnimations() {
            // Используем пассивные слушатели
            const options = { passive: true };
            window.addEventListener('scroll', () => {}, options);
            window.addEventListener('resize', () => {}, options);
            
            // Оптимизация requestAnimationFrame
            window.requestAnimationFrame = (function() {
                return window.requestAnimationFrame ||
                       window.webkitRequestAnimationFrame ||
                       window.mozRequestAnimationFrame ||
                       function(callback) {
                           window.setTimeout(callback, 1000 / 60);
                       };
            })();
        }
    };
    
    // Инициализация оптимизаций
    utils.optimizeAnimations();
    
    // Отключаем тяжелые эффекты на слабых устройствах
    if (utils.isLowPerformanceDevice()) {
        const style = document.createElement('style');
        style.textContent = `
            .bg-video-container video { 
                display: none !important; 
            }
            .bg-fallback { 
                opacity: 1 !important; 
                background-image: url('bck/rska.jpg') !important;
                background-size: cover !important;
                filter: brightness(0.7) !important;
            }
            .tab.active { 
                box-shadow: none !important;
            }
            .rs-logo:hover .rs-image { 
                transform: none !important; 
                filter: none !important; 
            }
            #snow-canvas { 
                display: none !important; 
            }
            .performance-mode * {
                animation: none !important;
                transition: none !important;
                transform: none !important;
                filter: none !important;
                backdrop-filter: none !important;
            }
        `;
        document.head.appendChild(style);
        console.log('Optimizations applied for low-performance device');
    }
    
    // Фон видео и резервное изображение
    const bgVideo = document.getElementById('bgVideo');
    const bgFallback = document.getElementById('bgFallback');
    
    function handleVideoBackground() {
        if (!bgVideo) {
            if (bgFallback) bgFallback.classList.add('active');
            return;
        }
        
        // Оптимизация видео
        bgVideo.playsInline = true;
        bgVideo.muted = true;
        bgVideo.loop = true;
        bgVideo.preload = 'auto';
        
        // Устанавливаем качество видео в зависимости от устройства
        if (utils.isLowPerformanceDevice()) {
            bgVideo.pause();
            if (bgFallback) bgFallback.classList.add('active');
        } else {
            // Пытаемся воспроизвести видео
            const playPromise = bgVideo.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    if (bgFallback) bgFallback.classList.remove('active');
                }).catch(() => {
                    // Если видео не может воспроизвестись, показываем fallback
                    if (bgFallback) bgFallback.classList.add('active');
                });
            }
        }
        
        // Обработчики событий
        bgVideo.addEventListener('error', () => {
            if (bgFallback) bgFallback.classList.add('active');
        });
        
        bgVideo.addEventListener('playing', () => {
            if (bgFallback) bgFallback.classList.remove('active');
        });
    }
    
    // Вкладки
    class TabManager {
        constructor() {
            this.tabs = document.querySelectorAll('.tab');
            this.contents = document.querySelectorAll('.content');
            this.heightWrapper = document.getElementById('heightWrapper');
            this.bgContainer = document.querySelector('.bg-video-container');
            this.isAnimating = false;
            this.currentTab = 'links';
            
            this.init();
        }
        
        init() {
            // Обработчики кликов
            this.tabs.forEach(tab => {
                tab.addEventListener('click', () => this.switchTab(tab));
            });
            
            // Обработчики клавиш
            document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        }
        
        switchTab(tab) {
            if (this.isAnimating || tab.classList.contains('active')) return;
            
            this.isAnimating = true;
            const targetId = tab.dataset.tab;
            
            // Находим текущую и целевую секции
            const current = document.getElementById(this.currentTab);
            const target = document.getElementById(targetId);
            
            if (!current || !target) return;
            
            // Анимация перехода
            this.animateTransition(current, target, tab);
            
            // Обновляем текущую вкладку
            this.currentTab = targetId;
        }
        
        animateTransition(current, target, tab) {
            // Временно убираем blur фона
            if (this.bgContainer) {
                this.bgContainer.classList.add('unblur');
            }
            
            // Анимация высоты контейнера
            this.updateContainerHeight(target);
            
            // Анимация перехода контента
            current.classList.remove('active');
            current.classList.add('exiting');
            target.classList.add('entering');
            
            setTimeout(() => {
                current.classList.remove('exiting');
                target.classList.remove('entering');
                target.classList.add('active');
                
                // Обновляем активную вкладку
                this.tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Восстанавливаем blur фона
                setTimeout(() => {
                    if (this.bgContainer) {
                        this.bgContainer.classList.remove('unblur');
                    }
                    this.isAnimating = false;
                }, 150);
            }, 300);
        }
        
        updateContainerHeight(target) {
            if (!this.heightWrapper) return;
            
            const currentHeight = this.heightWrapper.scrollHeight;
            const targetHeight = target.scrollHeight;
            
            this.heightWrapper.style.height = currentHeight + 'px';
            
            requestAnimationFrame(() => {
                this.heightWrapper.style.height = targetHeight + 'px';
                
                setTimeout(() => {
                    this.heightWrapper.style.height = 'auto';
                }, 600);
            });
        }
        
        handleKeyPress(e) {
            if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
            
            const activeIndex = [...this.tabs].findIndex(t => t.classList.contains('active'));
            let nextIndex = activeIndex;
            
            if (e.key === 'ArrowRight') nextIndex++;
            if (e.key === 'ArrowLeft') nextIndex--;
            
            if (nextIndex < 0) nextIndex = this.tabs.length - 1;
            if (nextIndex >= this.tabs.length) nextIndex = 0;
            
            this.tabs[nextIndex].click();
        }
    }
    
    // Логотип
    function initLogo() {
        const rsLogo = document.getElementById('rsLogo');
        const logoSound = document.getElementById('logoSound');
        
        if (!rsLogo) return;
    }
    
    // Кнопка скачивания
    function initDownloadButton() {
        const downloadBtn = document.getElementById('downloadConfig');
        
        if (!downloadBtn) return;
        
        downloadBtn.addEventListener('click', function(e) {
            if (this.classList.contains('done')) {
                e.preventDefault();
                return;
            }
            
            // Меняем состояние кнопки
            this.classList.add('done');
            this.textContent = 'DONE';
            
            // Восстанавливаем кнопку через 3 секунды
            setTimeout(() => {
                this.classList.remove('done');
                this.textContent = 'DOWNLOAD';
            }, 3000);
        });
    }
    
    // Инициализация блюра фона
    function initBackgroundBlur() {
        const bgContainer = document.querySelector('.bg-video-container');
        
        if (!bgContainer) return;
        
        // Активируем блюр с задержкой
        setTimeout(() => {
            bgContainer.classList.add('bg-blur-active');
        }, 300);
    }
    
    // Инициализация всего при загрузке DOM
    document.addEventListener('DOMContentLoaded', () => {
        // Запускаем обработку фона
        handleVideoBackground();
        
        // Инициализируем вкладки
        new TabManager();
        
        // Инициализируем логотип
        initLogo();
        
        // Инициализируем кнопку скачивания
        initDownloadButton();
        
        // Инициализируем блюр фона
        initBackgroundBlur();

        // Инициализируем систему уведомлений
        initNotificationSystem();
        if (!window.NotificationManager) {
            console.log('Notification system not loaded');
    }
        
        console.log('Main script initialized successfully');
    });
    
    // Экспортируем утилиты
    window.utils = utils;

function initNotificationSystem() {
    // Проверяем, загружен ли уже notification.js
    if (!window.NotificationManager) {
        console.warn('NotificationManager not available. Loading notification module...');
        
        // Создаем элемент для загрузки CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/notification.css';
        document.head.appendChild(link);
        
        // Создаем элемент для загрузки JS
        const script = document.createElement('script');
        script.src = 'js/notification.js';
        script.onload = function() {
            console.log('Notification module loaded successfully');
            window.notificationManager = new window.NotificationManager();
        };
        script.onerror = function() {
            console.error('Failed to load notification module');
        };
        document.head.appendChild(script);
    } else {
        // Если уже доступен, инициализируем
        window.notificationManager = new window.NotificationManager();
    }
}
})();