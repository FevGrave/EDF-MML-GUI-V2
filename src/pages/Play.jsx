import { useEffect, useState } from "react";
import Panel from "@/components/mml/Panel";
import { bridge } from "@/lib/mmlBridge";
import { EDF_GAMES } from "@/lib/edfGames";

export default function Play() {
  const [launched, setLaunched] = useState(null);
  const [config, setConfig] = useState({}); // managed-game id -> game config (platform)

  useEffect(() => {
    bridge.getGames().then((gs) => {
      const map = {};
      gs.forEach((g) => { map[g.id] = g; });
      setConfig(map);
    });
  }, []);

  const launch = (g) => {
    const epic = config[g.id]?.platform === "epic";
    const url = epic && g.epicApp
      ? `com.epicgames.launcher://apps/${g.epicApp}?action=launch&silent=true`
      : `steam://run/${g.appid}`;
    window.location.href = url;
    setLaunched(g.appid);
    setTimeout(() => setLaunched(null), 1800);
  };

  return (
    <Panel style={{ left: 620, top: 130, width: 1170, height: 830, padding: "10px 24px" }} title="Play Game">
      <p className="cfdesc" style={{ marginTop: 10, marginBottom: 14 }}>
        Launch any EDF title straight from your client — click <b>Launch</b> and the game opens via Steam or the Epic Games launcher. Set each game's platform in Settings.
      </p>
      <div className="scroller" style={{ maxHeight: 670, border: "3px solid var(--frame2)", background: "rgba(0,0,0,.45)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.6)" }}>
        {EDF_GAMES.map((g) => {
          const epic = config[g.id]?.platform === "epic";
          return (
            <div key={g.appid} className="modrow" style={{ gridTemplateColumns: "104px 1fr auto", cursor: "default" }}>
              <span className="ord" style={{ fontSize: 17 }}>{g.appid}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <b style={{ fontSize: 20, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.title}</b>
                <span className="catsub" style={{ flex: "none", color: "#9be0ff" }}>{g.engine}</span>
                <span className="chip" style={{ margin: 0, background: epic ? "rgba(93,255,154,.15)" : "rgba(0,0,0,.4)", borderColor: epic ? "var(--ok)" : "var(--frame2)", color: epic ? "var(--ok)" : "#a9a58f" }}>{epic ? "EGS" : "Steam"}</span>
              </div>
              <button className="palbtn" style={{ padding: "6px 16px" }} onClick={() => launch(g)}>
                {launched === g.appid ? "Launching…" : "Launch"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="cfdesc" style={{ fontSize: 15, marginTop: 12 }}>
        EDF 6 is also on the Epic Games Store — set its platform to <b>epic</b> in Settings to launch via EGS. EDF 6.2 is PS5-first and not on PC yet.
      </p>
    </Panel>
  );
}