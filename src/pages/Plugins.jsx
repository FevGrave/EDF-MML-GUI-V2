import { useEffect, useState } from "react";
import { bridge } from "@/lib/mmlBridge";
import Panel from "@/components/mml/Panel";
import Toggle from "@/components/mml/Toggle";
import Pill from "@/components/mml/Pill";
import ScrollText from "@/components/mml/ScrollText";

const TYPE_BADGE = { dll: "DLL", txt: "TXT" };

export default function Plugins() {
  const [plugins, setPlugins] = useState([]);
  const [sel, setSel] = useState(null);
  const [file, setFile] = useState(null);

  const load = () => bridge.getPlugins().then((ps) => { setPlugins(ps); if (!sel && ps[0]) setSel(ps[0].id); });
  useEffect(() => { load(); }, []);
  useEffect(() => { if (sel) bridge.getPluginFile(sel).then(setFile); else setFile(null); }, [sel]);

  const toggle = async (id, enabled) => { await bridge.togglePlugin(id, enabled); load(); };
  const uninstall = async (id) => { await bridge.uninstallPlugin(id); setSel(null); load(); };

  const selP = plugins.find((p) => p.id === sel);
  const folders = [];
  plugins.forEach((p) => { if (!folders.includes(p.folder)) folders.push(p.folder); });

  return (
    <>
      <Panel style={{ left: 620, top: 130, width: 600, height: 830, padding: "10px 20px" }} title="Plugins/Patches" right={<Pill className="w">{plugins.filter((p) => p.enabled).length} of {plugins.length} on</Pill>}>
        <div className="scroller" style={{ height: 720, marginTop: 8 }}>
          {folders.map((f) => (
            <div key={f}>
              <div className="folderhd">{f}</div>
              {plugins.filter((p) => p.folder === f).map((p) => (
                <div key={p.id} className={`modrow ${sel === p.id ? "sel" : ""}`} onClick={() => setSel(p.id)}>
                  <span className="ord">{TYPE_BADGE[p.type] || p.type}</span>
                  <div style={{ minWidth: 0, overflow: "hidden" }}><ScrollText><b>{p.name}</b></ScrollText><span className="catsub">{p.category}</span></div>
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
      <Panel style={{ left: 1240, top: 130, width: 540, height: 395, padding: "10px 18px" }} title="Plugin Detail">
        {selP ? (
          <div className="scroller" style={{ maxHeight: 320, marginTop: 8 }}>
            <p className="cfn" style={{ width: "32ch" }}><ScrollText><b>{selP.name}</b></ScrollText></p>
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
      <Panel style={{ left: 1240, top: 540, width: 540, height: 420, padding: "10px 18px" }} title="File Contents" right={file ? <span className="chip" style={{ margin: 0 }}>{file.ext.toUpperCase()}</span> : null}>
        {file ? (
          <div className="scroller" style={{ height: 340, marginTop: 8, background: "rgba(0,0,0,.5)", border: "2px solid var(--frame2)", padding: 10 }}>
            <div style={{ font: "600 16px var(--font)", color: "var(--focus2)", marginBottom: 6, letterSpacing: ".06em" }}>{file.name}</div>
            <pre style={{ margin: 0, font: "15px/1.5 var(--mono)", color: "#cfe", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{file.content}</pre>
          </div>
        ) : <p className="cfdesc" style={{ marginTop: 8 }}>Select a plugin to view its file contents.</p>}
      </Panel>
    </>
  );
}