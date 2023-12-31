import JSZip from "jszip";
import { fileExists, listFiles, readFile } from "./files";
import { assets, mcVersion } from "./mc";
import { ParsedTextKey, colors } from "./textParser";

export interface FontSchema {
  providers: (
    | {
        type: "reference";
        id: string;
      }
    | {
        type: "bitmap";
        file: string;
        height?: number;
        ascent: number;
        chars: string[];
      }
    | {
        type: "space";
        advances: Record<string, number>;
      }
    | {
        type: "ttf";
        file: string;
        shift: [number, number];
        size: number;
        oversample: number;
        skip: string[] | string;
      }
    | {
        type: "unihex";
        hex_file: string;
        size_overrides: {
          from: string;
          to: string;
          left: number;
          right: number;
        }[];
      }
  )[];
}

const namespacer = /^(\w+):(.+)$/;

const anyValid = (a: string) =>
  a.toLowerCase() === a
    ? !!resolveNamespace(a + ".json", ["font"]) || "json file doesn't exist"
    : "namespace must be lowercase";
const pngValid = (a: string) =>
  a.toLowerCase() === a
    ? !!resolveNamespace(a, ["textures"]) || "png file doesn't exist"
    : "namespace must be lowercase";
const ttfValid = (a: string) =>
  a.toLowerCase() === a
    ? !!resolveNamespace(a, ["font"]) || "ttf/otf file doesn't exist"
    : "namespace must be lowercase";
const zipValid = (a: string) =>
  a.toLowerCase() === a
    ? !!resolveNamespace(a, []) || "zip file doesn't exist"
    : "namespace must be lowercase";

export function validateFontSchema(font: FontSchema): true | JSX.Element {
  if (!Array.isArray(font.providers))
    return (
      <>
        Property <b>providers</b> must be <b>[ref]</b>
      </>
    );

  const valids = {
    reference: {
      id: { type: ["string"], validate: anyValid },
    },
    bitmap: {
      file: {
        type: ["string"],
        validate: pngValid,
      },
      height: ["number", "undefined"],
      ascent: {
        type: ["number"],
        validate: (a: number, obj: { height?: number }) => {
          const height = obj.height ?? 8;
          return a <= height || "ascent cannot be higher than height";
        },
      },
      chars: {
        type: ["[string]"],
        validate: (a: string[]) => {
          if (!a[0]) return "must have at least one entry";
          let len = a[0].length;
          return (
            a.every((x) => x.length === len) ||
            "all entries must be the same length"
          );
        },
      },
    },
    space: {
      advances: ["<string,number>"],
    },
    ttf: {
      file: { type: ["string"], validate: ttfValid },
      shift: ["[number,number]"],
      size: ["number"],
      oversample: ["number"],
      skip: ["[string]", "string"],
    },
    unihex: {
      hex_file: { type: ["string"], validate: zipValid },
      size_overrides: {
        type: ["[ref]"],
        ref: {
          from: ["string"],
          to: ["string"],
          left: ["number"],
          right: ["number"],
        },
      },
    },
  };

  const recursiveValid = (
    obj: any,
    ref: any,
    path: (string | number)[]
  ): true | JSX.Element => {
    let full = path
      .map((x, i) =>
        i !== 0 ? (typeof x === "number" ? `[${x}]` : `.${x}`) : x
      )
      .join("");
    if (typeof obj !== "object" || Array.isArray(obj))
      return (
        <>
          Entry <b>{full}</b> is not object
        </>
      );
    for (const [k, _v] of Object.entries(ref)) {
      full = [...path, k]
        .map((x, i) =>
          i !== 0 ? (typeof x === "number" ? `[${x}]` : `.${x}`) : x
        )
        .join("");
      const v = _v as
        | string[]
        | {
            type: string[];
            ref: any;
            validate: (a: any, b: any) => boolean;
          };
      const thing = obj[k];

      const types = "type" in v ? v.type : v;
      let typed: true | null | JSX.Element = null;
      for (const t of types) {
        if (typed === true) break;

        const [_, arr] = t.match(/^\[(.+?)\]$/) ?? [];
        const [__, dobjK, dobjV] = t.match(/^\<(.+?),(.+?)\>$/) ?? [];
        if (arr) {
          if (!Array.isArray(thing)) {
            typed = (
              <>
                Property <b>{full}</b> must be <b>{t}</b>
              </>
            );
            continue;
          }
          const av = arr.split(",");

          typed = thing.every((x, i) =>
            av.some((y) =>
              y === "ref" && "ref" in v
                ? recursiveValid(x, v.ref, [...path, k, i])
                : typeof x === y
            )
          ) || (
            <>
              Entries of array <b>{full}</b> must be <b>{t}</b>
            </>
          );
        } else if (dobjK && dobjV) {
          if (typeof thing !== "object" || Array.isArray(thing)) {
            typed = (
              <>
                Property <b>{full}</b> must be <b>{t}</b>
              </>
            );
            continue;
          }
          const ants = Object.entries(thing);
          const kav = dobjK.split(",");
          const vav = dobjV.split(",");

          typed = ants.every(([k]) => kav.some((x) => typeof k === x)) || (
            <>
              Keys of object <b>{full}</b> must be <b>{dobjK}</b>
            </>
          );
          if (typed)
            typed = ants.every(([_, d], i) =>
              vav.some((x) =>
                x === "ref" && "ref" in v
                  ? recursiveValid(d, v.ref, [...path, k, i])
                  : typeof d === x
              )
            ) || (
              <>
                Values of object <b>{full}</b> must be <b>{dobjV}</b>
              </>
            );
        } else {
          typed = (t === "ref" && "ref" in v
            ? recursiveValid(thing, v.ref, [...path, k])
            : typeof thing === t) || (
            <>
              Property <b>{full}</b> must be <b>{t}</b>
            </>
          );
        }

        if (typed === true && "validate" in v) {
          const val = v.validate(thing, obj);
          if (val !== true)
            typed = (
              <>
                Property <b>{full}</b> validation failed{" "}
                {typeof val === "string"
                  ? `(${val})`
                  : "for an unknown reason."}
              </>
            );
          else typed = true;
        }
      }

      if (typed !== true && typed) return typed;
    }

    return true;
  };

  let i = 0;
  for (const prov of font.providers) {
    const ref = valids[prov.type];
    if (!ref)
      return (
        <>
          Property <b>type</b> must be <b>{Object.keys(valids).join(",")}</b>
        </>
      );

    const res = recursiveValid(prov, ref, ["providers", i++]);
    if (res !== true) return res;
  }

  return true;
}

export function resolveNamespace(namespace: string, prefix: string[]) {
  const split = namespace.split(":");
  const path = [split[0], ...prefix, split.slice(1).join(":")].join("/");

  return assets.includes(path) || fileExists(path) ? path : false;
}
export function toNamespace(path: string, strip: number) {
  const pat = path.split("/");
  return [pat[0], pat.slice(1 + strip).join("/")].join(":");
}

export function assetsWith(path: string, exts: string | string[]) {
  const ext = Array.isArray(exts) ? exts : [exts];
  const base = assets
    .filter(
      (x) =>
        x.startsWith(`minecraft/${path ? path + "/" : ""}`) &&
        ext.some((y) => x.endsWith("." + y))
    )
    .map(
      (x) =>
        `minecraft:${x
          .split("/")
          .slice(path.split("/").length + 1)
          .join("/")}`
    );
  const add = listFiles()
    .filter(
      (x) =>
        x
          .split("/")
          .slice(1)
          .join("/")
          .startsWith(path ? path + "/" : "") &&
        ext.some((y) => x.endsWith("." + y))
    )
    .map(
      (x) =>
        `${x.split("/")[0]}:${x
          .split("/")
          .slice(path.split("/").length + 1)
          .join("/")}`
    );
  return [...base, ...add].sort();
}

function makePath(file: string, encoding: string): string {
  if (assets.includes(file))
    return fileExists(file)
      ? `data:${encoding};base64,${btoa(readFile(file)!)}`
      : `/api/asset?version=${encodeURIComponent(
          mcVersion
        )}&asset=${encodeURIComponent(file)}`;
  else return `data:${encoding};base64,${btoa(readFile(file)!)}`;
}

enum CharacterMapLoad {
  Bitmap,
  Unihex,
}

interface UnihexChar {
  l: number;
  r: number;
  w: number;
  h: number;
  pixels: { x: number; y: number }[];
}
type CharacterMap =
  | {
      load: CharacterMapLoad.Bitmap;
      ascent: number;
      height: number;
      image: HTMLImageElement;
      chars: Record<
        string,
        { x: number; y: number; w: number; h: number; s: number }
      >;
    }
  | {
      load: CharacterMapLoad.Unihex;
      chars: Record<string, UnihexChar>;
    };

const transparentPixelCache = new Map<string, Set<number>>();
const zipCache = new Map<string, JSZip.JSZipObject[]>();

export interface BuiltFont {
  spacing: Record<string, number>;
  characters: CharacterMap[];
}
export async function build(
  id: string,
  font: FontSchema,
  include?: Set<string>
): Promise<{ spacing: Record<string, number>; characters: CharacterMap[] }> {
  include ??= new Set();
  if (!include.has(id)) include.add(id);

  const spacing: Record<string, number> = {};
  const characters: CharacterMap[] = [];

  for (const prov of font.providers.slice().reverse()) {
    if (prov.type === "reference") {
      if (include.has(prov.id)) continue;
      include.add(prov.id);

      const path = resolveNamespace(prov.id + ".json", ["font"]);
      if (!path) continue;

      const refReq = await fetch(makePath(path, "application/json"), {
        headers: {
          "cache-control": "public, max-age=600",
        },
      });
      if (!refReq.ok) continue;

      let ref: any;
      try {
        ref = await refReq.json();
      } catch {
        continue;
      }

      const { spacing: rspacing, characters: rcharacters } = await build(
        prov.id,
        ref,
        include
      );

      for (const [k, v] of Object.entries(rspacing)) spacing[k] = v;
      for (const ch of rcharacters) characters.push(ch);
    } else if (prov.type === "space") {
      for (const [k, v] of Object.entries(prov.advances))
        spacing[k.charCodeAt(0)] = v;
    } else if (prov.type === "ttf") {
      //TODO - remember to implement this!!!
    } else if (prov.type === "unihex") {
      if (include.has("H" + prov.hex_file)) continue;
      include.add("H" + prov.hex_file);

      const path = resolveNamespace(prov.hex_file, []);
      if (!path) continue;
      const zipReq = await fetch(makePath(path, "fg"), {
        headers: {
          "cache-control": "public, max-age=600",
        },
      });
      if (!zipReq.ok) continue;

      let files = new Array<JSZip.JSZipObject>();

      if (zipCache.has(prov.hex_file)) files = zipCache.get(prov.hex_file)!;
      else {
        try {
          files = Object.values(
            (await JSZip.loadAsync(await zipReq.arrayBuffer())).files
          );
          zipCache.set(prov.hex_file, files);
        } catch {
          continue;
        }
      }

      const overrides = prov.size_overrides.map((x) => ({
        left: x.left ?? 0,
        right: x.right ?? 8,
        from: x.from?.charCodeAt(0) ?? 0x0000,
        to: x.to?.charCodeAt(0) ?? 0xffff,
      }));

      const chars: Record<string, any> = {};
      for (const fil of files.filter(
        (f) => !f.dir && !f.name.includes("/") && f.name.endsWith(".hex")
      )) {
        const lines = (await fil.async("text"))
          .split("\n")
          .map((x) => x.split(":"))
          .filter((x) => x.length === 2);
        for (const txt of lines) {
          const bin = txt[1]
            .split("")
            .map((x) => parseInt(x, 16).toString(2).padStart(4, "0"))
            .join("");
          const width = Math.floor(bin.length / 16);

          const char = parseInt(txt[0], 16);
          const override = overrides.find(
            (x) => char >= x.from && char <= x.to
          );
          if (!override) continue;
          const rows = bin.match(new RegExp(`(.{${width}})`, "g")) ?? [];

          const pixels: { x: number; y: number }[] = [];
          for (let rowI = 0; rowI < rows.length; rowI++)
            for (let charI = 0; charI < rows[rowI].length; charI++)
              if (rows[rowI][charI] === "1") pixels.push({ x: charI, y: rowI });

          chars[char] = {
            l: override.left,
            r: override.right,
            w: width,
            h: rows.length,
            pixels,
          };
        }
      }

      characters.push({ load: CharacterMapLoad.Unihex, chars });
    } else if (prov.type === "bitmap") {
      // if (include.has("B" + prov.file)) continue;
      // include.add("B" + prov.file);

      const path = resolveNamespace(prov.file, ["textures"]);
      if (!path) continue;

      const img = new Image();
      const statPromise = (() =>
        new Promise((res) => {
          img.addEventListener("load", () => res(true));
          img.addEventListener("error", () => res(false));
        }))();
      img.src = makePath(path, "image/png");

      const stat = await statPromise;
      if (!stat) continue;

      let cache = transparentPixelCache.get(prov.file)!;
      if (!cache) {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const { data } = ctx.getImageData(0, 0, img.width, img.height);

        cache = new Set<number>();
        for (let i = 0; i < data.length; i += 4)
          if (data[i + 3] === 0) cache.add(i / 4);
        transparentPixelCache.set(prov.file, cache);
      }

      const map: CharacterMap = {
        load: CharacterMapLoad.Bitmap,
        ascent: prov.ascent,
        height: prov.height ?? 8,
        image: img,
        chars: {},
      };

      const chW = Math.floor(img.width / prov.chars[0].length);
      const chH = Math.floor(img.height / prov.chars.length);

      for (let y = 0; y < prov.chars.length; y++) {
        for (let x = 0; x < prov.chars[0].length; x++) {
          const char = prov.chars[y][x];
          const X = x * chW,
            Y = y * chH,
            I = X + Y * img.width;

          let wid = 0;
          for (let offX = chW - 1; offX >= 0; offX--) {
            wid = offX;

            if (
              !new Array(chH)
                .fill(0)
                .every((_, offY) => cache.has(I + offX + offY * img.width))
            )
              break;
          }

          map.chars[char.charCodeAt(0)] = {
            x: X,
            y: Y,
            w: chW,
            h: chH,
            s: wid + 1,
          };
        }
      }

      characters.push(map);
    }
  }

  return { spacing, characters };
}

interface MadeCharFilters {
  color?: string;
  bold?: boolean;
  underline?: boolean;
  obfuscated?: boolean;
}

export enum MadeCharType {
  Image,
  Pixels,
  Indicator,
}
type MadeChar = {
  filters: MadeCharFilters;
} & (
  | {
      type: MadeCharType.Image;
      img: HTMLImageElement;
      pos: {
        x: number;
        y: number;
      };
      size: {
        w: number;
        h: number;
      };
      crop: {
        x: number;
        y: number;
        w: number;
        h: number;
      };
    }
  | {
      type: MadeCharType.Pixels;
      pos: {
        x: number;
        y: number;
      };
      size: {
        w: number;
        h: number;
      };
      pixSize: number;
      pixels: {
        x: number;
        y: number;
      }[];
    }
  | {
      type: MadeCharType.Indicator;
      pos: {
        x: number;
        y: number;
      };
      size: {
        w: number;
        h: number;
      };
    }
);
export interface MadeText {
  chars: MadeChar[];
  width: number;
  height: number;
}
export function makeText(
  font: BuiltFont,
  parsed: ParsedTextKey[],
  lines: boolean
): MadeText {
  const chars = new Array<MadeChar>();
  const unknown = new Image();
  unknown.src =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAICAYAAAAx8TU7AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAfSURBVBhXY/z9+/d/BnSALgjiM0HZKIAWglicxMAAAAxuD82P1il1AAAAAElFTkSuQmCC";

  let x = 0,
    y = 0;
  let filters: MadeCharFilters = {};
  for (const dt of parsed) {
    if (dt.reset) filters = {};

    if (dt.color) filters.color = colors.find((x) => x.name === dt.color)?.hex;
    if (dt.bold) filters.bold = true;
    if (dt.underline) filters.underline = true;
    if (dt.obfuscated) filters.obfuscated = true;

    const rawChars = dt.text.split("");
    for (const ch of rawChars) {
      let key = ch.charCodeAt(0);
      const space = font.spacing[key];
      if (space) {
        chars.push({
          type: MadeCharType.Indicator,
          pos: {
            x,
            y,
          },
          size: {
            w: space,
            h: 0,
          },
          filters: { ...filters },
        });
        x += space;
        continue;
      }

      if (lines && ch === "\n") {
        y += 9;
        x = 0;
        continue;
      }

      const boldOff = filters.bold ? 1 : 0;

      let data: CharacterMap | undefined;
      if (dt.obfuscated) {
        data =
          font.characters[Math.floor(Math.random() * font.characters.length)];
        const keys = Object.keys(data.chars).map((x) => Number(x));
        key = keys[Math.floor(Math.random() * keys.length)];
      } else data = font.characters.findLast((m) => m.chars[key]);

      if (!data || !data.chars[key]) {
        chars.push({
          type: MadeCharType.Image,
          img: unknown,
          pos: {
            x: x - 1,
            y: y - 7,
          },
          size: {
            w: 5,
            h: 8,
          },
          crop: {
            x: 0,
            y: 0,
            w: 5,
            h: 8,
          },
          filters: { ...filters },
        });
        x += 5 + boldOff;
      } else {
        if (data.load === CharacterMapLoad.Bitmap) {
          const char = data.chars[key];
          const sizeW = Math.round((char.s / char.w) * data.height);
          chars.push({
            type: MadeCharType.Image,
            img: data.image,
            pos: {
              x,
              y: -data.ascent + y,
            },
            size: {
              w: sizeW,
              h: data.height,
            },
            crop: {
              x: char.x,
              y: char.y,
              w: char.s,
              h: char.h,
            },
            filters: { ...filters },
          });
          x += sizeW + 1 + boldOff;
        } else if (data.load === CharacterMapLoad.Unihex) {
          const char = data.chars[key];

          const m = 8 / char.h;
          x -= char.l * m;

          const pixels: { x: number; y: number }[] = [];
          for (const pix of char.pixels)
            pixels.push({
              x: pix.x * m,
              y: pix.y * m,
            });

          chars.push({
            type: MadeCharType.Pixels,
            pos: { x, y: -char.h * m + y },
            size: { w: char.w * m, h: char.h * m },
            pixSize: m,
            pixels,
            filters: { ...filters },
          });
          x += char.r * m + boldOff * m;
        }
      }
    }
  }

  return {
    chars,
    width: x - 1,
    height: y,
  };
}
