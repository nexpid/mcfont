/* eslint-disable @next/next/no-img-element */
import { readFile } from "@/lib/files";
import { Download } from "lucide-react";

export default function Popover({
  file,
  disable,
}: {
  file: string | null;
  disable: () => void;
}) {
  return (
    <button
      className={`w-full h-full left-0 top-0 fixed bg-black/50 ${
        !file && "opacity-0 pointer-events-none"
      } transition-opacity cursor-default flex items-center justify-center`}
      onClick={disable}
    >
      <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 flex flex-col items-center gap-1">
        {file &&
          (file.endsWith(".png") ? (
            <img
              src={`data:image/png;base64,${btoa(readFile(file))}`}
              alt={`Preview of ${file.split("/").slice(-1)[0]}`}
              className="mb-1 bg-black dark:bg-white"
            />
          ) : file.endsWith(".ttf") || file.endsWith(".otf") ? (
            <>
              <style>{`@font-face {
  font-family: "Popover";
  src: url(${JSON.stringify(
    `data:font/${file.split(".").slice(-1)[0]};base64,${btoa(readFile(file))}`
  )});
}`}</style>
              <h2 className="px-4 mb-2 select-none font-normal text-4xl font-[Popover]">
                ABCDEFGHIJKLM
                <br />
                NOPQRSTUVWXYZ
                <br />
                abcdefghijklm
                <br />
                nopqrstuvwxyz
                <br />
                1234657890
              </h2>
            </>
          ) : null)}
        <button
          className="flex gap-1 items-center text-md font-semibold px-2 py-1 rounded-lg dark:bg-zinc-900/30 bg-zinc-200"
          onClick={async () => {
            if (!file) return;

            const url = URL.createObjectURL(
              new File([readFile(file)], file.split("/").slice(-1)[0])
            );
            window.open(url, "_self");
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="w-5 h-5" />
          Download
        </button>
      </div>
    </button>
  );
}
