import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MENU } from "@/lib/mmlMenu";

export default function MenuBar({ onFocus }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [activeIdx, setActiveIdx] = useState(0);
  const [focusIdx, setFocusIdx] = useState(0);

  useEffect(() => {
    const i = MENU.findIndex((m) => m.path === loc.pathname);
    if (i >= 0) {
      setActiveIdx(i);
      setFocusIdx(i);
      onFocus?.(MENU[i].help);
    }
  }, [loc.pathname, onFocus]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      const live = MENU.map((m, i) => ({ m, i })).filter((x) => !x.m.off);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const cur = live.find((x) => x.i === focusIdx) || live[0];
        let idx = live.indexOf(cur);
        idx = (idx + (e.key === "ArrowDown" ? 1 : -1) + live.length) % live.length;
        setFocusIdx(live[idx].i);
        onFocus?.(live[idx].m.help);
        e.preventDefault();
      } else if (e.key === "Enter") {
        const m = MENU[focusIdx];
        if (m && !m.off) nav(m.path);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focusIdx, nav, onFocus]);

  return (
    <div id="menu" onMouseLeave={() => setFocusIdx(activeIdx)}>
      {MENU.map((m, i) => (
        <div
          key={m.path}
          className={`mb ${i === activeIdx ? "f" : ""} ${i === focusIdx && i !== activeIdx ? "kf" : ""} ${m.off ? "off" : ""}`}
          style={{ top: 148 + i * 70 + "px" }}
          data-help={m.help}
          onMouseEnter={() => { if (!m.off) { setFocusIdx(i); onFocus?.(m.help); } }}
          onClick={() => { if (!m.off) nav(m.path); }}
        >
          <span className="mark" />
          <i className="body" />
          <i className="acc" />
          <i className="bev" />
          <i className="u1" />
          <i className="u2" />
          <span className="t">{m.label}</span>
        </div>
      ))}
    </div>
  );
}