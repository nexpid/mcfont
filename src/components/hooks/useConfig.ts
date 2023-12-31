import { useState } from "react";
import { LocationData } from "../LocationThingy";
import { PreviewHud } from "../PreviewCanvas";

export interface ConfigHookProps {
  scale: number;
  hud: PreviewHud;
  locations: LocationData[];
  setScale: (scale: number) => void;
  setHud: (hud: PreviewHud) => void;
  setLocations: (locations: LocationData[]) => void;
}

export default function useConfig(): ConfigHookProps {
  const [scale, setScale] = useState(1);
  const [hud, setHud] = useState<PreviewHud>("barebones");
  const [locations, setLocations] = useState<LocationData[]>([
    {
      location: "title",
      text: "Minecraft",
    },
  ]);

  return {
    scale,
    hud,
    locations,
    setScale,
    setHud,
    setLocations,
  };
}
