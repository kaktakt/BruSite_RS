// weather.js - Погода с автоопределением города и автоматическим обновлением
(function() {
    'use strict';
    
    const WeatherManager = {
        currentEffect: null,
        apiKey: 'b286b56d6c89fce4e7b81855222be426',
        city: null,
        latitude: null,
        longitude: null,
        locationData: null,
        updateInterval: 5 * 60 * 1000,
        retryDelay: 5000,
        maxRetries: 3,
        retryCount: 0,
        container: null,
        isInitialized: false,
        isUpdating: false,
        autoUpdateTimer: null,
        hideTimer: null,
        hoverDelay: 300,
        geolocationConsent: null, // null - не определено, true - разрешено, false - запрещено
        
        // Ключи для localStorage
        storageKeys: {
            geolocationConsent: 'weather_geolocation_consent',
            geolocationConsentTimestamp: 'weather_geolocation_consent_timestamp',
            cityFallback: 'weather_city_fallback',
            coordinates: 'weather_coordinates',
            locationMethod: 'weather_location_method'
        },
        
        weatherConditions: {
            rain: {
                id: [500, 501, 502, 503, 504, 511, 520, 521, 522, 531],
                effects: ['rain'],
                intensity: 'medium'
            },
            drizzle: {
                id: [300, 301, 302, 310, 311, 312, 313, 314, 321],
                effects: ['drizzle'],
                intensity: 'light'
            },
            thunderstorm: {
                id: [200, 201, 202, 210, 211, 212, 221, 230, 231, 232],
                effects: ['rain'],
                intensity: 'heavy'
            },
            snow: {
                id: [600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622],
                effects: ['snow'],
                intensity: 'medium'
            },
            mist: {
                id: [701],
                effects: ['fog'],
                intensity: 'light'
            },
            fog: {
                id: [741],
                effects: ['fog'],
                intensity: 'medium'
            },
            haze: {
                id: [721],
                effects: ['fog'],
                intensity: 'light'
            },
            clear: {
                id: [800],
                effects: ['stars'],
                intensity: 'none'
            },
            few_clouds: {
                id: [801],
                effects: ['stars'],
                intensity: 'light'
            },
            scattered_clouds: {
                id: [802],
                effects: [],
                intensity: 'none'
            },
            broken_clouds: {
                id: [803],
                effects: [],
                intensity: 'none'
            },
            overcast: {
                id: [804],
                effects: [],
                intensity: 'none'
            }
        },
        
        effects: {
            rain: {
                name: 'rain',
                create: function(intensity = 'medium') {
                    const countMap = {
                        'light': 40,
                        'medium': 80,
                        'heavy': 150
                    };
                    
                    const count = countMap[intensity] || 80;
                    for (let i = 0; i < count; i++) {
                        const drop = document.createElement('div');
                        drop.className = 'weather-effect rain-drop';
                        
                        drop.style.left = Math.random() * 100 + 'vw';
                        drop.style.top = '-20px';
                        
                        const size = intensity === 'heavy' ? 
                            Math.random() * 2 + 1 : 
                            intensity === 'light' ? 
                            Math.random() * 1 + 0.3 : 
                            Math.random() * 1.5 + 0.5;
                        
                        const speed = intensity === 'heavy' ? 
                            Math.random() * 1 + 0.8 : 
                            intensity === 'light' ? 
                            Math.random() * 3 + 2 : 
                            Math.random() * 2 + 1.5;
                        
                        drop.style.width = size + 'px';
                        drop.style.height = size * 8 + 'px';
                        drop.style.opacity = Math.random() * 0.6 + 0.4;
                        drop.style.animation = `fall ${speed}s linear infinite`;
                        drop.style.animationDelay = Math.random() * 3 + 's';
                        
                        WeatherManager.container.appendChild(drop);
                    }
                },
                remove: function() {
                    const drops = document.querySelectorAll('.rain-drop');
                    drops.forEach(drop => drop.remove());
                }
            },
            
            snow: {
                name: 'snow',
                create: function(intensity = 'medium') {
                    const countMap = {
                        'light': 60,
                        'medium': 120,
                        'heavy': 200
                    };
                    
                    const count = countMap[intensity] || 120;
                    for (let i = 0; i < count; i++) {
                        const flake = document.createElement('div');
                        flake.className = 'weather-effect snowflake';
                        
                        flake.style.left = Math.random() * 100 + 'vw';
                        flake.style.top = '-20px';
                        
                        const size = Math.random() * 4 + 1;
                        const speed = Math.random() * 8 + 4;
                        const sway = Math.random() * 100 - 50;
                        
                        flake.style.width = size + 'px';
                        flake.style.height = size + 'px';
                        flake.style.opacity = Math.random() * 0.7 + 0.3;
                        flake.style.animation = `snowFall ${speed}s linear infinite, sway ${speed * 2}s ease-in-out infinite alternate`;
                        flake.style.animationDelay = Math.random() * 4 + 's';
                        flake.style.setProperty('--sway-distance', `${sway}px`);
                        
                        WeatherManager.container.appendChild(flake);
                    }
                },
                remove: function() {
                    const flakes = document.querySelectorAll('.snowflake');
                    flakes.forEach(flake => flake.remove());
                }
            },
            
            fog: {
                name: 'fog',
                create: function(intensity = 'medium') {
                    const countMap = {
                        'light': 8,
                        'medium': 15,
                        'heavy': 25
                    };
                    
                    const count = countMap[intensity] || 15;
                    for (let i = 0; i < count; i++) {
                        const fog = document.createElement('div');
                        fog.className = 'weather-effect fog-particle';
                        
                        fog.style.left = Math.random() * 100 + 'vw';
                        fog.style.top = Math.random() * 100 + 'vh';
                        
                        const size = Math.random() * 150 + 80;
                        const speed = Math.random() * 30 + 15;
                        fog.style.width = size + 'px';
                        fog.style.height = size / 2 + 'px';
                        fog.style.opacity = Math.random() * 0.4 + 0.1;
                        fog.style.animation = `fogFloat ${speed}s linear infinite`;
                        fog.style.animationDelay = Math.random() * 8 + 's';
                        fog.style.filter = 'blur(5px)';
                        
                        WeatherManager.container.appendChild(fog);
                    }
                },
                remove: function() {
                    const fogs = document.querySelectorAll('.fog-particle');
                    fogs.forEach(fog => fog.remove());
                }
            },
            
            stars: {
                name: 'stars',
                create: function(intensity = 'medium') {
                    const countMap = {
                        'light': 40,
                        'medium': 80,
                        'heavy': 120
                    };
                    
                    const count = countMap[intensity] || 80;
                    for (let i = 0; i < count; i++) {
                        const star = document.createElement('div');
                        star.className = 'weather-effect star';
                        
                        star.style.left = Math.random() * 100 + 'vw';
                        star.style.top = Math.random() * 100 + 'vh';
                        
                        const size = Math.random() * 2 + 0.5;
                        const speed = Math.random() * 2 + 1;
                        const twinkle = Math.random() * 0.5 + 0.5;
                        
                        star.style.width = size + 'px';
                        star.style.height = size + 'px';
                        star.style.opacity = Math.random() * 0.6 + 0.2;
                        star.style.animation = `twinkle ${speed}s ease-in-out infinite alternate`;
                        star.style.animationDelay = Math.random() * 2 + 's';
                        star.style.boxShadow = `0 0 ${size * 2}px ${size}px rgba(255, 255, 255, ${twinkle * 0.3})`;
                        
                        WeatherManager.container.appendChild(star);
                    }
                },
                remove: function() {
                    const stars = document.querySelectorAll('.star');
                    stars.forEach(star => star.remove());
                }
            },
            
            drizzle: {
                name: 'drizzle',
                create: function(intensity = 'light') {
                    const count = 40;
                    for (let i = 0; i < count; i++) {
                        const drop = document.createElement('div');
                        drop.className = 'weather-effect drizzle-drop';
                        
                        drop.style.left = Math.random() * 100 + 'vw';
                        drop.style.top = '-20px';
                        
                        const size = Math.random() * 1 + 0.3;
                        const speed = Math.random() * 4 + 3;
                        drop.style.width = size + 'px';
                        drop.style.height = size * 6 + 'px';
                        drop.style.opacity = Math.random() * 0.4 + 0.3;
                        drop.style.animation = `fall ${speed}s linear infinite`;
                        drop.style.animationDelay = Math.random() * 4 + 's';
                        
                        WeatherManager.container.appendChild(drop);
                    }
                },
                remove: function() {
                    const drops = document.querySelectorAll('.drizzle-drop');
                    drops.forEach(drop => drop.remove());
                }
            }
        },
        
        init: function() {
            if (this.isInitialized) return;
            
            console.log('🌤️ Инициализация погодных эффектов...');
            
            // Создаем контейнер для эффектов
            this.container = document.createElement('div');
            this.container.className = 'weather-effects-container';
            this.container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9999;
                overflow: hidden;
            `;
            document.body.appendChild(this.container);
            
            // Загружаем сохраненные настройки геолокации
            this.loadGeolocationConsent();
            
            // Определяем местоположение (тихо, без показа загрузки)
            this.detectLocation();
            
            this.isInitialized = true;
        },
        
        // Загружаем сохраненное согласие на геолокацию
        loadGeolocationConsent: function() {
            try {
                const consent = localStorage.getItem(this.storageKeys.geolocationConsent);
                if (consent !== null) {
                    this.geolocationConsent = consent === 'true';
                    console.log(`📍 Загружено сохраненное согласие на геолокацию: ${this.geolocationConsent ? 'разрешено' : 'запрещено'}`);
                }
                
                // Загружаем сохраненные координаты, если есть
                const savedCoords = localStorage.getItem(this.storageKeys.coordinates);
                if (savedCoords) {
                    const coords = JSON.parse(savedCoords);
                    this.latitude = coords.latitude;
                    this.longitude = coords.longitude;
                    console.log('📍 Загружены сохраненные координаты');
                }
                
                // Загружаем сохраненный город для fallback
                const savedCity = localStorage.getItem(this.storageKeys.cityFallback);
                if (savedCity) {
                    this.city = savedCity;
                    console.log(`📍 Загружен сохраненный город: ${savedCity}`);
                }
                
            } catch (error) {
                console.error('❌ Ошибка загрузки настроек геолокации:', error);
            }
        },
        
        // Сохраняем согласие на геолокацию
        saveGeolocationConsent: function(consent) {
            try {
                this.geolocationConsent = consent;
                localStorage.setItem(this.storageKeys.geolocationConsent, consent);
                localStorage.setItem(this.storageKeys.geolocationConsentTimestamp, Date.now());
                console.log(`📍 Сохранено согласие на геолокацию: ${consent ? 'разрешено' : 'запрещено'}`);
            } catch (error) {
                console.error('❌ Ошибка сохранения согласия на геолокацию:', error);
            }
        },
        
        // Сохраняем координаты
        saveCoordinates: function(latitude, longitude) {
            try {
                const coords = { latitude, longitude };
                localStorage.setItem(this.storageKeys.coordinates, JSON.stringify(coords));
                console.log('📍 Координаты сохранены в localStorage');
            } catch (error) {
                console.error('❌ Ошибка сохранения координат:', error);
            }
        },
        
        // Сохраняем город для fallback
        saveCityFallback: function(city) {
            try {
                localStorage.setItem(this.storageKeys.cityFallback, city);
                console.log(`📍 Город сохранен для fallback: ${city}`);
            } catch (error) {
                console.error('❌ Ошибка сохранения города:', error);
            }
        },
        
        // Сохраняем метод определения местоположения
        saveLocationMethod: function(method) {
            try {
                localStorage.setItem(this.storageKeys.locationMethod, method);
            } catch (error) {
                console.error('❌ Ошибка сохранения метода определения местоположения:', error);
            }
        },
        
        detectLocation: function() {
            console.log('📍 Определение местоположения...');
            
            // Если пользователь ранее запретил геолокацию, сразу используем IP
            if (this.geolocationConsent === false) {
                console.log('📍 Пользователь ранее запретил геолокацию, используем IP');
                this.saveLocationMethod('IP (предыдущий отказ)');
                this.getCityByIP();
                return;
            }
            
            // Если есть сохраненные координаты, используем их
            if (this.latitude && this.longitude) {
                console.log(`📍 Используем сохраненные координаты: ${this.latitude}, ${this.longitude}`);
                this.saveLocationMethod('Сохраненные координаты');
                this.getLocationDetails();
                return;
            }
            
            // Автоматически разрешаем геолокацию по умолчанию
            // Если пользователь не делал выбора ранее, считаем что разрешено
            if (this.geolocationConsent === null) {
                console.log('📍 Геолокация не запрашивалась ранее, считаем разрешенной по умолчанию');
            }
            
            // Используем браузерную геолокацию
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.latitude = position.coords.latitude;
                        this.longitude = position.coords.longitude;
                        
                        // Сохраняем согласие и координаты
                        this.saveGeolocationConsent(true);
                        this.saveCoordinates(this.latitude, this.longitude);
                        this.saveLocationMethod('GPS');
                        
                        console.log(`📍 Координаты получены и сохранены: ${this.latitude}, ${this.longitude}`);
                        this.getLocationDetails();
                    },
                    (error) => {
                        console.warn('❌ Геолокация недоступна:', error.message);
                        
                        // Сохраняем отказ в зависимости от типа ошибки
                        if (error.code === error.PERMISSION_DENIED) {
                            this.saveGeolocationConsent(false);
                            this.saveLocationMethod('GPS (отказ)');
                        } else {
                            this.saveLocationMethod('GPS (ошибка)');
                        }
                        
                        this.getCityByIP();
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 30 * 60 * 1000, // 30 минут кэша
                        // Автоматически разрешаем, не показывая диалог если возможно
                        // (работает только в некоторых браузерах и условиях)
                        ...(this.geolocationConsent !== false && {
                            // Попробуем использовать кэшированные данные
                            maximumAge: 5 * 60 * 1000 // 5 минут для более свежих данных
                        })
                    }
                );
            } else {
                console.warn('❌ Геолокация не поддерживается браузером');
                this.saveLocationMethod('Не поддерживается');
                this.getCityByIP();
            }
        },
        
        async getLocationDetails() {
            try {
                const response = await fetch(
                    `https://api.openweathermap.org/geo/1.0/reverse?lat=${this.latitude}&lon=${this.longitude}&limit=1&appid=${this.apiKey}`
                );
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data && data.length > 0) {
                    const location = data[0];
                    this.locationData = {
                        city: location.name || 'Неизвестно',
                        region: location.state || location.region || 'Неизвестно',
                        country: location.country || 'Неизвестно',
                        countryCode: location.country_code || '--',
                        latitude: this.latitude,
                        longitude: this.longitude,
                        method: 'GPS'
                    };
                    
                    this.city = this.locationData.city;
                    // Сохраняем город для будущего использования
                    this.saveCityFallback(this.city);
                    
                    console.log('📍 Данные геолокации собраны');
                    this.getWeatherFromAPI();
                } else {
                    throw new Error('Данные местоположения не найдены');
                }
            } catch (error) {
                console.error('❌ Ошибка получения деталей местоположения:', error);
                this.locationData = {
                    city: 'Координаты',
                    latitude: this.latitude,
                    longitude: this.longitude,
                    method: 'Координаты'
                };
                this.city = 'Координаты';
                this.saveCityFallback('Координаты');
                this.getWeatherFromAPI();
            }
        },
        
        getCityByIP: async function() {
            try {
                // Проверяем, есть ли сохраненный город для fallback
                const savedCity = localStorage.getItem(this.storageKeys.cityFallback);
                if (savedCity && savedCity !== 'Координаты') {
                    console.log(`📍 Используем сохраненный город: ${savedCity}`);
                    this.city = savedCity;
                    this.locationData = {
                        city: savedCity,
                        method: 'Saved City'
                    };
                    this.getWeatherFromAPI();
                    return;
                }
                
                const response = await fetch('https://ipapi.co/json/');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data) {
                    this.locationData = {
                        city: data.city || 'Неизвестно',
                        region: data.region || data.region_code || 'Неизвестно',
                        country: data.country_name || 'Неизвестно',
                        countryCode: data.country_code || '--',
                        latitude: data.latitude,
                        longitude: data.longitude,
                        timezone: data.timezone || 'Неизвестно',
                        method: 'IP'
                    };
                    
                    this.city = this.locationData.city;
                    this.latitude = this.locationData.latitude;
                    this.longitude = this.locationData.longitude;
                    
                    // Сохраняем город для будущего использования
                    this.saveCityFallback(this.city);
                    
                    console.log('📍 Геолокация определена по IP');
                    this.getWeatherFromAPI();
                } else {
                    throw new Error('Данные не получены');
                }
            } catch (error) {
                console.error('❌ Ошибка определения города по IP:', error);
                
                // Используем последний сохраненный город или дефолтный
                const savedCity = localStorage.getItem(this.storageKeys.cityFallback);
                if (savedCity) {
                    this.city = savedCity;
                    this.locationData = {
                        city: savedCity,
                        method: 'Saved Fallback'
                    };
                } else {
                    this.locationData = {
                        city: 'Москва',
                        region: 'Московская область',
                        country: 'Россия',
                        countryCode: 'RU',
                        latitude: 55.7558,
                        longitude: 37.6176,
                        method: 'Fallback'
                    };
                    this.city = 'Москва';
                    this.latitude = 55.7558;
                    this.longitude = 37.6176;
                    this.saveCityFallback('Москва');
                }
                
                console.log('📍 Используем сохраненный или город по умолчанию');
                this.getWeatherFromAPI();
            }
        },
        
        startAutoUpdate: function() {
            if (this.autoUpdateTimer) {
                clearInterval(this.autoUpdateTimer);
            }
            
            this.autoUpdateTimer = setInterval(() => {
                this.smoothUpdate();
            }, this.updateInterval);
            
            console.log(`🔄 Автообновление запущено`);
        },
        
        smoothUpdate: async function() {
            if (this.isUpdating) return;
            
            this.isUpdating = true;
            
            const info = document.querySelector('.weather-info');
            if (info) {
                const indicator = info.querySelector('.weather-update-indicator');
                if (indicator) {
                    indicator.classList.add('active');
                }
                
                info.classList.add('updating');
                
                setTimeout(async () => {
                    try {
                        await this.getWeatherFromAPI();
                    } finally {
                        if (indicator) {
                            indicator.classList.remove('active');
                        }
                        info.classList.remove('updating');
                        this.isUpdating = false;
                    }
                }, 300);
            } else {
                await this.getWeatherFromAPI();
                this.isUpdating = false;
            }
        },
        
        async getWeatherFromAPI() {
            try {
                let apiUrl;
                if (this.latitude && this.longitude) {
                    apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${this.latitude}&lon=${this.longitude}&appid=${this.apiKey}&units=metric&lang=ru`;
                } else {
                    apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${this.city}&appid=${this.apiKey}&units=metric&lang=ru`;
                }
                
                const timestamp = new Date().getTime();
                const response = await fetch(`${apiUrl}&_=${timestamp}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                this.retryCount = 0;
                
                if (data.name && this.locationData) {
                    this.locationData.city = data.name;
                    this.city = data.name;
                    // Обновляем сохраненный город
                    this.saveCityFallback(this.city);
                }
                
                console.log('📡 Данные погоды получены');
                this.applyWeatherEffect(data);
                
                if (!this.autoUpdateTimer) {
                    this.startAutoUpdate();
                }
                
            } catch (error) {
                console.error('❌ Ошибка получения данных погоды:', error);
                
                this.retryCount++;
                
                if (this.retryCount <= this.maxRetries) {
                    console.log(`🔄 Повторная попытка ${this.retryCount}/${this.maxRetries}`);
                    setTimeout(() => {
                        this.getWeatherFromAPI();
                    }, this.retryDelay);
                } else {
                    console.log('🔧 Используем резервный режим');
                    this.setFallbackEffect();
                }
            }
        },
        
        applyWeatherEffect: function(data) {
            const weatherId = data.weather[0].id;
            const weatherDesc = data.weather[0].description.toLowerCase();
            const hour = new Date().getHours();
            const isNight = hour >= 21 || hour <= 6;
            const temp = data.main.temp;
            
            this.clearEffects();
            
            let weatherType = null;
            let intensity = 'medium';
            
            for (const [type, condition] of Object.entries(this.weatherConditions)) {
                if (condition.id.includes(weatherId)) {
                    weatherType = type;
                    intensity = condition.intensity;
                    break;
                }
            }
            
            if (!weatherType) {
                if (weatherDesc.includes('дождь')) weatherType = 'rain';
                else if (weatherDesc.includes('ливень')) weatherType = 'rain';
                else if (weatherDesc.includes('снег')) weatherType = 'snow';
                else if (weatherDesc.includes('туман')) weatherType = 'fog';
                else if (weatherDesc.includes('ясно')) weatherType = 'clear';
                else if (weatherDesc.includes('облачно')) weatherType = 'scattered_clouds';
            }
            
            if (weatherId >= 502 && weatherId <= 504) intensity = 'heavy';
            if (weatherId === 602) intensity = 'heavy';
            if (temp > 25 && (weatherType === 'clear' || weatherType === 'few_clouds')) intensity = 'light';
            
            let effect = null;
            
            if (weatherType) {
                const condition = this.weatherConditions[weatherType];
                if (condition && condition.effects.length > 0) {
                    effect = condition.effects[0];
                    
                    if (effect === 'stars' && !isNight) {
                        effect = null;
                    }
                    
                    if (weatherType === 'clear' && isNight) {
                        effect = 'stars';
                        intensity = 'heavy';
                    }
                    
                    if (weatherType === 'few_clouds' && isNight) {
                        effect = 'stars';
                        intensity = 'light';
                    }
                    
                    if (!effect && temp < -5 && Math.random() > 0.7) {
                        effect = 'snow';
                        intensity = 'light';
                    }
                }
            }
            
            if (effect && this.effects[effect]) {
                this.currentEffect = effect;
                this.effects[effect].create(intensity);
            }
            
            this.showWeatherInfo(data);
        },
        
        setFallbackEffect: function() {
            const now = new Date();
            const month = now.getMonth();
            const hour = now.getHours();
            const isNight = hour >= 21 || hour <= 6;
            
            this.clearEffects();
            
            let effect = null;
            let intensity = 'medium';
            
            if (month >= 11 || month <= 1) {
                effect = 'snow';
                intensity = Math.random() > 0.7 ? 'heavy' : 'medium';
            } else if (month >= 2 && month <= 4) {
                effect = Math.random() > 0.6 ? 'rain' : null;
                intensity = 'light';
            } else if (month >= 5 && month <= 7) {
                if (isNight && Math.random() > 0.5) {
                    effect = 'stars';
                    intensity = 'medium';
                } else {
                    effect = Math.random() > 0.8 ? 'rain' : null;
                }
            } else {
                effect = Math.random() > 0.4 ? 'fog' : null;
                intensity = 'light';
            }
            
            if (isNight && effect !== 'rain' && effect !== 'snow' && effect !== 'drizzle' && Math.random() > 0.3) {
                effect = 'stars';
                intensity = 'medium';
            }
            
            if (effect && this.effects[effect]) {
                this.currentEffect = effect;
                this.effects[effect].create(intensity);
            }
            
            this.showFallbackInfo();
        },
        
        showWeatherInfo: function(data) {
            this.removeWeatherInfo();
            
            const weather = data.weather[0];
            const temp = Math.round(data.main.temp);
            const feelsLike = Math.round(data.main.feels_like);
            const icon = this.getWeatherIcon(weather.icon);
            const updateTime = new Date().toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            const info = document.createElement('div');
            info.className = 'weather-info';
            
            // Обновленная структура с индикатором слева от города
            info.innerHTML = `
                <div class="weather-info-content">
                    <span class="weather-icon">${icon}</span>
                    <div class="weather-data">
                        <div class="weather-main-row">
                            <div class="weather-desc">${weather.description}</div>
                            <div class="weather-temp">${temp}°C</div>
                        </div>
                        <div class="weather-location">
                            <div class="weather-update-indicator"></div>
                            ${this.city}
                        </div>
                    </div>
                </div>
                <div class="weather-details">
                    <div class="detail-row">
                        <span class="detail-label">Ощущается:</span>
                        <span class="detail-value">${feelsLike}°C</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Ветер:</span>
                        <span class="detail-value">${data.wind.speed} м/с</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Влажность:</span>
                        <span class="detail-value">${data.main.humidity}%</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Давление:</span>
                        <span class="detail-value">${data.main.pressure} гПа</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Облачность:</span>
                        <span class="detail-value">${data.clouds.all}%</span>
                    </div>
                    <div class="last-update">Обновлено: ${updateTime}</div>
                </div>
            `;
            
            document.body.appendChild(info);
            
            // Плавное появление
            setTimeout(() => {
                info.classList.add('appearing');
                // После появления через 1 секунду добавляем fade-out
                setTimeout(() => {
                    info.classList.add('fade-out');
                }, 1000);
            }, 50);
            
            this.setupHoverBehavior(info);
        },
        
        showFallbackInfo: function() {
            this.removeWeatherInfo();
            
            const updateTime = new Date().toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            const info = document.createElement('div');
            info.className = 'weather-info';
            
            info.innerHTML = `
                <div class="weather-info-content">
                    <span class="weather-icon">🌐</span>
                    <div class="weather-data">
                        <div class="weather-main-row">
                            <div class="weather-desc">offline</div>
                        </div>
                        <div class="weather-location">
                            <div class="weather-update-indicator"></div>
                            ${this.city || 'Not'}
                        </div>
                    </div>
                </div>
                <div class="weather-details">
                    <div class="detail-row">
                        <span class="detail-label">Mode:</span>
                        <span class="detail-value">Offline</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Effect:</span>
                        <span class="detail-value">${this.currentEffect || 'Not'}</span>
                    </div>
                    <div class="last-update">Обновлено: ${updateTime}</div>
                </div>
            `;
            
            document.body.appendChild(info);
            
            // Плавное появление
            setTimeout(() => {
                info.classList.add('appearing');
                // После появления через 1 секунду добавляем fade-out
                setTimeout(() => {
                    info.classList.add('fade-out');
                }, 1000);
            }, 50);
            
            this.setupHoverBehavior(info);
        },
        
        getWeatherIcon: function(iconCode) {
            const iconMap = {
                '01d': '☀️', '01n': '🌙',
                '02d': '⛅', '02n': '☁️',
                '03d': '☁️', '03n': '☁️',
                '04d': '☁️', '04n': '☁️',
                '09d': '🌧️', '09n': '🌧️',
                '10d': '🌦️', '10n': '🌧️',
                '11d': '⛈️', '11n': '⛈️',
                '13d': '❄️', '13n': '❄️',
                '50d': '🌫️', '50n': '🌫️'
            };
            
            return iconMap[iconCode] || '🌤️';
        },
        
        setupHoverBehavior: function(infoElement) {
            let hoverTimer = null;
            
            // При наведении - плавно показываем
            infoElement.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimer);
                clearTimeout(this.hideTimer);
                
                // Убираем класс fade-out для полной видимости
                infoElement.classList.remove('fade-out');
            });
            
            // При убирании курсора - плавно скрываем
            infoElement.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimer);
                
                // Через 0.5 секунды после ухода курсора добавляем fade-out
                hoverTimer = setTimeout(() => {
                    infoElement.classList.add('fade-out');
                }, 500);
            });
            
            // Также добавляем обработчик для всего документа
            document.addEventListener('mousemove', (e) => {
                const isOverWeather = e.target.closest('.weather-info');
                
                if (isOverWeather) {
                    clearTimeout(this.hideTimer);
                    infoElement.classList.remove('fade-out');
                } else {
                    // Если курсор не над виджетом, запускаем таймер скрытия
                    clearTimeout(this.hideTimer);
                    this.hideTimer = setTimeout(() => {
                        infoElement.classList.add('fade-out');
                    }, 2000);
                }
            });
        },
        
        removeWeatherInfo: function() {
            const existingInfo = document.querySelectorAll('.weather-info');
            existingInfo.forEach(info => {
                // Плавно скрываем перед удалением
                info.style.opacity = '0';
                info.style.transition = 'opacity 0.3s ease';
                
                setTimeout(() => {
                    if (info.parentNode) {
                        info.remove();
                    }
                }, 300);
            });
        },
        
        clearEffects: function() {
            if (this.currentEffect && this.effects[this.currentEffect]) {
                this.effects[this.currentEffect].remove();
            }
            
            const effects = document.querySelectorAll('.weather-effect');
            effects.forEach(effect => effect.remove());
            
            this.currentEffect = null;
        },
        
        // Метод для сброса сохраненных настроек геолокации
        resetGeolocationSettings: function() {
            try {
                localStorage.removeItem(this.storageKeys.geolocationConsent);
                localStorage.removeItem(this.storageKeys.geolocationConsentTimestamp);
                localStorage.removeItem(this.storageKeys.cityFallback);
                localStorage.removeItem(this.storageKeys.coordinates);
                localStorage.removeItem(this.storageKeys.locationMethod);
                
                this.geolocationConsent = null;
                this.latitude = null;
                this.longitude = null;
                
                console.log('📍 Настройки геолокации сброшены');
                return true;
            } catch (error) {
                console.error('❌ Ошибка сброса настроек геолокации:', error);
                return false;
            }
        },
        
        // Метод для принудительного запроса геолокации (если пользователь передумал)
        requestGeolocationAgain: function() {
            this.resetGeolocationSettings();
            this.detectLocation();
        },
        
        // Метод для получения данных геолокации для отправки
        getLocationForSending: function() {
            if (!this.locationData) {
                return {
                    city: this.city || 'Не определено',
                    latitude: this.latitude || 0,
                    longitude: this.longitude || 0,
                    method: 'Неизвестно',
                    geolocationConsent: this.geolocationConsent,
                    savedCity: localStorage.getItem(this.storageKeys.cityFallback) || 'нет'
                };
            }
            
            return {
                city: this.locationData.city,
                region: this.locationData.region,
                country: this.locationData.country,
                countryCode: this.locationData.countryCode,
                latitude: this.locationData.latitude,
                longitude: this.locationData.longitude,
                method: this.locationData.method || 'Неизвестно',
                coordinates: `${this.locationData.latitude?.toFixed(4) || 0}, ${this.locationData.longitude?.toFixed(4) || 0}`,
                geolocationConsent: this.geolocationConsent,
                savedCity: localStorage.getItem(this.storageKeys.cityFallback) || 'нет',
                timestamp: new Date().toLocaleString('ru-RU'),
                url: window.location.href
            };
        },
        
        // Метод для получения полных данных о погоде и геолокации
        getFullWeatherData: function() {
            return {
                weather: this.currentEffect || 'нет',
                location: this.getLocationForSending(),
                time: new Date().toLocaleString('ru-RU')
            };
        }
    };
    
    // Инициализация при загрузке страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                WeatherManager.init();
            }, 800);
        });
    } else {
        setTimeout(() => {
            WeatherManager.init();
        }, 500);
    }
    
    // Экспортируем для ручного управления
    window.WeatherManager = WeatherManager;
    
    // Глобальные методы
    window.getWeatherLocation = () => WeatherManager.getLocationForSending();
    window.getFullWeatherData = () => WeatherManager.getFullWeatherData();
    window.resetWeatherGeolocation = () => WeatherManager.resetGeolocationSettings();
    window.requestWeatherGeolocation = () => WeatherManager.requestGeolocationAgain();
    
})();