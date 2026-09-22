import { useState } from "react";
import { bridge } from "@/lib/mmlBridge";
import Panel from "@/components/mml/Panel";

export default function Build() {
  const [mode, setMode] = useState("ni");
  const [order, setOrder] = useState("MOD NAME");
  const [log, setLog] = useState([{ t: "Ready. Select a build type and press Build.", c: "d" }]);
  const [busy, setBusy] = useState(false);

  const run = async (type) => {
    setBusy(true);
    setLog((l) => [...l, { t: "> build " + (type === "ni" ? "NI test" : "installer"), c: "d" }]);
    const res = await bridge.runBuild(type);
    setLog((l) => [...l, { t: res.text, c: res.cls }]);
    setBusy(false);
  };

  return (
    <>
      <Panel style={{ left: 620, top: 130, width: 600, height: 830, padding: "10px 20px" }} title="Build">
        <div className="optrow"><span>Mode</span>
          <div className="seg">
            <button className={mode === "ni" ? "on" : ""} onClick={() => setMode("ni")}>NI Test</button>
            <button className={mode === "installer" ? "on" : ""} onClick={() => setMode("installer")}>Installer</button>
          </div>
        </div>
        <div className="optrow"><span>Order by</span>
          <select className="mmlsel" value={order} onChange={(e) => setOrder(e.target.value)}>
            <option>MOD NAME</option><option>LOAD ORDER</option><option>CATEGORY</option>
          </select>
        </div>
        <p className="cfdesc" style={{ marginTop: 16 }}>NI Test builds merged tables to the NI folder without installing — safe to test. Installer packages a deployable build.</p>
        <div style={{ marginTop: 24 }}>
          <div className="mb big action" onClick={() => !busy && mode === "ni" && run("ni")}><i className="body" /><i className="acc" /><i className="bev" /><i className="u1" /><i className="u2" /><span className="t">Build NI Test</span></div>
          <div className="mb big action" onClick={() => !busy && mode === "installer" && run("installer")}><i className="body" /><i className="acc" /><i className="bev" /><i className="u1" /><i className="u2" /><span className="t">Build Installer</span></div>
        </div>
        <p className="cfdesc" style={{ marginTop: 18, color: busy ? "var(--warn)" : "var(--ok)" }}>{busy ? "Building…" : "Idle."}</p>
      </Panel>
      <Panel style={{ left: 1240, top: 130, width: 550, height: 830, padding: "10px 18px" }} title="Build Log">
        <div className="buildlog" style={{ marginTop: 8 }}>
          {log.map((l, i) => <div key={i} className={l.c}>{l.t}</div>)}
        </div>
      </Panel>
    </>
  );
}