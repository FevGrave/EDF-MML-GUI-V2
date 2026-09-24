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
      <div className="scroller" style={{ maxHeight: 690, border: "3px solid var(--frame2)", background: "rgba(0,0,0,.45)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.6)" }}>
        {EDF_GAMES.map((g) => (
          <div key={g.appid} className="modrow" style={{ gridTemplateColumns: "44px 1fr auto", cursor: "default" }}>
            <span className="ord">{g.appid}</span>
            <b style={{ fontSize: 20 }}>{g.title}</b>
            <button className="palbtn" style={{ padding: "6px 16px" }} onClick={() => launch(g)}>
              {launched === g.appid ? "Launching…" : "Launch"}
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}