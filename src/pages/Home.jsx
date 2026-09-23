import { useEffect, useState } from "react";
import { bridge } from "@/lib/mmlBridge";
import ArtWindow from "@/components/mml/ArtWindow";
import CommandLine from "@/components/mml/CommandLine";
import Panel from "@/components/mml/Panel";
import Pill from "@/components/mml/Pill";
import Chip from "@/components/mml/Chip";
import Badge from "@/components/mml/Badge";
import Gauge from "@/components/mml/Gauge";
import { useBgArt } from "@/lib/mmlBgArt";

const cls = (s) => (s === "ok" ? "" : s === "warn" ? "w" : s === "error" ? "bad" : "mute");
const word = (s, a, b, c, d) => (s === "ok" ? a : s === "warn" ? b : s === "error" ? c : d);

function PfRow({ dot, name, cat, note, children }) {
  return (
    <div className="pf">
      <i className={`dm ${dot}`} />
      <span>{name} <Chip>{cat}</Chip><code>{note}</code></span>
      <span className="pfend">{children}</span>
    </div>
  );
}

export default function Home() {
  const [r, setR] = useState(null);
  const [bgArt] = useBgArt();
  useEffect(() => { bridge.getPreflight().then(setR); }, []);

  if (!r) return <Panel style={{ left: 1070, top: 130, width: 720, height: 600, padding: 20 }} title="Preflight"><p className="cfdesc">Loading preflight…</p></Panel>;

  const by = (id) => r.checks.find((c) => c.id === id);
  const hk = by("hakken_build"), mp = by("mppp"), ba = by("edfmodloader"), tools = by("edftools"), mml = by("mml_self");
  const w = r.counts.weapons?.data, md = r.counts.mode?.data;
  const wpct = w && w.capacity ? (w.used / w.capacity) * 100 : 0;

  return (
    <>
      {bgArt && <ArtWindow />}
      <Panel style={{ left: 1070, top: 130, width: 720, height: 600, padding: "10px 20px" }} title="Preflight" right={<Pill className={r.warning_count ? "w" : ""}>{r.warning_count ? `${r.warning_count} warning${r.warning_count > 1 ? "s" : ""}` : "all clear"}</Pill>}>
        <div className={`bigstat ${hk.state === "ok" ? "ok" : hk.state === "error" ? "bad" : ""}`}>
          <i className={`dm ${cls(hk.state)}`} />
          <div><b>HAKKEN engine <Chip>Build</Chip></b><small>{hk.detail}</small></div>
          <Pill className={cls(hk.state)}>{word(hk.state, "Deployed", "Stale", "Not built", "?")}</Pill>
        </div>
        <PfRow dot={cls(mp.state)} name="mppp.dll" cat="Plugin" note={mp.detail}><Pill className={cls(mp.state)}>{word(mp.state, "Ready", "Enable", "Missing", "?")}</Pill></PfRow>
        <PfRow dot={cls(ba.state)} name="EDFModLoader" cat="Loader" note={ba.detail}><Badge state={ba.state} /><Pill className={cls(ba.state)}>{word(ba.state, "Up to date", "Update", "Error", "Offline")}</Pill></PfRow>
        <PfRow dot={cls(tools.state)} name="EDF Tools.exe" cat="Tool" note={tools.detail}><Badge state={tools.state} /><Pill className={cls(tools.state)}>{word(tools.state, "Up to date", "Update", "Error", "Offline")}</Pill></PfRow>
        <PfRow dot={cls(mml.state)} name="MML MergeCommand" cat="Core" note={mml.detail}><Badge state={mml.state} /><Pill className={cls(mml.state)}>{word(mml.state, "Up to date", "Update", "Error", "Offline")}</Pill></PfRow>
        <div className="st">
          <Gauge label="Weapons" value={wpct} />
          <div className="gv"><b>{w && w.used != null && w.capacity != null ? `${w.used.toLocaleString()} / ${w.capacity.toLocaleString()}` : (w && w.capacity != null ? `— / ${w.capacity.toLocaleString()}` : "—")}</b><span>slots used</span></div>
          <div className="r"><span>Loaded profile</span><small>{r.loaded_profile || "—"}</small></div>
          <div className="r"><span>Mode</span><small>{md ? md.ni_mode : "—"}</small></div>
        </div>
      </Panel>
      <CommandLine />
    </>
  );
}