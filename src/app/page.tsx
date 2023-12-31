"use client";

import title from "@/../public/images/title.png";
import titleStaging from "@/../public/images/titlestaging.png";
import { useEffect, useState } from "react";
import FileEditor from "@/components/FileEditor";
import { baseFile } from "@/lib/files";
import Image from "next/image";
import FileView from "@/components/FileView";
import PreviewCanvas from "@/components/PreviewCanvas";
import { fetchAssets, fetchVersions } from "@/lib/mc";
import { toNamespace } from "@/lib/fontDrawer";
import FilePorterThing from "@/components/FilePorterThing";
import Popover from "@/components/Popover";
import parseText, { colors } from "@/lib/textParser";
import Codeblock, { CodeblockLine } from "@/components/Codeblock";
import Config from "@/components/Config";
import useConfig from "@/components/hooks/useConfig";
import isProduction from "@/lib/isProduction";

export default function App() {
  const [popover, setPopover] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(baseFile());
  const config = useConfig();

  useEffect(() => {
    const handler = (_ev: Event) => {
      if (!("detail" in _ev)) return;
      const ev = _ev as CustomEvent<string>;

      const full = ev.detail;
      if (full.endsWith(".json")) setCurrentFile(full);
      else setPopover(full);
    };

    window.addEventListener("filePreviewOpen", handler);
    return () => window.removeEventListener("filePreviewOpen", handler);
  });

  useEffect(() => {
    const press = (e: KeyboardEvent) => {
      if (e.code === "KeyS" && e.ctrlKey) return e.preventDefault();
    };

    window.addEventListener("keydown", press);
    return () => window.removeEventListener("keydown", press);
  });

  useEffect(() => {
    fetchVersions();
    fetchAssets();
  }, []);

  return (
    <>
      <Image
        src={isProduction() ? title : titleStaging}
        alt={
          isProduction()
            ? "Minecraft Font tool Beta"
            : "Minecraft Font tool Staging"
        }
        height={150}
        className="self-center select-none mb-5"
        onMouseDown={(e) => e.preventDefault()}
      />
      <h2 className="text-center text-2xl font-semibold">Files</h2>
      {currentFile !== null && (
        <FileEditor file={currentFile} close={() => setCurrentFile(null)} />
      )}
      <FilePorterThing />
      <FileView currentFile={currentFile} setCurrentFile={setCurrentFile} />
      <h2 className="text-center text-2xl font-semibold">Preview</h2>
      <Config {...config} />
      <PreviewCanvas
        scale={config.scale}
        locations={config.locations}
        hud={config.hud}
      />
      {baseFile() && (
        <Codeblock
          lines={config.locations.map((x) => {
            const parsed = parseText(
              x.text,
              toNamespace(baseFile()!, 1).slice(0, -5)
            );

            return [
              {
                type: "text",
                text: x.location === "chat" ? "/tellraw" : "/title",
              },
              {
                type: "selector",
                text: "@s",
              },
              x.location !== "chat" && {
                type: "text",
                text: x.location,
              },
              {
                type: "json",
                text: JSON.stringify(
                  parsed.length > 1 ? parsed : parsed[0]
                ).replace(
                  /[\u0100-\uffff]/g,
                  (e) => `\\u${e.charCodeAt(0).toString(16).padStart(4, "0")}`
                ),
              },
            ].filter((x) => !!x) as CodeblockLine[];
          })}
        />
      )}
      <div className="h-5" />
      <Popover file={popover} disable={() => setPopover(null)} />
    </>
  );
}
