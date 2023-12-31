import { useRef } from "react";
import { PreviewLocation } from "./PreviewCanvas";
import { X } from "lucide-react";

export interface LocationData {
  location: PreviewLocation;
  text: string;
}

export default function LocationThingy({
  locations,
  data,
  assign,
}: {
  locations: LocationData[];
  data?: LocationData;
  assign: (data?: LocationData) => void;
}) {
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const availableMap: Record<PreviewLocation, string> = {
    chat: "Chat",
    title: "Title",
    subtitle: "Subtitle",
    actionbar: "Actionbar",
  };
  for (const x of locations.filter((x) => x !== data))
    delete availableMap[x.location];

  return (
    <div
      className={`flex flex-row gap-2 justify-between items-center ${
        !data && "opacity-70"
      }`}
    >
      <select
        className="dark:bg-zinc-900/30 bg-zinc-200 py-1 px-2 flex-[1] rounded-lg"
        value={data?.location ?? "."}
        onChange={() => {
          assign({
            location: (selectRef.current?.value ??
              Object.keys(availableMap)[0]) as PreviewLocation,
            text: inputRef.current?.value ?? "",
          });
          if (!data && inputRef.current) inputRef.current.value = "";
        }}
        ref={selectRef}
      >
        {!data && <option value="." label="Select a location..." />}
        {(Object.keys(availableMap) as PreviewLocation[]).map((y, i) => (
          <option value={y} label={availableMap[y]} key={i} />
        ))}
      </select>
      <input
        className="dark:bg-zinc-900/30 bg-zinc-200 py-1 px-2 flex-[5] rounded-lg"
        ref={inputRef}
        defaultValue={data?.text ?? ""}
        onChange={() =>
          selectRef.current?.value !== "." &&
          assign({
            location: (selectRef.current?.value ??
              Object.keys(availableMap)[0]) as PreviewLocation,
            text: inputRef.current?.value ?? "",
          })
        }
      />
      {data && (
        <button onClick={() => assign()}>
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
