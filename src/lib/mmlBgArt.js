import { useState, useEffect } from "react";

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

// Background art settings, persisted locally:
//  mode    = all | modded | mml | none
//  auto    = cycle automatically on a timer
//  interval= seconds between advances
//  pick    = "next" (in order) | "random"
export function useBgArt() {
  const [s, setS] = useState(load);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(s)); }, [s]);
  const set = (patch) => setS((prev) => ({ ...prev, ...patch }));
  return [s, set];
}