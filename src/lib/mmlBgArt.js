import { useState, useEffect } from "react";

const KEY = "mml-bg-art";
const MODES = ["all", "modded", "mml", "none"];

// Background art display mode, persisted locally.
// all = MML art + modded images; modded = only custom images; mml = only built-in art; none = hide the window.
export function useBgArt() {
  const [mode, setMode] = useState(() => {
    const v = localStorage.getItem(KEY);
    return MODES.includes(v) ? v : "all";
  });
  useEffect(() => { localStorage.setItem(KEY, mode); }, [mode]);
  return [mode, setMode];
}