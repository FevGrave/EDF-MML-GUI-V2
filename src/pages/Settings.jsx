import { useState } from "react";
import Panel from "@/components/mml/Panel";
import Toggle from "@/components/mml/Toggle";
import { useMmlPalette } from "@/lib/mmlPalette";

const PALETTES = [["khaki", "#c9b98a"], ["purple", "#5b4056"], ["green", "#2fb070"]];

export default function Settings() {
  const [pal, setPal] = useMmlPalette();
  const [ni, setNi] = useState(true);
  const [art, setArt] = useState(false);

  return (
    <Panel style={{ left: 620, top: 130, width: 1100, height: 830, padding: "10px 24px" }} title="Settings">
      <div className="optrow" style={{ marginTop: 12 }}><span>Palette</span>
        <div className="seg">
          {PALETTES.map(([k, c]) => (
            <button key={k} className={`palbtn ${pal === k ? "on" : ""}`} onClick={() => setPal(k)}>
              <i style={{ background: c, width: 12, height: 12, display: "inline-block", marginRight: 8, border: "1px solid #fff6" }} />{k}
            </button>
          ))}
        </div>
      </div>
      <div className="optrow"><span>No Install (NI) mode</span><Toggle on={ni} onClick={() => setNi((v) => !v)} /></div>
      <div className="optrow"><span>Background art</span><Toggle on={art} onClick={() => setArt((v) => !v)} /></div>
      <p className="cfdesc" style={{ marginTop: 16 }}>Palette switches the HUD colour scheme. Changes apply instantly and are remembered on this machine.</p>
    </Panel>
  );
}