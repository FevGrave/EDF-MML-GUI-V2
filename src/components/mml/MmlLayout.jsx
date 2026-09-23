import { useLayoutEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import SceneBackground from "./SceneBackground";
import MenuBar from "./MenuBar";
import { MENU } from "@/lib/mmlMenu";

export default function MmlLayout() {
  const [scale, setScale] = useState(0.5);
  const [help, setHelp] = useState(MENU[0].help);

  useLayoutEffect(() => {
    const fit = () => {
      const k = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      setScale(k);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="mml-stage">
      <div className="mml-wrap" style={{ width: 1920 * scale, height: 1080 * scale }}>
        <div className="scene" style={{ transform: `scale(${scale})` }}>
          <SceneBackground />
          <div className="ban" style={{ top: 40 }}>
            <span className="cap l" /><span className="cap r" />
            <div className="tx">EDF　Multimod　Loader</div>
          </div>
          <div className="ban" style={{ top: 975, height: 60 }}>
            <span className="cap l" /><span className="cap r" />
            <div className="tx sm">▲ ▼ NAVIGATE　　ENTER SELECT</div>
          </div>
          <MenuBar onFocus={setHelp} />
          <div className="help">{help}</div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}