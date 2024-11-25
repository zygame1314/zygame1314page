function initWeatherWidget() {
    const temperatureElem = document.querySelector('.temperature');
    const descriptionElem = document.querySelector('.description');
    const weatherIconElem = document.querySelector('.weather-icon img');

    const defaultIconURL = 'https://openweathermap.org/img/wn/01d@2x.png';
    weatherIconElem.src = defaultIconURL;

    async function getHighAccuracyPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('浏览器不支持定位'));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000
            };

            navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
    }

    async function getBestLocation(retryCount = 2) {
        showNotification('📍 正在获取精确位置...', 2, 'info');
        try {
            const position = await getHighAccuracyPosition();
            showNotification('✨ 已完成高精度定位', 2, 'success');
            return position;
        } catch (error) {
            console.log('高精度定位失败，尝试普通定位', error);
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        resolve,
                        reject,
                        {
                            enableHighAccuracy: false,
                            timeout: 5000,
                            maximumAge: 300000
                        }
                    );
                });
                showNotification('✨ 已完成普通精度定位', 2, 'success');
                return position;
            } catch (error) {
                if (retryCount > 0) {
                    console.log(`定位失败，剩余重试次数: ${retryCount}`);
                    return getBestLocation(retryCount - 1);
                }
                console.log('所有定位方式失败，使用IP定位');
                return getLocationByIP();
            }
        }
    }

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
        getBestLocation()
            .then(showPosition)
            .catch(error => {
                console.error('所有定位方式均失败', error);
                showError(error);
            });
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