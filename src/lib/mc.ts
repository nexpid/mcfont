export let mcVersion = "23w46a";

export let assets = new Array<string>();
export const fetching = new Set<string>();
export async function fetchAssets() {
  if (fetching.has("assets")) return;
  fetching.add("assets");
  window.dispatchEvent(fetchingEvent);
  assets = [];

  const assetsReq = await fetch(
    `/api/assets?version=${encodeURIComponent(mcVersion)}`
  );
  if (!assetsReq.ok) {
    fetching.delete("assets");
    window.dispatchEvent(fetchingEvent);
    return;
  }

  assets = await assetsReq.json();
  fetching.delete("assets");
  window.dispatchEvent(fetchingEvent);
}

export let versions = new Array<string>();
export async function fetchVersions() {
  if (fetching.has("versions")) return;
  fetching.add("versions");
  window.dispatchEvent(fetchingEvent);
  versions = [mcVersion];

  const versionsReq = await fetch("/api/versions");
  if (!versionsReq.ok) {
    fetching.delete("versions");
    window.dispatchEvent(fetchingEvent);
    return;
  }

  versions = await versionsReq.json();
  fetching.delete("versions");
  window.dispatchEvent(fetchingEvent);
}

export function changeVersion(version: string) {
  mcVersion = version;
  fetchAssets();
}

export const fetchingEvent = new Event("fetchingChanged");
