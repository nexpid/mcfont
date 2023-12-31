/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import useImage from "./hooks/useImage";
import {
  BuiltFont,
  MadeCharType,
  MadeText,
  build,
  makeText,
  validateFontSchema,
} from "@/lib/fontDrawer";
import { baseFile, readFile } from "@/lib/files";
import useFetching from "./hooks/useFetching";
import parseText, { ParsedTextKey } from "@/lib/textParser";

export type PreviewLocation = "chat" | "title" | "subtitle" | "actionbar";
export type PreviewHud = "barebones" | "blockbench" | "random";

export default function PreviewCanvas({
  scale,
  hud,
  locations,
}: {
  scale: number;
  hud: PreviewHud;
  locations: {
    location: PreviewLocation;
    text: string;
  }[];
}) {
  const [built, setBuilt] = useState<BuiltFont | null | [JSX.Element]>(null);
  const builter = useRef(setBuilt);
  builter.current = setBuilt;
  const fetching = useFetching();

  const canvas = useRef<HTMLCanvasElement | null>();

  const az = {
    hotbar: useImage("minecraft/textures/gui/sprites/hud/hotbar.png")!,
    hotbarSel: useImage(
      "minecraft/textures/gui/sprites/hud/hotbar_selection.png"
    )!,
    xpBarBg: useImage(
      "minecraft/textures/gui/sprites/hud/experience_bar_background.png"
    )!,
    xpBar: useImage(
      "minecraft/textures/gui/sprites/hud/experience_bar_progress.png"
    )!,

    heartContainer: useImage(
      "minecraft/textures/gui/sprites/hud/heart/container.png"
    )!,
    heartFull: useImage("minecraft/textures/gui/sprites/hud/heart/full.png")!,
    heartHalf: useImage("minecraft/textures/gui/sprites/hud/heart/half.png")!,

    foodEmpty: useImage("minecraft/textures/gui/sprites/hud/food_empty.png")!,
    foodFull: useImage("minecraft/textures/gui/sprites/hud/food_full.png")!,
    foodHalf: useImage("minecraft/textures/gui/sprites/hud/food_half.png")!,

    armorEmpty: useImage("minecraft/textures/gui/sprites/hud/armor_empty.png")!,
    armorFull: useImage("minecraft/textures/gui/sprites/hud/armor_full.png")!,
    armorHalf: useImage("minecraft/textures/gui/sprites/hud/armor_half.png")!,

    crosshair: useImage("minecraft/textures/gui/sprites/hud/crosshair.png")!,

    blockbench: useImage("/images/blockbench/hud.png", true)!,
  };

  useEffect(() => {
    const canv = canvas.current;
    if (
      !canv ||
      (Object.values(az) as any[]).includes(null) ||
      !built ||
      Array.isArray(built)
    )
      return;

    canv.width = 854;
    canv.height = 480;
    const ctx = canv.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canv.width, canv.height);

    const dupe = (): [HTMLCanvasElement, CanvasRenderingContext2D] => {
      const ncnv = document.createElement("canvas");
      ncnv.width = canv.width;
      ncnv.height = canv.height;
      const nctx = ncnv.getContext("2d")!;
      nctx.imageSmoothingEnabled = false;
      return [ncnv, nctx];
    };

    const [shadCnv, shadCtx] = dupe();
    const [textCnv, textCtx] = dupe();

    const hotbX =
      Math.round(canv.width / 2) - 91 * scale - Math.floor(0.5 * scale);

    if (hud === "blockbench") {
      ctx.drawImage(
        az.blockbench,
        hotbX - 29 * scale,
        canv.height - 39 * scale,
        212 * scale,
        39 * scale
      );
    } else {
      ctx.drawImage(
        az.hotbar,
        hotbX,
        canv.height - 22 * scale,
        182 * scale,
        22 * scale
      );
      ctx.drawImage(
        az.hotbarSel,
        hotbX -
          scale +
          20 *
            scale *
            (hud === "barebones" ? 4 : Math.floor(Math.random() * 9)),
        canv.height - 23 * scale,
        24 * scale,
        23 * scale
      );

      ctx.drawImage(
        az.xpBarBg,
        hotbX,
        canv.height - 29 * scale,
        182 * scale,
        5 * scale
      );
      const xpProg = hud === "barebones" ? 0 : Math.round(Math.random() * 182);
      ctx.drawImage(
        az.xpBar,
        0,
        0,
        xpProg,
        5,
        hotbX,
        canv.height - 29 * scale,
        xpProg * scale,
        5 * scale
      );

      const hearts =
        hud === "barebones"
          ? 20
          : Math.max(Math.round(Math.random() * 20) / 2, 1);
      for (let i = 0; i < 10; i++) {
        const val = Math.max(Math.min(hearts - i, 1), 0);
        const img =
          val === 0.5 ? az.heartHalf : val === 1 ? az.heartFull : null;

        ctx.drawImage(
          az.heartContainer,
          hotbX + i * 8 * scale,
          canv.height - 39 * scale,
          9 * scale,
          9 * scale
        );
        if (img)
          ctx.drawImage(
            img,
            hotbX + i * 8 * scale,
            canv.height - 39 * scale,
            9 * scale,
            9 * scale
          );
      }

      const hunger =
        hud === "barebones" ? 20 : Math.round(Math.random() * 20) / 2;
      for (let i = 0; i < 10; i++) {
        const val = Math.max(Math.min(hunger - i, 1), 0);
        const img = val === 0.5 ? az.foodHalf : val === 1 ? az.foodFull : null;

        ctx.drawImage(
          az.foodEmpty,
          hotbX + 101 * scale + (9 - i) * 8 * scale,
          canv.height - 39 * scale,
          9 * scale,
          9 * scale
        );
        if (img)
          ctx.drawImage(
            img,
            hotbX + 101 * scale + (9 - i) * 8 * scale,
            canv.height - 39 * scale,
            9 * scale,
            9 * scale
          );
      }

      const armor =
        hud === "barebones" ? 20 : Math.round(Math.random() * 20) / 2;
      if ((hud === "barebones" ? true : Math.random() <= 0.5) && armor > 0)
        for (let i = 0; i < 10; i++) {
          const val = Math.max(Math.min(armor - i, 1), 0);
          const img =
            val === 0.5 ? az.armorHalf : val === 1 ? az.armorFull : null;

          ctx.drawImage(
            az.armorEmpty,
            hotbX + i * 8 * scale,
            canv.height - 49 * scale,
            9 * scale,
            9 * scale
          );
          if (img)
            ctx.drawImage(
              img,
              hotbX + i * 8 * scale,
              canv.height - 49 * scale,
              9 * scale,
              9 * scale
            );
        }
    }

    ctx.drawImage(
      az.crosshair,
      Math.round(canv.width / 2) - Math.round(7.5 * scale),
      Math.round(canv.height / 2) -
        Math.round(7.5 * scale) -
        Math.floor(0.5 * scale),
      15 * scale,
      15 * scale
    );

    const draw = (
      txt: MadeText,
      tScale: number,
      tPosX: number,
      tPosY: number
    ) => {
      let lastColor: string | undefined = undefined;
      for (const char of txt.chars) {
        const fx = tPosX + char.pos.x * tScale;
        const fy = tPosY + char.pos.y * tScale;
        const fw = tScale + char.size.w * tScale;
        const fh = tScale + char.size.h * tScale;

        if (lastColor !== char.filters.color) {
          emptyCanvas();
          lastColor = char.filters.color;
        }

        if (fx < -fw || fx > canv.width) continue;
        if (fy < -fh || fy > canv.height) continue;

        if (char.type === MadeCharType.Image) {
          const rep = (o: number) => {
            shadCtx.drawImage(
              char.img,
              char.crop.x,
              char.crop.y,
              char.crop.w,
              char.crop.h,
              fx + tScale + o,
              fy + tScale,
              char.size.w * tScale,
              char.size.h * tScale
            );
            textCtx.drawImage(
              char.img,
              char.crop.x,
              char.crop.y,
              char.crop.w,
              char.crop.h,
              fx + o,
              fy,
              char.size.w * tScale,
              char.size.h * tScale
            );
          };

          rep(0);
          if (char.filters.bold) rep(tScale);

          const wOff = char.filters.bold ? tScale : 0;
          if (char.filters.color) {
            shadCtx.globalCompositeOperation = "source-atop";
            textCtx.globalCompositeOperation = "source-atop";
            shadCtx.fillStyle = char.filters.color + "bf";
            textCtx.fillStyle = char.filters.color;
            shadCtx.fillRect(
              fx + tScale,
              fy + tScale,
              char.size.w * tScale + wOff,
              char.size.h * tScale
            );
            textCtx.fillRect(
              fx,
              fy,
              char.size.w * tScale + wOff,
              char.size.h * tScale
            );
            shadCtx.globalCompositeOperation = "source-over";
            textCtx.globalCompositeOperation = "source-over";
          }
        } else if (char.type === MadeCharType.Pixels) {
          shadCtx.fillStyle = char.filters.color ?? "#fff";
          textCtx.fillStyle = char.filters.color ?? "#fff";

          const rep = (o: number) => {
            for (const p of char.pixels) {
              shadCtx.fillRect(
                fx + p.x * tScale + char.pixSize * tScale,
                fy + p.y * tScale + char.pixSize * tScale,
                char.pixSize * tScale + o,
                char.pixSize * tScale
              );
              textCtx.fillRect(
                fx + p.x * tScale,
                fy + p.y * tScale,
                char.pixSize * tScale + o,
                char.pixSize * tScale
              );
            }
          };

          rep(0);
          if (char.filters.bold) rep(char.pixSize * tScale);
        }

        if (char.filters.underline) {
          shadCtx.fillStyle = char.filters.color ?? "#fff";
          textCtx.fillStyle = char.filters.color ?? "#fff";

          const siz = char.filters.bold ? 2 : 1;
          shadCtx.fillRect(
            fx + tScale,
            tPosY + tScale * 2 + tScale,
            (char.size.w + siz) * tScale,
            tScale
          );
          textCtx.fillRect(
            fx,
            tPosY + tScale * 2,
            (char.size.w + siz) * tScale,
            tScale
          );
        }
      }
    };

    const used = new Set<PreviewLocation>();

    const parsedTexts = new Map<string, ParsedTextKey[]>();
    const madeTexts = new Map<string, MadeText>();

    for (const t of locations) {
      if (!parsedTexts.has(t.text))
        parsedTexts.set(t.text, parseText(t.text, ""));
      if (
        !madeTexts.has(t.text + (t.location === "chat")) &&
        parsedTexts.has(t.text)
      )
        madeTexts.set(
          t.text + (t.location === "chat"),
          makeText(built, parsedTexts.get(t.text)!, t.location === "chat")
        );
    }

    const emptyCanvas = () => {
      shadCtx.globalCompositeOperation = "source-atop";
      shadCtx.fillStyle = "#000000bf";
      shadCtx.fillRect(0, 0, shadCnv.width, shadCnv.height);
      shadCtx.globalCompositeOperation = "source-over";
      ctx.drawImage(shadCnv, 0, 0);
      shadCtx.clearRect(0, 0, shadCnv.width, shadCnv.height);
      ctx.drawImage(textCnv, 0, 0);
      textCtx.clearRect(0, 0, textCnv.width, textCnv.height);
    };

    const sorted: PreviewLocation[] = [
      "actionbar",
      "subtitle",
      "title",
      "chat",
    ];
    for (const loc of sorted.map((x) =>
      locations.find((y) => y.location === x)
    )) {
      if (!loc || used.has(loc.location)) continue;

      const txt = madeTexts.get(loc.text + (loc.location === "chat"));
      if (!txt) continue;

      let tScale = scale,
        x = 0,
        y = 0;
      if (loc.location === "title")
        (tScale = 4 * scale),
          (x =
            Math.floor(canv.width / 2 - (txt.width * 4 * scale) / 2) -
            2 * scale -
            Math.floor(0.5 * scale)),
          (y = Math.round(canv.height / 2) - 12 * scale);
      if (loc.location === "subtitle")
        (tScale = 2 * scale),
          (x =
            Math.floor(canv.width / 2 - (txt.width * 2 * scale) / 2) -
            Math.floor(0.5 * scale)),
          (y = Math.round(canv.height / 2) + 24 * scale);
      if (loc.location === "actionbar")
        (x =
          Math.floor(canv.width / 2 - (txt.width * scale) / 2) -
          Math.floor(0.5 * scale)),
          (y = canv.height - 65 * scale);
      if (loc.location === "chat")
        (tScale = scale), (x = 5 * scale), (y = canv.height - 41 * scale);

      if (loc.location === "chat") {
        const ay = txt.height;
        emptyCanvas();
        ctx.fillStyle = "#0000007d";
        ctx.fillRect(
          0,
          canv.height - 49 * scale - ay * scale,
          332 * scale,
          (txt.height + 9) * scale
        );
        ctx.fillStyle = "#D0D0D0";
        ctx.fillRect(
          0,
          canv.height - 49 * scale - ay * scale,
          2 * scale,
          (txt.height + 9) * scale
        );

        draw(txt, tScale, x, y - ay * scale);
      } else draw(txt, tScale, x, y);
    }

    emptyCanvas();
  }, [scale, locations, Object.values(az)]);

  const upd = () => {
    builter.current(null);
    const base = baseFile();
    if (!base) return builter.current([<>No base file selected</>]);

    let json;
    try {
      json = JSON.parse(readFile(base) ?? "");
    } catch {
      return builter.current([
        <>
          Failed to parse <b>{base}</b>
        </>,
      ]);
    }

    const valid = validateFontSchema(json);
    if (valid !== true) return builter.current([valid]);

    build("custom:foobar", json).then((d) => builter.current(d));
  };

  useEffect(() => {
    window.addEventListener("fileChanged", upd);
    return () => window.removeEventListener("fileChanged", upd);
  });
  useEffect(upd, [fetching.has("assets")]);

  return (
    <div className="w-full aspect-[854/480] flex items-center justify-center dark:bg-zinc-900/30 bg-zinc-200 rounded-md">
      {built === null ? (
        <p className="text-lg font-semibold">...</p>
      ) : Array.isArray(built) ? (
        <p className="text-lg font-medium text-red-400">{built[0]}</p>
      ) : (
        <canvas className="w-full h-full" ref={(e) => (canvas.current = e)} />
      )}
    </div>
  );
}
