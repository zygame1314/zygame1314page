function initWeatherWidget() {
    const temperatureElem = document.querySelector('.temperature');
    const descriptionElem = document.querySelector('.description');
    const weatherIconElem = document.querySelector('.weather-icon img');

    const defaultIconURL = 'https://openweathermap.org/img/wn/01d@2x.png';
    weatherIconElem.src = defaultIconURL;

    async function getLocationByIP() {
        showNotification('📍 正在获取位置...', 2, 'info');
        try {
            const response = await fetch('http://ip-api.com/json/?lang=zh-CN');
            const data = await response.json();
            if (data.status === 'success') {
                showNotification('✨ 已完成定位', 2, 'success');
                return {
                    coords: {
                        latitude: data.lat,
                        longitude: data.lon
                    }
                };
            } else {
                throw new Error('IP定位失败');
            }
        } catch (error) {
            console.error('IP定位失败', error);
            throw error;
        }
    }

    function getLocation() {
        getLocationByIP()
            .then(showPosition)
            .catch(error => {
                console.error('定位失败', error);
                temperatureElem.textContent = "获取位置失败";
            });
    }

    function showPosition(position) {
        console.log('成功获取地理位置');
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherData(lat, lon);
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