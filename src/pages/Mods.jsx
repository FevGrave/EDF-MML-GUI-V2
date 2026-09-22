import { useEffect, useState } from "react";
import { bridge } from "@/lib/mmlBridge";
import Panel from "@/components/mml/Panel";
import Toggle from "@/components/mml/Toggle";
import Pill from "@/components/mml/Pill";

export default function Mods() {
  const [mods, setMods] = useState([]);
  const [sel, setSel] = useState(null);

  const load = () => bridge.getMods().then((m) => { setMods(m); if (!sel && m[0]) setSel(m[0].id); });
  useEffect(() => { load(); }, []);

  const toggle = async (id, enabled) => { await bridge.toggleMod(id, enabled); load(); };
  const move = async (id, dir) => {
    const ids = mods.map((m) => m.id);
    const i = ids.indexOf(id), j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await bridge.setLoadOrder(ids);
    load();
  };

  const sorted = [...mods].sort((a, b) => a.order - b.order);
  const selMod = mods.find((m) => m.id === sel);

  return (
    <>
      <Panel style={{ left: 620, top: 130, width: 760, height: 830, padding: "10px 20px" }} title="Mods" right={<Pill className="w">{mods.filter((m) => m.enabled).length} of {mods.length} on</Pill>}>
        <div className="scroller" style={{ height: 720, marginTop: 8 }}>
          {sorted.map((m, i) => (
            <div key={m.id} className={`modrow ${sel === m.id ? "sel" : ""}`} onClick={() => setSel(m.id)}>
              <span className="ord">{String(i + 1).padStart(2, "0")}</span>
              <div><b>{m.name}</b><span className="catsub">{m.category}</span></div>
              <span className={`confbadge ${m.conflicts?.length ? "bad" : ""}`}>{m.conflicts?.length ? `${m.conflicts.length} conflict${m.conflicts.length > 1 ? "s" : ""}` : "OK"}</span>
              <Toggle on={m.enabled} onClick={(e) => { e.stopPropagation(); toggle(m.id, !m.enabled); }} />
              <div className="ordbtns">
                <button onClick={(e) => { e.stopPropagation(); move(m.id, -1); }}>▲</button>
                <button onClick={(e) => { e.stopPropagation(); move(m.id, 1); }}>▼</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel style={{ left: 1400, top: 130, width: 390, height: 830, padding: "10px 18px" }} title="Conflicts">
        {selMod ? (
          <div style={{ marginTop: 8 }}>
            <p className="cfn">{selMod.name}</p>
            {selMod.conflicts?.length ? (
              selMod.conflicts.map((c, i) => <div key={i} className="cfitem"><i className="dm bad" /> <span>{c}</span></div>)
            ) : (
              <div className="cfitem"><i className="dm" /> <span>No conflicts detected.</span></div>
            )}
            <p className="cfdesc" style={{ marginTop: 14 }}>Load order matters: later mods override earlier ones for shared tables. Use ▲▼ to reorder.</p>
          </div>
        ) : <p className="cfdesc" style={{ marginTop: 8 }}>Select a mod to inspect its conflict report.</p>}
      </Panel>
    </>
  );
}