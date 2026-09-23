import { useEffect, useState } from "react";

const norm = (t) => {
  let s = (t || "").trim();
  if (s && !s.startsWith("#")) s = "#" + s;
  return s.toLowerCase();
};
const valid = (s) => /^#[0-9a-f]{6}$/.test(s);

// Forgiving hex editor. The text box lets you type freely; a valid #rrggbb
// (with "#" auto-prepended) is committed to the parent. The colour swatch is
// always driven by the authoritative committed value, so the two stay in sync.
export default function ColorField({ label, value, def, onChange }) {
  const cur = value && valid(value) ? value : def; // "#rrggbb" lowercase, always valid
  const [text, setText] = useState(cur.toUpperCase());
  useEffect(() => { setText(cur.toUpperCase()); }, [cur]);

  const commit = (t) => {
    const n = norm(t);
    if (valid(n)) {
      setText(n.toUpperCase()); // display "#RRGGBB"
      onChange(n);              // commit lowercase "#rrggbb"
    } else {
      setText(t.toUpperCase()); // keep typing, don't commit invalid input
    }
  };

  return (
    <div className="cfitem" style={{ height: 40, gap: 8 }}>
      <input type="color" value={cur} onChange={(e) => commit(e.target.value)}
        style={{ width: 26, height: 26, padding: 0, border: "2px solid var(--frame2)", background: "transparent", cursor: "pointer" }} />
      <span style={{ flex: 1, fontSize: 17 }}>{label}</span>
      <input className="mmlin" style={{ width: 90, height: 28, fontSize: 14, padding: "0 6px" }} maxLength={7}
        value={text} onChange={(e) => commit(e.target.value)} />
    </div>
  );
}