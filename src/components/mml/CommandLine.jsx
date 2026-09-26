import { useEffect, useRef, useState } from "react";
import { bridge } from "@/lib/mmlBridge";

// Console log cap. The old version kept only the last 5 lines
// (`.slice(-5)`), which silently dropped everything else -- a real
// complaint (2026-09-25: "console needs to be improved") on top of the
// separate pywebview text_select fix. Multi-line commands (the EDF chant,
// credits scroll, the fake transmission egg, etc. -- see
// backend/console_commands.py) can push dozens of lines, so the log is now
// a real scrollback instead of a single frame.
const MAX_LINES = 400;

const mppCls = (state) => (state === "ok" ? "d" : state === "warn" ? "w" : "b");

export default function CommandLine() {
  const [log, setLog] = useState([
    { t: "Type help for commands, or paste a request code.", c: "d" },
  ]);
  const [v, setV] = useState("");
  const logRef = useRef(null);

  const say = (t, c = "ok") => setLog((l) => (l.length >= MAX_LINES ? [...l.slice(l.length - MAX_LINES + 1), { t, c }] : [...l, { t, c }]));

  // Real boot-status lines (real data, 2026-09-25): these two lines used to be
  // hardcoded fake text ('Profile "core+lostmp" loaded, order by MOD NAME' /
  // "Preflight: mppp.dll is disabled (file is mppp.dlll)") baked in before the
  // real profile/preflight backend existed -- they never updated and duplicated
  // (incorrectly, once real profiles/mppp state changed) what Home.jsx's
  // Preflight panel already shows for real. Now fetched once on mount from the
  // same real bridge calls Home.jsx/Build.jsx already use, and prepended above
  // whatever's already in the log (never replacing anything the user already
  // typed/saw while this was loading).
  useEffect(() => {
    Promise.all([bridge.getPreflight(), bridge.getBuildPrefs()]).then(([r, prefs]) => {
      const mp = r?.checks?.find((c) => c.id === "mppp");
      const lines = [];
      if (r) lines.push({ t: `Profile "${r.loaded_profile || "none"}" loaded, order by ${prefs?.order || "MOD NAME"}`, c: "d" });
      if (mp) lines.push({ t: `Preflight: ${mp.detail}`, c: mppCls(mp.state) });
      if (lines.length) setLog((l) => [...lines, ...l]);
    }).catch(() => {});
  }, []);

  // Real backend push channel for timed/multi-line commands (added
  // 2026-09-25): backend/console_commands.py streams follow-up lines via
  // window.evaluate_js("window.onConsoleLine(text, cls)") on a background
  // thread -- e.g. the EDF chant, the credits scroll, the fake transmission
  // easter egg, the enigma puzzle's staged reveals. Mirrors the existing
  // window.onPreflightUpdate hook pattern already used for preflight
  // refreshes (see webapp.py's refresh_preflight_async).
  useEffect(() => {
    window.onConsoleLine = (t, c) => say(t, c);
    return () => { if (window.onConsoleLine) delete window.onConsoleLine; };
  }, []);

  // Auto-scroll to the newest line whenever the log grows.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  const onKey = async (e) => {
    if (e.key !== "Enter") return;
    const raw = v.trim();
    setV("");
    if (!raw) return;
    say("> " + raw, "d");
    const res = await bridge.runCommand(raw);
    if (res && res.text) say(res.text, res.cls);
  };

  return (
    <div className="win conwin" style={{ left: 620, top: 756, width: 1180, height: 180 }}>
      <div id="log" ref={logRef}>
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
