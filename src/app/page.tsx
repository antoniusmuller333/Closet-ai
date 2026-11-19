"use client";

import { useEffect, useState } from "react";
import { loadStore, useStore } from "@/lib/store";
import { TodayView } from "@/components/TodayView";
import { ClosetView } from "@/components/ClosetView";
import { DiaryView } from "@/components/DiaryView";
import { SettingsView } from "@/components/SettingsView";
import { ClosetIcon, DiaryIcon, SettingsIcon, TodayIcon } from "@/components/icons";

const TABS = [
  { id: "today", label: "Today", Icon: TodayIcon },
  { id: "closet", label: "Closet", Icon: ClosetIcon },
  { id: "diary", label: "Diary", Icon: DiaryIcon },
  { id: "settings", label: "Settings", Icon: SettingsIcon },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default function Home() {
  const [tab, setTab] = useState<Tab>("today");
  const { ready } = useStore();

  useEffect(() => {
    loadStore();
  }, []);

  // Everything lives in this browser's storage, so render only once it's loaded
  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <span className="font-serif text-2xl text-muted">Closet</span>
      </div>
    );
  }

  const go = (t: Tab) => {
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-5 pb-32">
      <div hidden={tab !== "today"}>
        <TodayView goToCloset={() => go("closet")} />
      </div>
      <div hidden={tab !== "closet"}>
        <ClosetView />
      </div>
      <div hidden={tab !== "diary"}>
        <DiaryView />
      </div>
      <div hidden={tab !== "settings"}>
        <SettingsView />
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-linen/90 backdrop-blur-md pb-safe">
        <div className="mx-auto grid max-w-2xl grid-cols-4">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={`flex flex-col items-center gap-0.5 pt-2.5 pb-1 text-[11px] transition ${tab === id ? "text-clay" : "text-muted"}`}
              aria-current={tab === id ? "page" : undefined}
            >
              <Icon className="size-6" />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
