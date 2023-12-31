"use client";

export const allowedTypes = ["png", "json", "ttf", "otf", "zip"];
type FilesInterface = Record<string, string>;

export let files: FilesInterface;

function convertFiles() {
  ensureFiles();
  return Object.entries(files)
    .map(
      ([x, y]) =>
        `${x.replaceAll("=", "=\u0000")}=${y.replaceAll(";", ";\u0000")}`
    )
    .join(";");
}

enum StateType {
  PendingFile,
  PendingValue,
}
function parseFiles(str: string) {
  const ret: Record<string, string> = {};
  let state:
    | { type: StateType.PendingFile; pendingFile: string; skip: boolean }
    | {
        type: StateType.PendingValue;
        file: string;
        pendingValue: string;
        skip: boolean;
      } = {
    type: StateType.PendingFile,
    pendingFile: "",
    skip: false,
  };
  for (let i = 0; i < str.length; i++) {
    const cur = str[i],
      nex = str[i + 1];

    if (state.type === StateType.PendingFile) {
      if (cur !== "=" || nex === "\u0000") {
        if (state.skip) state.skip = false;
        else state.pendingFile += cur;
        if (cur === "=") state.skip = true;
      } else {
        state = {
          type: StateType.PendingValue,
          file: state.pendingFile,
          pendingValue: "",
          skip: false,
        };
      }
    } else if (state.type === StateType.PendingValue) {
      if (cur !== ";" || nex === "\u0000") {
        if (state.skip) state.skip = false;
        else state.pendingValue += cur;
        if (cur === ";") state.skip = true;
      } else {
        ret[state.file] = state.pendingValue;
        state = {
          type: StateType.PendingFile,
          pendingFile: "",
          skip: false,
        };
      }
    }
  }

  if (state.type === StateType.PendingValue)
    ret[state.file] = state.pendingValue;

  return ret;
}

let fileSyncTimeout: NodeJS.Timeout;
function syncFiles() {
  if (fileSyncTimeout) clearTimeout(fileSyncTimeout);
  fileSyncTimeout = setTimeout(() => {
    try {
      localStorage.setItem("files", convertFiles());
    } catch (e) {
      localStorage.setItem("files", "");
      if (e instanceof DOMException) {
        if (localStorage.getItem("config-noQuotaAlert") !== "") {
          localStorage.setItem("config-noQuotaAlert", "");
          alert(
            "Local files have reached over 5MB, meaning your browser won't save them anymore. This popup will only appear once"
          );
        }
      } else console.log("file saving faled :(", e);
      return;
    }
    localStorage.removeItem("config-noQuotaAlert");
  }, 1_000);
}

export function baseFile() {
  if (typeof localStorage === "undefined") return null;

  const val = localStorage.getItem("config-baseFile");
  if (!val) return null;

  const pat = val.split("/");
  if (pat[1] !== "font" || !val.endsWith(".json")) return null;

  return fileExists(val) ? val : null;
}
export function setBaseFile(path: string, manual?: boolean) {
  if (typeof localStorage === "undefined") return;

  const pat = path.split("/");
  if (pat[1] !== "font" || !path.endsWith(".json") || !fileExists(path)) return;

  localStorage.setItem("config-baseFile", path);
  if (!manual) window.dispatchEvent(fileChangedEvent);
}

export function ensureFiles() {
  if (typeof localStorage === "undefined") {
    files = {};
    return files;
  }

  if (!files) {
    try {
      const val = localStorage.getItem("files");
      if (val) files = parseFiles(val);
    } catch {}
    files ??= {};
    syncFiles();
  }

  if (!localStorage.getItem("config-visited")) {
    localStorage.setItem("config-visited", new Date().toISOString());
    localStorage.setItem("config-baseFile", "custom/font/foobar.json");
    writeFile(
      "custom/font/foobar.json",
      JSON.stringify(
        {
          providers: [
            {
              type: "reference",
              id: "minecraft:default",
            },
          ],
        },
        undefined,
        4
      )
    );
  }
}

export function listFiles() {
  ensureFiles();

  return Object.keys(files);
}

export function writeFile(name: string, value: string, manual?: boolean) {
  ensureFiles();

  files[name] = value;
  syncFiles();
  if (!manual) window.dispatchEvent(fileChangedEvent);
}
export function deleteFile(name: string, manual?: boolean) {
  ensureFiles();

  delete files[name];
  syncFiles();

  if (!manual) window.dispatchEvent(fileChangedEvent);
}
export function readFile(name: string) {
  ensureFiles();

  return files[name];
}
export function renameFile(oldName: string, newName: string, manual?: boolean) {
  ensureFiles();

  if (files[oldName]) {
    files[newName] = files[oldName];
    delete files[oldName];
    syncFiles();

    if (!manual) window.dispatchEvent(fileChangedEvent);
  }
}
export function fileExists(name: string) {
  return listFiles().includes(name);
}

export function renameFiles(path: string[], newPath: string[]) {
  for (const f of listFiles()) {
    const pt = f.split("/");
    if (!pt.slice(0, path.length).every((x, i) => x === path[i])) continue;

    const nw = [...newPath, ...pt.slice(path.length)].join("/");
    if (f === nw) continue;
    renameFile(f, nw, true);
  }
  window.dispatchEvent(fileChangedEvent);
}
export function deleteFiles(path: string[]) {
  for (const f of listFiles()) {
    const pt = f.split("/");
    if (!pt.slice(0, path.length).every((x, i) => x === path[i])) continue;

    deleteFile(f, true);
  }
  window.dispatchEvent(fileChangedEvent);
}

export function availablePath(_name: string, ext?: string) {
  let name = _name;
  const full = () => (ext ? `${name}.${ext}` : name);

  if (!fileExists(full())) return full();

  let i = 1;
  while (i < 9999) {
    name = `${_name} (${i++})`;
    if (!fileExists(full())) return full();
  }

  return full();
}
export function filterPath(input: string) {
  return input
    .split("/")
    .filter((x) => !!x)
    .join("/");
}
export function validateFile(_input: string, original?: string) {
  const input = filterPath(_input);
  if ((original ? input !== original : true) && fileExists(input))
    return (
      <>
        A file or folder with the name <b>{input}</b> already exists.
      </>
    );

  const last = input.split("/").slice(-1)[0];
  if (!allowedTypes.some((x) => last.endsWith(`.${x}`)) && last.includes("."))
    return (
      <>
        Disallowed file type <b>{last.split(".").slice(-1)[0]}</b>. Only{" "}
        <b>{allowedTypes.join(",")}</b> are allowed.
      </>
    );

  return true;
}

export const fileChangedEvent = new Event("fileChanged");
