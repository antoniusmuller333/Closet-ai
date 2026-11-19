"use client";

import { describe, fmtTemp, keyHours, type Weather } from "@/lib/weather";
import { UmbrellaIcon, WeatherIcon, WindIcon } from "./icons";

export function WeatherCard({ w, dayIndex, unit }: { w: Weather; dayIndex: number; unit: "C" | "F" }) {
  const day = w.days[dayIndex];
  const isToday = dayIndex === 0;
  const main = isToday ? w.current : { temp: day.max, feels: day.feelsMax, code: day.code };
  const d = describe(main.code);
  const nowHour = new Date().getHours();
  const hours = keyHours(day, isToday ? nowHour : 7).slice(0, 6);

  return (
    <div className="animate-rise overflow-hidden rounded-3xl border border-line bg-paper">
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div>
          <div className="font-serif text-6xl leading-none tracking-tight">{fmtTemp(main.temp, unit)}</div>
          <div className="mt-2 text-[15px]">
            {d.label}
            {isToday ? ` · feels ${fmtTemp(main.feels, unit)}` : " · daytime high"}
          </div>
          <div className="mt-0.5 text-sm text-muted">
            H {fmtTemp(day.max, unit)} · L {fmtTemp(day.min, unit)}
          </div>
        </div>
        <WeatherIcon kind={d.kind} className="size-16 text-clay" />
      </div>

      <div className="mt-4 flex gap-4 px-5 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <UmbrellaIcon /> {day.rainChance}% rain
        </span>
        <span className="inline-flex items-center gap-1.5">
          <WindIcon /> {Math.round(day.windMax)} km/h
        </span>
        {day.uvMax >= 3 && <span>UV {Math.round(day.uvMax)}</span>}
      </div>

      {hours.length > 0 && (
        <div className="mt-4 grid grid-flow-col auto-cols-fr border-t border-line">
          {hours.map((h) => (
            <div key={h.time} className="flex flex-col items-center gap-1 border-r border-line py-3 text-xs last:border-r-0">
              <span className="text-muted">{String(h.hour).padStart(2, "0")}h</span>
              <WeatherIcon kind={describe(h.code).kind} className="size-5" />
              <span className="font-medium">{fmtTemp(h.temp, unit)}</span>
              <span className={h.rainChance >= 40 ? "text-sky" : "text-transparent"}>{h.rainChance}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
