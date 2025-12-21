// notification.js - исправленная версия без звука при двойном клике
(function() {
    'use strict';
    
    class NotificationManager {
        constructor() {
            this.currentNotification = null;
            this.notificationQueue = [];
            this.isShowing = false;
            this.logoDoubleClickTimer = null;
            this.logoClickCount = 0;
            
            this.init();
        }
        
        init() {
            // Создаем стиль для анимации
            this.addNotificationStyles();
            
            // Инициализируем обработчик для логотипа
            this.initLogoHandler();
            
            console.log('Notification Manager initialized');
        }
        
        addNotificationStyles() {
            // Проверяем, добавлены ли уже стили
            if (document.getElementById('notification-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                /* Инлайн стили для быстрой загрузки */
                .notification-wrapper { 
                    position: fixed; 
                    bottom: 20px; 
                    right: 20px; 
                    z-index: 9999; 
                }
            `;
            document.head.appendChild(style);
        }
        
        initLogoHandler() {
            const rsLogo = document.getElementById('rsLogo');
            const logoSound = document.getElementById('logoSound');
            
            if (!rsLogo) {
                console.warn('Logo element not found for notification handler');
                return;
            }
            
            // Удаляем старые обработчики, если они есть
            rsLogo.removeEventListener('click', this.handleLogoClick.bind(this));
            
            rsLogo.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogoClick(e, logoSound);
            });
            
            // Отключаем стандартное поведение двойного клика (выделение текста)
            rsLogo.addEventListener('dblclick', (e) => {
                e.preventDefault();
            });
        }
        
        handleLogoClick(e, logoSound) {
            this.logoClickCount++;
            
            if (this.logoClickCount === 1) {
                // Одиночный клик - запускаем таймер
                this.logoDoubleClickTimer = setTimeout(() => {
                    // Выполняем стандартное действие логотипа
                    this.executeSingleClickAction(logoSound);
                    this.logoClickCount = 0;
                }, 300);
            } else if (this.logoClickCount === 2) {
                // Двойной клик - очищаем таймер и показываем уведомление
                clearTimeout(this.logoDoubleClickTimer);
                this.logoClickCount = 0;
                // НЕ воспроизводим звук при двойном клике
                this.showGiftNotification();
            }
        }
        
        executeSingleClickAction(logoSound) {
            // Прокрутка наверх
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Воспроизведение звука
            if (logoSound) {
                logoSound.currentTime = 0;
                logoSound.play().catch(() => {
                    // Игнорируем ошибки воспроизведения звука
                });
            }
        }
        
        showGiftNotification(message = null, linkText = null, linkUrl = null) {
            // Если уже показывается уведомление, закрываем его
            if (this.currentNotification) {
                this.hideNotification(this.currentNotification);
            }
            
            const notification = this.createNotification(
                message || 'раздача подарков действует до 31-го числа (включительно)',
                linkText || 'получить подарок',
                linkUrl || 'https://t.me/brusnikaone/4700'
            );
            
            this.showNotification(notification);
        }
        
        createNotification(message, linkText, linkUrl) {
            const notification = document.createElement('div');
            notification.className = 'notification';
            
            // Создаем элементы вручную для лучшего контроля
            const closeBtn = document.createElement('button');
            closeBtn.className = 'notification-close';
            closeBtn.setAttribute('aria-label', 'Закрыть');
            closeBtn.textContent = '×';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'notification-content';
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'notification-header';
            
            const iconSpan = document.createElement('span');
            iconSpan.className = 'notification-icon';
            iconSpan.textContent = '🎁';
            
            const titleH3 = document.createElement('h3');
            titleH3.className = 'notification-title';
            titleH3.textContent = 'Акция!';
            
            const messageP = document.createElement('p');
            messageP.className = 'notification-message';
            messageP.textContent = message;
            
            const footerDiv = document.createElement('div');
            footerDiv.className = 'notification-footer';
            
            // Создаем контейнер для ссылки с эмблемой
            const linkContainer = document.createElement('div');
            linkContainer.style.display = 'flex';
            linkContainer.style.alignItems = 'center';
            linkContainer.style.justifyContent = 'center';
            linkContainer.style.gap = '8px';
            
            // Создаем эмблему (мини-логотип) - используем SVG для лучшего качества
            const emblemaDiv = document.createElement('div');
            emblemaDiv.className = 'notification-link-emblema';
            
            // Создаем SVG эмблему (аналогичную логотипу)
            const emblemaSVG = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            emblemaSVG.setAttribute('viewBox', '0 0 100 100');
            emblemaSVG.setAttribute('width', '24');
            emblemaSVG.setAttribute('height', '24');
            
            // Создаем элементы SVG для эмблемы RS
            const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textElement.setAttribute('x', '50');
            textElement.setAttribute('y', '65');
            textElement.setAttribute('text-anchor', 'middle');
            textElement.setAttribute('font-family', 'Arial, sans-serif');
            textElement.setAttribute('font-size', '60');
            textElement.setAttribute('font-weight', 'bold');
            textElement.setAttribute('fill', '#e30613');
            textElement.textContent = 'RS';
            
            // Добавляем фильтр для свечения
            const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
            filter.setAttribute('id', 'emblema-glow');
            
            const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
            feGaussianBlur.setAttribute('stdDeviation', '2');
            feGaussianBlur.setAttribute('result', 'coloredBlur');
            
            const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
            const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
            feMergeNode1.setAttribute('in', 'coloredBlur');
            const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
            feMergeNode2.setAttribute('in', 'SourceGraphic');
            
            feMerge.appendChild(feMergeNode1);
            feMerge.appendChild(feMergeNode2);
            filter.appendChild(feGaussianBlur);
            filter.appendChild(feMerge);
            
            emblemaSVG.appendChild(filter);
            textElement.setAttribute('filter', 'url(#emblema-glow)');
            emblemaSVG.appendChild(textElement);
            
            emblemaDiv.appendChild(emblemaSVG);
            
            // Создаем текстовую ссылку
            const linkSpan = document.createElement('span');
            linkSpan.className = 'notification-text-link';
            linkSpan.textContent = linkText;
            linkSpan.style.cursor = 'pointer';
            
            // Добавляем эмблему в контейнер с ссылкой
            linkContainer.appendChild(emblemaDiv);
            linkContainer.appendChild(linkSpan);
            
            // Создаем копию текста для восстановления
            const originalLinkText = linkText;
            
            // Обработчик для текстовой ссылки
            linkSpan.addEventListener('click', (e) => {
                // Меняем состояние текста
                linkSpan.classList.add('done');
                linkSpan.textContent = 'подарок получен!';
                
                // Закрываем уведомление с анимацией вправо
                this.hideNotification(notification);
                
                // Открываем ссылку в новой вкладке
                setTimeout(() => {
                    window.open(linkUrl, '_blank', 'noopener,noreferrer');
                }, 200);
                
                // Восстанавливаем текст через 3 секунды (если нужно для других целей)
                setTimeout(() => {
                    linkSpan.classList.remove('done');
                    linkSpan.textContent = originalLinkText;
                }, 3000);
            });
            
            // Собираем структуру
            headerDiv.appendChild(iconSpan);
            headerDiv.appendChild(titleH3);
            
            footerDiv.appendChild(linkContainer);
            
            contentDiv.appendChild(headerDiv);
            contentDiv.appendChild(messageP);
            contentDiv.appendChild(footerDiv);
            
            notification.appendChild(closeBtn);
            notification.appendChild(contentDiv);
            
            return notification;
        }
        
        showNotification(notification) {
            document.body.appendChild(notification);
            this.currentNotification = notification;
            
            // Показываем с небольшой задержкой для анимации
            requestAnimationFrame(() => {
                setTimeout(() => {
                    notification.classList.add('show');
                    this.isShowing = true;
                }, 10);
            });
            
            // Настраиваем обработчики закрытия
            this.setupNotificationEvents(notification);
            
            // Автоматическое закрытие через 8 секунд
            this.autoCloseTimer = setTimeout(() => {
                this.hideNotification(notification);
            }, 8000);
            
            return notification;
        }
        
        setupNotificationEvents(notification) {
            const closeBtn = notification.querySelector('.notification-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.hideNotification(notification);
                });
            }
            
            // Закрытие при клике вне уведомления
            document.addEventListener('click', (e) => {
                if (this.isShowing && 
                    notification === this.currentNotification && 
                    !notification.contains(e.target) && 
                    e.target.id !== 'rsLogo' && 
                    !document.getElementById('rsLogo').contains(e.target)) {
                    this.hideNotification(notification);
                }
            });
        }
        
        hideNotification(notification) {
            if (!notification || !notification.parentNode) return;
            
            notification.classList.remove('show');
            notification.classList.add('hide');
            
            // Очищаем таймер авто-закрытия
            if (this.autoCloseTimer) {
                clearTimeout(this.autoCloseTimer);
                this.autoCloseTimer = null;
            }
            
            // Удаляем элемент после анимации
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.remove();
                    if (notification === this.currentNotification) {
                        this.currentNotification = null;
                    }
                }
                this.isShowing = false;
            }, 400);
        }
        
        // Публичные методы для использования из других скриптов
        showCustomNotification(message, linkText, linkUrl) {
            this.showGiftNotification(message, linkText, linkUrl);
        }
        
        hideCurrentNotification() {
            if (this.currentNotification) {
                this.hideNotification(this.currentNotification);
            }
        }
    }
    
    // Экспортируем глобально
    window.NotificationManager = NotificationManager;
    
    // Автоматическая инициализация при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                window.notificationManager = new NotificationManager();
            }, 1000);
        });
    } else {
        setTimeout(() => {
            window.notificationManager = new NotificationManager();
        }, 1000);
    }
})();