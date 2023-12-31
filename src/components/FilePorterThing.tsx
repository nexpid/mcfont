import {
  allowedTypes,
  availablePath,
  ensureFiles,
  fileExists,
  writeFile,
  files,
} from "@/lib/files";
import JSZip from "jszip";
import { Download, Import } from "lucide-react";
import { useRef, useState } from "react";

const simpleFormat = (file: string, cur: number, max: number) =>
  `${Math.floor((cur / max) * 100)}% — ${file}`;

export default function FilePorterThing() {
  const [pending, setPending] = useState<
    [false | true | "upload", string | null]
  >([false, null]);
  const [dragging, setDragging] = useState(false);

  const importZipRef = useRef<HTMLInputElement | null>(null);
  const uploadRef = useRef<HTMLInputElement | null>(null);

  const runWithFiles = async (files: File[]) => {
    if (pending[0]) return;
    setPending(["upload", null]);

    const afiles = new Array<{ path: string; f: File }>();
    for (const f of files) {
      if (!allowedTypes.some((x) => f.name.toLowerCase().endsWith(`.${x}`)))
        continue;

      const splat = f.name.split(".");
      afiles.push({
        path: availablePath(
          splat.slice(0, -1).join("."),
          splat.slice(-1).join(".")
        ),
        f,
      });
    }

    for (let i = 0; i < afiles.length; i++) {
      const { path, f } = afiles[i];

      setPending(["upload", simpleFormat(path, i, afiles.length)]);
      try {
        const buffer = await f.arrayBuffer();
        writeFile(
          path,
          String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer)))
        );
      } catch {}
    }

    setTimeout(() => setPending([false, null]));
  };

  return (
    <>
      <div
        className={`flex justify-center gap-1 ${pending[0] && "opacity-60"}`}
      >
        <button
          className="flex gap-1 items-center text-md font-semibold px-2 py-1 rounded-lg dark:bg-zinc-900/30 bg-zinc-200"
          onClick={async () => {
            if (pending[0]) return;
            const zip = new JSZip();

            ensureFiles();
            for (const [file, val] of Object.entries(files))
              zip.file(file, btoa(val), { base64: true });
            const blob = await zip.generateAsync({ type: "blob" });

            const url = URL.createObjectURL(new File([blob], "export.zip"));
            window.open(url, "_self");
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="w-5 h-5" />
          Export zip
        </button>
        <button
          className="flex gap-1 items-center text-md font-semibold px-2 py-1 rounded-lg dark:bg-zinc-900/30 bg-zinc-200"
          onClick={() => importZipRef.current?.click()}
        >
          <Import className="w-5 h-5" />
          Import zip
          <input
            type="file"
            ref={(e) => (importZipRef.current = e)}
            onChange={async (e) => {
              e.preventDefault();
              if (pending[0] || !e.currentTarget.files) return;

              const file = Array.from(e.currentTarget.files).find((x) =>
                ["application/x-zip-compressed", "application/zip"].some(
                  (y) => x.type === y
                )
              );
              if (!file) return;

              setPending([true, null]);
              try {
                const zip = new JSZip();
                await zip.loadAsync(file);

                const files = zip.filter(
                  (_, f) =>
                    !f.dir &&
                    (allowedTypes.some((y) => f.name.endsWith("." + y)) ||
                      !f.name.includes("."))
                );
                const existed = files.filter((x) => fileExists(x.name));
                const overwrite =
                  existed.length !== 0
                    ? confirm(
                        `Files\n\n${existed
                          .map((x) => `• ${x.name}`)
                          .join("\n")}\n\nalready exist. Overwrite them? `
                      )
                    : true;

                const afiles = new Array<{
                  path: string;
                  f: JSZip.JSZipObject;
                }>();
                for (const f of files) {
                  if (fileExists(f.name) && !overwrite) {
                    const av = f.name.includes(".")
                      ? availablePath(
                          f.name.split(".").slice(0, -1).join("."),
                          f.name.split(".").slice(-1)[0]
                        )
                      : availablePath(f.name);
                    afiles.push({ path: av, f });
                  } else afiles.push({ path: f.name, f });
                }

                for (let i = 0; i < afiles.length; i++) {
                  const { path, f } = afiles[i];
                  setPending([true, simpleFormat(path, i, afiles.length)]);

                  try {
                    const val = String.fromCharCode.apply(
                      null,
                      Array.from(new Uint8Array(await f.async("arraybuffer")))
                    );
                    writeFile(path, val);
                  } catch (e) {
                    console.log(e);
                  }
                }

                setPending([false, null]);
              } catch {
                return setPending([false, null]);
              }
            }}
            className="hidden"
          />
        </button>
      </div>
      <button
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          runWithFiles(Array.from(e.dataTransfer.files));
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        className={`w-full dark:bg-zinc-900/30 dark:hover:bg-zinc-900/10 bg-zinc-200 hover:bg-zinc-300 transition-colors ${
          pending[0] && "opacity-60 cursor-not-allowed"
        }`}
        disabled={!!pending[0]}
        onClick={() => !pending[0] && uploadRef.current?.click()}
      >
        <h1 className="font-semibold text-lg py-5">
          {pending[0] === "upload" ? (
            <>Processing files...</>
          ) : dragging ? (
            <>Drop file here</>
          ) : (
            <>Drop files here/click to open uploader</>
          )}
        </h1>
        <input
          type="file"
          className="hidden"
          multiple={true}
          ref={(e) => (uploadRef.current = e)}
          onChange={(e) => {
            e.preventDefault();
            if (e.currentTarget.files)
              runWithFiles(Array.from(e.currentTarget.files));
          }}
        />
      </button>
      {typeof pending[1] === "string" && (
        <h1 className="text-lg font-semibold text-center">{pending[1]}</h1>
      )}
    </>
  );
}
