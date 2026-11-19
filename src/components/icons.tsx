import type { WeatherKind } from "@/lib/weather";

type P = { className?: string };
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function WeatherIcon({ kind, className = "size-6" }: { kind: WeatherKind; className?: string }) {
  const cloud = <path d="M7 18h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.1 9.6 4.2 4.2 0 0 0 7 18Z" />;
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      {kind === "sun" && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </>
      )}
      {kind === "partly" && (
        <>
          <path d="M8.5 4.5v1.2M3.7 9.5h1.2M5.1 6.1l.9.9M11.9 6.1l-.9.9" />
          <path d="M5.6 11.6A3.5 3.5 0 0 1 11.5 8" />
          <path d="M9 19h8.5a3.5 3.5 0 0 0 .5-6.96 4.8 4.8 0 0 0-9.2-.8A3.9 3.9 0 0 0 9 19Z" />
        </>
      )}
      {kind === "cloud" && cloud}
      {kind === "fog" && <path d="M4 9h16M6 13h12M4 17h16" />}
      {(kind === "drizzle" || kind === "rain" || kind === "storm" || kind === "snow") && (
        <path d="M7 15h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.1 6.6 4.2 4.2 0 0 0 7 15Z" />
      )}
      {kind === "drizzle" && <path d="M9 18.5v.5M13 18.5v.5M11 20.5v.5" />}
      {kind === "rain" && <path d="M8.5 18l-1 2.5M12.5 18l-1 2.5M16.5 18l-1 2.5" />}
      {kind === "snow" && <path d="M9 18.5h.01M13 18.5h.01M11 21h.01M15 21h.01M7 21h.01" strokeWidth={2.4} />}
      {kind === "storm" && <path d="M12.5 16l-2 3.2h3l-2 3.3" />}
    </svg>
  );
}

export const Sun = ({ className = "size-5" }: P) => <WeatherIcon kind="sun" className={className} />;

export function TodayIcon({ className = "size-6" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 4.5c-1.4 0-2.4 1-2.4 2.2 0 .9.5 1.5 1.3 1.9l1.1.5v1.3L3.7 15.6c-1 .5-.6 2 .5 2h15.6c1.1 0 1.5-1.5.5-2L12 10.4" />
    </svg>
  );
}

export function ClosetIcon({ className = "size-6" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M12 3v18M9.5 11v2M14.5 11v2M4 18h16" />
    </svg>
  );
}

export function DiaryIcon({ className = "size-6" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="4" y="5" width="16" height="15" rx="1.5" />
      <path d="M4 9.5h16M8.5 3v4M15.5 3v4M8 13.5h3M8 16.5h6" />
    </svg>
  );
}

export function SettingsIcon({ className = "size-6" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  );
}

export function CameraIcon({ className = "size-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function PinIcon({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

export function CloseIcon({ className = "size-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function CheckIcon({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2.2}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function SparkIcon({ className = "size-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8Z" />
      <path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z" />
    </svg>
  );
}

export function UmbrellaIcon({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3 12a9 9 0 0 1 18 0Z" />
      <path d="M12 12v6.5a2 2 0 0 1-4 0" />
    </svg>
  );
}

export function WindIcon({ className = "size-4" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M3 9h11a2.5 2.5 0 1 0-2.5-2.5M3 13h15a2.5 2.5 0 1 1-2.5 2.5M3 17h7" />
    </svg>
  );
}
