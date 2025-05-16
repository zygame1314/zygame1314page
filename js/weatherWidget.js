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
                            console.warn('浏览器定位失败，将使用服务器IP定位:', error);
                            resolve(null);
                        },
                        options
                    );
                } catch (error) {
                    reject(error);
                }
            } else {
                console.warn('浏览器不支持定位API，将使用服务器IP定位');
                resolve(null);
            }
        });
    }

    async function getWeatherData() {
        try {
            const position = await getCurrentPosition();
            
            let url;
            let data;

            if (position && position.coords) {
                const { latitude, longitude } = position.coords;
                url = `${API_BASE}/weather/weather?lat=${latitude}&lon=${longitude}`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || '天气 API 错误');
                }
                
                data = await response.json();
            } else {
                try {
                    url = `${API_BASE}/weather/weather?useIP=true`;
                    const response = await fetch(url);
                    
                    if (!response.ok) {
                        throw new Error('IP定位失败');
                    }
                    
                    data = await response.json();
                } catch (ipError) {
                    console.warn('IP定位失败，尝试使用缓存位置:', ipError);
                    
                    const cachedPosition = localStorage.getItem('lastKnownPosition');
                    if (cachedPosition) {
                        const parsedPosition = JSON.parse(cachedPosition);
                        const { latitude, longitude } = parsedPosition.coords;
                        
                        showNotification('📍 浏览器定位和IP定位均失败，使用缓存位置', 4, 'warning');
                        
                        url = `${API_BASE}/weather/weather?lat=${latitude}&lon=${longitude}`;
                        const response = await fetch(url);
                        
                        if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.message || '天气 API 错误');
                        }
                        
                        data = await response.json();
                    } else {
                        throw new Error('无法获取位置信息');
                    }
                }
            }
            
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
            updateWeatherWidget(data);
        })
        .catch(error => {
            console.error('获取天气信息失败', error);
            temperatureElem.textContent = "获取天气失败";
            if (weatherIconElem) {
                weatherIconElem.src = DEFAULT_ICON_URL;
            }
            document.querySelector('.weather-widget')?.classList.add('weather-error');
        });
}