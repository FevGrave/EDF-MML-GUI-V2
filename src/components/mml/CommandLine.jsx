import { useState } from "react";
import { bridge } from "@/lib/mmlBridge";

export default function CommandLine() {
  const [log, setLog] = useState([
    { t: 'Profile "core+lostmp" loaded, order by MOD NAME', c: "d" },
    { t: "Preflight: mppp.dll is disabled (file is mppp.dlll)", c: "w" },
    { t: "Type help for commands, or paste a request code.", c: "d" },
  ]);
  const [v, setV] = useState("");

  const say = (t, c = "ok") => setLog((l) => [...l, { t, c }].slice(-5));

  const onKey = async (e) => {
    if (e.key !== "Enter") return;
    const raw = v.trim();
    setV("");
    if (!raw) return;
    say("> " + raw, "d");
    const res = await bridge.runCommand(raw);
    if (res.text) say(res.text, res.cls);
  };

  return (
    <div className="win conwin" style={{ left: 630, top: 756, width: 800, height: 190 }}>
      <div id="log">
        {log.map((l, i) => (
          <div key={i} className={l.c}>{l.t}</div>
        ))}
      </div>
      <div className="cin">
        <span>&gt;</span>
        <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={onKey} placeholder="Request code or command. Try: help" spellCheck={false} autoComplete="off" />
      </div>
    </div>
  );
}