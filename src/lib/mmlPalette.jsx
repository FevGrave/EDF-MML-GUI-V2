import { createContext, useContext, useState, useEffect } from "react";

const Ctx = createContext(null);

// HUD color slots exposed for the "Custom" palette. `def` matches the khaki
// preset so a fresh custom palette starts from a known-good baseline.
export const CUSTOM_FIELDS = [
  { label: "Background", var: "--bg1", def: "#2c2b22" },
  { label: "Band", var: "--bg2", def: "#5a5443" },
  { label: "Frame", var: "--frame", def: "#c9b98a" },
  { label: "Frame trim", var: "--frame2", def: "#7d704c" },
  { label: "Accent line", var: "--line", def: "#c9b060" },
  { label: "Bevel", var: "--bevel1", def: "#c2b283" },
  { label: "Focus", var: "--focus", def: "#ff8a1f" },
  { label: "Text", var: "--ink", def: "#f4f1e6" },
];

const loadCustom = () => {
  try { return JSON.parse(localStorage.getItem("mml-custom-colors")) || {}; } catch { return {}; }
};

export function MmlPaletteProvider({ children }) {
  const [palette, setPalette] = useState(() => localStorage.getItem("mml-palette") || "khaki");
  const [custom, setCustomState] = useState(loadCustom);
  // merge a single colour override into the custom palette object — NOT a raw
  // setState (calling that with (varName, hex) would clobber the whole object)
  const setCustom = (varName, hex) => setCustomState((prev) => ({ ...prev, [varName]: hex }));

  useEffect(() => {
    const root = document.documentElement;
    // clear overrides from a previous custom session so presets render true
    CUSTOM_FIELDS.forEach(({ var: v }) => root.style.removeProperty(v));
    if (palette === "custom") {
      // base on khaki so the derived rgba vars (--panel, --row, --dia-*) resolve
      root.setAttribute("data-theme", "khaki");
      CUSTOM_FIELDS.forEach(({ var: v, def }) => root.style.setProperty(v, custom[v] || def));
      localStorage.setItem("mml-custom-colors", JSON.stringify(custom));
    } else {
      root.setAttribute("data-theme", palette);
    }
    localStorage.setItem("mml-palette", palette);
  }, [palette, custom]);

  return (
    <Ctx.Provider value={{ palette, setPalette, custom, setCustom }}>
      {children}
    </Ctx.Provider>
  );
}

export const useMmlPalette = () => useContext(Ctx);