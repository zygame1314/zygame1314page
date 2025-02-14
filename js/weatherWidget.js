<<<<<<< HEAD
function initWeatherWidget() {
    const API_BASE = 'https://zygame1314.site';
    const temperatureElem = document.querySelector('.temperature');
    const weatherIconElem = document.querySelector('.weather-icon img');
    const defaultIconURL = 'https://openweathermap.org/img/wn/01d@2x.png';
    weatherIconElem.src = defaultIconURL;

    async function getLocationByIP() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch('https://ipwho.is', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await response.json();

            if (!data.success) {
                throw new Error('无法获取位置信息');
            }

            return {
                coords: {
                    latitude: parseFloat(data.latitude) || 39.9042,
                    longitude: parseFloat(data.longitude) || 116.4074
                }
            };
        } catch (error) {
            console.error('IP定位失败:', error);
            throw error;
        }
    }

    function getCurrentPosition() {
        return new Promise(async (resolve, reject) => {
            const cachedPosition = localStorage.getItem('lastKnownPosition');
            const cacheTime = localStorage.getItem('positionTimestamp');
            const CACHE_DURATION = 30 * 60 * 1000;

            if (cachedPosition && cacheTime) {
                const age = Date.now() - parseInt(cacheTime);
                if (age < CACHE_DURATION) {
                    return resolve(JSON.parse(cachedPosition));
                }
            }

            if (navigator.geolocation) {
                const options = {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 5000
                };

                const savePosition = (position) => {
                    localStorage.setItem('lastKnownPosition', JSON.stringify(position));
                    localStorage.setItem('positionTimestamp', Date.now().toString());
                    resolve(position);
                };

                try {
                    navigator.geolocation.getCurrentPosition(
                        savePosition,
                        async (error) => {
                            console.warn('浏览器定位失败，尝试IP定位:', error);
                            try {
                                const ipPosition = await getLocationByIP();
                                savePosition(ipPosition);
                            } catch (ipError) {
                                if (cachedPosition) {
                                    showNotification('📍 使用上次保存的位置信息', 4, 'info');
                                    resolve(JSON.parse(cachedPosition));
                                } else {
                                    resolve({
                                        coords: {
                                            latitude: 39.9042,
                                            longitude: 116.4074
                                        }
                                    });
                                }
                            }
                        },
                        options
                    );
                } catch (error) {
                    reject(error);
                }
            } else {
                try {
                    const ipPosition = await getLocationByIP();
                    savePosition(ipPosition);
                } catch (error) {
                    reject(error);
                }
            }
        });
    }

    async function getWeatherData() {
        try {
            const position = await getCurrentPosition();
            const { latitude, longitude } = position.coords;

            const response = await fetch(`${API_BASE}/weather/weather?lat=${latitude}&lon=${longitude}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '天气 API 错误');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('获取天气数据失败:', error);
            throw error;
        }
    }

    const weatherEffects = new WeatherEffects();

    function updateWeatherWidget(data) {
        const temperatureElem = document.querySelector('.temperature');
        const descriptionElem = document.querySelector('.description');
        const locationElem = document.querySelector('.location');
        const weatherIconElem = document.querySelector('.weather-icon img');
        const feelsLikeElem = document.querySelector('.feels-like');
        const humidityElem = document.querySelector('.humidity');
        const windSpeedElem = document.querySelector('.wind-speed');
        const pressureElem = document.querySelector('.pressure');
        const sunriseElem = document.querySelector('.sunrise');
        const sunsetElem = document.querySelector('.sunset');

        const weatherData = data.weather;
        const locationData = data.location;

        const temp = Math.round(weatherData.main.temp);
        const feelsLike = Math.round(weatherData.main.feels_like);
        const description = weatherData.weather[0].description;
        const iconCode = weatherData.weather[0].icon;
        const iconURL = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        const humidity = weatherData.main.humidity;
        const windSpeed = Math.round(weatherData.wind.speed * 3.6);
        const pressure = weatherData.main.pressure;
        const sunrise = new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const sunset = new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        temperatureElem.textContent = `${temp}°C`;
        descriptionElem.textContent = description;
        locationElem.textContent = `${locationData.city}`;
        weatherIconElem.src = iconURL;
        feelsLikeElem.textContent = `${feelsLike}°C`;
        humidityElem.textContent = `${humidity}%`;
        windSpeedElem.textContent = `${windSpeed}km/h`;
        pressureElem.textContent = `${pressure}hPa`;
        sunriseElem.textContent = sunrise;
        sunsetElem.textContent = sunset;

        const weatherId = weatherData.weather[0].id;
        weatherEffects.setWeatherEffect(weatherId).catch(error => {
            console.error('设置天气效果失败:', error);
        });

        const weatherClass = getWeatherClass(weatherData.weather[0].id);
        document.querySelector('.weather-widget').className = `weather-widget ${weatherClass}`;
    }

    function getWeatherClass(weatherId) {
        if (weatherId >= 200 && weatherId < 300) return 'weather-thunderstorm';
        if (weatherId >= 300 && weatherId < 400) return 'weather-drizzle';
        if (weatherId >= 500 && weatherId < 600) return 'weather-rain';
        if (weatherId >= 600 && weatherId < 700) return 'weather-snow';
        if (weatherId >= 700 && weatherId < 800) return 'weather-atmosphere';
        if (weatherId === 800) return 'weather-clear';
        if (weatherId > 800) return 'weather-clouds';
        return '';
    }

    getWeatherData()
        .then(data => {
            updateWeatherWidget(data);
        })
        .catch(error => {
            console.error('获取天气信息失败', error);
            temperatureElem.textContent = "获取天气失败";
        });
=======
function initWeatherWidget() {
    const API_BASE = 'https://zygame1314.site';
    const temperatureElem = document.querySelector('.temperature');
    const weatherIconElem = document.querySelector('.weather-icon img');
    const defaultIconURL = 'https://openweathermap.org/img/wn/01d@2x.png';
    weatherIconElem.src = defaultIconURL;

    async function getLocationByIP() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch('https://ipwho.is', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await response.json();

            if (!data.success) {
                throw new Error('无法获取位置信息');
            }

            return {
                coords: {
                    latitude: parseFloat(data.latitude) || 39.9042,
                    longitude: parseFloat(data.longitude) || 116.4074
                }
            };
        } catch (error) {
            console.error('IP定位失败:', error);
            throw error;
        }
    }

    function getCurrentPosition() {
        return new Promise(async (resolve, reject) => {
            const cachedPosition = localStorage.getItem('lastKnownPosition');
            const cacheTime = localStorage.getItem('positionTimestamp');
            const CACHE_DURATION = 30 * 60 * 1000;

            if (cachedPosition && cacheTime) {
                const age = Date.now() - parseInt(cacheTime);
                if (age < CACHE_DURATION) {
                    return resolve(JSON.parse(cachedPosition));
                }
            }

            if (navigator.geolocation) {
                const options = {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 5000
                };

                const savePosition = (position) => {
                    localStorage.setItem('lastKnownPosition', JSON.stringify(position));
                    localStorage.setItem('positionTimestamp', Date.now().toString());
                    resolve(position);
                };

                try {
                    navigator.geolocation.getCurrentPosition(
                        savePosition,
                        async (error) => {
                            console.warn('浏览器定位失败，尝试IP定位:', error);
                            try {
                                const ipPosition = await getLocationByIP();
                                savePosition(ipPosition);
                            } catch (ipError) {
                                if (cachedPosition) {
                                    showNotification('📍 使用上次保存的位置信息', 4, 'info');
                                    resolve(JSON.parse(cachedPosition));
                                } else {
                                    resolve({
                                        coords: {
                                            latitude: 39.9042,
                                            longitude: 116.4074
                                        }
                                    });
                                }
                            }
                        },
                        options
                    );
                } catch (error) {
                    reject(error);
                }
            } else {
                try {
                    const ipPosition = await getLocationByIP();
                    savePosition(ipPosition);
                } catch (error) {
                    reject(error);
                }
            }
        });
    }

    async function getWeatherData() {
        try {
            const position = await getCurrentPosition();
            const { latitude, longitude } = position.coords;

            const response = await fetch(`${API_BASE}/weather/weather?lat=${latitude}&lon=${longitude}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '天气 API 错误');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('获取天气数据失败:', error);
            throw error;
        }
    }

    const weatherEffects = new WeatherEffects();

    function updateWeatherWidget(data) {
        const temperatureElem = document.querySelector('.temperature');
        const descriptionElem = document.querySelector('.description');
        const locationElem = document.querySelector('.location');
        const weatherIconElem = document.querySelector('.weather-icon img');
        const feelsLikeElem = document.querySelector('.feels-like');
        const humidityElem = document.querySelector('.humidity');
        const windSpeedElem = document.querySelector('.wind-speed');
        const pressureElem = document.querySelector('.pressure');
        const sunriseElem = document.querySelector('.sunrise');
        const sunsetElem = document.querySelector('.sunset');

        const weatherData = data.weather;
        const locationData = data.location;

        const temp = Math.round(weatherData.main.temp);
        const feelsLike = Math.round(weatherData.main.feels_like);
        const description = weatherData.weather[0].description;
        const iconCode = weatherData.weather[0].icon;
        const iconURL = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        const humidity = weatherData.main.humidity;
        const windSpeed = Math.round(weatherData.wind.speed * 3.6);
        const pressure = weatherData.main.pressure;
        const sunrise = new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const sunset = new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        temperatureElem.textContent = `${temp}°C`;
        descriptionElem.textContent = description;
        locationElem.textContent = `${locationData.city}`;
        weatherIconElem.src = iconURL;
        feelsLikeElem.textContent = `${feelsLike}°C`;
        humidityElem.textContent = `${humidity}%`;
        windSpeedElem.textContent = `${windSpeed}km/h`;
        pressureElem.textContent = `${pressure}hPa`;
        sunriseElem.textContent = sunrise;
        sunsetElem.textContent = sunset;

        const weatherId = weatherData.weather[0].id;
        weatherEffects.setWeatherEffect(weatherId).catch(error => {
            console.error('设置天气效果失败:', error);
        });

        const weatherClass = getWeatherClass(weatherData.weather[0].id);
        document.querySelector('.weather-widget').className = `weather-widget ${weatherClass}`;
    }

    function getWeatherClass(weatherId) {
        if (weatherId >= 200 && weatherId < 300) return 'weather-thunderstorm';
        if (weatherId >= 300 && weatherId < 400) return 'weather-drizzle';
        if (weatherId >= 500 && weatherId < 600) return 'weather-rain';
        if (weatherId >= 600 && weatherId < 700) return 'weather-snow';
        if (weatherId >= 700 && weatherId < 800) return 'weather-atmosphere';
        if (weatherId === 800) return 'weather-clear';
        if (weatherId > 800) return 'weather-clouds';
        return '';
    }

    getWeatherData()
        .then(data => {
            updateWeatherWidget(data);
        })
        .catch(error => {
            console.error('获取天气信息失败', error);
            temperatureElem.textContent = "获取天气失败";
        });
>>>>>>> b029a527becedfc9927b8e11b6ce5e48017539d2
}