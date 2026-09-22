import { createContext, useContext, useState, useEffect } from "react";

const Ctx = createContext(["khaki", () => {}]);

export function MmlPaletteProvider({ children }) {
  const [p, setP] = useState(() => localStorage.getItem("mml-palette") || "khaki");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", p);
    localStorage.setItem("mml-palette", p);
  }, [p]);
  return <Ctx.Provider value={[p, setP]}>{children}</Ctx.Provider>;
}

export const useMmlPalette = () => useContext(Ctx);