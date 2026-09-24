import { useEffect, useState } from "react";
import { bridge } from "@/lib/mmlBridge";
import Panel from "@/components/mml/Panel";
import Pill from "@/components/mml/Pill";
import ColorField from "@/components/mml/ColorField";
import { useMmlPalette, CUSTOM_FIELDS } from "@/lib/mmlPalette";
import { useBgArt } from "@/lib/mmlBgArt";

const PALETTES = [["khaki", "#c9b98a"], ["purple", "#5b4056"], ["green", "#2fb070"]];
const ART_MODES = [["all", "All"], ["modded", "Modded"], ["mml", "MML"], ["none", "None"]];
const PLATS = ["steam", "epic"];

export default function Settings() {
  const { palette, setPalette, custom, setCustom } = useMmlPalette();
  const [art, setArt] = useBgArt();
  const [games, setGames] = useState([]);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => { bridge.getGames().then(setGames); }, []);
  const detect = async () => {
    setDetecting(true);
    try {
      const found = await bridge.detectGames();
      setGames((gs) => gs.map((g) => {
        const d = found.find((x) => x.id === g.id);
        if (!d) return g;
        bridge.updateGame(g.id, { working_dir: d.working_dir, platform: d.platform, installed: true });
        return { ...g, working_dir: d.working_dir, platform: d.platform, installed: true };
      }));
    } finally { setDetecting(false); }
  };
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
          <div style={{ font: "600 24px var(--font)", letterSpacing: ".08em", color: "#fff", marginBottom: 8 }}>Palette</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
            {PALETTES.map(([k, c]) => (
              <button key={k} className={`palbtn ${palette === k ? "on" : ""}`} onClick={() => setPalette(k)}>
                <i style={{ background: c, width: 14, height: 14, display: "inline-block", marginRight: 10, border: "1px solid #ffffff66" }} />{k}
              </button>
            ))}
            <button className={`palbtn ${palette === "custom" ? "on" : ""}`} onClick={() => setPalette("custom")}>
              <i style={{ background: "linear-gradient(135deg,#ff6a5a,#5ad0ff,#5dff9a)", width: 14, height: 14, display: "inline-block", marginRight: 10, border: "1px solid #ffffff66" }} />custom
            </button>
          </div>

          {palette === "custom" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 18px", marginTop: 10 }}>
              {CUSTOM_FIELDS.map(({ label, var: v, def }) => (
                <ColorField key={v} label={label} value={custom[v]} def={def} onChange={(hex) => setCustom(v, hex)} />
              ))}
            </div>
          )}

          <div className="optrow" style={{ marginTop: 8 }}><span>Background art</span>
            <div className="seg">
              {ART_MODES.map(([m, lbl]) => (
                <button key={m} className={`palbtn ${art.mode === m ? "on" : ""}`} onClick={() => setArt({ mode: m })}>{lbl}</button>
              ))}
            </div>
          </div>
          {art.mode !== "none" && (
            <div className="optrow" style={{ height: "auto", padding: "8px 0", flexWrap: "wrap" }}><span>Auto-advance</span>
              <div className="seg">
                <button className={`palbtn ${art.auto ? "on" : ""}`} onClick={() => setArt({ auto: !art.auto })}>{art.auto ? "On" : "Off"}</button>
                <select className="mmlsel" style={{ height: 34, fontSize: 14, padding: "0 8px" }} value={art.pick} onChange={(e) => setArt({ pick: e.target.value })}>
                  <option value="next">Next in line</option>
                  <option value="random">Random pick</option>
                </select>
                <span style={{ font: "500 16px var(--mono)", color: "#cfd", display: "flex", alignItems: "center", gap: 6, padding: "0 8px" }}>every
                  <input type="number" min={2} max={120} className="mmlin" style={{ width: 56, height: 30, fontSize: 14, textAlign: "center", padding: "0 4px" }} value={art.interval} onChange={(e) => setArt({ interval: Math.max(2, Math.min(120, parseInt(e.target.value, 10) || 8)) })} />s
                </span>
              </div>
            </div>
          )}
          <p className="cfdesc" style={{ marginTop: 16 }}>Palette switches the HUD colour scheme — pick a preset or tune every colour with the Custom editor. Background art chooses what shows on the Home screen (all / modded / MML / none); auto-advance cycles images every few seconds, in order or at random.</p>
        </div>

        {/* right: game working directories */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: "4px 0 12px", font: "600 20px var(--font)", letterSpacing: ".12em", color: "#fff", borderBottom: "3px solid var(--line)", paddingBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Game working directories
            <Pill className="w">{games.filter((g) => g.working_dir).length}/{games.length} set</Pill>
          </h4>
          <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button className="palbtn" style={{ padding: "8px 12px" }} onClick={detect} disabled={detecting}>{detecting ? "Detecting…" : "Auto-detect (Steam)"}</button>
            <span className="cfdesc" style={{ fontSize: 15 }}>Scans your Steam library and fills in every detected EDF install.</span>
          </div>
          <div className="scroller" style={{ maxHeight: 620, border: "3px solid var(--frame2)", background: "rgba(0,0,0,.45)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.6)" }}>
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