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
        // 先尝试GPS定位
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    position.source = 'GPS';
                    try {
                        const address = await getLocationDetails(
                            position.coords.latitude,
                            position.coords.longitude
                        );

                        let locationText = '未知位置';
                        if (address) {
                            const state = address.state || '';
                            const city = address.city || address.town || address.village || '';
                            locationText = state + (city ? city : '');
                        }

                        showNotification(`✨ 已通过浏览器精准定位~ <br>在：${locationText}`, 4, 'success');
                        showPosition(position);
                    } catch (error) {
                        console.error('GPS定位详情获取失败，尝试IP定位', error);
                        fallbackToIP();
                    }
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
            const address = await getLocationDetails(
                position.coords.latitude,
                position.coords.longitude
            );

            let locationText = '未知位置';
            if (address) {
                const state = address.state || '';
                const city = address.city || address.town || address.village || '';
                locationText = state + (city ? city : '');
            }

            showNotification(`📍 GPS定位未能成功，已通过IP定位到你的大致位置~ <br>似乎在：${locationText}`, 4, 'info');
            showPosition(position);
        } catch (error) {
            showError(error);
        }
    }

    async function getLocationDetails(lat, lon) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
            const data = await response.json();
            return data.address;
        } catch (error) {
            console.error('获取地理位置详情失败', error);
            return null;
        }
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
