import { createContext, useContext, useState, useEffect } from "react";
import { bridge } from "@/lib/mmlBridge";

const Ctx = createContext(null);

export const PALETTE_NAMES = ["khaki", "purple", "green", "custom"];

// Real per-theme base colors, mirrored from index.css's [data-theme] blocks
// (2026-09-24 per-palette redesign, confirmed by the user: "each preset has
// its own overrides" -- so khaki/purple/green each now get their own saved
// color overrides instead of only the separate "Custom" 4th option). These
// are the single source of truth for "what a not-yet-overridden field should
// show" -- the backend (settings.py) deliberately stores/returns only raw
// override dicts, never a defaults-merged copy, so there's no second copy of
// this that could drift out of sync.
//
// "custom" bases on khaki, same as before this redesign, so any real var not
// covered by CUSTOM_FIELDS below still resolves to a known-good value.
// --focus/--ink are global :root vars (NOT redefined inside any [data-theme]
// block in the real CSS -- confirmed by reading index.css directly), so
// they're identical across all 4 entries here, not per-theme.
export const PRESET_DEFAULTS = {
  khaki: {
    "--bg1": "#2c2b22", "--bg2": "#5a5443", "--frame": "#c9b98a", "--frame2": "#7d704c",
    "--band1": "#5b5238", "--band2": "#d9cca0", "--bevel1": "#c2b283", "--bevel2": "#6f6440",
    "--line": "#c9b060", "--focus": "#ff8a1f", "--ink": "#f4f1e6",
    "--dia-a": "#ffffff", "--dia-b": "#000000", "--panel": "#0e0e0a", "--row": "#ffffff",
  },
  purple: {
    "--bg1": "#1d1628", "--bg2": "#5b4056", "--frame": "#cdbd90", "--frame2": "#7d704c",
    "--band1": "#5a4a3a", "--band2": "#dccfa4", "--bevel1": "#c2b283", "--bevel2": "#6f6440",
    "--line": "#c9b060", "--focus": "#ff8a1f", "--ink": "#f4f1e6",
    "--dia-a": "#ffdcff", "--dia-b": "#000000", "--panel": "#0a0812", "--row": "#ffffff",
  },
  green: {
    "--bg1": "#00502a", "--bg2": "#2fb070", "--frame": "#a9d8b6", "--frame2": "#2a8a55",
    "--band1": "#02501a", "--band2": "#3ee060", "--bevel1": "#57f0e0", "--bevel2": "#0a8a80",
    "--line": "#22d8c8", "--focus": "#ff8a1f", "--ink": "#f4f1e6",
    "--dia-a": "#ffffff", "--dia-b": "#002814", "--panel": "#02280c", "--row": "#b4ffdc",
  },
};
PRESET_DEFAULTS.custom = PRESET_DEFAULTS.khaki;

// Fixed alpha per palette for the semi-transparent vars below -- also
// mirrored from index.css, and genuinely different per theme (e.g. khaki's
// --row is .17 but green's is .20; khaki's --dia-b is .12 but purple's is
// .16). NOT user-editable: only the base RGB is exposed via ColorField (see
// CUSTOM_FIELDS), so nobody can accidentally make a panel fully opaque or a
// row highlight fully invisible while editing a preset's own colors.
const ALPHA_DEFAULTS = {
  khaki: { "--dia-a": 0.04, "--dia-b": 0.12, "--panel": 0.62, "--row": 0.17 },
  purple: { "--dia-a": 0.04, "--dia-b": 0.16, "--panel": 0.66, "--row": 0.16 },
  green: { "--dia-a": 0.07, "--dia-b": 0.10, "--panel": 0.66, "--row": 0.20 },
};
ALPHA_DEFAULTS.custom = ALPHA_DEFAULTS.khaki;

const ALPHA_VARS = new Set(["--dia-a", "--dia-b", "--panel", "--row"]);

// HUD color slots exposed for editing -- now for ANY palette, not just
// "custom" (2026-09-24 redesign). `def`/`alpha` used to live on each entry
// here, but they're per-PALETTE now (see PRESET_DEFAULTS/ALPHA_DEFAULTS
// above), not a single fixed value -- so this list is just the real CSS var
// names + labels.
//
// Two of the vars index.css defines per theme -- --rowhd and --grid -- were
// tried here and then REMOVED again the same day: grepped every .css/.jsx
// file in the repo and confirmed neither one is read by any CSS rule or
// component anywhere. They're dead theme variables (defined in every
// `[data-theme]` block, consumed nowhere) -- editing them can never change
// anything on screen, on any page, so exposing them as "editable" would just
// be a fake control. Not listed here on purpose; see HAKKEN_GUI_backend.md.
//
// --row IS real but its effect is easy to miss while testing from the
// Settings page itself: it only paints `.chip` (the small "Build"/category
// tags on Home), `.artcap` (the background-art prev/next buttons, also
// Home), and `.modrow` (Profiles' mod list rows) -- none of which render on
// Settings. Check Home.jsx or Profiles.jsx to see a --row edit take effect.
export const CUSTOM_FIELDS = [
  { label: "Background", var: "--bg1" },
  { label: "Band", var: "--bg2" },
  { label: "Frame", var: "--frame" },
  { label: "Frame trim", var: "--frame2" },
  { label: "Accent line", var: "--line" },
  { label: "Bevel", var: "--bevel1" },
  { label: "Bevel shadow", var: "--bevel2" },
  { label: "Banner left", var: "--band1" },
  { label: "Banner right", var: "--band2" },
  { label: "Focus", var: "--focus" },
  { label: "Text", var: "--ink" },
  { label: "Diamond tile (light)", var: "--dia-a" },
  { label: "Diamond tile (dark)", var: "--dia-b" },
  { label: "Panel scrim", var: "--panel" },
  // Shortened from "Row highlight (Home chips / Profiles rows)" -- that
  // label wrapped to 4-5 lines in the fixed-height grid and visually
  // overlapped the row above it (real bug, seen in a screenshot). The
  // "where does this show up" detail lives in the comment above instead.
  { label: "Row highlight", var: "--row" },
];

// --focus/--ink are real GLOBAL :root vars -- confirmed against index.css,
// they are NOT redefined inside any [data-theme] block, unlike the other 13
// fields above. So they can't be scoped to "whichever palette is currently
// selected" the way the rest of CUSTOM_FIELDS is: editing "Text" while on
// khaki has to keep showing on purple/green/custom too, not silently reset
// once you switch away from khaki. This mirrors a pattern already real
// elsewhere in this app -- mmlBridge.js's mock `toggleModConfig` writes a
// per-profile toggle into BOTH that profile's own mod list AND the global
// PLUGINS list in the same call, because a mod's actual enabled/disabled
// state is one file on disk, not something each profile owns separately.
// Same idea here: Focus/Text are one shared value, not fifteen-minus-two
// per-palette ones, so they get their own "global" bucket in custom_colors
// instead of living inside whichever palette was selected when they were
// edited (see settings.py's `_migrate_custom_colors` for how a real
// already-saved value gets moved there automatically).
const GLOBAL_FIELD_VARS = new Set(["--focus", "--ink"]);
export const GLOBAL_FIELDS = CUSTOM_FIELDS.filter(({ var: v }) => GLOBAL_FIELD_VARS.has(v));
export const PALETTE_FIELDS = CUSTOM_FIELDS.filter(({ var: v }) => !GLOBAL_FIELD_VARS.has(v));

// "#rrggbb" -> "rgba(r,g,b,alpha)" for the semi-transparent fields above.
// Returns null on anything malformed so callers can fall back to a default.
const hexToRgba = (hex, alpha) => {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || "");
  if (!m) return null;
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// Upgrades a real, already-saved flat `mml-custom-colors` dict ({cssVar:
// hex}, from before per-palette overrides existed -- localStorage's own copy
// of the same shape settings.py used to store) into the new {paletteName:
// {cssVar: hex}} shape, under "custom" since that was the only palette the
// old editor could ever write to. A second pass moves any GLOBAL_FIELD_VARS
// still sitting inside a per-palette bucket into "global" (see
// GLOBAL_FIELD_VARS' own comment above for why). Both passes are no-ops
// once migrated. Mirrors settings.py's own `_migrate_custom_colors` /
// mmlBridge.js's own `_migrateLegacyColors`.
function migrateLegacyShape(all) {
  if (!all || typeof all !== "object") all = {};
  let migrated = all;
  const isFlat = Object.values(migrated).some((v) => typeof v !== "object" || v === null);
  if (isFlat) migrated = { custom: migrated };
  // If two different buckets saved DIFFERENT values for the same
  // now-global var, the bucket matching the currently active palette wins
  // the plain key; any other bucket's differing value is kept too
  // (renamed `<var>#<bucket>`) rather than silently dropped -- mirrors
  // settings.py's own `_migrate_custom_colors` docstring, which has the
  // exact real case this was found from on the real device.
  let active;
  try { active = localStorage.getItem("mml-palette"); } catch { /* ignore */ }
  const names = Object.keys(migrated).filter((n) => n !== "global" && n !== active);
  const order = active && migrated[active] ? [active, ...names] : names;
  let globalBucket = null;
  for (const name of order) {
    const bucket = migrated[name];
    if (!bucket || typeof bucket !== "object") continue;
    for (const v of GLOBAL_FIELD_VARS) {
      if (v in bucket) {
        if (!globalBucket) globalBucket = migrated.global || (migrated.global = {});
        if (!(v in globalBucket)) globalBucket[v] = bucket[v];
        else if (globalBucket[v] !== bucket[v]) globalBucket[`${v}#${name}`] = bucket[v];
        delete bucket[v];
      }
    }
  }
  return migrated;
}

const loadCustom = () => {
  try { return migrateLegacyShape(JSON.parse(localStorage.getItem("mml-custom-colors")) || {}); }
  catch { return {}; }
};

export function MmlPaletteProvider({ children }) {
  const [palette, setPaletteState] = useState(() => localStorage.getItem("mml-palette") || "khaki");
  const [custom, setCustomState] = useState(loadCustom); // {paletteName: {cssVar: hex}}

  // Real, saved values from the backend (added 2026-09-24) -- fetched once on
  // mount and merged over the localStorage seed, so a machine whose real
  // mml_settings.json disagrees with this browser profile's local cache shows
  // the real persisted choice rather than a stale local one. Every palette's
  // overrides are fetched in parallel (per-palette redesign) so switching
  // palettes later never needs a fresh round-trip.
  useEffect(() => {
    bridge.getPalette().then((p) => { if (p) setPaletteState(p); });
    // "global" is fetched alongside the 4 real palettes -- it's just another
    // bucket in custom_colors as far as the bridge/backend are concerned,
    // it's only the frontend that treats it specially (see GLOBAL_FIELD_VARS).
    Promise.all([...PALETTE_NAMES, "global"].map((p) => bridge.getCustomColors(p).then((c) => [p, c])))
      .then((pairs) => {
        setCustomState((prev) => {
          const next = { ...prev };
          for (const [p, c] of pairs) {
            if (c && Object.keys(c).length) next[p] = { ...(next[p] || {}), ...c };
          }
          return next;
        });
      });
  }, []);

  // merge a single colour override into the right bucket — NOT a raw
  // setState (calling that with (varName, hex) would clobber the whole
  // nested object). A GLOBAL_FIELD_VARS var (Focus/Text) always goes into
  // the shared "global" bucket regardless of which palette is selected;
  // everything else goes into the CURRENTLY selected palette's own bucket.
  const setCustom = (varName, hex) => {
    const bucket = GLOBAL_FIELD_VARS.has(varName) ? "global" : palette;
    setCustomState((prev) => ({ ...prev, [bucket]: { ...(prev[bucket] || {}), [varName]: hex } }));
    bridge.setCustomColor(bucket, varName, hex);
  };
  const setPalette = (name) => {
    setPaletteState(name);
    bridge.setPalette(name);
  };

  // Real, overridden colors for the CURRENTLY selected palette, falling back
  // to that palette's own real default (PRESET_DEFAULTS) for anything not
  // yet overridden — this is what Settings.jsx's color grid actually shows.
  // GLOBAL_FIELD_VARS (Focus/Text) resolve from the shared "global" bucket
  // instead, regardless of which of khaki/purple/green/custom is selected.
  const overrides = custom[palette] || {};
  const globalOverrides = custom.global || {};
  const defaults = PRESET_DEFAULTS[palette] || PRESET_DEFAULTS.khaki;
  const paletteColors = {};
  CUSTOM_FIELDS.forEach(({ var: v }) => {
    paletteColors[v] = GLOBAL_FIELD_VARS.has(v) ? (globalOverrides[v] || defaults[v]) : (overrides[v] || defaults[v]);
  });

  useEffect(() => {
    const root = document.documentElement;
    const alphaDefs = ALPHA_DEFAULTS[palette] || ALPHA_DEFAULTS.khaki;
    // "custom" has no real [data-theme] CSS block of its own -- base on
    // khaki so any real var not covered by CUSTOM_FIELDS still resolves.
    root.setAttribute("data-theme", palette === "custom" ? "khaki" : palette);
    // Only touch vars this palette (or, for Focus/Text, the shared "global"
    // bucket) has actually overridden; anything else is cleared so the real
    // theme CSS (or khaki, for "custom") shows through — this is what lets
    // editing khaki/purple/green's own colors work without a second
    // always-on copy of every default fighting the real stylesheet. Because
    // Focus/Text read from `globalOverrides` unconditionally here (not
    // `overrides`), they keep applying no matter which palette is active —
    // exactly the "other states" a per-palette-only lookup would have missed.
    CUSTOM_FIELDS.forEach(({ var: v }) => {
      const hex = GLOBAL_FIELD_VARS.has(v) ? globalOverrides[v] : overrides[v];
      if (!hex) { root.style.removeProperty(v); return; }
      const alpha = ALPHA_VARS.has(v) ? alphaDefs[v] : null;
      root.style.setProperty(v, alpha != null ? (hexToRgba(hex, alpha) || hex) : hex);
    });
    localStorage.setItem("mml-custom-colors", JSON.stringify(custom));
    localStorage.setItem("mml-palette", palette);
  }, [palette, custom]);

  return (
    <Ctx.Provider value={{ palette, setPalette, custom, setCustom, paletteColors }}>
      {children}
    </Ctx.Provider>
  );
}

export const useMmlPalette = () => useContext(Ctx);
