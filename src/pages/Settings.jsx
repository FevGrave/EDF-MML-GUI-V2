import { useEffect, useState } from "react";
import { bridge } from "@/lib/mmlBridge";
import Panel from "@/components/mml/Panel";
import Toggle from "@/components/mml/Toggle";
import Pill from "@/components/mml/Pill";
import { useMmlPalette, CUSTOM_FIELDS } from "@/lib/mmlPalette";
import { useBgArt } from "@/lib/mmlBgArt";

const PALETTES = [["khaki", "#c9b98a"], ["purple", "#5b4056"], ["green", "#2fb070"]];
const PLATS = ["steam", "epic"];
const hexValid = (h) => /^#[0-9a-fA-F]{6}$/.test(h);

export default function Settings() {
  const { palette, setPalette, custom, setCustom } = useMmlPalette();
  const [art, setArt] = useBgArt();
  const [games, setGames] = useState([]);

  useEffect(() => { bridge.getGames().then(setGames); }, []);
  const setDir = (id, dir) => {
    bridge.setGameDir(id, dir);
    setGames((gs) => gs.map((g) => (g.id === id ? { ...g, working_dir: dir } : g)));
  };
  const setPlat = (id, platform) => {
    bridge.setGamePlatform(id, platform);
    setGames((gs) => gs.map((g) => (g.id === id ? { ...g, platform } : g)));
  };

  return (
    <Panel style={{ left: 620, top: 130, width: 1100, height: 830, padding: "10px 24px" }} title="Settings">
      <div style={{ display: "flex", gap: 28, marginTop: 14 }}>
        {/* left: palette + background art */}
        <div style={{ width: 480, flex: "none" }}>
          <div className="optrow"><span>Palette</span>
            <div className="seg">
              {PALETTES.map(([k, c]) => (
                <button key={k} className={`palbtn ${palette === k ? "on" : ""}`} onClick={() => setPalette(k)}>
                  <i style={{ background: c, width: 12, height: 12, display: "inline-block", marginRight: 8, border: "1px solid #ffffff66" }} />{k}
                </button>
              ))}
              <button className={`palbtn ${palette === "custom" ? "on" : ""}`} onClick={() => setPalette("custom")}>
                <i style={{ background: "linear-gradient(135deg,#ff6a5a,#5ad0ff,#5dff9a)", width: 12, height: 12, display: "inline-block", marginRight: 8, border: "1px solid #ffffff66" }} />custom
              </button>
            </div>
          </div>

          {palette === "custom" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 18px", marginTop: 10 }}>
              {CUSTOM_FIELDS.map(({ label, var: v, def }) => {
                const val = custom[v] && hexValid(custom[v]) ? custom[v] : def;
                return (
                  <div key={v} className="cfitem" style={{ height: 40, gap: 8 }}>
                    <input type="color" value={val} onChange={(e) => setCustom(v, e.target.value)}
                      style={{ width: 26, height: 26, padding: 0, border: "2px solid var(--frame2)", background: "transparent", cursor: "pointer" }} />
                    <span style={{ flex: 1, fontSize: 17 }}>{label}</span>
                    <input className="mmlin" style={{ width: 86, height: 28, fontSize: 14, padding: "0 6px" }} maxLength={7}
                      value={val.toUpperCase()} onChange={(e) => {
                        const h = e.target.value;
                        if (/^#[0-9a-fA-F]{0,6}$/.test(h)) setCustom(v, h);
                      }} />
                  </div>
                );
              })}
            </div>
          )}

          <div className="optrow"><span>Background art</span><Toggle on={art} onClick={() => setArt((v) => !v)} /></div>
          <p className="cfdesc" style={{ marginTop: 16 }}>Palette switches the HUD colour scheme — pick a preset or tune every colour with the Custom editor. Background art shows the character artwork on the Home screen. Changes apply instantly and are remembered on this machine.</p>
        </div>

        {/* right: game working directories */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: "4px 0 12px", font: "600 20px var(--font)", letterSpacing: ".12em", color: "#fff", borderBottom: "3px solid var(--line)", paddingBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Game working directories
            <Pill className="w">{games.filter((g) => g.working_dir).length}/{games.length} set</Pill>
          </h4>
          <div className="scroller" style={{ maxHeight: 660, border: "3px solid var(--frame2)", background: "rgba(0,0,0,.45)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.6)" }}>
            {games.map((g) => (
              <div key={g.id} style={{ padding: "12px 14px", borderBottom: "2px solid rgba(255,255,255,.12)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <b style={{ font: "600 22px var(--font)", letterSpacing: ".06em", color: "#fff", textShadow: "0 2px 0 #000" }}>{g.label}</b>
                  <span className={`pill ${g.installed ? "" : "mute"}`} style={{ fontSize: 13 }}>{g.installed ? "Installed" : "Not installed"}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select className="mmlsel" style={{ height: 30, fontSize: 14, padding: "0 8px", flex: "none" }}
                    value={g.platform || ""} onChange={(e) => setPlat(g.id, e.target.value || null)}>
                    <option value="">platform —</option>
                    {PLATS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input className="mmlin" style={{ height: 30, fontSize: 14, padding: "0 10px" }} maxLength={260}
                    placeholder="Game working directory…" value={g.working_dir || ""} onChange={(e) => setDir(g.id, e.target.value)} />
                </div>
              </div>
            ))}
          </div>
          <p className="cfdesc" style={{ marginTop: 10, fontSize: 16 }}>Store each install path now. EDF 4.1 and 5 get their own mppp/bin gun-save and HAKKEN logic later, after which each game can be modded independently from this list.</p>
        </div>
      </div>
    </Panel>
  );
}