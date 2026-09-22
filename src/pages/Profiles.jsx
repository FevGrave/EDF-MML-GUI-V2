import { useEffect, useState } from "react";
import { bridge } from "@/lib/mmlBridge";
import Panel from "@/components/mml/Panel";
import Pill from "@/components/mml/Pill";

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
  const del = async () => { if (!selP) return; await bridge.deleteProfile(selP.id); setMsg("Profile deleted."); load(); };

  return (
    <>
      <Panel style={{ left: 690, top: 130, width: 560, height: 830, padding: "10px 20px" }} title="Profiles" right={<Pill className="w">{profiles.length} saved</Pill>}>
        <div className="scroller" style={{ height: 560, marginTop: 8 }}>
          {profiles.map((p) => (
            <div key={p.id} className={`modrow ${sel === p.id ? "sel" : ""}`} onClick={() => setSel(p.id)}>
              <span className="ord">◈</span>
              <div><b>{p.name}</b><span className="catsub">{new Date(p.timestamp).toLocaleString()}</span></div>
              <span className="catsub">{p.mods?.length || 0} mods</span>
              <span /><span />
            </div>
          ))}
          {profiles.length === 0 && <p className="cfdesc" style={{ marginTop: 10 }}>No profiles yet. Save your current setup below.</p>}
        </div>
        <div className="savebar">
          <input className="mmlin" value={name} onChange={(e) => setName(e.target.value)} placeholder="Profile name" />
          <div className="mb big action" style={{ width: 140 }} onClick={save}><i className="body" /><i className="acc" /><i className="bev" /><i className="u1" /><i className="u2" /><span className="t">Save</span></div>
        </div>
      </Panel>
      <Panel style={{ left: 1270, top: 130, width: 590, height: 830, padding: "10px 18px" }} title="Profile Detail">
        {selP ? (
          <div style={{ marginTop: 8 }}>
            <p className="cfn">{selP.name}</p>
            <p className="catsub" style={{ display: "block", margin: "0 0 8px" }}>{new Date(selP.timestamp).toLocaleString()}</p>
            <div className="scroller" style={{ height: 520 }}>
              {selP.mods?.map((m, i) => (
                <div key={i} className="modrow">
                  <span className="ord">{i + 1}</span>
                  <div><b>{m.name}</b><span className="catsub">{m.category}</span></div>
                  <span /><Pill className={m.enabled ? "" : "mute"}>{m.enabled ? "on" : "off"}</Pill><span />
                </div>
              ))}
            </div>
            <div className="actrow">
              <div className="mb big action" style={{ width: 130 }} onClick={loadP}><i className="body" /><i className="acc" /><i className="bev" /><i className="u1" /><i className="u2" /><span className="t">Load</span></div>
              <div className="mb big action" style={{ width: 150 }} onClick={exp}><i className="body" /><i className="acc" /><i className="bev" /><i className="u1" /><i className="u2" /><span className="t">Export</span></div>
              <div className="mb big action" style={{ width: 150 }} onClick={del}><i className="body" /><i className="acc" /><i className="bev" /><i className="u1" /><i className="u2" /><span className="t">Delete</span></div>
            </div>
          </div>
        ) : <p className="cfdesc" style={{ marginTop: 8 }}>Select or save a profile.</p>}
        {msg && <p className="cfdesc" style={{ marginTop: 12, color: "var(--ok)" }}>{msg}</p>}
      </Panel>
    </>
  );
}