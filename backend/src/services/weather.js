import { getSetting } from '../db/index.js';

const BASE = 'https://api.open-meteo.com/v1/forecast';

const WMO_CODES = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' },
  48: { label: 'Icy fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Heavy drizzle', icon: '🌧️' },
  61: { label: 'Light rain', icon: '🌧️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  71: { label: 'Light snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '❄️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  80: { label: 'Light showers', icon: '🌦️' },
  81: { label: 'Showers', icon: '🌧️' },
  82: { label: 'Heavy showers', icon: '⛈️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  99: { label: 'Thunderstorm w/ hail', icon: '⛈️' },
};

function wmo(code) {
  return WMO_CODES[code] ?? { label: 'Unknown', icon: '🌡️' };
}

function cToF(c) { return Math.round(c * 9 / 5 + 32); }
function kmhToMph(k) { return Math.round(k * 0.621371); }

let cache = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function fetchWeather() {
  if (cache && Date.now() - cacheTime < CACHE_TTL) return cache;

  const loc = getSetting('location') ?? { lat: 40.7128, lon: -74.0060, timezone: 'America/New_York' };
  const units = 'fahrenheit';

  const params = new URLSearchParams({
    latitude: loc.lat,
    longitude: loc.lon,
    timezone: loc.timezone,
    temperature_unit: units,
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    current: [
      'temperature_2m', 'apparent_temperature', 'weather_code',
      'wind_speed_10m', 'wind_direction_10m', 'relative_humidity_2m',
      'precipitation', 'is_day'
    ].join(','),
    hourly: [
      'temperature_2m', 'weather_code', 'precipitation_probability',
      'precipitation', 'wind_speed_10m'
    ].join(','),
    daily: [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min',
      'precipitation_sum', 'precipitation_probability_max'
    ].join(','),
    forecast_days: 7,
    forecast_hours: 24
  });

  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const data = await res.json();

  const c = data.current;
  const now = new Date();

  // Build hourly array (next 24h)
  const hourly = data.hourly.time.map((t, i) => ({
    time: t,
    temp: Math.round(data.hourly.temperature_2m[i]),
    weatherCode: data.hourly.weather_code[i],
    ...wmo(data.hourly.weather_code[i]),
    precipProb: data.hourly.precipitation_probability[i],
    precip: data.hourly.precipitation[i],
    wind: Math.round(data.hourly.wind_speed_10m[i])
  })).filter(h => new Date(h.time) >= now).slice(0, 24);

  // Check if rain/snow is coming in next 6h (for radar prompt)
  const precipComing = hourly.slice(0, 6).some(h => h.precipProb > 30);

  // Build daily array
  const daily = data.daily.time.map((t, i) => ({
    date: t,
    weatherCode: data.daily.weather_code[i],
    ...wmo(data.daily.weather_code[i]),
    high: Math.round(data.daily.temperature_2m_max[i]),
    low: Math.round(data.daily.temperature_2m_min[i]),
    precipProb: data.daily.precipitation_probability_max[i],
    precip: data.daily.precipitation_sum[i]
  }));

  cache = {
    location: loc.label ?? 'Home',
    current: {
      temp: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      humidity: c.relative_humidity_2m,
      wind: Math.round(c.wind_speed_10m),
      windDir: c.wind_direction_10m,
      weatherCode: c.weather_code,
      ...wmo(c.weather_code),
      isDay: !!c.is_day,
      precip: c.precipitation
    },
    hourly,
    daily,
    precipComing,
    updatedAt: new Date().toISOString()
  };
  cacheTime = Date.now();
  return cache;
}
