// Abstraction over the pywebview JS bridge (window.pywebview.api).
// In the desktop app this delegates to the real Python 3.12.4 backend.
// In a plain browser preview it falls back to in-memory mock data so the
// whole GUI stays interactive.

const API = () =>
  typeof window !== "undefined" && window.pywebview && window.pywebview.api
    ? window.pywebview.api
    : null;

const clone = (x) => JSON.parse(JSON.stringify(x));

let MODS = [
  { id: "m1", name: "EDF5 Weapon Pack", category: "Weapons", enabled: true, order: 0, conflicts: [] },
  { id: "m2", name: "Lost Mission Pack", category: "Missions", enabled: true, order: 1, conflicts: ["Mission table overlap with Redux Overhaul"] },
  { id: "m3", name: "Redux Overhaul", category: "Core", enabled: true, order: 2, conflicts: ["Mission table overlap with Lost Mission Pack"] },
  { id: "m4", name: "Custom Text Edits", category: "Text", enabled: false, order: 3, conflicts: [] },
  { id: "m5", name: "Armor Skins", category: "Visual", enabled: true, order: 4, conflicts: [] },
  { id: "m6", name: "Balance Tweaks", category: "Core", enabled: false, order: 5, conflicts: [] },
];

let PROFILES = [
  { id: "p1", name: "core+lostmp", timestamp: Date.now() - 86400000, mods: MODS.filter((m) => m.enabled).map((m) => ({ ...m })) },
  { id: "p2", name: "vanilla+skins", timestamp: Date.now() - 2 * 86400000, mods: [{ ...MODS[0], enabled: true }, { ...MODS[4], enabled: true }] },
];

export const bridge = {
  async getPreflight() {
    if (API()?.get_preflight) return API().get_preflight();
    return {
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
        mods: { data: { on: MODS.filter((m) => m.enabled).length, total: MODS.length } },
        packs: { data: { total: 4 } },
        mode: { data: { ni_mode: "NI test, order by MOD NAME" } },
      },
    };
  },
  async getMods() {
    if (API()?.get_mods) return API().get_mods();
    return clone(MODS).sort((a, b) => a.order - b.order);
  },
  async toggleMod(id, enabled) {
    if (API()?.toggle_mod) return API().toggle_mod(id, enabled);
    const m = MODS.find((x) => x.id === id);
    if (m) m.enabled = enabled;
  },
  async setLoadOrder(ids) {
    if (API()?.set_load_order) return API().set_load_order(ids);
    ids.forEach((id, i) => { const m = MODS.find((x) => x.id === id); if (m) m.order = i; });
  },
  async getProfiles() {
    if (API()?.get_profiles) return API().get_profiles();
    return clone(PROFILES);
  },
  async saveProfile(name) {
    if (API()?.save_profile) return API().save_profile(name);
    const p = { id: "p" + Date.now(), name, timestamp: Date.now(), mods: MODS.map((m) => ({ ...m })) };
    PROFILES.unshift(p);
    return clone(p);
  },
  async loadProfile(id) {
    if (API()?.load_profile) return API().load_profile(id);
    const p = PROFILES.find((x) => x.id === id);
    if (p) p.mods.forEach((pm) => { const m = MODS.find((x) => x.name === pm.name); if (m) { m.enabled = pm.enabled; m.order = pm.order; } });
  },
  async exportProfile(id) {
    if (API()?.export_profile) return API().export_profile(id);
    return { text: (PROFILES.find((x) => x.id === id) || {}).name + ".mmlprofile" };
  },
  async deleteProfile(id) {
    if (API()?.delete_profile) return API().delete_profile(id);
    PROFILES = PROFILES.filter((x) => x.id !== id);
  },
  async runBuild(type) {
    if (API()?.run_build) return API().run_build(type);
    await new Promise((r) => setTimeout(r, 600));
    return type === "ni"
      ? { text: "NI build complete — 1,565 weapons, 4 packs merged to NI folder.", cls: "ok" }
      : { text: "Installer packaged: mergcommand_installer.exe", cls: "ok" };
  },
  async runCommand(raw) {
    if (API()?.run_command) return API().run_command(raw);
    const c = raw.toLowerCase().trim();
    if (!c) return { text: "", cls: "d" };
    if (c === "help" || c === "h") return { text: "Commands: help | bg random | bg list | ni | mods | build | fetch <code>", cls: "ok" };
    if (c === "bg random" || c === "bg r") return { text: "Random background set (demo).", cls: "ok" };
    if (c === "bg list") return { text: "Pool: 28 images (1 custom)", cls: "ok" };
    if (c.indexOf("bg ") === 0) return { text: "Background set: " + c.slice(3), cls: "ok" };
    if (c === "ni" || c === "no install") return { text: "NI request queued — open the Build menu.", cls: "ok" };
    if (c === "mods") { const on = MODS.filter((m) => m.enabled).length; return { text: `${on} of ${MODS.length} mods enabled.`, cls: "ok" }; }
    if (c === "build") return { text: "Use the Build menu for builds.", cls: "ok" };
    if (c === "debug_cmd") return { text: "demo: nothing to report", cls: "d" };
    if (/^[0-9a-f-]{36}$/.test(c)) return { text: "Request code accepted, fetching mod... (demo)", cls: "ok" };
    return { text: "Unknown command: " + raw + ". Try help", cls: "b" };
  },
};