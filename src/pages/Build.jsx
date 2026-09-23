import { useState, useRef, useEffect } from "react";
import { bridge, buildStages } from "@/lib/mmlBridge";
import Panel from "@/components/mml/Panel";
import EdfProgress from "@/components/mml/EdfProgress";

export default function Build() {
  const [mode, setMode] = useState("installer");
  const [order, setOrder] = useState("MOD NAME");
  const [stages, setStages] = useState([]);
  const [done, setDone] = useState([]);
  const [waiting, setWaiting] = useState(false);
  const [log, setLog] = useState("Ready. Choose a mode and press Build Tables.");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const build = async () => {
    if (busy) return;
    const s = buildStages(mode);
    setStages(s);
    setDone(new Array(s.length).fill(false));
    setWaiting(false);
    setOk(false);
    setBusy(true);
    setLog("> build tables (" + (mode === "ni" ? "NI test" : "installer") + ") — streaming AA-Log.txt");
    await bridge.run_build_async(mode);
    timerRef.current = setInterval(async () => {
      const st = await bridge.get_build_status();
      const lt = st.log || "";
      setLog(lt);
      setDone(s.map((sg) => lt.includes(sg.match)));
      setWaiting(!!st.waiting);
      if (st.finished) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setBusy(false);
        setOk(!!st.ok);
        setWaiting(false);
      }
    }, 400);
  };

  const activeIdx = done.findIndex((d) => !d);
  const doneCount = done.filter(Boolean).length;
  const pct = stages.length ? (doneCount / stages.length) * 100 : 0;
  const statusText = busy ? (waiting ? "Waiting for mission pack selection…" : "Building…") : ok ? "Build complete." : "Idle.";

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
        <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
          <div className="mb big action" onClick={() => !busy && build()}><i className="body" /><i className="acc" /><i className="acc r" /><i className="bev" /><i className="u1" /><i className="u2" /><span className="t">Build Tables</span></div>
        </div>
        <EdfProgress value={pct} active={busy} />
        <div className="edfsteps">
          {stages.map((s, i) => {
            const isDone = done[i];
            const isWait = s.waitForInput && isDone && i + 1 < stages.length && !done[i + 1] && busy && waiting;
            const cls = isWait ? "wait" : isDone ? "done" : (busy && !waiting && i === activeIdx) ? "act" : "";
            return <div key={s.id + i} className={`stp ${cls}`}><i />{s.label}</div>;
          })}
        </div>
        <p className="cfdesc" style={{ marginTop: 16, color: busy ? (waiting ? "var(--warn)" : "var(--warn)") : ok ? "var(--ok)" : "#a9a58f" }}>{statusText}</p>
      </Panel>
      <Panel style={{ left: 1240, top: 130, width: 550, height: 830, padding: "10px 18px" }} title="Build Log" right={<span className="catsub">AA-Log.txt</span>}>
        <div className="buildlog" style={{ marginTop: 8 }}>
          {log.split("\n").map((ln, i) => <div key={i} className={ln.includes("EDIT") ? "w" : ""}>{ln}</div>)}
        </div>
      </Panel>
    </>
  );
}