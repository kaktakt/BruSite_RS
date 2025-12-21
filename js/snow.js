// snow-final.js — адаптивный снег без лагов
(() => {
    'use strict';

    if (!window.requestAnimationFrame) return;

    /* ================= Canvas ================= */
    const canvas = document.createElement('canvas');
    canvas.id = 'snow-canvas';
    canvas.style.cssText = `
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        opacity: 0;
        transition: opacity 0.5s ease-in;
    `;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    /* ================= Плотность от экрана ================= */
    const AREA = w * h;
    const BASE_DENSITY = 1 / 35000;
    let flakeCount = Math.round(AREA * BASE_DENSITY);

    const MIN = 20;
    const MAX = 120;
    flakeCount = Math.max(MIN, Math.min(MAX, flakeCount));

    /* ================= Ветер (без sin) ================= */
    let wind = 0;
    let windTarget = Math.random() * 0.4 - 0.2;

    function updateWind() {
        wind += (windTarget - wind) * 0.002;

        if (Math.random() < 0.002) {
            windTarget = Math.random() * 0.6 - 0.3;
        }
    }

    /* ================= Снежинки ================= */
    let sizeMultiplier = 1;
    let flakes = [];

    function createFlake(fromTop = false) {
        return {
            x: Math.random() * w,
            y: fromTop ? -Math.random() * h : Math.random() * h,
            r: (Math.random() * 1.4 + 0.6) * sizeMultiplier,
            v: Math.random() * 0.9 + 0.6,
            opacity: 0
        };
    }

    function rebuildFlakes(fromTop = false) {
        flakes.length = flakeCount;
        for (let i = 0; i < flakeCount; i++) {
            flakes[i] = flakes[i] || createFlake(fromTop);
        }
    }

    rebuildFlakes();

    /* ================= FPS монитор ================= */
    let frames = 0;
    let last = performance.now();
    let fps = 60;

    function monitorFPS(now) {
        frames++;
        if (now - last >= 1000) {
            fps = frames;
            frames = 0;
            last = now;

            if (fps < 55) {
                flakeCount = Math.max(MIN, flakeCount - 8);
                sizeMultiplier = Math.min(1.6, sizeMultiplier + 0.1);
                rebuildFlakes();
            }
            else if (fps > 58) {
                flakeCount = Math.min(MAX, flakeCount + 6);
                sizeMultiplier = Math.max(1, sizeMultiplier - 0.05);
                rebuildFlakes();
            }
        }
    }

    /* ================= Анимация ================= */
    let running = false;
    let animationStartTime = 0;
    const ANIMATION_DURATION = 95;

    function update() {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#fff';
        
        updateWind();

        const currentTime = Date.now();
        const elapsedTime = currentTime - animationStartTime;
        const progress = Math.min(elapsedTime / ANIMATION_DURATION, 1);
        
        if (progress < 1) {
            canvas.style.opacity = 0.65 * progress;
        }

        for (let i = 0; i < flakeCount; i++) {
            const f = flakes[i];

            f.y += f.v;
            f.x += wind;

            if (f.y > h) {
                f.y = -5;
                f.x = Math.random() * w;
            }

            if (f.x > w) f.x = 0;
            if (f.x < 0) f.x = w;

            if (!f.opacity) f.opacity = 0;
            f.opacity = Math.min(f.opacity + 0.02, 1);
            
            ctx.globalAlpha = f.opacity * (parseFloat(canvas.style.opacity) || 0.65);
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
    }

    function loop(now) {
        if (!running) return;
        monitorFPS(now);
        update();
        requestAnimationFrame(loop);
    }

    /* ================= Запуск снега вместе с логотипом ================= */
    function startSnowWithLogo() {
        // Запускаем снег одновременно с появлением логотипа
        animationStartTime = Date.now();
        running = true;
        rebuildFlakes(true);
        canvas.style.opacity = '0';
        setTimeout(() => {
            canvas.style.opacity = '0.65';
        }, 10);
        requestAnimationFrame(loop);
    }

    function waitForLogoAppearance() {
        const rsLogo = document.querySelector('.rs-logo');
        
        if (!rsLogo) {
            // Если логотип не найден, запускаем снег через 1.5 секунды (время появления логотипа)
            setTimeout(() => {
                startSnowWithLogo();
            }, 1500);
            return;
        }

        // Логотип появляется через 1.5 секунды с анимацией 1 секунда
        // Ждем 1.5 секунды и запускаем снег одновременно с логотипом
        setTimeout(() => {
            startSnowWithLogo();
        }, 1500);
    }

    /* ================= UI-visible sync ================= */
    function waitForUI() {
        if (document.body.classList.contains('ui-visible')) {
            // Ждем появления логотипа вместо немедленного запуска
            waitForLogoAppearance();
        } else {
            requestAnimationFrame(waitForUI);
        }
    }

    waitForUI();

    /* ================= Resize ================= */
    window.addEventListener('resize', () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;

        const area = w * h;
        flakeCount = Math.round(area * BASE_DENSITY);
        flakeCount = Math.max(MIN, Math.min(MAX, flakeCount));

        rebuildFlakes(true);
    });

    document.addEventListener('visibilitychange', () => {
        running = !document.hidden;
        if (running) {
            animationStartTime = Date.now();
            requestAnimationFrame(loop);
        }
    });

    document.addEventListener('DOMContentLoaded', async () => {
        // Ждём появления UI
        document.body.classList.add('ui-visible');
    });

    /* ================= Snow control ================= */
    let snowEnabled = true;
    
    function startSnow() {
        snowEnabled = true;
        if (!running) {
            startSnowWithLogo();
        } 
    }

    function stopSnow() {
        snowEnabled = false;
        running = false;
        ctx.clearRect(0, 0, w, h);
        canvas.style.opacity = '0';
    }
    
    window.startSnow = startSnow;
    window.stopSnow = stopSnow;
})();

async function isSnowingInYekaterinburg() {
    try {
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=56.8389&longitude=60.6057&current_weather=true&hourly=precipitation_type');
        const data = await response.json();
        const currentWeather = data.current_weather;
        const hourly = data.hourly;
        const currentHourIndex = hourly.time.indexOf(currentWeather.time);
        const precipitationType = hourly.precipitation_type[currentHourIndex];
        // 1 - дождь, 2 - снег, 3 - смешанные осадки
        return precipitationType === 2 || precipitationType === 3;
    } catch (error) {
        console.error('Ошибка при получении данных о погоде:', error);
        return false;
    }
}