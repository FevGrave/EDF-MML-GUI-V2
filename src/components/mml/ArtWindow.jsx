import { useState, useEffect, useRef } from "react";
import { ART } from "@/lib/mmlArt";
import { bridge } from "@/lib/mmlBridge";

const MODE_LABEL = { all: "All art", modded: "Modded art", mml: "MML art" };
const isVideo = (a) => (a?.type || "").startsWith("video") || /\.(mp4|webm|ogv|mov|m4v)$/i.test(a?.url || "");

export default function ArtWindow({ mode = "mml", auto = false, interval = 8, pick = "next" }) {
  const [modded, setModded] = useState([]);
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { bridge.getModdedArt().then((m) => setModded(Array.isArray(m) ? m : [])); }, []);
  // reset position whenever the mode (and thus the pool) changes
  useEffect(() => { setI(0); setLoaded(false); }, [mode]);

  const pool = mode === "mml" ? ART : mode === "modded" ? modded : [...ART, ...modded];
  const a = pool[i];

  const go = (n) => { setI(n); setLoaded(false); };
  const step = (d) => { if (pool.length) go((i + d + pool.length) % pool.length); };
  const rnd = () => { if (pool.length) go(Math.floor(Math.random() * pool.length)); };

  // auto-advance: space each hop by `interval` seconds, in order or at random.
  // Re-arming on `i` gives a steady cadence and pauses if the pool is too small.
  useEffect(() => {
    if (!auto || pool.length < 2) return;
    const t = setTimeout(() => {
      setI((cur) => (pick === "random" ? Math.floor(Math.random() * pool.length) : (cur + 1) % pool.length));
      setLoaded(false);
    }, Math.max(2, interval || 8) * 1000);
    return () => clearTimeout(t);
  }, [auto, interval, pick, pool.length, i]);

  const addFiles = (files) => {
    const next = Array.from(files).filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"))
      .map((f) => ({ url: URL.createObjectURL(f), name: f.name, type: f.type }));
    if (next.length) setModded((m) => [...m, ...next]);
  };
  const canUpload = mode !== "mml";
  const dim = a ? 1 : 0.4;

  return (
    <div className="win artwin" style={{ left: 620, top: 130, width: 430, height: 600 }}>
      <div className="artimg">
        {a ? (
          <>
            {isVideo(a) ? (
              <video src={a.url} autoPlay loop muted playsInline onLoadedData={() => setLoaded(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity .2s" }} />
            ) : (
              <img src={a.url} alt={a.name} onLoad={() => setLoaded(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity .2s" }} />
            )}
            {!loaded && (
              <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--dim)", font: "500 18px var(--font)" }}>Loading…</span>
            )}
          </>
        ) : (
          <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 24, textAlign: "center", color: "var(--dim)", font: "500 17px/1.5 var(--font)" }}>
            No modded images loaded.<br />In the desktop build these come from your modded art folder — in the browser click + to add some.
          </span>
        )}
      </div>
      <div className="artcap">
        <button onClick={() => step(-1)} title="Previous" style={{ opacity: dim }}>◀</button>
        <span>{a ? a.name : MODE_LABEL[mode]}</span>
        <em>{a ? `${i + 1}/${pool.length}` : "0/0"}</em>
        {canUpload && <button onClick={() => fileRef.current?.click()} title="Add modded images">+</button>}
        {canUpload && (
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: "none" }}
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        )}
        <button onClick={rnd} title="Random" style={{ opacity: dim }}>⚄</button>
        <button onClick={() => step(1)} title="Next" style={{ opacity: dim }}>▶</button>
      </div>
    </div>
  );
}