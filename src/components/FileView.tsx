import styles from "./FileView.module.css";
import {
  baseFile,
  deleteFiles,
  filterPath,
  listFiles,
  renameFiles,
  setBaseFile,
  validateFile,
  writeFile,
} from "@/lib/files";
import {
  File,
  FileCode,
  FileImage,
  FilePlus,
  FolderClosed,
  FolderOpen,
  LucideFileArchive,
  PencilLine,
  Trash,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";

const list = (path: string[]) =>
  listFiles()
    .filter((x) =>
      x
        .split("/")
        .slice(0, path.length)
        .every((y, i) => y === path[i])
    )
    .map((x) => {
      const sp = x.split("/");

      return {
        dir: !!sp[path.length + 1],
        name: sp[path.length],
      };
    })
    .sort((a, b) =>
      a.dir && !b.dir
        ? -1
        : !a.dir && b.dir
        ? 1
        : a.name < b.name
        ? -1
        : a.name > b.name
        ? 1
        : 0
    )
    .filter((x, i, a) => !a.slice(0, i).find((y) => y.name === x.name));

const lucides = {
  png: FileImage,
  json: FileCode,
  ttf: LucideFileArchive,
  otf: LucideFileArchive,
  zip: LucideFileArchive,
};

const editoring = new Map<string, () => void>();

function FileEntry({
  currentFile,
  setCurrentFile,
  name,
  dir,
  path,
}: {
  currentFile: string | null;
  setCurrentFile: (file: string) => void;
  name: string;
  dir: boolean;
  path: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editErr, setEditErr] = useState<JSX.Element | null>(null);
  const [creating, setCreating] = useState(false);
  const [creatingErr, setCreatingErr] = useState<JSX.Element | null>(null);

  const full = path.join("/");

  const [files, setFiles] = useState(list(path));
  useEffect(() => {
    const upd = () => setFiles(list(path));
    window.addEventListener("fileChanged", upd);
    return () => window.removeEventListener("fileChanged", upd);
  });

  useEffect(() => {
    editoring.set(full, () => (setEditing(false), setCreating(false)));
    return () => {
      editoring.delete(full);
    };
  });

  const selected = currentFile === full;

  const cbBaseFile = path[1] === "font" && full.endsWith(".json");
  const isBaseFile = baseFile() === full;

  const remVal = (path.length - 1) * 0.75;
  const rem = (a?: number) => `${remVal + (a ?? 0)}rem`;

  const Lucide =
    Object.entries(lucides).find(([key]) => name.endsWith(`.${key}`))?.[1] ??
    File;

  return (
    <>
      <div
        className={`flex flex-row justify-between ${styles.thing}`}
        style={{
          marginLeft: rem(),
          paddingRight: rem(),
          width: "100%",
        }}
      >
        <div className="flex flex-row gap-2 items-center">
          <button
            onClick={() =>
              !editing &&
              (dir
                ? setExpanded(!expanded)
                : window.dispatchEvent(
                    new CustomEvent("filePreviewOpen", {
                      detail: full,
                    })
                  ))
            }
            className={`flex flex-row gap-1 items-center text-md font-semibold px-2 py-1 rounded-lg ${
              selected
                ? "dark:bg-zinc-700/30 bg-zinc-0"
                : "dark:bg-zinc-900/30 bg-zinc-200"
            }`}
          >
            {dir ? (
              expanded ? (
                <FolderOpen className="w-5 h-5" />
              ) : (
                <FolderClosed className="w-5 h-5" />
              )
            ) : (
              Lucide && <Lucide className="w-5 h-5" />
            )}
            {editing ? (
              <div className="flex flex-col">
                <input
                  defaultValue={full}
                  className="bg-transparent"
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    validateFile(e.currentTarget.value, full) === true &&
                    (renameFiles(
                      path,
                      filterPath(e.currentTarget.value).split("/")
                    ),
                    setEditing(false))
                  }
                  onChange={(e) => {
                    const res = validateFile(e.currentTarget.value, full);
                    if (res !== true) setEditErr(res);
                    else setEditErr(null);
                  }}
                />
              </div>
            ) : (
              <p>{name}</p>
            )}
          </button>

          {dir && (
            <button
              onClick={() => {
                if (!creating) {
                  editoring.forEach((v, k) => k !== full && v());
                  setExpanded(true);
                }
                setCreating(!creating);
              }}
              className={styles.bop}
            >
              <FilePlus className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="px-2 py-1 flex flex-row gap-1 items-center rounded-lg dark:bg-zinc-900/30 bg-zinc-200">
          {cbBaseFile && (
            <button onClick={() => !isBaseFile && setBaseFile(full)}>
              <Wrench className={`w-5 h-5 ${isBaseFile && "text-cyan-300"}`} />
            </button>
          )}
          {cbBaseFile && (
            <div className="w-[1px] h-2/3 rounded-full bg-white/10 mx-1" />
          )}
          <button
            onClick={() => {
              if (!editing) editoring.forEach((v, k) => k !== full && v());
              setEditing(!editing);
            }}
          >
            <PencilLine className="w-5 h-5" />
          </button>
          <button
            onClick={() => confirm(`Delete ${full}?`) && deleteFiles(path)}
          >
            <Trash className="w-5 h-5" />
          </button>
        </div>
      </div>
      {editing && editErr && (
        <p
          className="text-md font-medium text-red-400"
          style={{
            marginLeft: rem(0.5),
            paddingRight: rem(0.5),
            width: "100%",
          }}
        >
          {editErr}
        </p>
      )}
      {expanded && (
        <>
          {creating && (
            <>
              <div
                className="flex flex-row justify-between"
                style={{
                  marginLeft: rem(0.75),
                  paddingRight: rem(0.75),
                  width: "100%",
                }}
              >
                <button
                  className={`flex flex-row gap-1 items-center text-md font-semibold px-2 py-1 rounded-lg ${
                    selected
                      ? "dark:bg-zinc-700/30 bg-zinc-0"
                      : "dark:bg-zinc-900/30 bg-zinc-200"
                  }`}
                >
                  <File className="w-5 h-5" />
                  <input
                    defaultValue={full + "/"}
                    className="bg-transparent"
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      validateFile(e.currentTarget.value) === true &&
                      (writeFile(filterPath(e.currentTarget.value), ""),
                      setCreating(false))
                    }
                    onChange={(e) => {
                      const res = validateFile(e.currentTarget.value);
                      if (res !== true) setCreatingErr(res);
                      else setCreatingErr(null);
                    }}
                  />
                </button>
              </div>
              {creatingErr && (
                <p
                  className="text-md font-medium text-red-400"
                  style={{
                    marginLeft: rem(0.5),
                    paddingRight: rem(0.5),
                    width: "100%",
                  }}
                >
                  {creatingErr}
                </p>
              )}
            </>
          )}
          {files.map(({ name, dir }) => (
            <FileEntry
              currentFile={currentFile}
              setCurrentFile={setCurrentFile}
              name={name}
              dir={dir}
              path={[...path, name]}
              key={[...path, name].join("/")}
            />
          ))}
        </>
      )}
    </>
  );
}

export default function FileView({
  currentFile,
  setCurrentFile,
}: {
  currentFile: string | null;
  setCurrentFile: (file: string) => void;
}) {
  const [files, setFiles] = useState(list([]));

  useEffect(() => {
    const upd = () => setFiles(list([]));
    window.addEventListener("fileChanged", upd);
    return () => window.removeEventListener("fileChanged", upd);
  });

  return (
    <div className="flex flex-col items-start gap-2">
      {files.map(({ name, dir }) => (
        <FileEntry
          currentFile={currentFile}
          setCurrentFile={setCurrentFile}
          name={name}
          dir={dir}
          path={[name]}
          key={name}
        />
      ))}
    </div>
  );
}
