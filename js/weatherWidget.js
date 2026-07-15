import { showNotification } from './showNotification.js';
import { API_BASE } from './config.js';
import { WeatherEffects } from './weather-effects.js';
export function initWeatherWidget() {
    const temperatureElem = document.querySelector('.temperature');
    const weatherIconElem = document.querySelector('.weather-icon img');
    const DEFAULT_LOCATION = { city: '天际省' };
    const DEFAULT_ICON_URL = 'https://openweathermap.org/img/wn/01d@2x.png';
    if (weatherIconElem) {
        weatherIconElem.src = DEFAULT_ICON_URL;
    }
    async function getWeatherData() {
        try {
            const response = await fetch(`${API_BASE}/weather/weather`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '天气 API 错误');
            }
            return await response.json();
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
                if (data.isDefault) {
                    showNotification('📍 无法定位，显示默认天气', 4, 'warning');
                }
                updateWeatherWidget(data);
            }
        });
}