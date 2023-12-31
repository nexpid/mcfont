import { fileExists, readFile } from "@/lib/files";
import { mcVersion } from "@/lib/mc";
import { useEffect, useRef, useState } from "react";

export default function useImage(path: string, custom?: boolean) {
  const image = useRef(typeof Image === "undefined" ? null : new Image());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = image.current;
    if (!img) return;

    setLoaded(false);
    img.src = custom
      ? path
      : fileExists(path)
      ? `data:image/png;base64,${btoa(readFile(path)!)}`
      : `/api/asset?version=${encodeURIComponent(
          mcVersion
        )}&asset=${encodeURIComponent(path)}`;

    const cb = () => setLoaded(true);
    img.addEventListener("load", cb);
    return () => img.removeEventListener("load", cb);
  }, [path, custom]);

  return loaded ? image.current : null;
}
