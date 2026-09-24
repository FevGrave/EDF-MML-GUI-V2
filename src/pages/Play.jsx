import { useState } from "react";
import Panel from "@/components/mml/Panel";
import { EDF_GAMES } from "@/lib/edfGames";

export default function Play() {
  const [launched, setLaunched] = useState(null);
  const launch = (g) => {
    // steam://run/<appid> opens the game through the user's Steam client
    window.location.href = `steam://run/${g.appid}`;
    setLaunched(g.appid);
    setTimeout(() => setLaunched(null), 1800);
  };

  return (
    <Panel style={{ left: 690, top: 130, width: 1100, height: 830, padding: "10px 24px" }} title="Play Game">
      <p className="cfdesc" style={{ marginTop: 10, marginBottom: 14 }}>
        Launch any EDF title straight from Steam — click <b>Launch</b> and the game opens through your Steam client (steam://run/&lt;appid&gt;).
      </p>
      <div className="scroller" style={{ maxHeight: 670, border: "3px solid var(--frame2)", background: "rgba(0,0,0,.45)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.6)" }}>
        {EDF_GAMES.map((g) => (
          <div key={g.appid} className="modrow" style={{ gridTemplateColumns: "104px 1fr auto", cursor: "default" }}>
            <span className="ord" style={{ fontSize: 17 }}>{g.appid}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <b style={{ fontSize: 20, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.title}</b>
              <span className="catsub" style={{ flex: "none", color: "#9be0ff" }}>{g.engine}</span>
              {g.epic && (
                <span className="chip" style={{ margin: 0, background: "rgba(93,255,154,.15)", borderColor: "var(--ok)", color: "var(--ok)" }}>EGS</span>
              )}
            </div>
            <button className="palbtn" style={{ padding: "6px 16px" }} onClick={() => launch(g)}>
              {launched === g.appid ? "Launching…" : "Launch"}
            </button>
          </div>
        ))}
      </div>
      <p className="cfdesc" style={{ fontSize: 15, marginTop: 12 }}>
        EDF 6 is also available on the Epic Games Store. EDF 6.2 is PS5-first and not on PC yet — expected to reach EGS/Steam later.
      </p>
    </Panel>
  );
}