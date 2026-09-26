// Abstraction over the pywebview JS bridge (window.pywebview.api).
// In the desktop app this delegates to the real Python 3.12.4 backend.
// In a plain browser preview it falls back to in-memory mock data so the
// whole GUI stays interactive.

const API = () =>
  typeof window !== "undefined" && window.pywebview && window.pywebview.api
    ? window.pywebview.api
    : null;

// Real, confirmed race (2026-09-25): pywebview injects window.pywebview.api
// asynchronously -- its own JS bridge only dispatches a real
// `pywebviewready` CustomEvent on `window` once the Python<->JS handshake
// finishes (confirmed straight from the installed pywebview package's own
// source, webview/js/finish.js + webview/util.py's generate_js_object()).
// React can mount and fire its very first bridge.getX() calls before that
// event ever fires -- especially on a cold/fresh boot, which is exactly
// when the user hit this. Before this fix, API() returning null at that
// one moment meant every method below permanently fell through to its
// mock/demo value for the rest of that page's life (nothing re-checks
// later): confirmed on a real fresh-boot screenshot where EVERY field on
// Home -- weapons "1,565 / 8,192" (no "max 65,536" suffix), Active game
// "EDF 6.2 · not set", Loaded profile "core+lostmp", Mode
// "NI test, order by MOD NAME" -- matched this file's own mock data
// byte-for-byte, including the mock's own placeholder wording. The Save
// slot dropdown looked "real" (1,572 used) purely by coincidence: its own
// mock fallback a few lines below happens to hardcode that same real
// number.
//
// Fix: every exported bridge method now awaits pywebviewready (or a short
// timeout, for the plain-browser-preview case where pywebview never loads
// at all) before its first real API() check, via the Proxy wrapper at the
// bottom of this file -- centralized here once, rather than editing every
// individual method's own API() check.
let _apiReadyPromise = null;
function whenApiReady() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.pywebview && window.pywebview.api) return Promise.resolve();
  if (!_apiReadyPromise) {
    _apiReadyPromise = new Promise((resolve) => {
      const done = () => resolve();
      window.addEventListener("pywebviewready", done, { once: true });
      // Plain browser preview (style-only iteration, no pywebview at all):
      // pywebviewready will never fire there. Don't hang forever -- fall
      // back to mock data after a short grace period, same as today.
      setTimeout(done, 1500);
    });
  }
  return _apiReadyPromise;
}

const clone = (x) => JSON.parse(JSON.stringify(x));

let PLUGINS = [
  { id: "p1", name: "EDF5_NativeRenderer_Fix_x64_r3.dll", type: "dll", folder: "native", category: "Native", enabled: true, order: 0, conflicts: [] },
  { id: "p2", name: "ModernCamera_OverTheShoulder_v4_x64.dll", type: "dll", folder: "camera", category: "Camera", enabled: true, order: 1, conflicts: [] },
  { id: "p3", name: "PatchKeys_KeyboardRemap_Expanded_Set2.txt", type: "txt", folder: "PatchKeys", category: "Input", enabled: true, order: 2, conflicts: [] },
  { id: "p4", name: "PatchTables_AlphaBalance_WeaponTuning_Hotfix.txt", type: "txt", folder: "PatchTables", category: "Balance", enabled: false, order: 3, conflicts: ["Overwrites weapon table rows also patched by PatchTables_ReduxOverhaul_FullRebalance"] },
  { id: "p5", name: "PatchTables_ReduxOverhaul_FullRebalance_v2.txt", type: "txt", folder: "PatchTables", category: "Core", enabled: true, order: 4, conflicts: ["Overwrites weapon table rows also patched by PatchTables_AlphaBalance_WeaponTuning_Hotfix"] },
  { id: "p6", name: "Visual_ArmorSkinPack_Apocalypse_Edition.txt", type: "txt", folder: "Visual", category: "Visual", enabled: true, order: 5, conflicts: [] },
  { id: "p7", name: "Native_FPSUnlock_144Hz_Loader_Fix.dll", type: "dll", folder: "native", category: "Native", enabled: true, order: 6, conflicts: [] },
  { id: "p8", name: "PatchTables_EnemySpawnMultiplier_LegendaryMode.txt", type: "txt", folder: "PatchTables", category: "Balance", enabled: true, order: 7, conflicts: [] },
  { id: "p9", name: "Visual_WeaponSkinPack_InfernoAndFrost_Set.txt", type: "txt", folder: "Visual", category: "Visual", enabled: false, order: 8, conflicts: [] },
  { id: "p10", name: "Camera_FirstPerson_Mod_ExpFix_Arbalest.dll", type: "dll", folder: "camera", category: "Camera", enabled: false, order: 9, conflicts: [] },
  { id: "p11", name: "PatchKeys_GamepadCustomLayout_DualShock.txt", type: "txt", folder: "PatchKeys", category: "Input", enabled: true, order: 10, conflicts: [] },
  { id: "p12", name: "PatchTables_MissionPack_LostArkside_Expansion.txt", type: "txt", folder: "PatchTables", category: "Missions", enabled: true, order: 11, conflicts: [] },
];

let PROFILES = [
  { id: "p1", name: "core+lostmp", timestamp: Date.now() - 86400000, mods: PLUGINS.filter((m) => m.enabled).map((m) => ({ ...m })) },
  { id: "p2", name: "vanilla+skins", timestamp: Date.now() - 2 * 86400000, mods: [{ ...PLUGINS[0], enabled: true }, { ...PLUGINS[5], enabled: true }] },
  { id: "p3", name: "legendary-survival", timestamp: Date.now() - 3 * 86400000, mods: PLUGINS.slice(0, 9).map((m) => ({ ...m })) },
];

let LOADED_PROFILE = (PROFILES[0] && PROFILES[0].name) || "—";

let DEFAULT_GAMES = [
  { id: "edf62", label: "EDF 6.2", working_dir: "", platform: "steam", installed: false },
  { id: "edf6", label: "EDF 6", working_dir: "F:\\Games\\EARTH DEFENSE FORCE 6", platform: "steam", installed: true },
  { id: "edf5", label: "EDF 5", working_dir: "", platform: null, installed: false },
  { id: "edf41", label: "EDF 4.1", working_dir: "", platform: null, installed: false },
];
function loadGames() {
  try {
    const saved = JSON.parse(localStorage.getItem("mml-games"));
    if (Array.isArray(saved)) {
      return DEFAULT_GAMES.map((g) => {
        const s = saved.find((x) => x.id === g.id);
        return s ? { ...g, ...s } : clone(g);
      });
    }
  } catch (e) {}
  return clone(DEFAULT_GAMES);
}
function saveGames(games) { localStorage.setItem("mml-games", JSON.stringify(games)); }

// Real ConfigBuildAll.py pipeline stages. NI Test and Installer each run 9
// stages — a different 9. `match` is the exact substring ConfigBuildAll.py
// prints to AA-Log.txt for that stage; the Build page lights its pill when the
// substring appears in the streamed log. The Missions stage (NI only) blocks on
// a separate GamemodeConfig popup, so it gets a distinct "waiting for input"
// state instead of a spinner. (A "Compress Files" stage exists in source but is
// disabled/commented out in both modes, so it is not listed.)
const STAGES_NI = [
  { id: "replace", label: "Data replacement", match: "Running data replacement..." },
  { id: "yoink", label: "Yoink configs", match: "Yoink over non additive configs..." },
  { id: "config", label: "Build config", match: "Building config..." },
  { id: "missions", label: "Mission packs", match: "EDIT what mission pack this player wants in the config...", waitForInput: true },
  { id: "text", label: "Text tables", match: "Processing text tables..." },
  { id: "subs", label: "Subtitles", match: "Processing subtitles..." },
  { id: "weapons", label: "Weapon data", match: "Appending weapon data..." },
  { id: "culldlc", label: "Cull DLC weapons", match: "EDIT DLC Weapon drops for matching mission packs..." },
  { id: "cullmod", label: "Cull modded weapons", match: "EDIT MODDED Weapon drops for matching mission packs..." },
];
const STAGES_INSTALLER = [
  { id: "replace", label: "Data replacement", match: "Running data replacement..." },
  { id: "yoink", label: "Yoink configs", match: "Yoink over non additive configs..." },
  { id: "config", label: "Build config", match: "Building config..." },
  { id: "text", label: "Text tables", match: "Processing text tables..." },
  { id: "subs", label: "Subtitles", match: "Processing subtitles..." },
  { id: "weapons", label: "Weapon data", match: "Appending weapon data..." },
  { id: "sgo", label: "SGO conversion", match: "Starting SGO conversion..." },
  { id: "rename", label: "Rename tables", match: "Renaming in game text data files..." },
  { id: "move", label: "Move to Mods/", match: "Installing SGOs to Mods folders..." },
];
export function buildStages(mode) { return mode === "ni" ? STAGES_NI : STAGES_INSTALLER; }

// Mock build stream for browser preview. The real backend (run_build_async /
// get_build_status) streams AA-Log.txt from ConfigBuildAll.py; the mock replays
// the same stage strings so the GUI behaves identically.
let BUILD = { running: false, idx: 0, log: "", finished: false, ok: false, waiting: false, timer: null };
function startMockBuild(kind) {
  if (BUILD.timer) clearTimeout(BUILD.timer);
  const stages = buildStages(kind);
  BUILD = { running: true, stages, idx: 0, log: "", finished: false, ok: false, waiting: false, timer: null };
  const emit = () => {
    if (BUILD.idx >= stages.length) {
      BUILD.running = false; BUILD.finished = true; BUILD.ok = true; BUILD.waiting = false;
      BUILD.log += (BUILD.log ? "\n" : "") + (kind === "ni" ? "NI build complete." : "Installer build complete.");
      return;
    }
    const st = stages[BUILD.idx];
    BUILD.log += (BUILD.log ? "\n" : "") + st.match;
    BUILD.idx += 1;
    BUILD.waiting = !!st.waitForInput;
    BUILD.timer = setTimeout(emit, st.waitForInput ? 2200 : 650);
  };
  BUILD.timer = setTimeout(emit, 400);
}
function mockBuildStatus() {
  return { running: BUILD.running, log: BUILD.log, finished: BUILD.finished, ok: BUILD.ok, waiting: BUILD.waiting };
}

const _rawBridge = {
  async getPreflight() {
    if (API()?.get_preflight) return API().get_preflight();
    return {
      loaded_profile: LOADED_PROFILE,
      warning_count: 1,
      checks: [
        { id: "hakken_build", state: "error", detail: "No build yet. Run Build NI Test or Build Installer from the Build menu." },
        { id: "mppp", state: "warn", detail: "mppp.dlll (disabled) — packs can't be built" },
        { id: "edfmodloader", state: "ok", detail: "v1.0.10 installed, v1.0.10 latest" },
        { id: "edftools", state: "ok", detail: "6 of 6 copies match the latest release" },
        { id: "mml_self", state: "ok", detail: "2.0 installed, 2.0 latest" },
      ],
      counts: {
        weapons: { data: { used: 1565, capacity: 8192 } },
        mods: { data: { on: PLUGINS.filter((m) => m.enabled).length, total: PLUGINS.length } },
        packs: { data: { total: 4 } },
        mode: { data: { ni_mode: "NI test, order by MOD NAME" } },
      },
    };
  },
  async getPlugins() {
    if (API()?.get_plugins) return API().get_plugins();
    return clone(PLUGINS).sort((a, b) => a.order - b.order);
  },
  async togglePlugin(id, enabled) {
    if (API()?.toggle_plugin) return API().toggle_plugin(id, enabled);
    const m = PLUGINS.find((x) => x.id === id);
    if (m) m.enabled = enabled;
  },
  async uninstallPlugin(id) {
    if (API()?.uninstall_plugin) return API().uninstall_plugin(id);
    PLUGINS = PLUGINS.filter((x) => x.id !== id);
  },
  // Returns the on-disk file contents for a plugin. For DLL plugins this is
  // whatever same-stem .txt/.ini/.cfg/.json sits next to it (most real DLLs
  // ship a .txt; editable: false + a note means none exists); for txt patch
  // files it's the patch source itself. Shape matches the real backend's
  // get_plugin_file (see backend/plugins.py) so Plugins.jsx doesn't need to
  // special-case mock vs real.
  async getPluginFile(id) {
    if (API()?.get_plugin_file) return API().get_plugin_file(id);
    const p = PLUGINS.find((x) => x.id === id);
    if (!p) return null;
    if (p.type === "dll") {
      return {
        ok: true, editable: true,
        name: p.name.replace(/\.[^.]+$/, "") + ".txt",
        ext: "txt",
        content: `# ${p.name} configuration (demo)\nenabled=${p.enabled ? 1 : 0}\nlog_level=0\nverbose=0\n`,
      };
    }
    return {
      ok: true, editable: true,
      name: p.name,
      ext: "txt",
      content: `# ${p.name}\n# Category: ${p.category}\n# Folder: ${p.folder}\n\n[WeaponTable:Ranger]\nDamageMultiplier=1.15\nFireRate=1.05\nReloadSpeed=1.10\n\n[TextMap:Weapons]\n; overrides display strings\n`,
    };
  },
  // Writes edited file contents back to disk (added 2026-09-24). Real backend:
  // backend/plugins.py's write_file() -- preserves the file's original text
  // encoding and overwrites directly (no backup, per the user's own choice).
  async savePluginFile(id, content) {
    if (API()?.save_plugin_file) return API().save_plugin_file(id, content);
    const p = PLUGINS.find((x) => x.id === id);
    return { ok: true, name: p ? p.name : id, mock: true };
  },
  async getProfiles() {
    if (API()?.get_profiles) return API().get_profiles();
    return clone(PROFILES);
  },
  async saveProfile(name) {
    if (API()?.save_profile) return API().save_profile(name);
    const p = { id: "p" + Date.now(), name, timestamp: Date.now(), mods: PLUGINS.map((m) => ({ ...m })) };
    PROFILES.unshift(p);
    return clone(p);
  },
  async loadProfile(id) {
    if (API()?.load_profile) return API().load_profile(id);
    const p = PROFILES.find((x) => x.id === id);
    if (p) { LOADED_PROFILE = p.name; p.mods.forEach((pm) => { const m = PLUGINS.find((x) => x.name === pm.name); if (m) { m.enabled = pm.enabled; m.order = pm.order; } }); }
  },
  async exportProfile(id) {
    if (API()?.export_profile) return API().export_profile(id);
    return { text: (PROFILES.find((x) => x.id === id) || {}).name + ".mmlprofile" };
  },
  async deleteProfile(id) {
    if (API()?.delete_profile) return API().delete_profile(id);
    PROFILES = PROFILES.filter((x) => x.id !== id);
  },
  async toggleModConfig(profileId, modId, enabled) {
    if (API()?.toggle_mod_config) return API().toggle_mod_config(profileId, modId, enabled);
    const p = PROFILES.find((x) => x.id === profileId);
    const m = p && p.mods.find((x) => x.id === modId);
    if (m) m.enabled = enabled;
    const pl = PLUGINS.find((x) => x.id === modId);
    if (pl) pl.enabled = enabled;
  },
  async uninstallModConfig(profileId, modId) {
    if (API()?.uninstall_mod_config) return API().uninstall_mod_config(profileId, modId);
    const p = PROFILES.find((x) => x.id === profileId);
    if (p) p.mods = p.mods.filter((x) => x.id !== modId);
    PLUGINS = PLUGINS.filter((x) => x.id !== modId);
  },
  async moveModConfig(profileId, fromIndex, toIndex) {
    if (API()?.move_mod_config) return API().move_mod_config(profileId, fromIndex, toIndex);
    const p = PROFILES.find((x) => x.id === profileId);
    if (!p || !p.mods) return;
    const arr = p.mods;
    if (toIndex < 0 || toIndex >= arr.length) return;
    const [item] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, item);
  },
  async getGames() {
    if (API()?.get_games) return API().get_games();
    return loadGames();
  },
  async getModdedArt() {
    if (API()?.get_modded_art) return API().get_modded_art();
    // browser preview: no modded art folder; users add images via the ArtWindow +
    return [];
  },
  async setGameDir(id, dir) {
    if (API()?.set_game_dir) return API().set_game_dir(id, dir);
    const games = loadGames();
    const g = games.find((x) => x.id === id);
    if (g) { g.working_dir = dir; saveGames(games); }
  },
  async setGamePlatform(id, platform) {
    if (API()?.set_game_platform) return API().set_game_platform(id, platform);
    const games = loadGames();
    const g = games.find((x) => x.id === id);
    if (g) { g.platform = platform; saveGames(games); }
  },
  // Generic merge so auto-detect can update working_dir + platform + installed
  // in one persisted write without separate calls.
  async updateGame(id, patch) {
    if (API()?.update_game) return API().update_game(id, patch);
    const games = loadGames();
    const g = games.find((x) => x.id === id);
    if (g) { Object.assign(g, patch); saveGames(games); }
  },
  // Steam auto-detect. The real backend parses libraryfolders.vdf and matches
  // the EDF app IDs (4.1=251110, 5=1039840, 6=2291060); the mock replays the
  // same shape. EDF 6.2 is not (yet) on Steam, so it is never auto-detected —
  // it stays manual in the picker.
  async detectGames() {
    if (API()?.detect_games) return API().detect_games();
    await new Promise((r) => setTimeout(r, 700));
    const base = "F:\\SteamLibrary\\steamapps\\common\\EARTH DEFENSE FORCE";
    return [
      { id: "edf6", working_dir: base + " 6", platform: "steam", installed: true },
      { id: "edf5", working_dir: base + " 5", platform: "steam", installed: true },
      { id: "edf41", working_dir: base + " 4.1", platform: "steam", installed: true },
    ];
  },
  async getActiveGame() {
    if (API()?.get_active_game) return API().get_active_game();
    return localStorage.getItem("mml-active-game") || null;
  },
  async setActiveGame(id) {
    if (API()?.set_active_game) return API().set_active_game(id);
    localStorage.setItem("mml-active-game", id);
  },
  // Real weapon-table save data: Mods/SaveData/edf6_weapons_slotNN.bin --
  // up to 4, one per in-game save slot (added 2026-09-25). Only one is
  // ever "the save you're playing", so which slot preflight's weapons-used
  // count reads from is its own persisted choice, same pattern as
  // active game above. See backend/preflight.py's list_weapon_slots.
  async getWeaponSlots() {
    if (API()?.get_weapon_slots) return API().get_weapon_slots();
    return [{ slot: "00", file: "edf6_weapons_slot00.bin", capacity: 8192, used: 1572, anomaly: false }];
  },
  async getActiveSaveSlot() {
    if (API()?.get_active_save_slot) return API().get_active_save_slot();
    return localStorage.getItem("mml-active-save-slot") || null;
  },
  async setActiveSaveSlot(slot) {
    if (API()?.set_active_save_slot) return API().set_active_save_slot(slot);
    localStorage.setItem("mml-active-save-slot", slot);
  },
  // Real backend: settings.py's SettingsManager (added 2026-09-24). Mocks
  // mirror the exact localStorage keys mmlPalette.jsx / mmlBgArt.js / Build.jsx
  // already read/write directly, so a browser preview and the real desktop
  // app end up at the same persisted values either way.
  async getPalette() {
    if (API()?.get_palette) return API().get_palette();
    return localStorage.getItem("mml-palette") || "khaki";
  },
  async setPalette(name) {
    if (API()?.set_palette) return API().set_palette(name);
    localStorage.setItem("mml-palette", name);
  },
  // Per-palette overrides (2026-09-24 redesign -- each of khaki/purple/green/
  // custom now keeps its own saved color overrides, confirmed with the user
  // rather than one shared override set). `mml-custom-colors` in
  // localStorage used to be a flat {cssVar: hex} dict meaning "the Custom
  // palette's colors"; `_migrateLegacyColors` upgrades that in place to
  // {paletteName: {cssVar: hex}} under "custom", mirroring settings.py's
  // own `_migrate_custom_colors` so a real already-saved mock/browser-preview
  // profile doesn't lose its colors either.
  //
  // --focus/--ink are real GLOBAL :root vars (not redefined per theme --
  // confirmed against index.css), so a second pass moves either of them out
  // of whichever bucket they're sitting in into a shared "global" bucket
  // that applies across every palette -- mirrors the same fix in
  // settings.py and mmlPalette.jsx. Both passes are idempotent.
  //
  // If two different buckets saved DIFFERENT values for the same var (a
  // real possibility, not hypothetical -- see settings.py's own docstring
  // for the exact case it was found in on the real device), the bucket
  // matching the currently active palette wins the plain key; any other
  // bucket's differing value is kept too, renamed `<var>#<bucket>`, rather
  // than silently dropped.
  _migrateLegacyColors(all) {
    if (!all || typeof all !== "object") all = {};
    let migrated = all;
    let changed = false;
    const isFlat = Object.values(migrated).some((v) => typeof v !== "object" || v === null);
    if (isFlat) { migrated = { custom: migrated }; changed = true; }
    let active;
    try { active = localStorage.getItem("mml-palette"); } catch (e) {}
    const names = Object.keys(migrated).filter((n) => n !== "global" && n !== active);
    const order = active && migrated[active] ? [active, ...names] : names;
    let globalBucket = null;
    for (const name of order) {
      const bucket = migrated[name];
      if (!bucket || typeof bucket !== "object") continue;
      for (const v of ["--focus", "--ink"]) {
        if (v in bucket) {
          if (!globalBucket) globalBucket = migrated.global || (migrated.global = {});
          if (!(v in globalBucket)) globalBucket[v] = bucket[v];
          else if (globalBucket[v] !== bucket[v]) globalBucket[`${v}#${name}`] = bucket[v];
          delete bucket[v];
          changed = true;
        }
      }
    }
    if (changed) localStorage.setItem("mml-custom-colors", JSON.stringify(migrated));
    return migrated;
  },
  async getCustomColors(palette) {
    if (API()?.get_custom_colors) return API().get_custom_colors(palette);
    let all = {};
    try { all = JSON.parse(localStorage.getItem("mml-custom-colors")) || {}; } catch (e) {}
    all = bridge._migrateLegacyColors(all);
    return all[palette] || {};
  },
  async setCustomColor(palette, varName, hex) {
    if (API()?.set_custom_color) return API().set_custom_color(palette, varName, hex);
    let all = {};
    try { all = JSON.parse(localStorage.getItem("mml-custom-colors")) || {}; } catch (e) {}
    all = bridge._migrateLegacyColors(all);
    all[palette] = { ...(all[palette] || {}), [varName]: hex };
    localStorage.setItem("mml-custom-colors", JSON.stringify(all));
  },
  async getBackgroundArt() {
    if (API()?.get_background_art) return API().get_background_art();
    try { return JSON.parse(localStorage.getItem("mml-bg-art")) || null; } catch (e) { return null; }
  },
  async setBackgroundArt(patch) {
    if (API()?.set_background_art) return API().set_background_art(patch);
    let art = {};
    try { art = JSON.parse(localStorage.getItem("mml-bg-art")) || {}; } catch (e) {}
    Object.assign(art, patch);
    localStorage.setItem("mml-bg-art", JSON.stringify(art));
  },
  async getBuildPrefs() {
    if (API()?.get_build_prefs) return API().get_build_prefs();
    try { return JSON.parse(localStorage.getItem("mml-build-prefs")) || null; } catch (e) { return null; }
  },
  async setBuildPrefs(patch) {
    if (API()?.set_build_prefs) return API().set_build_prefs(patch);
    let b = {};
    try { b = JSON.parse(localStorage.getItem("mml-build-prefs")) || {}; } catch (e) {}
    Object.assign(b, patch);
    localStorage.setItem("mml-build-prefs", JSON.stringify(b));
  },
  async getBuildPlan(type) {
    if (API()?.get_build_plan) return API().get_build_plan(type);
    const base = [
      { id: "order", label: "Load order", log: "Resolving plugin load order… 6 plugins", cls: "ok" },
      { id: "weapons", label: "Weapons", log: "Merging weapon tables… 1565 rows", cls: "ok" },
      { id: "missions", label: "Missions", log: "Merging mission packs… 4 packs", cls: "ok" },
      { id: "text", label: "Text maps", log: "Merging text maps… OK", cls: "ok" },
      { id: "conflicts", label: "Conflicts", log: "Resolving conflicts… 2 resolved", cls: "w" },
      { id: "bake", label: "Bake files", log: "Baking raw game files… done", cls: "ok" },
    ];
    return type === "ni" ? base : [...base, { id: "package", label: "Installer", log: "Packaging installer… mergcommand_installer.exe", cls: "ok" }];
  },
  async runBuild(type) {
    if (API()?.run_build) return API().run_build(type);
    await new Promise((r) => setTimeout(r, 600));
    return type === "ni"
      ? { text: "NI build complete — 1,565 weapons, 4 packs merged to NI folder.", cls: "ok" }
      : { text: "Installer packaged: mergcommand_installer.exe", cls: "ok" };
  },
  async run_build_async(kind) {
    if (API()?.run_build_async) return API().run_build_async(kind);
    startMockBuild(kind);
    return { started: true };
  },
  async get_build_status() {
    if (API()?.get_build_status) return API().get_build_status();
    return mockBuildStatus();
  },
  async runCommand(raw) {
    if (API()?.run_command) return API().run_command(raw);
    const c = raw.toLowerCase().trim();
    if (!c) return { text: "", cls: "d" };
    if (c === "help" || c === "h") return { text: "Commands: help | bg random | bg list | ni | plugins | build | fetch <code>", cls: "ok" };
    if (c === "bg random" || c === "bg r") return { text: "Random background set (demo).", cls: "ok" };
    if (c === "bg list") return { text: "Pool: 28 images (1 custom)", cls: "ok" };
    if (c.indexOf("bg ") === 0) return { text: "Background set: " + c.slice(3), cls: "ok" };
    if (c === "ni" || c === "no install") return { text: "NI request queued — open the Build menu.", cls: "ok" };
    if (c === "plugins") { const on = PLUGINS.filter((m) => m.enabled).length; return { text: `${on} of ${PLUGINS.length} plugins enabled.`, cls: "ok" }; }
    if (c === "build") return { text: "Use the Build menu for builds.", cls: "ok" };
    if (c === "debug_cmd") return { text: "demo: nothing to report", cls: "d" };
    if (/^[0-9a-f-]{36}$/.test(c)) return { text: "Request code accepted, fetching mod... (demo)", cls: "ok" };
    return { text: "Unknown command: " + raw + ". Try help", cls: "b" };
  },
};

// Every page still imports/uses `bridge` exactly as before -- this Proxy
// only inserts the `whenApiReady()` wait in front of each real method call,
// with zero change to any call site or to any individual method's own
// logic. Underscore-prefixed helpers (currently just _migrateLegacyColors,
// an internal sync helper `getCustomColors`/`setCustomColor` call directly,
// not a real bridge method) are passed through unwrapped so they keep
// their original synchronous return value.
export const bridge = new Proxy(_rawBridge, {
  get(target, prop, receiver) {
    const val = Reflect.get(target, prop, receiver);
    if (typeof val !== "function" || (typeof prop === "string" && prop.startsWith("_"))) return val;
    return async (...args) => {
      await whenApiReady();
      return val.apply(target, args);
    };
  },
});