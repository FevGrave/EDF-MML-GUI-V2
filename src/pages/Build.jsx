import { useState } from "react";
import { bridge } from "@/lib/mmlBridge";
import Panel from "@/components/mml/Panel";
import EdfProgress from "@/components/mml/EdfProgress";

export default function Build() {
  const [mode, setMode] = useState("installer");
  const [order, setOrder] = useState("MOD NAME");
  const [plan, setPlan] = useState([]);
  const [completed, setCompleted] = useState(0);
  const [log, setLog] = useState([{ t: "Ready. Choose a mode and press Build Tables.", c: "d" }]);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  const build = async () => {
    if (busy) return;
    setBusy(true); setOk(false); setCompleted(0);
    const steps = await bridge.getBuildPlan(mode);
    setPlan(steps);
    setLog((l) => [...l, { t: "> build tables (" + (mode === "ni" ? "NI test" : "installer") + ") — streaming AA-Log.txt", c: "d" }]);
    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 550));
      setLog((l) => [...l, { t: steps[i].log, c: steps[i].cls }]);
      setCompleted(i + 1);
    }
    const res = await bridge.runBuild(mode);
    setLog((l) => [...l, { t: res.text, c: res.cls }]);
    setBusy(false); setOk(true);
  };

  const active = busy ? completed : -1;
  const pct = plan.length ? (completed / plan.length) * 100 : 0;

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
        <p className="cfdesc" style={{ marginTop: 14 }}>Combines enabled plugins into raw game tables, bakes the merged files, and packages an installer — or drops a NI test build into the NI folder.</p>
        <div style={{ marginTop: 14 }}>
          <div className="mb big action" onClick={() => !busy && build()}><i className="body" /><i className="acc" /><i className="bev" /><i className="u1" /><i className="u2" /><span className="t">Build Tables</span></div>
        </div>
        <EdfProgress value={pct} active={busy} />
        <div className="edfsteps">
          {plan.map((s, i) => (
            <div key={s.id} className={`stp ${i < completed ? "done" : i === active ? "act" : ""}`}><i />{s.label}</div>
          ))}
        </div>
        <p className="cfdesc" style={{ marginTop: 16, color: busy ? "var(--warn)" : ok ? "var(--ok)" : "#a9a58f" }}>{busy ? "Building…" : ok ? "Build complete." : "Idle."}</p>
      </Panel>
      <Panel style={{ left: 1240, top: 130, width: 550, height: 830, padding: "10px 18px" }} title="Build Log" right={<span className="catsub">AA-Log.txt</span>}>
        <div className="buildlog" style={{ marginTop: 8 }}>
          {log.map((l, i) => <div key={i} className={l.c}>{l.t}</div>)}
        </div>
      </Panel>
    </>
  );
}