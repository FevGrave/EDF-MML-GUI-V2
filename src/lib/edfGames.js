// EDF titles available on Steam, keyed by App ID. A `steam://run/<appid>` link
// launches the game through the local Steam client. App IDs verified via SteamDB
// (2026-09). EDF 6 also has an Epic Games Store release; EDF 6.2 is not on PC
// yet (PS5-first; PC release expected later) and is therefore not listed here.
//
// `engine`: the game engine each title runs on.
//   - Library XGS: Sandlot mainline titles (4.1, 5, 6)
//   - Unity: WingDiver the Shooter
//   - Viscous Engine: Insect Armageddon
//   - Unreal Engine: Iron Rain, World Brothers 1 & 2
export const EDF_GAMES = [
  { id: "edf41", appid: "251110", title: "EARTH DEFENSE FORCE 4.1 The Shadow of New Despair", engine: "Library XGS" },
  { id: "wingdiver", appid: "574200", title: "EARTH DEFENSE FORCE 4.1 WINGDIVER THE SHOOTER", engine: "Unity" },
  { id: "edf5", appid: "1039840", title: "EARTH DEFENSE FORCE 5", engine: "Library XGS" },
  { id: "edf6", appid: "2291060", title: "EARTH DEFENSE FORCE 6", engine: "Library XGS", epic: true },
  { id: "insect", appid: "23530", title: "Earth Defense Force: Insect Armageddon", engine: "Viscous Engine" },
  { id: "ironrain", appid: "1039890", title: "EARTH DEFENSE FORCE: IRON RAIN", engine: "Unreal Engine" },
  { id: "worldbros", appid: "1497950", title: "EARTH DEFENSE FORCE: WORLD BROTHERS", engine: "Unreal Engine" },
  { id: "worldbros2", appid: "2370170", title: "EARTH DEFENSE FORCE: WORLD BROTHERS 2", engine: "Unreal Engine" },
];