import { useEffect, useState } from "react";

const norm = (t) => {
  let s = (t || "").trim();
  if (s && !s.startsWith("#")) s = "#" + s;
  return s.toLowerCase();
};
const valid = (s) => /^#[0-9a-f]{6}$/.test(s);

// Forgiving hex editor: the text box lets you type freely and only commits a
// valid #rrggbb back to the palette. A "#" is auto-prepended if you omit it.
export default function ColorField({ label, value, def, onChange }) {
  const [text, setText] = useState((value && valid(value) ? value : def).toUpperCase());
  useEffect(() => {
    const v = value && valid(value) ? value : def;
    setText(v.toUpperCase());
  }, [value, def]);

  const shown = valid(text) ? text : def;
  const commit = (t) => {
    setText(t.toUpperCase());
    const n = norm(t);
    if (valid(n)) onChange(n);
  };

  return (
    <div className="cfitem" style={{ height: 40, gap: 8 }}>
      <input type="color" value={shown} onChange={(e) => commit(e.target.value)}
        style={{ width: 26, height: 26, padding: 0, border: "2px solid var(--frame2)", background: "transparent", cursor: "pointer" }} />
      <span style={{ flex: 1, fontSize: 17 }}>{label}</span>
      <input className="mmlin" style={{ width: 90, height: 28, fontSize: 14, padding: "0 6px" }} maxLength={7}
        value={text} onChange={(e) => commit(e.target.value)} />
    </div>
  );
}