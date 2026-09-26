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
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const load = () => bridge.getPlugins().then((ps) => { setPlugins(ps); if (!sel && ps[0]) setSel(ps[0].id); });
  useEffect(() => { load(); }, []);
  useEffect(() => {
    setSaveMsg("");
    if (sel) {
      bridge.getPluginFile(sel).then((f) => { setFile(f); setContent(f?.content ?? ""); setDirty(false); });
    } else {
      setFile(null); setContent(""); setDirty(false);
    }
  }, [sel]);

  const toggle = async (id, enabled) => { await bridge.togglePlugin(id, enabled); load(); };
  const uninstall = async (id) => { await bridge.uninstallPlugin(id); setSel(null); load(); };

  const saveFile = async () => {
    if (!sel || !dirty || saving) return;
    setSaving(true);
    const r = await bridge.savePluginFile(sel, content);
    setSaving(false);
    if (r && r.ok === false) { setSaveMsg(r.error || "Save failed."); return; }
    setDirty(false);
    setSaveMsg("Saved.");
  };

  const selP = plugins.find((p) => p.id === sel);
  const folders = [];
  plugins.forEach((p) => { if (!folders.includes(p.folder)) folders.push(p.folder); });

  return (
    <>
      <Panel style={{ left: 620, top: 130, width: 600, height: 830, padding: "10px 20px", display: "flex", flexDirection: "column" }} title="Plugins/Patches" right={<Pill className="w">{plugins.filter((p) => p.enabled).length} of {plugins.length} on</Pill>}>
        {/* Real gap fixed (2026-09-25): this was a hardcoded height:720, which didn't
            actually match the Panel's real available height (830 minus its padding and
            title bar), leaving ~30-40px of dead space below the list. flex:1 + minHeight:0
            makes it absorb exactly whatever space the title bar leaves, so it stays correct
            even if the Panel's own height ever changes -- no magic number to re-tune. */}
        <div className="scroller" style={{ flex: 1, minHeight: 0, marginTop: 8 }}>
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
      <Panel style={{ left: 1240, top: 130, width: 550, height: 395, padding: "10px 18px" }} title="Plugin Detail">
        {selP ? (
          <div className="scroller" style={{ maxHeight: 320, marginTop: 8 }}>
            <p className="cfn" style={{ width: "32ch" }}><ScrollText><b>{selP.name}</b></ScrollText></p>
            <div className="cfitem"><i className="dm" /> <span>Type: <b>{selP.type.toUpperCase()}</b> patch</span></div>
            <div className="cfitem"><i className="dm" /> <span>Folder: {selP.folder}</span></div>
            <div className="cfitem"><i className="dm" /> <span>Category: {selP.category}</span></div>
            <p className="cfdesc" style={{ marginTop: 12 }}>Conflicts</p>
            {selP.conflicts?.length ? (
              selP.conflicts.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "2px solid rgba(255,255,255,.1)", font: "500 17px/1.4 var(--font)", color: "#fff" }}>
                  <i className="dm bad" style={{ marginTop: 5, flexShrink: 0 }} />
                  <span>{c}</span>
                </div>
              ))
            ) : (
              <div className="cfitem"><i className="dm" /> <span>No conflicts detected.</span></div>
            )}
          </div>
        ) : <p className="cfdesc" style={{ marginTop: 8 }}>Select a plugin to inspect it.</p>}
      </Panel>
      <Panel style={{ left: 1240, top: 540, width: 550, height: 420, padding: "10px 18px" }} title="File Contents" right={file?.editable ? <span className="chip" style={{ margin: 0 }}>{file.ext.toUpperCase()}</span> : null}>
        {file ? (
          file.editable === false ? (
            <p className="cfdesc" style={{ marginTop: 8 }}>{file.note || "This file can't be edited here."}</p>
          ) : (
            <div style={{ marginTop: 8 }}>
              {/* Real placement fix (2026-09-25): the "Saved."/error message used to sit
                  on its own line below the textarea, disconnected from the filename it's
                  actually reporting on -- easy to miss once the textarea scrolls. Moved
                  inline next to the filename in the header row instead, per the user's
                  request. */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 10 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={{ font: "600 16px var(--font)", color: "var(--focus2)", letterSpacing: ".06em" }}>{file.name}</span>
                  {saveMsg && <span className="catsub" style={{ color: saveMsg === "Saved." ? "var(--ok)" : "var(--bad)" }}>{saveMsg}</span>}
                </span>
                <button className="palbtn" style={{ padding: "3px 14px", fontSize: 13, opacity: (!dirty || saving) ? .5 : 1, flexShrink: 0 }} disabled={!dirty || saving} onClick={saveFile}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
              {file.note && <p className="cfdesc" style={{ margin: "0 0 6px" }}>{file.note}</p>}
              <textarea
                value={content}
                onChange={(e) => { setContent(e.target.value); setDirty(true); setSaveMsg(""); }}
                spellCheck={false}
                style={{ width: "100%", height: 300, boxSizing: "border-box", resize: "none", background: "rgba(0,0,0,.5)", border: "2px solid var(--frame2)", padding: 10, font: "15px/1.5 var(--mono)", color: "#cfe", whiteSpace: "pre", overflow: "auto" }}
              />
            </div>
          )
        ) : <p className="cfdesc" style={{ marginTop: 8 }}>Select a plugin to view its file contents.</p>}
      </Panel>
    </>
  );
}