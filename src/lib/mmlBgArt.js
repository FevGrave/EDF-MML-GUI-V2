import { useState, useEffect } from "react";

const KEY = "mml-bg-art";
// Persisted toggle for whether the character artwork window renders on Home.
// Different routes, so each reads localStorage on mount — no live sync needed.
export function useBgArt() {
  const [on, setOn] = useState(() => localStorage.getItem(KEY) !== "0");
  useEffect(() => { localStorage.setItem(KEY, on ? "1" : "0"); }, [on]);
  return [on, setOn];
}