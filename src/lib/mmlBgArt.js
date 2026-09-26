import { useState, useEffect } from "react";
import { bridge } from "@/lib/mmlBridge";

const KEY = "mml-bg-art";
const MODES = ["all", "modded", "mml", "none"];
const DEFAULT = { mode: "all", auto: false, interval: 8, pick: "next" };

// Migrates the old single-string value ("all"/"mml"/...) into the object shape.
const load = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    if (v && typeof v === "object") return { ...DEFAULT, ...v };
    return { ...DEFAULT, mode: MODES.includes(v) ? v : "all" };
  } catch {
    return { ...DEFAULT };
  }
};

// Background art settings:
//  mode    = all | modded | mml | none
//  auto    = cycle automatically on a timer
//  interval= seconds between advances
//  pick    = "next" (in order) | "random"
// Persisted locally (localStorage, instant) and, since 2026-09-24, in the
// real backend (settings.py's mml_settings.json) -- the bridge call is
// fire-and-forget on every set() so this behaves the same as every other
// bridge-backed setting in the app.
export function useBgArt() {
  const [s, setS] = useState(load);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(s)); }, [s]);
  // Real, saved value from the backend, fetched once on mount and merged
  // over the localStorage seed (same pattern as mmlPalette.jsx).
  useEffect(() => {
    bridge.getBackgroundArt().then((v) => { if (v) setS((prev) => ({ ...prev, ...v })); });
  }, []);
  const set = (patch) => {
    setS((prev) => ({ ...prev, ...patch }));
    bridge.setBackgroundArt(patch);
  };
  return [s, set];
}
