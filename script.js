const cityInput = document.querySelector(".city-input");
const searchBtn = document.querySelector(".search-btn");
const recentSearchList = document.querySelector(".recent-searches-list");

const weatherInfoSection = document.querySelector(".weather-info");
const notFoundSection = document.querySelector(".not-found");
const searchCitySection = document.querySelector(".search-city");

const countryTxt = document.querySelector(".country-txt");
const tempTxt = document.querySelector(".temp-txt");
const conditionTxt = document.querySelector(".condition-txt");
const humidityValueTxt = document.querySelector(".humidity-value-txt");
const windValueTxt = document.querySelector(".wind-value-txt");
const weatherSummaryImg = document.querySelector(".weather-summary-img");
const currentDateTxt = document.querySelector(".current-date-txt");

const forecastItemsContainer = document.querySelector(
  ".forcast-items-container"
);

const apiKey = "e0fcdbd44045cbf89c96bb3b829b4dce";
let previousSectionBeforeSearch = null;
let lastCitySearched = null;
let recentCities = [];

window.addEventListener("DOMContentLoaded", () => {
  const savedRecent = localStorage.getItem("recentCities");
  if (savedRecent) {
    recentCities = JSON.parse(savedRecent);
  }

  const lastSection = localStorage.getItem("lastSection");

  switch (lastSection) {
    case "weather":
      const lastCity = localStorage.getItem("lastCity");
      if (lastCity) {
        updateWeatherInfo(lastCity);
      } else {
        showDisplaySection(searchCitySection);
      }
      break;

    case "notFound":
      showDisplaySection(notFoundSection);
      break;

    case "search":
    default:
      showDisplaySection(searchCitySection);
      break;
  }
});

function showDisplaySection(section) {
  [weatherInfoSection, searchCitySection, notFoundSection].forEach((el) => {
    el.style.display = "none";
  });
  section.style.display = "flex";
  localStorage.setItem(
    "lastSection",
    section.classList.contains("weather-info")
      ? "weather"
      : section.classList.contains("not-found")
      ? "notFound"
      : "search"
  );
  recentSearchList.style.display = "none";
}

cityInput.addEventListener("click", () => {
  previousSectionBeforeSearch = localStorage.getItem("lastSection");
  showDisplaySection(searchCitySection);
  renderRecentSearches();
  recentSearchList.style.display = "block";
});

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city !== "") {
    updateWeatherInfo(city);
    cityInput.value = "";
    cityInput.blur();
  }
});

cityInput.addEventListener("keydown", (event) => {
  const city = cityInput.value.trim();
  if (event.key === "Enter" && city !== "") {
    updateWeatherInfo(city);
    cityInput.value = "";
    cityInput.blur();
  }
});

async function getfetchData(endPoint, city) {
  const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric`;
  const response = await fetch(apiUrl);
  return response.json();
}

function getWeatherIcon(id, isDaytime) {
  let iconName = "";
  if (id <= 232) iconName = "thunderstorm";
  else if (id <= 321) iconName = "drizzle";
  else if (id <= 531) iconName = "rainy";
  else if (id <= 622) iconName = "snow";
  else if (id === 800) iconName = "clear";
  else if (id <= 781) iconName = "atmosphere";
  else iconName = "cloudy";

  return `${iconName}_${isDaytime ? "day" : "night"}.png`;
}

function getCurrentDate() {
  const currentDate = new Date();
  const options = {
    weekday: "short",
    day: "2-digit",
    month: "short",
  };
  return currentDate.toLocaleDateString("en-GB", options);
}

async function updateWeatherInfo(city) {
  const weatherData = await getfetchData("weather", city);

  if (weatherData.cod != 200) {
    showDisplaySection(notFoundSection);
    return;
  }

  lastCitySearched = city;
  localStorage.setItem("lastCity", city);
  addToRecent(city);

  const {
    name: country,
    main: { temp, humidity },
    weather: [{ id, main }],
    wind: { speed },
    sys: { sunrise, sunset },
  } = weatherData;

  const currentTime = Math.floor(Date.now() / 1000);
  const isDaytime = currentTime >= sunrise && currentTime < sunset;

  countryTxt.textContent = country;
  tempTxt.textContent = Math.round(temp) + " °C";
  conditionTxt.textContent = main;
  humidityValueTxt.textContent = humidity + "%";
  windValueTxt.textContent = speed + " m/s";
  currentDateTxt.textContent = getCurrentDate();

  weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id, isDaytime)}`;

  await updateForecastsInfo(city, isDaytime);
  showDisplaySection(weatherInfoSection);
  recentSearchList.style.display = "none";
}

async function updateForecastsInfo(city, isDaytime) {
  const forecastsData = await getfetchData("forecast", city);
  const timeTaken = "12:00:00";
  const todayData = new Date().toISOString().split("T")[0];
  forecastItemsContainer.innerHTML = "";

  forecastsData.list.forEach((forecastWeather) => {
    if (
      forecastWeather.dt_txt.includes(timeTaken) &&
      !forecastWeather.dt_txt.includes(todayData)
    ) {
      updateForecastsItems(forecastWeather, isDaytime);
    }
  });
}

function updateForecastsItems(weatherData, isDaytime) {
  const {
    dt_txt: date,
    weather: [{ id }],
    main: { temp },
  } = weatherData;

  const dateTaken = new Date(date);
  const dateResult = dateTaken.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
  });

  const forecastItem = `
    <div class="forcast-item">
      <h5 class="forcast-item-date regular-txt">${dateResult}</h5>
      <img src="assets/weather/${getWeatherIcon(
        id,
        isDaytime
      )}" class="forcast-item-img" />
      <h5 class="forcast-item-temp">${Math.round(temp)} °C</h5>
    </div>
  `;

  forecastItemsContainer.insertAdjacentHTML("beforeend", forecastItem);
}

function addToRecent(city) {
  if (!recentCities.includes(city)) {
    recentCities.unshift(city);
    if (recentCities.length > 5) recentCities.pop();
    localStorage.setItem("recentCities", JSON.stringify(recentCities));
  }
}

function renderRecentSearches() {
  recentSearchList.innerHTML = "";
  recentCities.forEach((city) => {
    const li = document.createElement("li");
    li.classList.add("recent-item");
    li.innerHTML = `
      ${city}
      <span class="remove-btn" data-city="${city}">❌</span>
    `;
    li.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-btn")) return;
      updateWeatherInfo(city);
      cityInput.value = "";
      recentSearchList.style.display = "none";
    });
    li.querySelector(".remove-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      removeRecent(city);
    });
    recentSearchList.appendChild(li);
  });
}

function removeRecent(city) {
  recentCities = recentCities.filter((c) => c !== city);
  renderRecentSearches();
}

document.addEventListener("click", (e) => {
  const clickedInsideSearchBar = e.target.closest(".city-input");
  const clickedInsideRecentList = e.target.closest(".recent-searches-list");

  if (!clickedInsideSearchBar && !clickedInsideRecentList) {
    recentSearchList.style.display = "none";

    if (!cityInput.value.trim() && previousSectionBeforeSearch) {
      if (previousSectionBeforeSearch === "weather") {
        showDisplaySection(weatherInfoSection);
      } else if (previousSectionBeforeSearch === "notFound") {
        showDisplaySection(searchCitySection);
      } else {
        showDisplaySection(searchCitySection);
      }
    }
  }
});
