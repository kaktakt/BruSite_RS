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
        },
        
        // Генератор случайных ярких цветов
        getRandomColor() {
            const colors = [
                '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0',
                '#118AB2', '#EF476F', '#7209B7', '#F15BB5',
                '#00BBF9', '#00F5D4', '#FB5607', '#8338EC'
            ];
            return colors[Math.floor(Math.random() * colors.length)];
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
    
    // Вкладки с улучшенными анимациями (1.2 секунды)
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
            // Временно убираем blur фона для более плавного перехода
            if (this.bgContainer) {
                this.bgContainer.classList.add('unblur');
            }
            
            // Обновляем высоту контейнера перед началом анимации
            this.updateContainerHeight(target);
            
            // Обновляем активную вкладку сразу для лучшей обратной связи
            this.tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Убираем текущую вкладку с анимацией затемнения
            current.classList.remove('active');
            current.classList.add('exiting');
            
            // Задержка перед появлением новой вкладки для создания эффекта последовательности
            setTimeout(() => {
                target.classList.add('entering');
                
                // После небольшой задержки активируем новую вкладку
                setTimeout(() => {
                    target.classList.remove('entering');
                    target.classList.add('active');
                    current.classList.remove('exiting');
                    
                    // Восстанавливаем blur фона
                    setTimeout(() => {
                        if (this.bgContainer) {
                            this.bgContainer.classList.remove('unblur');
                        }
                        this.isAnimating = false;
                    }, 200);
                }, 50);
            }, 600); // Увеличена задержка до 600ms для 1.2s анимации
        }
        
        updateContainerHeight(target) {
            if (!this.heightWrapper) return;
            
            const currentHeight = this.heightWrapper.scrollHeight;
            const targetHeight = target.scrollHeight + 20; // Добавляем небольшой отступ
            
            this.heightWrapper.style.height = currentHeight + 'px';
            
            // Используем requestAnimationFrame для плавной анимации
            requestAnimationFrame(() => {
                this.heightWrapper.style.height = targetHeight + 'px';
                
                // После завершения анимации устанавливаем auto
                setTimeout(() => {
                    this.heightWrapper.style.height = 'auto';
                }, 1200); // Увеличено до 1200ms
            });
        }
        
        handleKeyPress(e) {
            if (!['ArrowLeft', 'ArrowRight', '1', '2', '3', '4', '5'].includes(e.key)) return;
            
            // Цифровые клавиши для быстрого переключения
            const keyMap = {
                '1': 0, // Ссылки
                '2': 1, // Конфиг
                '3': 2, // CS 1.6
                '4': 3, // BRUS (новый индекс)
                '5': 4  // донат
            };
            
            let nextIndex;
            
            if (keyMap[e.key] !== undefined) {
                nextIndex = keyMap[e.key];
            } else {
                // Стрелки для переключения
                const activeIndex = [...this.tabs].findIndex(t => t.classList.contains('active'));
                
                if (e.key === 'ArrowRight') nextIndex = activeIndex + 1;
                if (e.key === 'ArrowLeft') nextIndex = activeIndex - 1;
                
                // Циклическое переключение
                if (nextIndex < 0) nextIndex = this.tabs.length - 1;
                if (nextIndex >= this.tabs.length) nextIndex = 0;
            }
            
            // Проверяем, что индекс в пределах массива
            if (nextIndex >= 0 && nextIndex < this.tabs.length) {
                this.tabs[nextIndex].click();
            }
        }
    }
    
    // Логотип с обработкой двойного клика для открытия ссылки
    function initLogo() {
        const rsLogo = document.getElementById('rsLogo');
        const logoSound = document.getElementById('logoSound');
        
        if (!rsLogo) return;
        
        let clickCount = 0;
        let clickTimer = null;
        
        rsLogo.addEventListener('click', function(e) {
            e.preventDefault();
            clickCount++;
            
            if (clickCount === 1) {
                // Одиночный клик - прокрутка наверх и звук
                clickTimer = setTimeout(function() {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    
                    if (logoSound) {
                        logoSound.currentTime = 0;
                        logoSound.play().catch(() => {
                            // Игнорируем ошибки воспроизведения звука
                        });
                    }
                    clickCount = 0;
                }, 300);
            } else if (clickCount === 2) {
                // Двойной клик - открываем ссылку
                clearTimeout(clickTimer);
                window.open('https://t.me/brusnikaone/4700', '_blank', 'noopener,noreferrer');
                clickCount = 0;
            }
        });
        
        // Отключаем стандартное поведение двойного клика
        rsLogo.addEventListener('dblclick', function(e) {
            e.preventDefault();
        });
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
    
    // Функция для копирования текста в буфер обмена
    function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            // Используем старый метод, если navigator.clipboard недоступен
            let textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            return new Promise((resolve, reject) => {
                document.execCommand('copy') ? resolve() : reject();
                textArea.remove();
            });
        }
    }
    
    // Копирование номера карты и USDT адреса с уведомлением
    function initCardCopy() {
        const copyCardLinks = document.querySelectorAll('.copy-card');
        
        // Храним активные уведомления для каждой кнопки
        const activeNotifications = new Map();
        
        copyCardLinks.forEach(link => {
            let notification = null;
            let hideTimeout = null;
            
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                const cardNumber = this.getAttribute('data-card');
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                
                // Проверяем, есть ли уже активное уведомление для этой кнопки
                if (activeNotifications.has(this)) {
                    notification = activeNotifications.get(this);
                    
                    // Меняем цвет уведомления на случайный
                    const randomColor = utils.getRandomColor();
                    notification.style.color = randomColor;
                    notification.style.textShadow = 
                        `0 0 5px ${randomColor}, 0 0 10px ${randomColor}80, 0 0 15px ${randomColor}40`;
                    
                    // Добавляем класс для анимации
                    notification.classList.add('color-change');
                    
                    // Убираем класс анимации через 300ms
                    setTimeout(() => {
                        notification.classList.remove('color-change');
                    }, 300);
                    
                    // Сбрасываем таймер скрытия
                    clearTimeout(hideTimeout);
                } else {
                    // Создаем новое уведомление
                    notification = document.createElement('div');
                    notification.className = 'copy-notification-inline';
                    notification.textContent = 'Скопировано';
                    
                    // Начальный цвет
                    notification.style.color = '#ffffff';
                    notification.style.textShadow = 
                        '0 0 5px rgba(255, 255, 255, 0.5), 0 0 10px rgba(255, 255, 255, 0.3)';
                    
                    // Находим ближайший блок .meta для вставки уведомления
                    const metaBlock = this.parentElement;
                    
                    if (metaBlock) {
                        // Вставляем уведомление после ссылки
                        metaBlock.appendChild(notification);
                        
                        // Сохраняем ссылку на уведомление
                        activeNotifications.set(this, notification);
                        
                        // Показываем уведомление
                        setTimeout(() => {
                            notification.style.opacity = '1';
                            
                            // Виброотклик для мобильных устройств
                            if ('vibrate' in navigator && isMobile) {
                                navigator.vibrate(30);
                            }
                        }, 10);
                    }
                }
                
                // Копируем текст в буфер обмена
                copyToClipboard(cardNumber).catch(err => {
                    console.error('Ошибка копирования:', err);
                    notification.textContent = '✗ Ошибка!';
                    notification.style.color = '#ff4444';
                    notification.style.textShadow = 
                        '0 0 5px rgba(255, 68, 68, 0.5), 0 0 10px rgba(255, 68, 68, 0.3)';
                });
                
                // Устанавливаем таймер для скрытия уведомления
                hideTimeout = setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        if (notification && notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                        // Удаляем уведомление из Map
                        activeNotifications.delete(this);
                        notification = null;
                    }, 300);
                }, 1500);
                
                // Визуальная обратная связь для кнопки
                this.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                setTimeout(() => {
                    this.style.backgroundColor = '';
                }, 300);
                
                // Если есть ссылка на Сбербанк и это мобильное устройство
                const sberbankLink = this.getAttribute('data-sberbank');
                if (isMobile && sberbankLink) {
                    setTimeout(() => {
                        window.location.href = sberbankLink;
                        setTimeout(() => {
                            window.open('https://online.sberbank.ru', '_blank');
                        }, 500);
                    }, 100);
                }
            });
        });
    }
    
    // Инициализация копирования
    function initCopyButtons() {
        initCardCopy();
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
        
        // Инициализируем кнопки копирования
        initCopyButtons();
        
        console.log('Main script initialized successfully');
    });
    
})();
