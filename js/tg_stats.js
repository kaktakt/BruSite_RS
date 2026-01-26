// tg_stats.js - Отправка статистики в Telegram
(function() {
    'use strict';
    
    // ========== КОНФИГУРАЦИЯ ==========
    const CONFIG = {
        TELEGRAM_BOT_TOKEN: '8537481694:AAHY8yeywBIlZARf6QZe9GWfyINJtHdMknM',
        TELEGRAM_CHAT_ID: '1132585602',
        WEBSITE_NAME: 'BruSite RS',
        SEND_ON_VISIT: true,
        SEND_ON_CLICK: false,
        SEND_ON_ERROR: true,
        SEND_ON_DOWNLOAD: true,
        SEND_ON_IP_CLICK: true,
        DELAY_BETWEEN_REQUESTS: 2000,
        MAX_RETRIES: 2,
        DEBUG_MODE: true,
        TEST_MODE: false,
        INCLUDE_GEOLOCATION: true,
        SEND_DATA_FILE: true, // Отправлять данные в виде файла
        DATA_FORMAT: 'combined' // combined, summary, file_only
    };
    
    // ========== ЛОГИРОВАНИЕ ==========
    const Logger = {
        log: (msg, type = 'info') => {
            if (!CONFIG.DEBUG_MODE) return;
            console.log(`[TG Stats] ${type.toUpperCase()}: ${msg}`);
        },
        error: (msg, error) => {
            console.error(`[TG Stats] ERROR: ${msg}`, error);
        }
    };
    
    // ========== IP DETECTOR ==========
    class IPDetector {
        constructor() {
            this.ip = null;
            this.location = null;
            this.services = [
                'https://api.ipify.org?format=json',
                'https://ipapi.co/json/',
                'https://ipwho.is/'
            ];
        }
        
        async detect() {
            try {
                for (const service of this.services) {
                    try {
                        const response = await fetch(service, { 
                            signal: AbortSignal.timeout(2000) 
                        });
                        if (!response.ok) continue;
                        
                        const data = await response.json();
                        
                        if (data.ip) {
                            this.ip = data.ip;
                            
                            if (data.city && data.country) {
                                this.location = `${data.city}, ${data.country}`;
                            } else if (data.country_name) {
                                this.location = data.country_name;
                            } else if (data.country) {
                                this.location = data.country;
                            }
                            
                            if (data.isp) this.provider = data.isp;
                            if (data.org) this.organization = data.org;
                            if (data.asn) this.asn = data.asn;
                            
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
                
                return {
                    ip: this.ip || 'Не определен',
                    location: this.location || 'Неизвестно',
                    provider: this.provider || 'Неизвестно',
                    organization: this.organization || 'Неизвестно',
                    asn: this.asn || 'Неизвестно'
                };
            } catch (error) {
                Logger.error('Ошибка определения IP', error);
                return {
                    ip: 'Ошибка',
                    location: 'Неизвестно',
                    provider: 'Ошибка'
                };
            }
        }
    }
    
    // ========== TELEGRAM API ==========
    class TelegramClient {
        constructor() {
            this.baseUrl = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}`;
            this.isAvailable = false;
        }
        
        async sendMessage(text, options = {}) {
            if (CONFIG.TEST_MODE) {
                Logger.log(`[TEST] ${text.substring(0, 100)}...`, 'debug');
                return { ok: true };
            }
            
            try {
                const response = await fetch(`${this.baseUrl}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: CONFIG.TELEGRAM_CHAT_ID,
                        text: text,
                        parse_mode: 'HTML',
                        disable_web_page_preview: true
                    }),
                    signal: AbortSignal.timeout(5000)
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                if (!data.ok) throw new Error(data.description);
                
                return data;
            } catch (error) {
                Logger.error('Ошибка отправки', error);
                throw error;
            }
        }
        
        async sendDocument(content, filename, caption = '') {
            if (CONFIG.TEST_MODE) {
                Logger.log(`[TEST] Документ: ${filename} (${content.length} байт)`, 'debug');
                return { ok: true };
            }
            
            try {
                // Создаем Blob из текста
                const blob = new Blob([content], { type: 'text/plain' });
                const file = new File([blob], filename, { type: 'text/plain' });
                
                const formData = new FormData();
                formData.append('chat_id', CONFIG.TELEGRAM_CHAT_ID);
                formData.append('document', file);
                if (caption) {
                    formData.append('caption', caption);
                }
                
                const response = await fetch(`${this.baseUrl}/sendDocument`, {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                if (!data.ok) throw new Error(data.description);
                
                return data;
            } catch (error) {
                Logger.error('Ошибка отправки документа', error);
                throw error;
            }
        }
    }
    
    // ========== GEOLOCATION HELPER ==========
    class GeolocationHelper {
        constructor() {
            this.locationData = null;
            this.weatherData = null;
        }
        
        async getWeatherGeolocation() {
            try {
                // Получаем данные из weather.js
                if (typeof window.getWeatherLocation === 'function') {
                    const locationData = window.getWeatherLocation();
                    this.locationData = locationData;
                    Logger.log('Данные геолокации получены', 'info');
                }
                
                if (typeof window.getFullWeatherData === 'function') {
                    const weatherData = window.getFullWeatherData();
                    this.weatherData = weatherData;
                }
                
                return {
                    location: this.locationData,
                    weather: this.weatherData
                };
            } catch (error) {
                Logger.error('Ошибка получения геолокации', error);
                return null;
            }
        }
        
        formatGeolocationSummary() {
            if (!this.locationData) {
                return 'Геолокация: Не определена';
            }
            
            const loc = this.locationData;
            const parts = [];
            
            if (loc.city) parts.push(loc.city);
            if (loc.region && loc.region !== 'Неизвестно') parts.push(loc.region);
            if (loc.country) parts.push(loc.country);
            
            const locationString = parts.join(', ');
            const coords = loc.coordinates || `${loc.latitude}, ${loc.longitude}`;
            const method = loc.method || 'Неизвестно';
            
            return `Геолокация: ${locationString} (${coords}) [${method}]`;
        }
        
        formatGeolocationDetails() {
            if (!this.locationData) {
                return 'Детали геолокации недоступны';
            }
            
            const loc = this.locationData;
            const details = [];
            
            if (loc.city) details.push(`Город: ${loc.city}`);
            if (loc.region && loc.region !== 'Неизвестно') details.push(`Регион: ${loc.region}`);
            if (loc.country) details.push(`Страна: ${loc.country}`);
            if (loc.countryCode) details.push(`Код страны: ${loc.countryCode}`);
            
            const coords = loc.coordinates || `${loc.latitude}, ${loc.longitude}`;
            details.push(`Координаты: ${coords}`);
            
            if (loc.latitude && loc.longitude) {
                details.push(`Широта: ${loc.latitude.toFixed(6)}`);
                details.push(`Долгота: ${loc.longitude.toFixed(6)}`);
                details.push(`Карты: https://maps.google.com/?q=${loc.latitude},${loc.longitude}`);
            }
            
            details.push(`Метод: ${loc.method || 'Неизвестно'}`);
            details.push(`Время: ${loc.timestamp || 'Неизвестно'}`);
            
            return details.join('\n');
        }
        
        getCombinedGeolocationData(ipInfo) {
            return {
                ip: ipInfo,
                gps: this.locationData,
                weather: this.weatherData,
                timestamp: new Date().toISOString(),
                url: window.location.href
            };
        }
        
        formatWeatherData() {
            if (!this.weatherData) {
                return 'Погодные данные: Недоступны';
            }
            
            const weather = this.weatherData.weather || 'Неизвестно';
            const location = this.weatherData.location?.city || 'Неизвестно';
            
            return `Погода: ${location} - ${weather}`;
        }
    }
    
    // ========== DATA FORMATTER ==========
    class DataFormatter {
        static formatSummary(data, ipInfo, geolocation) {
            const lines = [];
            
            lines.push(`=== ПОСЕЩЕНИЕ САЙТА: ${CONFIG.WEBSITE_NAME} ===`);
            lines.push(`Время: ${data.time}`);
            lines.push(`Страница: ${data.title}`);
            lines.push(`URL: ${data.url.substring(0, 100)}${data.url.length > 100 ? '...' : ''}`);
            lines.push(`Источник: ${data.referrer}`);
            lines.push('');
            
            lines.push(`=== УСТРОЙСТВО ===`);
            lines.push(`Тип: ${data.device}`);
            lines.push(`Браузер: ${data.browser}`);
            lines.push(`ОС: ${data.os}`);
            lines.push(`Экран: ${data.screen}`);
            lines.push(`Язык: ${data.language}`);
            lines.push(`Часовой пояс: ${data.timezone}`);
            lines.push(`Пиксельное соотношение: ${data.pixelRatio}`);
            lines.push(`Сенсорный экран: ${data.isTouch}`);
            lines.push('');
            
            lines.push(`=== СЕТЕВЫЕ ДАННЫЕ ===`);
            lines.push(`IP адрес: ${ipInfo.ip}`);
            lines.push(`Локация IP: ${ipInfo.location}`);
            lines.push(`Провайдер: ${ipInfo.provider}`);
            lines.push(`ASN: ${ipInfo.asn || 'Неизвестно'}`);
            lines.push(`Организация: ${ipInfo.organization || 'Неизвестно'}`);
            lines.push('');
            
            if (geolocation?.gps) {
                lines.push(`=== ТОЧНАЯ ГЕОЛОКАЦИЯ ===`);
                const gps = geolocation.gps;
                lines.push(`Город: ${gps.city || 'Неизвестно'}`);
                if (gps.region && gps.region !== 'Неизвестно') lines.push(`Регион: ${gps.region}`);
                lines.push(`Страна: ${gps.country || 'Неизвестно'}`);
                if (gps.countryCode) lines.push(`Код страны: ${gps.countryCode}`);
                lines.push(`Координаты: ${gps.coordinates || `${gps.latitude}, ${gps.longitude}`}`);
                lines.push(`Метод определения: ${gps.method || 'Неизвестно'}`);
                lines.push('');
            }
            
            if (geolocation?.weather) {
                lines.push(`=== ПОГОДА ===`);
                lines.push(`Эффект: ${geolocation.weather.weather || 'Неизвестно'}`);
                lines.push(`Время данных: ${geolocation.weather.time || 'Неизвестно'}`);
                lines.push('');
            }
            
            lines.push(`=== СИСТЕМНЫЕ ДАННЫЕ ===`);
            lines.push(`Онлайн: ${data.online}`);
            lines.push(`Cookies: ${data.cookies}`);
            lines.push(`User Agent: ${data.userAgent.substring(0, 150)}${data.userAgent.length > 150 ? '...' : ''}`);
            
            return lines.join('\n');
        }
        
        static formatForFile(data, ipInfo, geolocation) {
            const result = {
                metadata: {
                    website: CONFIG.WEBSITE_NAME,
                    timestamp: new Date().toISOString(),
                    collection_time: data.time,
                    url: window.location.href
                },
                visit: {
                    page_title: data.title,
                    referrer: data.referrer,
                    url: data.url
                },
                device: {
                    type: data.device,
                    browser: data.browser,
                    os: data.os,
                    screen: data.screen,
                    language: data.language,
                    timezone: data.timezone,
                    pixel_ratio: data.pixelRatio,
                    touch_screen: data.isTouch,
                    online: data.online,
                    cookies: data.cookies
                },
                network: {
                    ip: ipInfo.ip,
                    location: ipInfo.location,
                    provider: ipInfo.provider,
                    asn: ipInfo.asn,
                    organization: ipInfo.organization
                },
                geolocation: geolocation?.gps || null,
                weather: geolocation?.weather || null,
                user_agent: data.userAgent
            };
            
            return JSON.stringify(result, null, 2);
        }
        
        static createFilename(ipInfo, data) {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
            const ip = ipInfo.ip.replace(/[^0-9.]/g, '') || 'unknown';
            
            return `${ip}_${dateStr}_${timeStr}.json`;
        }
        
        static createTextFilename(ipInfo, data) {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
            const ip = ipInfo.ip.replace(/[^0-9.]/g, '') || 'unknown';
            
            return `visit_${ip}_${dateStr}_${timeStr}.txt`;
        }
    }
    
    // ========== VISITOR TRACKER ==========
    class VisitorTracker {
        constructor() {
            this.data = {};
            this.ipDetector = new IPDetector();
            this.geolocationHelper = new GeolocationHelper();
            this.ipInfo = null;
            this.geolocationInfo = null;
        }
        
        async collect() {
            try {
                this.collectBasicData();
                await this.collectIPData();
                
                if (CONFIG.INCLUDE_GEOLOCATION) {
                    await this.collectGeolocationData();
                }
                
                return {
                    summary: DataFormatter.formatSummary(this.data, this.ipInfo, this.geolocationInfo),
                    fileData: DataFormatter.formatForFile(this.data, this.ipInfo, this.geolocationInfo),
                    filename: DataFormatter.createFilename(this.ipInfo, this.data),
                    textFilename: DataFormatter.createTextFilename(this.ipInfo, this.data)
                };
            } catch (error) {
                Logger.error('Ошибка сбора данных', error);
                return this.getFallbackData();
            }
        }
        
        collectBasicData() {
            this.data = {
                time: new Date().toLocaleString('ru-RU'),
                url: window.location.href,
                title: document.title,
                referrer: document.referrer || 'Прямой вход',
                userAgent: navigator.userAgent,
                screen: `${window.screen.width}x${window.screen.height}`,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                online: navigator.onLine ? 'Да' : 'Нет',
                cookies: navigator.cookieEnabled ? 'Да' : 'Нет'
            };
            
            this.detectBrowser();
        }
        
        async collectIPData() {
            try {
                this.ipInfo = await this.ipDetector.detect();
                Logger.log(`IP данные собраны`, 'debug');
            } catch (error) {
                this.ipInfo = { ip: 'Ошибка', location: 'Неизвестно' };
            }
        }
        
        async collectGeolocationData() {
            try {
                this.geolocationInfo = await this.geolocationHelper.getWeatherGeolocation();
                if (this.geolocationInfo?.location) {
                    Logger.log('Геолокационные данные получены', 'info');
                }
            } catch (error) {
                Logger.error('Ошибка сбора геолокации', error);
                this.geolocationInfo = null;
            }
        }
        
        detectBrowser() {
            const ua = this.data.userAgent;
            
            if (ua.includes('Chrome')) this.data.browser = 'Chrome';
            else if (ua.includes('Firefox')) this.data.browser = 'Firefox';
            else if (ua.includes('Safari')) this.data.browser = 'Safari';
            else if (ua.includes('Edge')) this.data.browser = 'Edge';
            else this.data.browser = 'Другой';
            
            if (/mobile/i.test(ua)) this.data.device = 'Мобильный';
            else if (/tablet/i.test(ua)) this.data.device = 'Планшет';
            else this.data.device = 'Компьютер';
            
            if (ua.includes('Windows')) this.data.os = 'Windows';
            else if (ua.includes('Mac')) this.data.os = 'macOS';
            else if (ua.includes('Linux')) this.data.os = 'Linux';
            else if (ua.includes('Android')) this.data.os = 'Android';
            else if (ua.includes('iOS')) this.data.os = 'iOS';
            else this.data.os = 'Другая ОС';
            
            this.data.isTouch = 'ontouchstart' in window ? 'Да' : 'Нет';
            this.data.pixelRatio = window.devicePixelRatio || 1;
        }
        
        getFallbackData() {
            return {
                summary: `Посещение сайта: ${CONFIG.WEBSITE_NAME}\nВремя: ${new Date().toLocaleString('ru-RU')}\nСтраница: ${document.title}\nURL: ${window.location.href}\n\nНе удалось собрать полные данные`,
                fileData: JSON.stringify({
                    error: 'Не удалось собрать данные',
                    timestamp: new Date().toISOString(),
                    url: window.location.href
                }, null, 2),
                filename: 'error_data.json',
                textFilename: 'error_data.txt'
            };
        }
        
        async getIP() {
            if (!this.ipInfo) {
                await this.collectIPData();
            }
            return this.ipInfo?.ip || 'Не определен';
        }
        
        async getGeolocationData() {
            if (!this.geolocationInfo && CONFIG.INCLUDE_GEOLOCATION) {
                await this.collectGeolocationData();
            }
            return this.geolocationHelper.getCombinedGeolocationData(this.ipInfo);
        }
        
        getFormattedGeolocation() {
            return this.geolocationHelper.formatGeolocationSummary();
        }
    }
    
    // ========== ОСНОВНОЙ КЛАСС ==========
    class TelegramStats {
        constructor() {
            this.client = new TelegramClient();
            this.tracker = new VisitorTracker();
            this.initialized = false;
            this.visitSent = false;
        }
        
        async init() {
            if (this.initialized) return;
            
            Logger.log('Инициализация...', 'info');
            
            setTimeout(async () => {
                try {
                    if (CONFIG.SEND_ON_VISIT && !this.visitSent) {
                        await this.sendVisitNotification();
                        this.visitSent = true;
                    }
                    
                    this.setupEventTracking();
                    if (CONFIG.SEND_ON_ERROR) this.setupErrorHandling();
                    
                    this.initialized = true;
                    Logger.log('Инициализирован', 'success');
                    
                } catch (error) {
                    Logger.error('Ошибка инициализации', error);
                }
            }, 2000);
        }
        
        async sendVisitNotification() {
            try {
                const collectedData = await this.tracker.collect();
                
                switch (CONFIG.DATA_FORMAT) {
                    case 'file_only':
                        await this.client.sendDocument(
                            collectedData.fileData,
                            collectedData.filename,
                            `Данные посещения: ${CONFIG.WEBSITE_NAME}\nВремя: ${new Date().toLocaleString('ru-RU')}`
                        );
                        break;
                        
                    case 'summary':
                        await this.client.sendMessage(
                            `<b>Посещение сайта</b>\n\n<pre>${collectedData.summary}</pre>`
                        );
                        break;
                        
                    case 'combined':
                    default:
                        // Отправляем краткую информацию
                        await this.client.sendMessage(
                            `<b>Посещение сайта: ${CONFIG.WEBSITE_NAME}</b>\n\n` +
                            `<b>Время:</b> ${new Date().toLocaleString('ru-RU')}\n` +
                            `<b>Страница:</b> ${document.title}\n` +
                            `<b>IP:</b> ${this.tracker.ipInfo?.ip || 'Не определен'}\n` +
                            `<b>${this.tracker.getFormattedGeolocation()}</b>`
                        );
                        
                        // Отправляем файл с полными данными
                        if (CONFIG.SEND_DATA_FILE) {
                            setTimeout(async () => {
                                await this.client.sendDocument(
                                    collectedData.fileData,
                                    collectedData.filename,
                                    `Полные данные посещения`
                                );
                            }, 1000);
                        }
                        break;
                }
                
                Logger.log('Уведомление о посещении отправлено', 'success');
                
            } catch (error) {
                Logger.error('Ошибка отправки уведомления о посещении', error);
            }
        }
        
        setupEventTracking() {
            document.querySelectorAll('a[download]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const filename = link.getAttribute('download') || link.href.split('/').pop();
                    setTimeout(() => {
                        window.open(link.href, '_blank');
                        this.sendDownloadNotification(filename);
                    }, 100);
                });
            });
            
            document.querySelectorAll('.copy-card').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const cardNumber = link.getAttribute('data-card') || link.textContent.trim();
                    this.sendCardNotification(cardNumber);
                    
                    try {
                        navigator.clipboard.writeText(cardNumber);
                    } catch (error) {
                        Logger.error('Ошибка копирования', error);
                    }
                });
            });
        }
        
        async sendDownloadNotification(filename) {
            if (!CONFIG.SEND_ON_DOWNLOAD) return;
            
            const ip = await this.tracker.getIP();
            const geolocation = await this.tracker.getGeolocationData();
            
            let message = `<b>Скачивание файла</b>\n\n`;
            message += `<b>Сайт:</b> ${CONFIG.WEBSITE_NAME}\n`;
            message += `<b>Время:</b> ${new Date().toLocaleString('ru-RU')}\n`;
            message += `<b>Файл:</b> ${filename}\n`;
            message += `<b>IP:</b> ${ip}\n`;
            message += `<b>Страница:</b> ${document.title}`;
            
            if (geolocation?.gps) {
                message += `\n<b>Геолокация:</b> ${geolocation.gps.city || 'Неизвестно'}`;
            }
            
            await this.client.sendMessage(message);
        }
        
        async sendCardNotification(cardNumber) {
            const masked = cardNumber.replace(/(\d{4})\d{8}(\d{4})/, '$1 **** **** $2');
            const geolocation = await this.tracker.getGeolocationData();
            
            let message = `<b>Копирование карты</b>\n\n`;
            message += `<b>Сайт:</b> ${CONFIG.WEBSITE_NAME}\n`;
            message += `<b>Время:</b> ${new Date().toLocaleString('ru-RU')}\n`;
            message += `<b>Карта:</b> ${masked}\n`;
            message += `<b>Страница:</b> ${document.title}`;
            
            if (geolocation?.gps) {
                message += `\n<b>Локация:</b> ${geolocation.gps.city || 'Неизвестно'}`;
                message += `\n<b>IP:</b> ${geolocation.ip?.ip || 'Не определен'}`;
            }
            
            await this.client.sendMessage(message);
        }
        
        setupErrorHandling() {
            window.addEventListener('error', (event) => {
                const message = `<b>Ошибка на сайте</b>\n\n`;
                message += `<b>Сайт:</b> ${CONFIG.WEBSITE_NAME}\n`;
                message += `<b>Время:</b> ${new Date().toLocaleString('ru-RU')}\n`;
                message += `<b>Ошибка:</b> ${event.message}\n`;
                message += `<b>Файл:</b> ${event.filename || 'Неизвестно'}\n`;
                message += `<b>Строка:</b> ${event.lineno || 'Неизвестно'}\n`;
                message += `<b>URL:</b> ${window.location.href}`;
                
                this.client.sendMessage(message).catch(e => {
                    Logger.error('Ошибка отправки уведомления об ошибке', e);
                });
            });
            
            window.addEventListener('unhandledrejection', (event) => {
                const message = `<b>Необработанная ошибка</b>\n\n`;
                message += `<b>Сайт:</b> ${CONFIG.WEBSITE_NAME}\n`;
                message += `<b>Время:</b> ${new Date().toLocaleString('ru-RU')}\n`;
                message += `<b>Причина:</b> ${event.reason?.message || event.reason}\n`;
                message += `<b>URL:</b> ${window.location.href}`;
                
                this.client.sendMessage(message);
            });
        }
        
        // Метод для экспорта данных
        async exportData(format = 'json') {
            try {
                const collectedData = await this.tracker.collect();
                
                switch (format) {
                    case 'json':
                        return collectedData.fileData;
                    case 'text':
                        return collectedData.summary;
                    case 'file':
                        return {
                            data: collectedData.fileData,
                            filename: collectedData.filename
                        };
                    default:
                        return collectedData.fileData;
                }
            } catch (error) {
                Logger.error('Ошибка экспорта данных', error);
                return null;
            }
        }
    }
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    window.TelegramStats = new TelegramStats();
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => window.TelegramStats.init(), 1500);
        });
    } else {
        setTimeout(() => window.TelegramStats.init(), 1500);
    }
    
    // Глобальные методы
    window.exportVisitorData = (format = 'json') => window.TelegramStats.exportData(format);
    window.getVisitorIP = () => window.TelegramStats.tracker.getIP();
    window.getVisitorGeolocation = () => window.TelegramStats.tracker.getGeolocationData();
    
    // Утилиты для разработки
    if (CONFIG.DEBUG_MODE) {
        window.debugTelegram = {
            sendTest: () => window.TelegramStats.sendVisitNotification(),
            getData: () => window.TelegramStats.exportData(),
            getIP: () => window.TelegramStats.tracker.getIP(),
            getGeolocation: () => window.TelegramStats.tracker.getGeolocationData()
        };
    }
    
    Logger.log('Модуль загружен', 'info');
})();