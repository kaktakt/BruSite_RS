// performance-manager.js
(function() {
    'use strict';
    
    class PerformanceManager {
        constructor() {
            this.metrics = {
                fps: 60,
                isLagging: false
            };
            
            this.effectsReduced = false;
            this.checkInterval = null;
            
            this.init();
        }
        
        init() {
            // Запускаем мониторинг FPS
            this.monitorFPS();
            
            // Проверяем производительность каждые 5 секунд
            this.checkInterval = setInterval(() => {
                this.checkPerformance();
            }, 5000);
            
            // Оптимизация событий мыши
            this.optimizeMouseEvents();
            
            console.log('Performance Manager initialized');
        }
        
        monitorFPS() {
            let lastTime = performance.now();
            let frames = 0;
            let frameTimes = [];
            
            const checkFPS = (currentTime) => {
                frames++;
                frameTimes.push(currentTime - lastTime);
                lastTime = currentTime;
                
                // Обновляем FPS каждые 2 секунды
                if (frameTimes.length >= 60) { // ~2 секунды при 30 FPS
                    const avgFrameTime = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
                    this.metrics.fps = Math.round(1000 / avgFrameTime);
                    
                    // Сбрасываем массив
                    frameTimes = [];
                    frames = 0;
                }
                
                requestAnimationFrame(checkFPS);
            };
            
            requestAnimationFrame(checkFPS);
        }
        
        checkPerformance() {
            const isLowEndDevice = 
                navigator.hardwareConcurrency <= 2 ||
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            // Если низкий FPS или слабое устройство - активируем режим производительности
            if ((this.metrics.fps < 25 || isLowEndDevice) && !this.effectsReduced) {
                this.reduceEffects();
            } else if (this.metrics.fps > 40 && this.effectsReduced) {
                this.restoreEffects();
            }
        }
        
        optimizeMouseEvents() {
            // Дебаунс для событий мыши
            let mouseMoveTimeout;
            
            document.addEventListener('mousemove', () => {
                clearTimeout(mouseMoveTimeout);
                
                // При активном движении мыши временно упрощаем эффекты
                document.body.classList.add('mouse-moving');
                
                mouseMoveTimeout = setTimeout(() => {
                    document.body.classList.remove('mouse-moving');
                }, 100);
            }, { passive: true });
        }
        
        reduceEffects() {
            if (this.effectsReduced) return;
            
            this.effectsReduced = true;
            console.log('Performance mode activated');
            
            // Упрощаем снег
            const snowCanvas = document.getElementById('snow-canvas');
            if (snowCanvas) {
                snowCanvas.style.opacity = '0.2';
                // Отправляем сообщение снегу для уменьшения количества снежинок
                if (window.snowController) {
                    window.snowController.reduceIntensity();
                }
            }
            
            // Убираем тяжелые CSS-эффекты
            document.body.classList.add('performance-mode');
            
            // Упрощаем видеофон
            const bgVideo = document.getElementById('bgVideo');
            if (bgVideo) {
                bgVideo.playbackRate = 0.7;
            }
            
            // Упрощаем анимации
            const animatedElements = document.querySelectorAll('.rs-image, .tab, .card');
            animatedElements.forEach(el => {
                el.style.transition = 'none';
            });
        }
        
        restoreEffects() {
            if (!this.effectsReduced) return;
            
            this.effectsReduced = false;
            console.log('Performance mode deactivated');
            
            // Восстанавливаем снег
            const snowCanvas = document.getElementById('snow-canvas');
            if (snowCanvas) {
                snowCanvas.style.opacity = '0.65';
                if (window.snowController) {
                    window.snowController.restoreIntensity();
                }
            }
            
            // Восстанавливаем CSS-эффекты
            document.body.classList.remove('performance-mode');
            
            // Восстанавливаем видео
            const bgVideo = document.getElementById('bgVideo');
            if (bgVideo) {
                bgVideo.playbackRate = 1.0;
            }
            
            // Восстанавливаем анимации
            const animatedElements = document.querySelectorAll('.rs-image, .tab, .card');
            animatedElements.forEach(el => {
                el.style.transition = '';
            });
        }
        
        destroy() {
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
            }
        }
    }
    
    // Инициализация после полной загрузки страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                window.PerformanceManager = new PerformanceManager();
            }, 2000);
        });
    } else {
        setTimeout(() => {
            window.PerformanceManager = new PerformanceManager();
        }, 2000);
    }
})();