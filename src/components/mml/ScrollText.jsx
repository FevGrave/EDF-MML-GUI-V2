import { useEffect, useRef, useState } from "react";

// Renders text that, when it overflows its container, scrolls left in a loop
// starting with a pause on the first characters ("sleep on the start of the
// string"). Reusable for any long label — pass children as the text/marks.
export default function ScrollText({ children, className = "", style }) {
  const [overflow, setOverflow] = useState(false);
  const [dur, setDur] = useState(8);
  const wrapRef = useRef(null);
  const firstRef = useRef(null);

  useEffect(() => {
    const check = () => {
      const w = wrapRef.current;
      const f = firstRef.current;
      if (!w || !f) return;
      const ow = f.scrollWidth;
      const cw = w.clientWidth;
      if (ow > cw + 1) {
        setOverflow(true);
        setDur(Math.max(5, Math.round(ow / 40)));
      } else {
        setOverflow(false);
      }
    };
    check();
    const t = setTimeout(check, 120);
    window.addEventListener("resize", check);
    return () => { clearTimeout(t); window.removeEventListener("resize", check); };
  });

  return (
    <span ref={wrapRef} className={`mcd-scroll ${overflow ? "anim" : ""}`} style={{ ...style, "--mcd-dur": dur }}>
      <span className="mcd-scroll-inner">
        <span ref={firstRef} className="mcd-copy">{children}</span>
        {overflow ? <span className="mcd-copy" aria-hidden="true">{children}</span> : null}
      </span>
    </span>
  );
}