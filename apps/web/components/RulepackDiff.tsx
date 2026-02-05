import type { ReactNode } from "react";

type DiffKind = "same" | "add" | "remove";

type DiffLine = {
  kind: DiffKind;
  text: string;
};

type DiffRow = {
  id: string;
  left?: DiffLine;
  right?: DiffLine;
};

const buildDiff = (fromText: string, toText: string): DiffRow[] => {
  const fromLines = fromText.split("\n");
  const toLines = toText.split("\n");
  const rows: DiffRow[] = [];

  let i = 0;
  let j = 0;
  let index = 0;

  while (i < fromLines.length || j < toLines.length) {
    if (i < fromLines.length && j < toLines.length) {
      const left = fromLines[i];
      const right = toLines[j];
      if (left === right) {
        rows.push({ id: `row-${index}`, left: { kind: "same", text: left }, right: { kind: "same", text: right } });
      } else {
        rows.push({ id: `row-${index}`, left: { kind: "remove", text: left }, right: { kind: "add", text: right } });
      }
      i += 1;
      j += 1;
    } else if (i < fromLines.length) {
      rows.push({ id: `row-${index}`, left: { kind: "remove", text: fromLines[i] } });
      i += 1;
    } else {
      rows.push({ id: `row-${index}`, right: { kind: "add", text: toLines[j] } });
      j += 1;
    }
    index += 1;
  }

  return rows;
};

const lineStyles = (line?: DiffLine) => {
  if (!line) return undefined;
  if (line.kind === "add") return { background: "#ecfdf3", color: "#166534" };
  if (line.kind === "remove") return { background: "#fff1f2", color: "#9f1239" };
  return undefined;
};

const lineNumberStyle = {
  width: 28,
  color: "var(--text-muted)",
  textAlign: "right" as const,
};

type RulepackDiffProps = {
  fromLabel: string;
  toLabel: string;
  fromText: string;
  toText: string;
};

export function RulepackDiff({ fromLabel, toLabel, fromText, toText }: RulepackDiffProps) {
  const rows = buildDiff(fromText, toText);
  let leftLine = 1;
  let rightLine = 1;

  const renderCell = (line: DiffLine | undefined, lineNumber: number | null): ReactNode => {
    if (!line) return "";
    return (
      <div style={{ display: "flex", gap: 12, ...lineStyles(line) }}>
        <span style={lineNumberStyle}>{lineNumber ?? ""}</span>
        <span style={{ whiteSpace: "pre-wrap" }}>{line.text}</span>
      </div>
    );
  };

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
          {fromLabel}
        </div>
        <div style={{ padding: "12px 16px", fontSize: 12, textTransform: "uppercase", color: "var(--text-muted)" }}>
          {toLabel}
        </div>
      </div>
      <div>
        {rows.map((row) => {
          const leftNumber = row.left ? leftLine : null;
          const rightNumber = row.right ? rightLine : null;
          if (row.left) leftLine += 1;
          if (row.right) rightLine += 1;

          return (
            <div
              key={row.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ padding: "10px 16px", minHeight: 28 }}>{renderCell(row.left, leftNumber)}</div>
              <div style={{ padding: "10px 16px", minHeight: 28 }}>{renderCell(row.right, rightNumber)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
