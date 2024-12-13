function initWeatherWidget() {
    const API_BASE = 'https://zygame1314.site';
    const temperatureElem = document.querySelector('.temperature');
    const weatherIconElem = document.querySelector('.weather-icon img');
    const defaultIconURL = 'https://openweathermap.org/img/wn/01d@2x.png';
    weatherIconElem.src = defaultIconURL;

    function getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('浏览器不支持地理定位'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                position => {
                    resolve(position);
                },
                error => {
                    if (error.code === error.PERMISSION_DENIED) {
                        showNotification('🙈 咱也不知道你在哪儿呢~要不打开定位告诉我？', 4, 'warning');
                        reject(new Error('地理位置权限被拒绝'));
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        showNotification('📡 定位信号不好，要不换个地方试试？', 4, 'error');
                        reject(error);
                    } else {
                        showNotification('⏰ 定位超时了，要不再试一次？', 4, 'error');
                        reject(error);
                    }
                },
                { enableHighAccuracy: true }
            );
        });
    }

    async function getWeatherData() {
        showNotification('📍 正在获取位置信息...', 2, 'info');
        try {
            const position = await getCurrentPosition();
            const { latitude, longitude } = position.coords;

            showNotification('🌍 正在获取天气信息...', 2, 'info');
            const response = await fetch(`${API_BASE}/weather/weather?lat=${latitude}&lon=${longitude}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '天气 API 错误');
            }

            const data = await response.json();
            showNotification('✨ 已获取天气信息', 2, 'success');
            return data;
        } catch (error) {
            console.error('获取天气数据失败:', error);
            showNotification('❌ ' + error.message, 4, 'error');
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
}