import LocationThingy from "./LocationThingy";
import { PreviewHud } from "./PreviewCanvas";
import { ConfigHookProps } from "./hooks/useConfig";

export default function Config({
  scale,
  hud,
  locations,
  setScale,
  setHud,
  setLocations,
}: ConfigHookProps) {
  return (
    <>
      <div className="flex flex-row gap-2 justify-between">
        <select
          className="dark:bg-zinc-900/30 bg-zinc-200 py-1 px-2 flex-[1] rounded-lg"
          value={scale.toString()}
          onChange={(e) => setScale(Number(e.currentTarget.value) || 1)}
        >
          <option value="1" label="Scale: 1" />
          <option value="2" label="Scale: 2" />
        </select>
        <select
          className="dark:bg-zinc-900/30 bg-zinc-200 py-1 px-2 flex-[1] rounded-lg"
          value={hud}
          onChange={(e) => setHud(e.currentTarget.value as PreviewHud)}
        >
          <option value="barebones" label="HUD: Barebones" />
          <option value="blockbench" label="HUD: Blockbench" />
          <option value="random" label="HUD: Random" />
        </select>
      </div>
      {new Array(Math.min(locations.length + 1, 4))
        .fill(0)
        .map((_, i) => locations[i])
        .map((d, i) => (
          <LocationThingy
            locations={locations}
            data={d}
            assign={(d) => {
              if (d) {
                const locs = locations.slice();
                d.text = d.text
                  .replace(/\\u([a-fA-F0-9]{4,4})/g, (_, g: string) =>
                    String.fromCharCode(parseInt(g, 16))
                  )
                  .replace(/\\n/g, "\n");
                locs[i] = d;
                setLocations(locs);
              } else setLocations(locations.filter((_, j) => i !== j));
            }}
            key={d ? i : "unselected"}
          />
        ))}
    </>
  );
}
