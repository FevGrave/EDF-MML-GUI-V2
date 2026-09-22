// The static chrome layers of the 1920x1080 scene: diamond tile, sweep,
// faint radar map, ambient glow/glitter, outer frame, corner blocks, rail.
export default function SceneBackground() {
  return (
    <>
      <div className="dia" />
      <div className="sweep" />
      <svg className="map" viewBox="0 0 800 820" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2">
        <circle cx="400" cy="410" r="380" />
        <ellipse cx="400" cy="410" rx="380" ry="190" />
        <ellipse cx="400" cy="410" rx="380" ry="95" />
        <ellipse cx="400" cy="410" rx="190" ry="380" />
        <ellipse cx="400" cy="410" rx="95" ry="380" />
        <path d="M20 410H780M400 30V790" />
      </svg>
      <div className="ambient"><i className="gl1" /><i className="gl2" /></div>
      <div className="edge" />
      <div className="edge2" />
      <div className="blk" style={{ left: 0, top: 0 }} />
      <div className="blk" style={{ right: 0, top: 0 }} />
      <div className="blk" style={{ left: 0, bottom: 0 }} />
      <div className="blk" style={{ right: 0, bottom: 0 }} />
      <svg className="rail" viewBox="0 0 190 860" fill="none">
        <path d="M78 0 L14 62 V760 L52 810" stroke="var(--frame)" strokeWidth="10" />
        <path d="M104 0 V800" stroke="var(--frame)" strokeWidth="6" opacity=".8" />
      </svg>
    </>
  );
}