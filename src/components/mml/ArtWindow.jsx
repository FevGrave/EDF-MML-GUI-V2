import { useState } from "react";
import { ART } from "@/lib/mmlArt";

export default function ArtWindow() {
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const a = ART[i];
  const go = (n) => { setI(n); setLoaded(false); };
  const step = (d) => go((i + d + ART.length) % ART.length);
  const rnd = () => go(Math.floor(Math.random() * ART.length));

  return (
    <div className="win artwin" style={{ left: 620, top: 130, width: 430, height: 600 }}>
      <div className="artimg">
        <img
          src={a.url}
          alt={a.name}
          onLoad={() => setLoaded(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity .2s" }}
        />
        {!loaded && (
          <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--dim)", font: "500 18px var(--font)" }}>
            Loading…
          </span>
        )}
      </div>
      <div className="artcap">
        <button onClick={() => step(-1)} title="Previous">◀</button>
        <span>{a.name}</span>
        <em>{i + 1}/{ART.length}</em>
        <button onClick={rnd} title="Random">⚄</button>
        <button onClick={() => step(1)} title="Next">▶</button>
      </div>
    </div>
  );
}