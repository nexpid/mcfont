import { fileExists, readFile, writeFile } from "@/lib/files";
import schema from "../lib/fontSchema.json";
import { Editor } from "@monaco-editor/react";
import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useEffect, useState } from "react";
import { assetsWith } from "@/lib/fontDrawer";
import useFetching from "./hooks/useFetching";

export interface EditorData {
  m: Monaco;
  e: editor.IStandaloneCodeEditor;
}

export default function FileEditor({
  file,
  close,
}: {
  file: string;
  close?: () => void;
}) {
  const [editor, setEditor] = useState<EditorData | null>(null);
  const [value, setValue] = useState<string | null>(null);
  const fetching = useFetching();
  const fetchingVals = Array.from(fetching.values());

  useEffect(() => {
    const schemaPlus = JSON.parse(JSON.stringify(schema));
    schemaPlus.definitions.anyFile.enum = assetsWith("font", "json").map((x) =>
      x.slice(0, -5)
    );
    schemaPlus.definitions.pngFile.enum = assetsWith("textures", "png");
    schemaPlus.definitions.ttfFile.enum = assetsWith("font", ["ttf", "otf"]);
    schemaPlus.definitions.zipFile.enum = assetsWith("", "zip");

    editor?.m.languages.json.jsonDefaults.setDiagnosticsOptions({
      schemas: [
        {
          uri: "/",
          fileMatch: ["*/font/**/*.json"],
          schema: schemaPlus,
        },
      ],
    });
  }, [editor, file, fetchingVals]);

  useEffect(() => {
    setValue(null);
    setValue(readFile(file));
  }, [file]);

  useEffect(() => {
    if (value && fileExists(file)) writeFile(file, value);
  }, [value, file]);

  useEffect(() => {
    const theme = window.matchMedia("(prefers-color-scheme: dark)");
    const changed = () =>
      //@ts-ignore womp womp
      editor?.e._themeService.setTheme(theme.matches ? "vs-dark" : "light");
    changed();

    theme.addEventListener("change", changed);
    return () => theme.removeEventListener("change", changed);
  }, [editor]);

  useEffect(() => {
    const upd = () => !fileExists(file) && (setValue(null), close?.());
    window.addEventListener("fileChanged", upd);
    return () => window.removeEventListener("fileChanged", upd);
  });

  return value !== null ? (
    <div className="flex flex-col">
      <p className="w-full h-6 dark:bg-[#1e1e1e] dark:text-[#d4d4d4] bg-[#fffffe] text-black text-center text-sm flex flex-col justify-center select-none">
        {file}
      </p>
      <div className="w-full h-[5px] z-10 bg-gradient-to-b dark:from-black/40 from-black/40" />
      <div className="w-full h-80 flex justify-center items-center dark:bg-[#1e1e1e] bg-[#fffffe] -mt-[5px]">
        {fetching.has("assets") && (
          <p className="text-md font-medium">Fetching assets...</p>
        )}
        {!fetching.has("assets") && (
          <Editor
            height="100%"
            width="100%"
            language="json"
            value={value}
            theme="vs-dark"
            path={file}
            onMount={(e, m) => setEditor({ m, e })}
            onChange={(val) => setValue(val ?? "")}
          />
        )}
      </div>
    </div>
  ) : (
    <div className="h-[21.5rem] bg-zinc-200 dark:bg-zinc-900/30 rounded-md" />
  );
}
