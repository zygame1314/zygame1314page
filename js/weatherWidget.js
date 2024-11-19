function initWeatherWidget() {
    const weatherWidget = document.querySelector('.weather-widget');
    const temperatureElem = document.querySelector('.temperature');
    const descriptionElem = document.querySelector('.description');
    const locationElem = document.querySelector('.location');
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
        const geoLocationPromise = new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            ...position,
                            source: 'GPS'
                        });
                    },
                    reject,
                    {
                        enableHighAccuracy: false,
                        timeout: 3000,
                        maximumAge: 300000
                    }
                );
            } else {
                reject(new Error('浏览器不支持地理位置'));
            }
        });

        const ipLocationPromise = getLocationByIP();

        Promise.race([geoLocationPromise, ipLocationPromise])
            .then(position => {
                let message = '';
                if (position.source === 'GPS') {
                    message = `✨ 已通过浏览器精准定位~ <br>坐标：${position.coords.latitude.toFixed(2)}°, ${position.coords.longitude.toFixed(2)}°`;
                } else {
                    message = `🌏 通过IP悄悄定位到你啦~ <br>大致在：${position.coords.latitude.toFixed(2)}°, ${position.coords.longitude.toFixed(2)}°`;
                }
                showNotification(message, 4, 'success');
                showPosition(position);
            })
            .catch(error => showError(error));
    }

    function showPosition(position) {
        console.log('成功获取地理位置', position);
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeatherData(lat, lon);
    }

    function showError(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                temperatureElem.textContent = "阁下未允，风云难测，愿再邀知天气。";
                break;
            case error.POSITION_UNAVAILABLE:
                temperatureElem.textContent = "行踪无处觅，风雨难知晓。";
                break;
            case error.TIMEOUT:
                temperatureElem.textContent = "时光流逝，风动迟来，尝试再度探寻天机。";
                break;
            case error.UNKNOWN_ERROR:
                temperatureElem.textContent = "天机未可测，未知之事难解。";
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
                temperatureElem.textContent = "天不予我知，气象难传达，愿稍后再试。";
            });
    }

    function updateWeatherWidget(data) {
        const temp = Math.round(data.main.temp);
        const description = data.weather[0].description;
        const location = `${data.name}, ${data.sys.country}`;
        const iconCode = data.weather[0].icon;
        const iconURL = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        temperatureElem.textContent = `${temp}°C`;
        descriptionElem.textContent = description;
        locationElem.textContent = location;
        weatherIconElem.src = iconURL;
    }

    getLocation();
}
