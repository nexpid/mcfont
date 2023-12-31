const defColor = (key: string, name: string, hex: string) => ({
  key,
  name,
  hex,
});
export const colors = [
  defColor("0", "black", "#000000"),
  defColor("1", "dark_blue", "#0000AA"),
  defColor("2", "dark_green", "#00AA00"),
  defColor("3", "dark_aqua", "#00AAAA"),
  defColor("4", "dark_red", "#AA0000"),
  defColor("5", "dark_purple", "#AA00AA"),
  defColor("6", "gold", "#FFAA00"),
  defColor("7", "gray", "#AAAAAA"),
  defColor("8", "dark_gray", "#555555"),
  defColor("9", "blue", "#5555FF"),
  defColor("a", "green", "#55FF55"),
  defColor("b", "aqua", "#55FFFF"),
  defColor("c", "red", "#FF5555"),
  defColor("d", "light_purple", "#FF55FF"),
  defColor("e", "yellow", "#FFFF55"),
  defColor("f", "white", "#FFFFFF"),
];

const defFormat = (key: string, prop: string) => ({ key, prop });
export const formats = [
  defFormat("k", "obfuscated"),
  defFormat("l", "bold"),
  defFormat("m", "strikethrough"),
  defFormat("n", "underline"),
  defFormat("o", "italic"),
  defFormat("r", "reset"),
];

export type ParsedTextKey = {
  text: string;
  font: string;
  color?: string;
  obfuscated?: boolean;
  bold?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  italic?: boolean;
  reset?: boolean;
};

export default function parseText(text: string, font: string): ParsedTextKey[] {
  const keys = new Array<ParsedTextKey>();
  let extra: Record<string, any> = {};

  const comb = text.split(/§([a-z0-9klmnor])/g);
  for (let i = 0; i < comb.length; i += 2) {
    const txt = comb[i],
      key = comb[i + 1];

    if (txt) {
      keys.push({
        text: txt,
        ...extra,
        font,
      });

      extra = {};
    }

    const clr = colors.find((x) => x.key === key);
    const form = formats.find((x) => x.key === key);

    if (clr) extra.color = clr.name;
    if (form) extra[form.prop] = true;
  }

  if (!keys[0])
    keys.push({
      text: "",
      font,
    });

  return keys;
}
