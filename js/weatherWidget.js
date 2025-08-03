function initWeatherWidget() {
    const temperatureElem = document.querySelector('.temperature');
    const weatherIconElem = document.querySelector('.weather-icon img');
    const DEFAULT_ICON_URL = 'https://openweathermap.org/img/wn/01d@2x.png';
    if (weatherIconElem) {
        weatherIconElem.src = DEFAULT_ICON_URL;
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
                        (error) => {
                            console.warn('浏览器定位失败:', error);
                            reject(error);
                        },
                        options
                    );
                } catch (error) {
                    reject(error);
                }
            } else {
                const error = new Error('浏览器不支持定位API');
                console.warn(error.message);
                reject(error);
            }
        });
    }
    async function getWeatherData() {
        let lat, lon;
        const DEFAULT_LOCATION = { lat: 60.1695, lon: 24.9354, city: '天际省' };
        try {
            const position = await getCurrentPosition();
            lat = position.coords.latitude;
            lon = position.coords.longitude;
        } catch (error) {
            console.warn('无法获取当前位置，将使用默认位置:', error.message);
            showNotification('📍 定位失败，显示默认天气', 4, 'warning');
            lat = DEFAULT_LOCATION.lat;
            lon = DEFAULT_LOCATION.lon;
        }
        try {
            const url = `${API_BASE}/weather/weather?lat=${lat}&lon=${lon}`;
            const response = await fetch(url);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '天气 API 错误');
            }
            const data = await response.json();
            if (lat === DEFAULT_LOCATION.lat && lon === DEFAULT_LOCATION.lon) {
                data.location.city = DEFAULT_LOCATION.city;
            }
            return data;
        } catch (error) {
            console.error('获取天气数据失败:', error);
            return {
                weather: null,
                location: { city: DEFAULT_LOCATION.city },
                error: true
            };
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
        const cachedPosition = localStorage.getItem('lastKnownPosition');
        if (!cachedPosition && weatherData.coord) {
            const position = {
                coords: {
                    latitude: weatherData.coord.lat,
                    longitude: weatherData.coord.lon
                }
            };
            localStorage.setItem('lastKnownPosition', JSON.stringify(position));
            localStorage.setItem('positionTimestamp', Date.now().toString());
            console.log('已保存IP定位的位置信息到本地存储');
        }
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
            if (data.error || !data.weather) {
                console.error('最终无法获取天气信息');
                temperatureElem.textContent = "获取失败";
                document.querySelector('.location').textContent = data.location.city || '天际省';
                if (weatherIconElem) {
                    weatherIconElem.src = DEFAULT_ICON_URL;
                }
                document.querySelector('.weather-widget')?.classList.add('weather-error');
            } else {
                updateWeatherWidget(data);
            }
        });
}