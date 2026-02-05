import type { ReactNode } from "react";

const buildLcsTable = (fromLines: string[], toLines: string[]) => {
  const rows = fromLines.length;
  const cols = toLines.length;
  const table: number[][] = Array.from({ length: rows + 1 }, () => Array(cols + 1).fill(0));

  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = cols - 1; j >= 0; j -= 1) {
      if (fromLines[i] === toLines[j]) {
        table[i][j] = table[i + 1][j + 1] + 1;
      } else {
        table[i][j] = Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
  }

  return table;
};

type DiffLine = {
  type: "equal" | "add" | "remove";
  value: string;
};

const diffLines = (fromText: string, toText: string): DiffLine[] => {
  const fromLines = fromText.split("\n");
  const toLines = toText.split("\n");
  const table = buildLcsTable(fromLines, toLines);

  const output: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < fromLines.length && j < toLines.length) {
    if (fromLines[i] === toLines[j]) {
      output.push({ type: "equal", value: fromLines[i] });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      output.push({ type: "remove", value: fromLines[i] });
      i += 1;
    } else {
      output.push({ type: "add", value: toLines[j] });
      j += 1;
    }
  }

  while (i < fromLines.length) {
    output.push({ type: "remove", value: fromLines[i] });
    i += 1;
  }

  while (j < toLines.length) {
    output.push({ type: "add", value: toLines[j] });
    j += 1;
  }

  return output;
};

type DiffRow = {
  id: string;
  left: ReactNode;
  right: ReactNode;
};

type RulepackDiffProps = {
  fromText: string;
  toText: string;
};

export function RulepackDiff({ fromText, toText }: RulepackDiffProps) {
  const lines = diffLines(fromText, toText);
  let leftLine = 1;
  let rightLine = 1;

  const rows: DiffRow[] = lines.map((line, index) => {
    const leftNumber = line.type !== "add" ? leftLine : null;
    const rightNumber = line.type !== "remove" ? rightLine : null;

    if (line.type !== "add") leftLine += 1;
    if (line.type !== "remove") rightLine += 1;

    const leftStyle =
      line.type === "remove" ? { background: "#fff1f2", color: "#9f1239" } : undefined;
    const rightStyle =
      line.type === "add" ? { background: "#ecfdf3", color: "#166534" } : undefined;

    return {
      id: `${index}-${line.type}`,
      left: line.type === "add" ? null : (
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", ...leftStyle }}>
          <span style={{ width: 28, color: "var(--text-muted)", textAlign: "right" }}>{leftNumber}</span>
          <span style={{ whiteSpace: "pre-wrap" }}>{line.value}</span>
        </div>
      ),
      right: line.type === "remove" ? null : (
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", ...rightStyle }}>
          <span style={{ width: 28, color: "var(--text-muted)", textAlign: "right" }}>{rightNumber}</span>
          <span style={{ whiteSpace: "pre-wrap" }}>{line.value}</span>
        </div>
      ),
    };
  });

  return (
    <div
      style={{
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        background: "var(--surface-1)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--surface-0)",
        }}
      >
        <div style={{ padding: "12px 16px", fontSize: 12, textTransform: "uppercase", color: "var(--text-muted)" }}>
          From
        </div>
        <div style={{ padding: "12px 16px", fontSize: 12, textTransform: "uppercase", color: "var(--text-muted)" }}>
          To
        </div>
      </div>
      <div>
        {rows.map((row) => (
          <div
            key={row.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ padding: "10px 16px", minHeight: 28 }}>{row.left ?? ""}</div>
            <div style={{ padding: "10px 16px", minHeight: 28 }}>{row.right ?? ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
