function initWeatherWidget() {
    const API_BASE = 'https://api.zygame1314.site/api';
    const temperatureElem = document.querySelector('.temperature');
    const weatherIconElem = document.querySelector('.weather-icon img');
    const defaultIconURL = 'https://openweathermap.org/img/wn/01d@2x.png';
    weatherIconElem.src = defaultIconURL;

    async function getLocationByIP() {
        showNotification('📍 正在获取位置...', 2, 'info');
        try {
            const response = await fetch(`${API_BASE}/weather/location`);
            if (!response.ok) throw new Error('Location API error');
            const location = await response.json();
            showNotification('✨ 已完成定位', 2, 'success');
            return {
                city: location.city || '武汉市'
            };
        } catch (error) {
            console.error('IP定位失败', error);
            throw error;
        }
    }

    function getLocation() {
        getLocationByIP()
            .then(getCityWeather)
            .catch(error => {
                console.error('定位失败', error);
                temperatureElem.textContent = "获取位置失败";
            });
    }

    async function getCityWeather(location) {
        console.log('准备请求天气数据', location);
        try {
            const response = await fetch(`${API_BASE}/weather/weather?city=${encodeURIComponent(location.city)}`);
            if (!response.ok) throw new Error('Weather API error');
            const data = await response.json();
            console.log('获取天气数据成功', data);
            updateWeatherWidget(data);
        } catch (error) {
            console.error('获取天气数据失败', error);
            temperatureElem.textContent = "获取天气失败";
        }
    }

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

        const temp = Math.round(data.main.temp);
        const feelsLike = Math.round(data.main.feels_like);
        const description = data.weather[0].description;
        const iconCode = data.weather[0].icon;
        const iconURL = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        const humidity = data.main.humidity;
        const windSpeed = Math.round(data.wind.speed * 3.6);
        const pressure = data.main.pressure;
        const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        temperatureElem.textContent = `${temp}°C`;
        descriptionElem.textContent = description;
        locationElem.textContent = data.name || '未知城市';
        weatherIconElem.src = iconURL;
        feelsLikeElem.textContent = `${feelsLike}°C`;
        humidityElem.textContent = `${humidity}%`;
        windSpeedElem.textContent = `${windSpeed}km/h`;
        pressureElem.textContent = `${pressure}hPa`;
        sunriseElem.textContent = sunrise;
        sunsetElem.textContent = sunset;

        const weatherClass = getWeatherClass(data.weather[0].id);
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

    getLocation();
}