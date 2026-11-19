"use client";

import { useRef, useState } from "react";
import { actions, useStore } from "@/lib/store";
import { Button, Chip, Label, inputClass } from "./ui";
import { LocationSheet } from "./LocationSheet";

export function SettingsView() {
  const { settings, items, log } = useStore();
  const [style, setStyle] = useState<string | null>(null);
  const [locOpen, setLocOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [wipeArmed, setWipeArmed] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ version: 1, items, log, settings: { ...settings, passcode: undefined } })], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `closet-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data.items)) throw new Error();
      actions.importAll({ ...data, settings: { ...data.settings, passcode: settings.passcode } });
      setMsg(`Restored ${data.items.length} items.`);
    } catch {
      setMsg("That file isn't a Closet backup.");
    }
  };

  return (
    <section className="space-y-7">
      <header className="pt-8">
        <h1 className="font-serif text-4xl tracking-tight">Settings</h1>
      </header>

      <div>
        <Label>Your style</Label>
        <textarea
          className={`${inputClass} min-h-24`}
          placeholder="e.g. Clean and minimal, mostly neutrals. No shorts in the city. I cycle to class."
          value={style ?? settings.style ?? ""}
          onChange={(e) => setStyle(e.target.value)}
          onBlur={() => style !== null && actions.setSettings({ style: style.trim() })}
        />
        <p className="mt-1 text-xs text-muted">The stylist reads this every time it suggests an outfit.</p>
      </div>

      <div>
        <Label>Location</Label>
        <div className="flex items-center justify-between rounded-xl border border-line bg-paper px-4 py-3">
          <span className="text-[15px]">{settings.location?.name ?? "Not set"}</span>
          <button className="text-sm text-clay" onClick={() => setLocOpen(true)}>
            Change
          </button>
        </div>
      </div>

      <div>
        <Label>Temperature</Label>
        <div className="flex gap-2">
          <Chip active={settings.unit === "C"} onClick={() => actions.setSettings({ unit: "C" })}>
            °C
          </Chip>
          <Chip active={settings.unit === "F"} onClick={() => actions.setSettings({ unit: "F" })}>
            °F
          </Chip>
        </div>
      </div>

      <div>
        <Label>App passcode</Label>
        <input
          className={inputClass}
          type="password"
          autoComplete="off"
          placeholder="Only needed if you set APP_PASSCODE on Vercel"
          defaultValue={settings.passcode ?? ""}
          onBlur={(e) => actions.setSettings({ passcode: e.target.value })}
        />
      </div>

      <div>
        <Label>Backup</Label>
        <p className="mb-3 text-sm text-muted">
          Your closet lives on this device only. Export a backup now and then, or to move to another phone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportData} disabled={!items.length} className="flex-1">
            Export
          </Button>
          <Button variant="outline" onClick={() => file.current?.click()} className="flex-1">
            Import
          </Button>
          <input
            ref={file}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importData(f);
              e.target.value = "";
            }}
          />
        </div>
        {msg && <p className="mt-2 text-sm text-moss">{msg}</p>}
      </div>

      <div className="border-t border-line pt-6">
        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            if (wipeArmed) {
              actions.wipe();
              setWipeArmed(false);
            } else setWipeArmed(true);
          }}
        >
          {wipeArmed ? "Tap again: delete all clothes and history" : "Delete everything"}
        </Button>
      </div>

      <LocationSheet open={locOpen} onClose={() => setLocOpen(false)} />
    </section>
  );
}
