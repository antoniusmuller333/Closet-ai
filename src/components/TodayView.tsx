"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { actions, api, todayISO, useStore } from "@/lib/store";
import { describe, fetchWeather, fmtTemp, weatherBrief, type Weather } from "@/lib/weather";
import { OCCASIONS, type Item, type Outfit, type Suggestion } from "@/lib/types";
import { Button, Chip, Spinner, inputClass } from "./ui";
import { CheckIcon, PinIcon, SparkIcon } from "./icons";
import { WeatherCard } from "./WeatherCard";
import { LocationSheet } from "./LocationSheet";

export function TodayView({ goToCloset }: { goToCloset: () => void }) {
  const { items, log, settings, ready } = useStore();
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherError, setWeatherError] = useState("");
  const [locOpen, setLocOpen] = useState(false);
  const [dayIndex, setDayIndex] = useState(0);
  const [occasion, setOccasion] = useState<string>("everyday");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<(Suggestion & { dayIndex: number }) | null>(null);

  const loc = settings.location;

  const loadWeather = useCallback(() => {
    if (!loc) return;
    fetchWeather(loc.lat, loc.lon).then(
      (w) => {
        setWeather(w);
        setWeatherError("");
      },
      () => setWeatherError("Couldn't load the forecast. Check your connection."),
    );
  }, [loc]);

  useEffect(loadWeather, [loadWeather]);

  // Refresh when coming back to the app after a while
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && weather && Date.now() - weather.fetchedAt > 30 * 60 * 1000) loadWeather();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [weather, loadWeather]);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const date = todayISO(dayIndex);
  const loggedFor = log.find((l) => l.date === date);

  const suggest = async () => {
    if (!weather || !loc) return;
    setLoading(true);
    setError("");
    try {
      const cutoff = todayISO(-7);
      const res = await api<Suggestion>("/api/suggest", {
        weather: weatherBrief(weather, dayIndex, loc.name),
        occasion: OCCASIONS.find((o) => o.id === occasion)?.label ?? occasion,
        notes: notes.trim(),
        style: settings.style,
        items: items.map((i) => ({
          id: i.id,
          name: i.notes ? `${i.name} (note: ${i.notes})` : i.name,
          category: i.category,
          subcategory: i.subcategory,
          colors: i.colors,
          pattern: i.pattern,
          material: i.material,
          warmth: i.warmth,
          waterproof: i.waterproof,
          formality: i.formality,
          seasons: i.seasons,
          lastWorn: i.lastWorn,
        })),
        recent: log.filter((l) => l.date >= cutoff && l.date < date).map((l) => ({ date: l.date, itemIds: l.itemIds })),
      });
      setResult({ ...res, dayIndex });
      if (!res.outfits.length) setError("Couldn't put an outfit together from what's in your closet. Add a few more pieces.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const wear = (o: Outfit) => {
    const day = weather?.days[dayIndex];
    actions.logWear({
      date,
      title: o.title,
      itemIds: o.itemIds,
      weather: day ? `${describe(day.code).label}, ${fmtTemp(day.min, settings.unit)}–${fmtTemp(day.max, settings.unit)}` : undefined,
    });
  };

  const heading = new Date(date + "T12:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const hasBasics = items.some((i) => i.category === "top" || i.category === "dress") && items.some((i) => i.category === "bottom" || i.category === "dress");

  return (
    <section>
      <header className="pt-8 pb-5">
        <p className="text-sm text-muted">{dayIndex === 0 ? "Today" : "Tomorrow"}</p>
        <h1 className="font-serif text-4xl tracking-tight">{heading}</h1>
        <button onClick={() => setLocOpen(true)} className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <PinIcon />
          <span className="underline decoration-line underline-offset-4">{loc ? loc.name : "Set your location"}</span>
        </button>
      </header>

      <div className="mb-4 flex gap-2">
        <Chip active={dayIndex === 0} onClick={() => setDayIndex(0)}>
          Today
        </Chip>
        <Chip active={dayIndex === 1} onClick={() => setDayIndex(1)}>
          Tomorrow
        </Chip>
      </div>

      {ready && !loc && (
        <div className="rounded-3xl border border-line bg-paper px-5 py-6">
          <p className="font-serif text-xl">First, where are you?</p>
          <p className="mt-1 text-[15px] text-muted">Outfits are planned around your local forecast, hour by hour.</p>
          <Button className="mt-4" onClick={() => setLocOpen(true)}>
            <PinIcon /> Set location
          </Button>
        </div>
      )}

      {loc && !weather && !weatherError && <div className="shimmer h-56 rounded-3xl" />}
      {weatherError && (
        <div className="rounded-3xl border border-line bg-paper px-5 py-5 text-[15px]">
          {weatherError}{" "}
          <button className="text-clay underline" onClick={loadWeather}>
            Retry
          </button>
        </div>
      )}
      {weather && <WeatherCard w={weather} dayIndex={dayIndex} unit={settings.unit} />}

      {ready && loc && (
        <div className="mt-6">
          {!hasBasics ? (
            <div className="rounded-3xl border border-dashed border-line px-5 py-6">
              <p className="font-serif text-xl">Your closet is {items.length ? "a bit thin" : "empty"}</p>
              <p className="mt-1 text-[15px] text-muted">
                Scan at least a few tops, bottoms and a pair of shoes so there&apos;s something to style.
              </p>
              <Button className="mt-4" onClick={goToCloset}>
                Go to closet
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">What&apos;s the plan?</div>
              <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
                {OCCASIONS.map((o) => (
                  <Chip key={o.id} active={occasion === o.id} onClick={() => setOccasion(o.id)}>
                    {o.label}
                  </Chip>
                ))}
              </div>
              <input
                className={`${inputClass} mt-3`}
                placeholder="Anything else? e.g. lots of walking, dinner after, want to wear the new boots"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && suggest()}
              />
              <Button className="mt-3 w-full" onClick={suggest} disabled={loading || !weather}>
                {loading ? <Spinner /> : <SparkIcon />}
                {loading ? "Putting looks together…" : result ? "Try different looks" : "Style me"}
              </Button>
            </>
          )}
        </div>
      )}

      {error && <p className="mt-4 rounded-2xl bg-clay/10 px-4 py-3 text-sm text-clay-dark">{error}</p>}

      {loading && !result && (
        <div className="mt-6 space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="shimmer h-64 rounded-3xl" />
          ))}
        </div>
      )}

      {result && result.dayIndex === dayIndex && (
        <div className={`mt-7 space-y-4 transition ${loading ? "opacity-50" : ""}`}>
          {result.forecastTake && <p className="font-serif text-xl leading-snug text-ink/90 italic">{result.forecastTake}</p>}
          {result.outfits.map((o, n) => (
            <OutfitCard
              key={`${n}-${o.title}`}
              outfit={o}
              items={o.itemIds.map((id) => byId.get(id)).filter((x): x is Item => !!x)}
              chosen={!!loggedFor && sameSet(loggedFor.itemIds, o.itemIds)}
              onWear={() => wear(o)}
              dayLabel={dayIndex === 0 ? "today" : "tomorrow"}
              delay={n * 80}
            />
          ))}
          {result.gap && (
            <div className="rounded-2xl border border-line px-4 py-3 text-sm text-muted">
              <span className="font-medium text-ink">Worth adding: </span>
              {result.gap}
            </div>
          )}
        </div>
      )}

      <LocationSheet open={locOpen} onClose={() => setLocOpen(false)} />
    </section>
  );
}

function sameSet(a: string[], b: string[]) {
  return a.length === b.length && a.every((x) => b.includes(x));
}

const ORDER = ["outerwear", "top", "dress", "bottom", "shoes", "accessory"];

function OutfitCard({
  outfit,
  items,
  chosen,
  onWear,
  dayLabel,
  delay,
}: {
  outfit: Outfit;
  items: Item[];
  chosen: boolean;
  onWear: () => void;
  dayLabel: string;
  delay: number;
}) {
  const sorted = [...items].sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category));
  return (
    <article
      className={`animate-rise overflow-hidden rounded-3xl border bg-paper ${chosen ? "border-moss" : "border-line"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`grid gap-px bg-line ${sorted.length >= 4 ? "grid-cols-4" : sorted.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {sorted.map((i) => (
          <div key={i.id} className="bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={i.image} alt={i.name} className="aspect-square w-full object-contain p-1" />
          </div>
        ))}
      </div>
      <div className="px-5 pt-4 pb-5">
        <h3 className="font-serif text-2xl">{outfit.title}</h3>
        <p className="mt-1 text-sm text-muted">{sorted.map((i) => i.name).join(" · ")}</p>
        <p className="mt-3 text-[15px] leading-relaxed">{outfit.why}</p>
        {outfit.tip && <p className="mt-2 text-sm text-sky">↳ {outfit.tip}</p>}
        <Button variant={chosen ? "ghost" : "outline"} className={`mt-4 w-full ${chosen ? "text-moss" : ""}`} onClick={onWear}>
          {chosen ? (
            <>
              <CheckIcon /> Wearing this {dayLabel}
            </>
          ) : (
            `Wear this ${dayLabel}`
          )}
        </Button>
      </div>
    </article>
  );
}
