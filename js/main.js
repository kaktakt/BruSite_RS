// main.js - оптимизированная версия с поддержкой 4 вкладок
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
            });
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
            if (!['ArrowLeft', 'ArrowRight', '1', '2', '3', '4'].includes(e.key)) return;
            
            // Цифровые клавиши для быстрого переключения
            const keyMap = {
                '1': 0, // Ссылки
                '2': 1, // Конфиг
                '3': 2, // Проект
                '4': 3  // Донат
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
    
    // Копирование команды connect для IP сервера
    function initIPCopy() {
        const copyIpBtn = document.querySelector('.copy-ip');
        if (!copyIpBtn) return;

        copyIpBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const ip = '194.93.2.151:27015';
            const command = `connect ${ip}`;
            
            copyToClipboard(command).then(() => {
                // Визуальная обратная связь
                const originalHTML = this.innerHTML;
                this.innerHTML = `
                    <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                `;
                this.style.color = '#4CAF50';
                
                setTimeout(() => {
                    this.innerHTML = originalHTML;
                    this.style.color = '';
                }, 2000);
            }).catch(err => {
                console.error('Ошибка копирования: ', err);
                alert('Не удалось скопировать команду. Скопируйте вручную: ' + command);
            });
        });
    }
    
    // Копирование номера карты
    function initCardCopy() {
        const copyCardLink = document.querySelector('.copy-card');
        const copyCardBtn = document.querySelector('.copy-card-btn');
        
        if (!copyCardLink || !copyCardBtn) return;

        // Функция для копирования карты
        const copyCard = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            const cardNumber = copyCardLink.getAttribute('data-card');
            
            // На мобильных устройствах пытаемся открыть банковское приложение
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
                // Пробуем разные схемы для популярных банковских приложений
                const bankSchemes = [
                    `bank100000000000://transfer?card=${cardNumber}`,
                    `sberbank://transfer?card=${cardNumber}`,
                    `tinkoff://transfer?card=${cardNumber}`,
                    `alfabank://transfer?card=${cardNumber}`,
                    `vtb://transfer?card=${cardNumber}`
                ];
                
                let appOpened = false;
                for (const scheme of bankSchemes) {
                    try {
                        window.location.href = scheme;
                        appOpened = true;
                        setTimeout(() => {
                            if (document.hidden) {
                                // Приложение открылось, выходим
                                return;
                            }
                        }, 100);
                        break;
                    } catch (e) {
                        // Продолжаем пробовать следующую схему
                    }
                }
                
                // Если не удалось открыть приложение, просто копируем
                setTimeout(() => {
                    if (!appOpened || !document.hidden) {
                        copyToClipboard(cardNumber).then(() => {
                            // Визуальная обратная связь для кнопки
                            const originalHTML = copyCardBtn.innerHTML;
                            copyCardBtn.innerHTML = `
                                <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            `;
                            copyCardBtn.style.color = '#00ff08ff';
                            
                            setTimeout(() => {
                                copyCardBtn.innerHTML = originalHTML;
                                copyCardBtn.style.color = '';
                            }, 2000);
                        }).catch(() => {
                            alert('Номер карты: ' + cardNumber);
                        });
                    }
                }, 300);
            } else {
                // На десктопе просто копируем
                copyToClipboard(cardNumber).then(() => {
                    // Визуальная обратная связь для кнопки
                    const originalHTML = copyCardBtn.innerHTML;
                    copyCardBtn.innerHTML = `
                        <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    `;
                    copyCardBtn.style.color = '#00ff08ff';
                    
                    setTimeout(() => {
                        copyCardBtn.innerHTML = originalHTML;
                        copyCardBtn.style.color = '';
                    }, 2000);
                }).catch(() => {
                    alert('Номер карты: ' + cardNumber);
                });
            }
        };

        // Обработчик для кнопки копирования
        copyCardBtn.addEventListener('click', copyCard);

        // Обработчик для самой ссылки с номером карты
        copyCardLink.addEventListener('click', copyCard);
    }
    
    // Инициализация кнопок копирования
    function initCopyButtons() {
        initIPCopy();
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
        
        console.log('Main script initialized successfully with 4 tabs');
    });
    
    // Экспортируем утилиты
    window.utils = utils;
})();