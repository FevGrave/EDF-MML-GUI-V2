import { useEffect, useState } from "react";
import { bridge } from "@/lib/mmlBridge";
import Panel from "@/components/mml/Panel";
import Toggle from "@/components/mml/Toggle";
import Pill from "@/components/mml/Pill";

const TYPE_BADGE = { dll: "DLL", txt: "TXT" };

export default function Plugins() {
  const [plugins, setPlugins] = useState([]);
  const [sel, setSel] = useState(null);

  const load = () => bridge.getPlugins().then((ps) => { setPlugins(ps); if (!sel && ps[0]) setSel(ps[0].id); });
  useEffect(() => { load(); }, []);

  const toggle = async (id, enabled) => { await bridge.togglePlugin(id, enabled); load(); };
  const uninstall = async (id) => { await bridge.uninstallPlugin(id); setSel(null); load(); };

  const selP = plugins.find((p) => p.id === sel);
  const folders = [];
  plugins.forEach((p) => { if (!folders.includes(p.folder)) folders.push(p.folder); });

  return (
    <>
      <Panel style={{ left: 620, top: 130, width: 760, height: 830, padding: "10px 20px" }} title="Plugins/Patches" right={<Pill className="w">{plugins.filter((p) => p.enabled).length} of {plugins.length} on</Pill>}>
        <div className="scroller" style={{ height: 720, marginTop: 8 }}>
          {folders.map((f) => (
            <div key={f}>
              <div className="folderhd">{f}</div>
              {plugins.filter((p) => p.folder === f).map((p) => (
                <div key={p.id} className={`modrow ${sel === p.id ? "sel" : ""}`} onClick={() => setSel(p.id)}>
                  <span className="ord">{TYPE_BADGE[p.type] || p.type}</span>
                  <div><b>{p.name}</b><span className="catsub">{p.category}</span></div>
                  <span className={`confbadge ${p.conflicts?.length ? "bad" : ""}`}>{p.conflicts?.length ? `${p.conflicts.length} conflict${p.conflicts.length > 1 ? "s" : ""}` : "OK"}</span>
                  <Toggle on={p.enabled} onClick={(e) => { e.stopPropagation(); toggle(p.id, !p.enabled); }} />
                  <button className="unbtn" title="Uninstall" onClick={(e) => { e.stopPropagation(); uninstall(p.id); }}>✕</button>
                </div>
              ))}
            </div>
          ))}
          {plugins.length === 0 && <p className="cfdesc" style={{ marginTop: 10 }}>No plugins loaded. Drop DLLs and txt patch files into your plugin folders, then refresh.</p>}
        </div>
      </Panel>
      <Panel style={{ left: 1400, top: 130, width: 390, height: 830, padding: "10px 18px" }} title="Plugin Detail">
        {selP ? (
          <div style={{ marginTop: 8 }}>
            <p className="cfn">{selP.name}</p>
            <div className="cfitem"><i className="dm" /> <span>Type: <b>{selP.type.toUpperCase()}</b> patch</span></div>
            <div className="cfitem"><i className="dm" /> <span>Folder: {selP.folder}</span></div>
            <div className="cfitem"><i className="dm" /> <span>Category: {selP.category}</span></div>
            <p className="cfdesc" style={{ marginTop: 12 }}>Conflicts</p>
            {selP.conflicts?.length ? (
              selP.conflicts.map((c, i) => <div key={i} className="cfitem"><i className="dm bad" /> <span>{c}</span></div>)
            ) : (
              <div className="cfitem"><i className="dm" /> <span>No conflicts detected.</span></div>
            )}
          </div>
        ) : <p className="cfdesc" style={{ marginTop: 8 }}>Select a plugin to inspect it.</p>}
      </Panel>
    </>
  );
}