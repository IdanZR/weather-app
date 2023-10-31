const apiUrlCountries = "https://countriesnow.space/api/v0.1/countries";
let apiNominatim = "";
let api7Timer = "";
const countrySelect = document.getElementById("country-select");
const citySelect = document.getElementById("cities-select");
let dayData = {};
let nightData = {};
let selectedCountry = "";
let selectedCity = "";
let CHOOSENUMOFDAYS = 3;
const currentTime = new Date();
const hours = currentTime.getHours().toString().padStart(2, "0");
const minutes = currentTime.getMinutes().toString().padStart(2, "0");
const formattedTime = `${hours}:${minutes}`;
document.getElementById("current-time").textContent = formattedTime;

const buildElement = (type, value, text, selectElement, attrb) => {
  const option = document.createElement(type);
  option.value = value;
  option.textContent = text;
  selectElement.appendChild(option);
};

function populateSelect(type, selectElement) {
  axios
    .get(apiUrlCountries)
    .then((response) => {
      response.data.data.forEach((country) => {
        buildElement(type, country.country, country.country, selectElement);
      });
    })
    .catch((error) => {
      console.error("Error fetching countries:", error);
    });
}

populateSelect("option", countrySelect);

countrySelect.addEventListener("change", function () {
  selectedCountry = countrySelect.value;
  if (selectedCountry) {
    axios
      .get(apiUrlCountries)
      .then((response) => {
        const countryData = response.data.data.find(
          (country) => country.country === selectedCountry
        );

        if (countryData && countryData.cities) {
          citySelect.innerHTML = "";
          const firstCityOption = document.createElement("option");
          firstCityOption.value = "";
          firstCityOption.textContent = "Select a city";
          citySelect.appendChild(firstCityOption);
          countryData.cities.forEach((city) => {
            buildElement("option", city, city, citySelect);
          });
          firstCityOption.disabled = true;
        }
      })
      .catch((error) => {
        console.error("Error fetching cities:", error);
      });
  }
});

citySelect.addEventListener("change", function () {
  selectedCity = citySelect.value;
  makeRequest();
});

const makeRequest = () => {
  dayData = {};
  nightData = {};
  let data;
  if (selectedCountry && selectedCity) {
    apiNominatim = `https://nominatim.openstreetmap.org/search.php?city=${selectedCity}&country=${selectedCountry}&format=jsonv2`;
    axios
      .get(apiNominatim)
      .then((response) => {
        data = response.data[0];
        console.log(data);
        makeRequestWeather(data);
      })
      .catch((error) => {
        console.log("error somewhat in: " + error);
      });
  }
};

const makeRequestWeather = (weather) => {
  console.log(weather);
  api7Timer = `https://www.7timer.info/bin/civil.php?lon=${weather.lon}&lat=${weather.lat}&ac=0&unit=metric&output=json&tzshift=0`;
  axios
    .get(api7Timer)
    .then((response) => {
      console.log("api request: " + JSON.stringify(response.data));

      handleWeatherSettings(response.data["dataseries"], CHOOSENUMOFDAYS);
    })
    .catch((error) => {
      console.log("well something went worng i guess...." + error);
    });
};

handleWeatherSettings = (weatherData, numOfDays) => {
  weatherData.forEach((dataPoint) => {
    const day = Math.floor(dataPoint.timepoint / 24);

    if (day >= 0 && day <= numOfDays - 1) {
      if (!dayData[day]) {
        dayData[day] = [];
      }
      dayData[day].push(dataPoint);
    }
  });
  console.log("Day Data: ", JSON.stringify(dayData));

  updateWeatherDisplay(dayData[0]);
  updateWeatherDisplay2(dayData);
};
const updateWeatherDisplay2 = (weatherData) => {
  weatherContainer.innerHTML = ""; // Clear previous data
  for (const time in weatherData) {
    const dayDataArray = dayData[time];
    dayDataArray.forEach((dataPoint) => {
      console.log(dataPoint);
      const weatherDataElement = createWeatherDataElement(dataPoint);
      weatherContainer.appendChild(weatherDataElement);
    });
  }
};
const updateWeatherDisplay = (weatherData) => {
  const currentWeather = weatherData[0];
  console.log("weather data:" + JSON.stringify(weatherData[0]));
  const weatherIcon = document.getElementById("weather-icon");
  const weatherDesc = document.getElementById("weather-description");
  document.getElementById("location").textContent =
    selectedCountry + ", " + selectedCity;
  document.getElementById("wind").textContent = currentWeather.wind10m.speed;
  document.getElementById("water").textContent = currentWeather.lifted_index;
  if (currentWeather && currentWeather.weather) {
    if (currentWeather.weather.includes("clear")) {
      if (currentWeather.weather.includes("day")) {
        weatherIcon.src = "./assets/clearday.png";
        weatherDesc.textContent = "Clear Day";
      } else {
        weatherIcon.src = "./assets/clearnight.png";
        weatherDesc.textContent = "Clear Night";
      }
    }
    if (
      currentWeather.weather.includes("pcloudy") ||
      currentWeather.weather.includes("mcloudy")
    ) {
      if (currentWeather.weather.includes("day")) {
        weatherIcon.src = "./assets/cloudyday.png";
        weatherDesc.textContent = "Cloudy Day";
      } else {
        weatherIcon.src = "./assets/cloudynight.png";
        weatherDesc.textContent = "Cloudy Night";
      }
    }
    if (
      currentWeather.weather.includes("cloudy") &&
      currentWeather.cloudcover >= 8
    ) {
      weatherIcon.src = "./assets/fullcloudy.png";
      weatherDesc.textContent = "All Clouds";
    }

    if (currentWeather.weather.includes("rain")) {
      weatherIcon.src = "./assets/rain.png";
      weatherDesc.textContent = "Raining";
    }
    if (
      currentWeather.weather.includes("osshower") ||
      currentWeather.weather.includes("ishower")
    ) {
      weatherDesc.textContent = "Light Raining";
      if (currentWeather.weather.includes("day")) {
        weatherIcon.src = "./assets/light-rain-day.png";
      } else {
        weatherIcon.src = "./assets/light-rain-night.png";
      }
    }
    if (currentWeather.weather.includes("ts")) {
      weatherDesc.textContent = "Thunderstrom";
      weatherIcon.src = "./assets/tsday.png";
    }
    document.getElementById(
      "temperature"
    ).textContent = `${currentWeather.temp2m}°C`;
  }
};

const weatherContainer = document.getElementById("weather-details");
const createWeatherDataElement = (dayData) => {
  const weatherDataElement = document.createElement("div");
  weatherDataElement.className = "weather-data";
  const weatherDataElementIN = document.createElement("div");
  weatherDataElementIN.className = "weather-data-details";
  const weatherDesc = document.createElement("h3");
  const weatherTime = document.createElement("h3");
  weatherTime.textContent = `+ ${dayData.timepoint}`;
  const weatherIcon = document.createElement("img");
  const { iconSrc, description } = getWeatherIconSrc(dayData);
  weatherIcon.src = iconSrc;
  weatherIcon.alt = "for some reason the img isnot showing up...";
  weatherDesc.textContent = description;
  const temperature = document.createElement("h2");
  temperature.textContent = `${dayData.temp2m}°C`;
  weatherDataElementIN.appendChild(weatherDesc);
  weatherDataElementIN.appendChild(weatherTime);
  weatherDataElement.appendChild(weatherDataElementIN);
  weatherDataElement.appendChild(weatherIcon);
  weatherDataElement.appendChild(temperature);
  return weatherDataElement;
};

const getWeatherIconSrc = (currentWeather) => {
  let iconSrc = "";
  let description = "";

  if (currentWeather && currentWeather.weather) {
    if (currentWeather.weather.includes("clear")) {
      if (currentWeather.weather.includes("day")) {
        iconSrc = "./assets/clearday.png";
        description = "Clear Day";
      } else {
        iconSrc = "./assets/clearnight.png";
        description = "Clear Night";
      }
    } else if (
      currentWeather.weather.includes("pcloudy") ||
      currentWeather.weather.includes("mcloudy")
    ) {
      if (currentWeather.weather.includes("day")) {
        iconSrc = "./assets/cloudyday.png";
        description = "Cloudy Day";
      } else {
        iconSrc = "./assets/cloudynight.png";
        description = "Cloudy Night";
      }
    } else if (
      currentWeather.weather.includes("cloudy") &&
      currentWeather.cloudcover >= 8
    ) {
      iconSrc = "./assets/fullcloudy.png";
      description = "All Clouds";
    } else if (currentWeather.weather.includes("rain")) {
      iconSrc = "./assets/rain.png";
      description = "Raining";
    } else if (
      currentWeather.weather.includes("osshower") ||
      currentWeather.weather.includes("ishower")
    ) {
      description = "Light Raining";
      if (currentWeather.weather.includes("day")) {
        iconSrc = "./assets/light-rain-day.png";
      } else {
        iconSrc = "./assets/light-rain-night.png";
      }
    } else if (currentWeather.weather.includes("ts")) {
      description = "Thunderstrom";
      iconSrc = "./assets/tsday.png";
    }
  }

  return { iconSrc, description };
};
