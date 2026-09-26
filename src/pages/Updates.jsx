import { useEffect, useState } from "react";
import { bridge } from "@/lib/mmlBridge";
import Panel from "@/components/mml/Panel";
import Pill from "@/components/mml/Pill";

export default function Updates() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [updating, setUpdating] = useState(null);

  const check = async () => {
    setLoading(true);
    try {
      const list = await bridge.getModUpdates();
      setUpdates(list);
      setLastChecked(new Date());
    } finally { setLoading(false); }
  };

  useEffect(() => { check(); }, []);

  const update = async (u) => {
    setUpdating(u.id);
    try {
      await bridge.updateMod(u.id);
      setUpdates((us) => us.map((x) => (x.id === u.id ? { ...x, current: x.latest, done: true } : x)));
    } finally { setUpdating(null); }
  };

  const count = updates.filter((u) => !u.done && u.current !== u.latest).length;

  return (
    <Panel style={{ left: 690, top: 130, width: 1100, height: 830, padding: "10px 24px" }} title="Updates" right={<Pill className={count ? "w" : ""}>{count} available</Pill>}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12, marginBottom: 10 }}>
        <button className="palbtn" style={{ padding: "8px 14px" }} onClick={check} disabled={loading}>{loading ? "Checking…" : "Check for updates"}</button>
        <span className="cfdesc" style={{ fontSize: 16 }}>{lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : "MML pulls the latest mod releases straight from their GitHub source pages."}</span>
      </div>
      <div className="scroller" style={{ height: 660, border: "3px solid var(--frame2)", background: "rgba(0,0,0,.45)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.6)" }}>
        {updates.map((u) => {
          const avail = !u.done && u.current !== u.latest;
          return (
            <div key={u.id} className="modrow" style={{ gridTemplateColumns: "1fr auto auto auto", cursor: "default" }}>
              <div style={{ minWidth: 0 }}>
                <b style={{ fontSize: 19, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 560 }}>{u.name}</b>
                <span className="catsub" style={{ marginLeft: 0 }}>{u.repo}</span>
              </div>
              <span className="chip" style={{ margin: 0, background: "rgba(0,0,0,.4)", borderColor: "var(--frame2)", color: "#a9a58f" }}>{u.current}</span>
              <span className="chip" style={{ margin: 0, background: avail ? "rgba(93,255,154,.15)" : "rgba(0,0,0,.4)", borderColor: avail ? "var(--ok)" : "var(--frame2)", color: avail ? "var(--ok)" : "#a9a58f" }}>{u.latest}</span>
              <button className="palbtn" style={{ padding: "6px 14px" }} disabled={!avail || updating === u.id} onClick={() => update(u)}>
                {u.done ? "Installed" : updating === u.id ? "Updating…" : avail ? "Update" : "Current"}
              </button>
            </div>
          );
        })}
        {updates.length === 0 && <p className="cfdesc" style={{ marginTop: 14, padding: "0 14px" }}>No mod sources configured yet. Add GitHub mod repos in Settings, then check for updates here.</p>}
      </div>
      <p className="cfdesc" style={{ fontSize: 15, marginTop: 12 }}>Each mod's source page is its GitHub repository — MML reads the latest release tag and assets so you always pull from the author's own distribution.</p>
    </Panel>
  );
}