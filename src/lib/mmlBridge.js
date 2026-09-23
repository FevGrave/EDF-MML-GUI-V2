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
    if (p) p.mods.forEach((pm) => { const m = PLUGINS.find((x) => x.name === pm.name); if (m) { m.enabled = pm.enabled; m.order = pm.order; } });
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