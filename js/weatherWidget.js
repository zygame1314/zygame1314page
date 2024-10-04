function initWeatherWidget() {
    const weatherWidget = document.querySelector('.weather-widget');
    const temperatureElem = document.querySelector('.temperature');
    const descriptionElem = document.querySelector('.description');
    const locationElem = document.querySelector('.location');
    const weatherIconElem = document.querySelector('.weather-icon img');

    const defaultIconURL = 'https://openweathermap.org/img/wn/01d@2x.png';
    weatherIconElem.src = defaultIconURL;

    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, showError);
        } else {
            temperatureElem.textContent = "天机无从得，地理难测，愿再谋风云。";
        }
    }

    function showPosition(position) {
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
        AV.Cloud.run('getWeather', { lat, lon })
            .then(data => {
                updateWeatherWidget(data);
            })
            .catch(error => {
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
