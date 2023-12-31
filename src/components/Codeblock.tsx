import styles from "./Codeblock.module.css";

const typeMap = {
  text: { dark: "#AAAAAA", light: "#555555" },
  selector: { dark: "#55FFFF", light: "#00A6A6" },
  json: { dark: "#FFFF55", light: "#878700" },
};

export interface CodeblockLine {
  type: keyof typeof typeMap;
  text: string;
}

export default function Codeblock({ lines }: { lines: CodeblockLine[][] }) {
  return (
    <pre className="p-2 dark:bg-zinc-900/60 bg-zinc-200/60 rounded-md font-thin font-mono">
      <code
        className={`w-full block overflow-hidden whitespace-pre-wrap ${styles.wrapper}`}
      >
        <table>
          <tbody>
            {lines.map((x, i) => (
              <tr key={i}>
                <td className="pr-4 opacity-80 align-top">{i + 1}</td>
                <td>
                  {x.map((b, i) => (
                    <>
                      <span
                        style={{
                          ["--keyword-color-light" as any]:
                            typeMap[b.type].light,
                          ["--keyword-color-dark" as any]: typeMap[b.type].dark,
                        }}
                        className={styles.keyword}
                      >
                        {b.text}
                      </span>
                      {i !== x.length - 1 && " "}
                    </>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </code>
    </pre>
  );
}
