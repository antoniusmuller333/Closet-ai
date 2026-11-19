import type { Place } from "./types";

export type Hour = { time: string; hour: number; temp: number; feels: number; rainChance: number; code: number };

export type DayForecast = {
  date: string;
  code: number;
  max: number;
  min: number;
  feelsMax: number;
  feelsMin: number;
  rainChance: number;
  rainSum: number;
  windMax: number;
  uvMax: number;
  hours: Hour[];
};

export type Weather = {
  fetchedAt: number;
  current: { temp: number; feels: number; code: number; wind: number; isDay: boolean };
  days: DayForecast[];
};

export type WeatherKind = "sun" | "partly" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "storm";

export function describe(code: number): { label: string; kind: WeatherKind } {
  if (code === 0) return { label: "Clear", kind: "sun" };
  if (code === 1) return { label: "Mostly clear", kind: "sun" };
  if (code === 2) return { label: "Partly cloudy", kind: "partly" };
  if (code === 3) return { label: "Overcast", kind: "cloud" };
  if (code === 45 || code === 48) return { label: "Fog", kind: "fog" };
  if (code >= 51 && code <= 57) return { label: code >= 56 ? "Freezing drizzle" : "Drizzle", kind: "drizzle" };
  if (code >= 61 && code <= 67) return { label: code >= 66 ? "Freezing rain" : code === 65 ? "Heavy rain" : "Rain", kind: "rain" };
  if (code >= 71 && code <= 77) return { label: "Snow", kind: "snow" };
  if (code >= 80 && code <= 82) return { label: "Showers", kind: "rain" };
  if (code === 85 || code === 86) return { label: "Snow showers", kind: "snow" };
  if (code >= 95) return { label: "Thunderstorms", kind: "storm" };
  return { label: "Mixed", kind: "cloud" };
}

export async function fetchWeather(lat: number, lon: number): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day",
    hourly: "temperature_2m,apparent_temperature,precipitation_probability,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max",
    timezone: "auto",
    forecast_days: "2",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error("Weather service unavailable");
  const d = await res.json();

  const hours: Hour[] = d.hourly.time.map((t: string, i: number) => ({
    time: t,
    hour: Number(t.slice(11, 13)),
    temp: d.hourly.temperature_2m[i],
    feels: d.hourly.apparent_temperature[i],
    rainChance: d.hourly.precipitation_probability[i] ?? 0,
    code: d.hourly.weather_code[i],
  }));

  const days: DayForecast[] = d.daily.time.map((date: string, i: number) => ({
    date,
    code: d.daily.weather_code[i],
    max: d.daily.temperature_2m_max[i],
    min: d.daily.temperature_2m_min[i],
    feelsMax: d.daily.apparent_temperature_max[i],
    feelsMin: d.daily.apparent_temperature_min[i],
    rainChance: d.daily.precipitation_probability_max[i] ?? 0,
    rainSum: d.daily.precipitation_sum[i] ?? 0,
    windMax: d.daily.wind_speed_10m_max[i],
    uvMax: d.daily.uv_index_max[i] ?? 0,
    hours: hours.filter((h) => h.time.startsWith(date)),
  }));

  return {
    fetchedAt: Date.now(),
    current: {
      temp: d.current.temperature_2m,
      feels: d.current.apparent_temperature,
      code: d.current.weather_code,
      wind: d.current.wind_speed_10m,
      isDay: d.current.is_day === 1,
    },
    days,
  };
}

/** Daytime hours worth showing / sending to the model */
export function keyHours(day: DayForecast, fromHour = 7): Hour[] {
  return day.hours.filter((h) => h.hour >= fromHour && h.hour <= 22 && (h.hour - 7) % 3 === 0);
}

/** Plain-text brief for the stylist model (always Celsius) */
export function weatherBrief(w: Weather, dayIndex: number, place: string): string {
  const day = w.days[dayIndex];
  const lines = [
    `Location: ${place}. Date: ${day.date} (${dayIndex === 0 ? "today" : "tomorrow"}).`,
    `${describe(day.code).label}. High ${Math.round(day.max)}°C / low ${Math.round(day.min)}°C, feels like ${Math.round(day.feelsMin)} to ${Math.round(day.feelsMax)}°C.`,
    `Max chance of rain ${day.rainChance}%, total precipitation ${day.rainSum.toFixed(1)} mm. Max wind ${Math.round(day.windMax)} km/h. UV index max ${day.uvMax.toFixed(0)}.`,
  ];
  if (dayIndex === 0) {
    lines.push(
      `Right now: ${Math.round(w.current.temp)}°C (feels ${Math.round(w.current.feels)}°C), ${describe(w.current.code).label.toLowerCase()}, wind ${Math.round(w.current.wind)} km/h.`,
    );
  }
  const hrs = keyHours(day)
    .map((h) => `${String(h.hour).padStart(2, "0")}:00 ${Math.round(h.temp)}°C (feels ${Math.round(h.feels)}), ${describe(h.code).label.toLowerCase()}, rain ${h.rainChance}%`)
    .join("; ");
  if (hrs) lines.push(`Through the day: ${hrs}.`);
  return lines.join("\n");
}

export function fmtTemp(c: number, unit: "C" | "F") {
  return unit === "F" ? `${Math.round((c * 9) / 5 + 32)}°` : `${Math.round(c)}°`;
}

export function getPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location isn't available in this browser"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => reject(new Error("Location permission was denied")),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30 * 60 * 1000 },
    );
  });
}

export async function placeName(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
    );
    const d = await res.json();
    return d.city || d.locality || d.principalSubdivision || "Your location";
  } catch {
    return "Your location";
  }
}

export async function searchPlaces(q: string): Promise<Place[]> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`,
  );
  const d = await res.json();
  return (d.results ?? []).map((r: { latitude: number; longitude: number; name: string; admin1?: string; country?: string }) => ({
    lat: r.latitude,
    lon: r.longitude,
    name: [r.name, r.admin1 && r.admin1 !== r.name ? r.admin1 : null, r.country].filter(Boolean).join(", "),
  }));
}
