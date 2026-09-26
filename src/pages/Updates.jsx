import { useState, useRef, useEffect } from "react";
import { bridge } from "@/lib/mmlBridge";
import Panel from "@/components/mml/Panel";
import Pill from "@/components/mml/Pill";
import EdfProgress from "@/components/mml/EdfProgress";

function fmtBytes(n) {
  if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + " MB";
  if (n >= 1024) return Math.round(n / 1024) + " KB";
  return n + " B";
}
function fmtRate(bps) {
  // bps is bytes/sec from poll_download's rolling rate
  if (bps >= 1024 * 1024) return (bps / (1024 * 1024)).toFixed(1) + " MB/s";
  if (bps >= 1024) return Math.round(bps / 1024) + " KB/s";
  return bps + " B/s";
}

const SOURCE_CHIP = {
  GITHUB: { label: "GitHub", color: "#9be0ff" },
  NEXUS: { label: "Nexus", color: "#d8a060" },
  THUNDERSTORE: { label: "Thunderstore", color: "#b45aff" },
};

export default function Updates() {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [dlId, setDlId] = useState(null);
  const [dl, setDl] = useState({ bytes_done: 0, bytes_total: 0, bps: 0, finished: false, ok: false });
  const timerRef = useRef(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const check = async () => {
    setLoading(true);
    try {
      const list = await bridge.check_all();
      setMods(list);
      setLastChecked(new Date());
    } finally { setLoading(false); }
  };

  useEffect(() => { check(); }, []);

  // Mirrors Build.jsx's build() almost line for line: start_download →
  // setInterval(poll_download, 400) → update byte state → clear on finished.
  const startDownload = async (modId) => {
    if (dlId) return;
    setDlId(modId);
    setDl({ bytes_done: 0, bytes_total: 0, bps: 0, finished: false, ok: false });
    await bridge.start_download(modId);
    timerRef.current = setInterval(async () => {
      const st = await bridge.poll_download();
      setDl({ bytes_done: st.bytes_done, bytes_total: st.bytes_total, bps: st.bps, finished: st.finished, ok: st.ok });
      if (st.finished) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        setMods((ms) => ms.map((m) => (m.id === modId ? { ...m, status: "CURRENT", latest: m.current } : m)));
        setDlId(null);
      }
    }, 400);
  };

  const count = mods.filter((m) => m.status === "UPDATE").length;
  const pct = dl.bytes_total ? (dl.bytes_done / dl.bytes_total) * 100 : 0;

  return (
    <Panel style={{ left: 690, top: 130, width: 1100, height: 830, padding: "10px 24px" }} title="Updates" right={<Pill className={count ? "w" : ""}>{count} to update</Pill>}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12, marginBottom: 10 }}>
        <button className="palbtn" style={{ padding: "8px 14px" }} onClick={check} disabled={loading}>{loading ? "Checking…" : "Check for updates"}</button>
        <span className="cfdesc" style={{ fontSize: 16 }}>{lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : "Checks every enabled mod's installed version against its real source on GitHub, Nexus Mods, or Thunderstore."}</span>
      </div>
      <div className="scroller" style={{ height: 660, border: "3px solid var(--frame2)", background: "rgba(0,0,0,.45)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.6)" }}>
        {mods.map((m) => {
          const sc = SOURCE_CHIP[m.source] || { label: m.source, color: "#a9a58f" };
          const isDl = dlId === m.id;
          const avail = m.status === "UPDATE";
          return (
            <div key={m.id} style={{ borderBottom: "2px solid rgba(255,255,255,.12)", padding: "10px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 20, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</b>
                  <span className="catsub" style={{ marginLeft: 0 }}>{m.author} · <span style={{ color: sc.color }}>{sc.label}</span></span>
                </div>
                <span className="chip" style={{ margin: 0, background: "rgba(0,0,0,.4)", borderColor: "var(--frame2)", color: "#a9a58f" }}>{m.current || "—"}</span>
                <span className="chip" style={{ margin: 0, background: avail ? "rgba(93,255,154,.15)" : "rgba(0,0,0,.4)", borderColor: avail ? "var(--ok)" : "var(--frame2)", color: avail ? "var(--ok)" : "#a9a58f" }}>{m.latest || "—"}</span>
                <div style={{ width: 130, textAlign: "right" }}>
                  {isDl ? (
                    <span className="pill" style={{ fontSize: 13 }}>{Math.round(pct)}%</span>
                  ) : avail ? (
                    <button className="palbtn" style={{ padding: "5px 12px" }} onClick={() => startDownload(m.id)} disabled={!!dlId}>Update</button>
                  ) : (
                    <span className={`pill ${m.status === "CURRENT" ? "" : "mute"}`} style={{ fontSize: 13 }}>{m.status === "CURRENT" ? "Current" : "Unknown"}</span>
                  )}
                </div>
              </div>
              {isDl && (
                <div style={{ marginTop: 8 }}>
                  <EdfProgress value={pct} active />
                  <p className="cfdesc" style={{ marginTop: 4, fontSize: 14, color: "var(--ok)" }}>{fmtBytes(dl.bytes_done)} / {fmtBytes(dl.bytes_total)} — {fmtRate(dl.bps)}</p>
                </div>
              )}
              {m.status === "UNKNOWN" && !isDl && m.notes && (
                <p className="cfdesc" style={{ marginTop: 4, fontSize: 13, opacity: 0.8 }}>{m.notes}</p>
              )}
            </div>
          );
        })}
        {mods.length === 0 && <p className="cfdesc" style={{ marginTop: 14, padding: "0 14px" }}>No mods found. Enable mods on the Plugins page, then check for updates here.</p>}
      </div>
      <p className="cfdesc" style={{ fontSize: 15, marginTop: 12 }}>Versions are compared by exact string match — mod authors use wildly different schemes, so MML never parses semver. GitHub is checked via release tags (or flagged when only a branch archive exists); Nexus via its v1 API key; Thunderstore via its package API.</p>
    </Panel>
  );
}