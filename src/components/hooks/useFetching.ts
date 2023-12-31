import { fetching } from "@/lib/mc";
import { useEffect, useState } from "react";

export default function useFetching(): Set<string> {
  const [_, setVal] = useState(fetching.values());

  useEffect(() => {
    const upd = () => setVal(fetching.values());
    window.addEventListener("fetchingChanged", upd);
    return () => window.removeEventListener("fetchingChanged", upd);
  });

  return fetching;
}
