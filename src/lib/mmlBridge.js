// Abstraction over the pywebview JS bridge (window.pywebview.api).
// In the desktop app this delegates to the real Python 3.12.4 backend.
// In a plain browser preview it falls back to in-memory mock data so the
// whole GUI stays interactive.

const API = () =>
  typeof window !== "undefined" && window.pywebview && window.pywebview.api
    ? window.pywebview.api
    : null;

const clone = (x) => JSON.parse(JSON.stringify(x));

let PLUGINS = [
  { id: "p1", name: "edf5_native_fix.dll", type: "dll", folder: "native", category: "Native", enabled: true, order: 0, conflicts: [] },
  { id: "p2", name: "modern_camera.dll", type: "dll", folder: "camera", category: "Camera", enabled: true, order: 1, conflicts: [] },
  { id: "p3", name: "input_remap.txt", type: "txt", folder: "PatchKeys", category: "Input", enabled: true, order: 2, conflicts: [] },
  { id: "p4", name: "alpha_balance.txt", type: "txt", folder: "PatchTables", category: "Balance", enabled: false, order: 3, conflicts: ["Overwrites weapon table rows also patched by redux_overhaul"] },
  { id: "p5", name: "redux_overhaul.txt", type: "txt", folder: "PatchTables", category: "Core", enabled: true, order: 4, conflicts: ["Overwrites weapon table rows also patched by alpha_balance"] },
  { id: "p6", name: "armor_skins.txt", type: "txt", folder: "Visual", category: "Visual", enabled: true, order: 5, conflicts: [] },
];

let PROFILES = [
  { id: "p1", name: "core+lostmp", timestamp: Date.now() - 86400000, mods: PLUGINS.filter((m) => m.enabled).map((m) => ({ ...m })) },
  { id: "p2", name: "vanilla+skins", timestamp: Date.now() - 2 * 86400000, mods: [{ ...PLUGINS[0], enabled: true }, { ...PLUGINS[5], enabled: true }] },
];

let LOADED_PROFILE = (PROFILES[0] && PROFILES[0].name) || "—";

// Real ConfigBuildAll.py pipeline stages. NI Test and Installer each run 9
// stages — a different 9. `match` is the exact substring ConfigBuildAll.py
// prints to AA-Log.txt for that stage; the Build page lights its pill when the
// substring appears in the streamed log. The Missions stage (NI only) blocks on
// a separate GamemodeConfig popup, so it gets a distinct "waiting for input"
// state instead of a spinner. (A "Compress Files" stage exists in source but is
// disabled/commented out in both modes, so it is not listed.)
const STAGES_NI = [
  { id: "replace", label: "Data replacement", match: "Replacing data strings..." },
  { id: "yoink", label: "Yoink configs", match: "Yoinking non-additive configs..." },
  { id: "config", label: "Build config", match: "Building config..." },
  { id: "missions", label: "Mission packs", match: "EDIT what mission pack this player wants...", waitForInput: true },
  { id: "text", label: "Text tables", match: "Processing text tables..." },
  { id: "subs", label: "Subtitles", match: "Processing subtitles..." },
  { id: "weapons", label: "Weapon data", match: "Appending weapon data..." },
  { id: "culldlc", label: "Cull DLC weapons", match: "Culling DLC weapon tables..." },
  { id: "cullmod", label: "Cull modded weapons", match: "Culling modded weapon tables..." },
];
const STAGES_INSTALLER = [
  { id: "replace", label: "Data replacement", match: "Replacing data strings..." },
  { id: "yoink", label: "Yoink configs", match: "Yoinking non-additive configs..." },
  { id: "config", label: "Build config", match: "Building config..." },
  { id: "text", label: "Text tables", match: "Processing text tables..." },
  { id: "subs", label: "Subtitles", match: "Processing subtitles..." },
  { id: "weapons", label: "Weapon data", match: "Appending weapon data..." },
  { id: "sgo", label: "SGO conversion", match: "Converting to SGO via sgott.exe..." },
  { id: "rename", label: "Rename tables", match: "Renaming converted text-table files..." },
  { id: "move", label: "Move to Mods/", match: "Moving files into Mods/ install locations..." },
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

export const bridge = {
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