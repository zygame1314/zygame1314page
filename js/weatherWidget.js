function initWeatherWidget() {
    const temperatureElem = document.querySelector('.temperature');
    const descriptionElem = document.querySelector('.description');
    const weatherIconElem = document.querySelector('.weather-icon img');

    const defaultIconURL = 'https://openweathermap.org/img/wn/01d@2x.png';
    weatherIconElem.src = defaultIconURL;

    async function getLocationByIP() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            return {
                coords: {
                    latitude: data.latitude,
                    longitude: data.longitude
                },
                source: 'IP'
            };
        } catch (error) {
            throw error;
        }
    }

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    showNotification('✨ 已完成定位', 2, 'success');
                    showPosition(position);
                },
                (error) => {
                    console.log('GPS定位失败，尝试IP定位', error);
                    fallbackToIP();
                },
                {
                    enableHighAccuracy: false,
                    timeout: 3000,
                    maximumAge: 300000
                }
            );
        } else {
            fallbackToIP();
        }
    }

    async function fallbackToIP() {
        try {
            const position = await getLocationByIP();
            showNotification('📍 已通过IP完成定位', 2, 'info');
            showPosition(position);
        } catch (error) {
            showError(error);
        }
    }

    function showPosition(position) {
        console.log('成功获取地理位置');
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherData(lat, lon);
    }

    function showError(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                temperatureElem.textContent = "定位未授权";
                break;
            case error.POSITION_UNAVAILABLE:
                temperatureElem.textContent = "无法获取位置";
                break;
            case error.TIMEOUT:
                temperatureElem.textContent = "定位超时";
                break;
            case error.UNKNOWN_ERROR:
                temperatureElem.textContent = "未知错误";
                break;
        }
    }

    function fetchWeatherData(lat, lon) {
        console.log('准备请求天气数据', { lat, lon });
        AV.Cloud.run('getWeather', { lat, lon })
            .then(data => {
                console.log('获取天气数据成功', data);
                updateWeatherWidget(data);
            })
            .catch(error => {
                console.error('获取天气数据失败', error);
                temperatureElem.textContent = "获取天气失败";
            });
    }

    function updateWeatherWidget(data) {
        const temp = Math.round(data.main.temp);
        const description = data.weather[0].description;
        const iconCode = data.weather[0].icon;
        const iconURL = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        temperatureElem.textContent = `${temp}°C`;
        descriptionElem.textContent = description;
        weatherIconElem.src = iconURL;

        const weatherEffects = new WeatherEffects();
        weatherEffects.setWeatherEffect(data.weather[0].id.toString());
    }

    getLocation();
}