import { useEffect, useState } from "react";
import { bridge } from "@/lib/mmlBridge";
import Panel from "@/components/mml/Panel";
import Pill from "@/components/mml/Pill";
import Toggle from "@/components/mml/Toggle";
import DualAction from "@/components/mml/DualAction";
import ScrollText from "@/components/mml/ScrollText";

export default function Profiles() {
  const [profiles, setProfiles] = useState([]);
  const [sel, setSel] = useState(null);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => bridge.getProfiles().then((ps) => { setProfiles(ps); if (!sel && ps[0]) setSel(ps[0].id); });
  useEffect(() => { load(); }, []);

  const selP = profiles.find((p) => p.id === sel);
  const save = async () => { if (!name.trim()) return; await bridge.saveProfile(name.trim()); setName(""); setMsg("Profile saved."); load(); };
  const loadP = async () => { if (!selP) return; await bridge.loadProfile(selP.id); setMsg('Profile "' + selP.name + '" loaded.'); };
  const exp = async () => { if (!selP) return; const r = await bridge.exportProfile(selP.id); setMsg("Exported: " + r.text); };
  const del = async () => { if (!selP) return; await bridge.deleteProfile(selP.id); setMsg("Profile deleted."); setSel(null); load(); };

  const toggleMod = async (m, enabled) => {
    if (!selP) return;
    await bridge.toggleModConfig(selP.id, m.id, enabled);
    load();
  };
  const uninstallMod = async (m) => {
    if (!selP) return;
    await bridge.uninstallModConfig(selP.id, m.id);
    setMsg("Uninstalled " + m.name + " — files listed in its config were removed.");
    load();
  };
  const moveMod = async (fromIdx, toIdx) => {
    if (!selP) return;
    await bridge.moveModConfig(selP.id, fromIdx, toIdx);
    load();
  };

  return (
    <>
      <Panel style={{ left: 620, top: 130, width: 560, height: 830, padding: "10px 20px", display: "flex", flexDirection: "column" }} title="Profiles" right={<Pill className="w">{profiles.length} saved</Pill>}>
        <div className="scroller" style={{ flex: 1, minHeight: 0, marginTop: 8, border: "3px solid var(--frame2)", background: "rgba(0,0,0,.45)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.6)" }}>
          {profiles.map((p) => (
            <div key={p.id} className={`modrow ${sel === p.id ? "sel" : ""}`} onClick={() => setSel(p.id)}>
              <span className="ord">◈</span>
              <div><b>{p.name}</b><span className="catsub">{new Date(p.timestamp).toLocaleString()}</span></div>
              <span className="catsub">{p.mods?.length || 0} mods</span>
              <span /><span />
            </div>
          ))}
          {profiles.length === 0 && <p className="cfdesc" style={{ marginTop: 10 }}>No profiles yet. Name it below and press Save.</p>}
        </div>
        <input className="mmlin" maxLength={32} style={{ marginTop: 12, width: "100%", height: 30, padding: "0 10px", fontSize: 15, lineHeight: "30px" }} value={name} onChange={(e) => setName(e.target.value)} placeholder="New profile name" />
        <DualAction items={[
          { label: "Save", onClick: save },
          { label: "Load", onClick: loadP },
        ]} />
      </Panel>

      <Panel style={{ left: 1200, top: 130, width: 590, height: 830, padding: "10px 18px", display: "flex", flexDirection: "column" }} title="Mod Config Data" right={<Pill className="w">{selP?.mods?.length || 0} files</Pill>}>
        {selP ? (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, marginTop: 8 }}>
            <p className="cfn">{selP.name}</p>
            <p className="catsub" style={{ display: "block", margin: "0 0 8px" }}>{new Date(selP.timestamp).toLocaleString()}</p>
            <div className="scroller" style={{ flex: 1, minHeight: 0, border: "3px solid var(--frame2)", background: "rgba(0,0,0,.45)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.6)" }}>
              {selP.mods?.map((m, i) => {
                const last = (selP.mods?.length || 0) - 1;
                return (
                <div key={m.id || i} className="modrow" style={{ cursor: "default", gridTemplateColumns: "48px minmax(0,1fr) auto auto auto" }}>
                  <input
                    key={`${m.id}-${i}`}
                    className="ordin"
                    type="number"
                    min={1}
                    defaultValue={i + 1}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= 1 && v <= (selP.mods?.length || 0) && v - 1 !== i) {
                        moveMod(i, v - 1);
                      }
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                  />
                  <div style={{ minWidth: 0, overflow: "hidden" }}>
                    <ScrollText><b>{m.name}</b></ScrollText>
                    <span className="catsub">{m.category}</span>
                  </div>
                  <div className="ordbtns">
                    <button onClick={(e) => { e.stopPropagation(); moveMod(i, i - 1); }} disabled={i === 0} style={i === 0 ? { opacity: .3, cursor: "default" } : undefined}>▲</button>
                    <button onClick={(e) => { e.stopPropagation(); moveMod(i, i + 1); }} disabled={i === last} style={i === last ? { opacity: .3, cursor: "default" } : undefined}>▼</button>
                  </div>
                  <Toggle on={m.enabled} onClick={(e) => { e.stopPropagation(); toggleMod(m, !m.enabled); }} />
                  <button className="unbtn" title="Uninstall" onClick={(e) => { e.stopPropagation(); uninstallMod(m); }}>✕</button>
                </div>
                );
              })}
            </div>
            <DualAction items={[
              { label: "Export", onClick: exp },
              { label: "Delete", onClick: del },
            ]} />
          </div>
        ) : <p className="cfdesc" style={{ marginTop: 8 }}>Select or save a profile.</p>}
        {msg && <p className="cfdesc" style={{ marginTop: 12, color: "var(--ok)" }}>{msg}</p>}
      </Panel>
    </>
  );
}