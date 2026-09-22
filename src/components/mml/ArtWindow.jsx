import { useState } from "react";

const NAMES = ["Android", "Bomber", "Cyclops", "Dragon", "Driller", "Preemo", "Red Bomber", "sky snake"];

export default function ArtWindow() {
  const [i, setI] = useState(0);
  const n = NAMES[i];
  const step = (d) => setI((p) => (p + d + NAMES.length) % NAMES.length);
  const rnd = () => setI(Math.floor(Math.random() * NAMES.length));

  return (
    <div className="win artwin" style={{ left: 690, top: 130, width: 430, height: 600 }}>
      <div className="artimg">
        <svg viewBox="0 0 430 554" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
          <rect width="430" height="554" fill="#0a0c0e" />
          <defs>
            <radialGradient id="ag" cx="50%" cy="36%" r="62%">
              <stop offset="0%" stopColor="var(--bg2)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0a0c0e" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="430" height="554" fill="url(#ag)" />
          <g stroke="var(--frame)" strokeWidth="6" fill="none" opacity="0.9">
            <path d="M215 165 L150 240 V360 L215 410 L280 360 V240 Z" />
            <circle cx="215" cy="110" r="52" />
            <path d="M180 100 L250 100" />
          </g>
          <g stroke="var(--line)" strokeWidth="3" opacity="0.55" fill="none">
            <path d="M215 58 V420 M150 458 L215 410 L280 458" />
          </g>
          <text x="215" y="498" textAnchor="middle" fontFamily="var(--font)" fontWeight="700" fontSize="28" fill="#fff" stroke="#000" paintOrder="stroke" letterSpacing="2">{n}</text>
        </svg>
      </div>
      <div className="artcap">
        <button onClick={() => step(-1)} title="Previous">◀</button>
        <span>{n}</span>
        <em>[default]</em>
        <button onClick={rnd} title="Random">⚄</button>
        <button onClick={() => step(1)} title="Next">▶</button>
      </div>
    </div>
  );
}