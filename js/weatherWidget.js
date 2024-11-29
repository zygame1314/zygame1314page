function initWeatherWidget() {
    const API_BASE = 'https://api.zygame1314.site/api';
    const temperatureElem = document.querySelector('.temperature');
    const weatherIconElem = document.querySelector('.weather-icon img');
    const defaultIconURL = 'https://openweathermap.org/img/wn/01d@2x.png';
    weatherIconElem.src = defaultIconURL;

    async function getWeatherData() {
        showNotification('📍 正在获取天气信息...', 2, 'info');
        try {
            const response = await fetch(`${API_BASE}/weather`);
            if (!response.ok) throw new Error('Weather API error');
            const data = await response.json();
            showNotification('✨ 已获取天气信息', 2, 'success');
            return data;
        } catch (error) {
            console.error('获取天气数据失败', error);
            throw error;
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