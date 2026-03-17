const weatherEmojis = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 51: "🌦️", 53: "🌧️", 61: "🌧️", 63: "🌧️", 65: "⛈️",
  71: "❄️", 80: "🌧️", 95: "⛈️"
};

function getEmoji(code) {
  return weatherEmojis[code] || "☁️";
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-bs-theme');
  document.documentElement.setAttribute('data-bs-theme', current === 'dark' ? 'light' : 'dark');
}

function updateDateTime() {
  const now = new Date();
  document.getElementById("currentDateTime").textContent = now.toLocaleString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
setInterval(updateDateTime, 60000);
updateDateTime();

let weatherData = null;
let mainChart = null;
let selectedChart = null;

async function getWeather() {
  let city = document.getElementById("city").value.trim();
  if (!city) city = "Dewas";

  const btn = document.getElementById("searchBtn");
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Searching...';

  try {
    const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&countryCode=IN`;
    const geoRes = await fetch(geoURL);
    const geo = await geoRes.json();

    let latitude, longitude, name;

    if (!geo.results || geo.results.length === 0) {
      // fallback to global search
      const fallbackURL = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
      const fallbackRes = await fetch(fallbackURL);
      const fallback = await fallbackRes.json();
      if (!fallback.results || fallback.results.length === 0) {
        throw new Error("City not found");
      }
      ({ latitude, longitude, name } = fallback.results[0]);
    } else {
      ({ latitude, longitude, name } = geo.results[0]);
      if (geo.results[0].admin1) name += `, ${geo.results[0].admin1}`;
    }

    await loadWeather(latitude, longitude, name);
  } catch (err) {
    document.getElementById("current").innerHTML = `<p class="text-danger text-center mt-4">City nahi mila 😕<br>Try karo: Indore, Bhopal, Mumbai, Delhi etc.</p>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

async function loadWeather(lat, lon, cityName) {
  document.getElementById("cityName").textContent = cityName;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m&timezone=auto`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather API error");
    weatherData = await res.json();

    const curr = weatherData.current;
    document.getElementById("current").innerHTML = `
      <div class="icon mb-3">${getEmoji(curr.weather_code)}</div>
      <div class="temp">${Math.round(curr.temperature_2m)}°</div>
      <div class="fs-5 text-muted mb-3">Feels like ${Math.round(curr.apparent_temperature)}°</div>
      <div class="d-flex justify-content-center gap-5">
        <div class="text-center">
          <div class="small text-muted">Wind</div>
          <div class="fw-bold">${Math.round(curr.wind_speed_10m)} km/h</div>
        </div>
      </div>
    `;

    let forecastHtml = "";
    const days = weatherData.daily.time;
    for (let i = 0; i < 5; i++) {
      const date = new Date(days[i]);
      const dayShort = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      const maxT = Math.round(weatherData.daily.temperature_2m_max[i]);
      const minT = Math.round(weatherData.daily.temperature_2m_min[i]);
      const emoji = getEmoji(weatherData.daily.weather_code[i]);

      forecastHtml += `
        <div class="card card-forecast text-center p-3 ${i === 0 ? 'active' : ''}" onclick="showDayHourly(${i})">
          <div class="small text-muted">${dayShort}</div>
          <div class="fs-1 my-2">${emoji}</div>
          <div class="fw-bold">
            <span class="text-warning">↑ ${maxT}°</span><br>
            ↓ ${minT}°
          </div>
        </div>
      `;
    }
    document.getElementById("forecast").innerHTML = forecastHtml;

    renderHourlyChart(
      weatherData.hourly.time.slice(0, 24),
      weatherData.hourly.temperature_2m.slice(0, 24),
      "hourlyChart",
      "Next 24 Hours"
    );

    document.getElementById("selectedHourlySection").classList.add("d-none");
  } catch (err) {
    document.getElementById("current").innerHTML = `<p class="text-danger text-center mt-4">Data load nahi ho paya 😓</p>`;
  }
}

function renderHourlyChart(times, temps, canvasId, title) {
  const hours = times.map(t => new Date(t).getHours() + ":00");

  const ctx = document.getElementById(canvasId).getContext("2d");
  const existingChart = canvasId === "hourlyChart" ? mainChart : selectedChart;
  if (existingChart) existingChart.destroy();

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: hours,
      datasets: [{
        label: 'Temperature °C',
        data: temps,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.2)',
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { color: '#94a3b8' } },
        x: { ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 } }
      }
    }
  });

  if (canvasId === "hourlyChart") mainChart = chart;
  else {
    selectedChart = chart;
    document.getElementById("selectedTitle").textContent = title;
  }
}

function showDayHourly(dayIndex) {
  if (!weatherData) return;

  document.querySelectorAll('.card-forecast').forEach((card, idx) => {
    card.classList.toggle('active', idx === dayIndex);
  });

  const start = dayIndex * 24;
  const times = weatherData.hourly.time.slice(start, start + 24);
  const temps = weatherData.hourly.temperature_2m.slice(start, start + 24);

  const date = new Date(times[0]);
  let titleText = date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }) + " Hourly";
  if (dayIndex === 0) titleText = "Aaj ke Hours";
  if (dayIndex === 1) titleText = "Kal Hourly";

  renderHourlyChart(times, temps, "selectedHourlyChart", titleText);

  document.getElementById("selectedHourlySection").classList.remove("d-none");
  document.getElementById("selectedHourlySection").scrollIntoView({ behavior: "smooth" });
}

// Auto load for Dewas on page load
loadWeather(22.9676, 76.0536, "Dewas, MP");