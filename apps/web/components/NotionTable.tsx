import type { ReactNode } from "react";

type Row = {
  id: string;
  cells: ReactNode[];
};

type NotionTableProps = {
  columns: string[];
  rows: Row[];
  emptyLabel?: string;
};

export function NotionTable({ columns, rows, emptyLabel }: NotionTableProps) {
  const tableLabel = columns.length > 0 ? columns.join(", ") : "Data table";

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
      <table style={{ width: "100%", borderCollapse: "collapse" }} aria-label={tableLabel}>
        <thead style={{ background: "var(--surface-0)" }}>
          <tr>
            {columns.map((col, index) => (
              <th
                key={`${col}-${index}`}
                style={{
                  textAlign: "left",
                  fontSize: 12,
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-subtle)",
                  letterSpacing: "0.04em",
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: "16px", color: "var(--text-muted)", fontStyle: "italic" }}
              >
                {emptyLabel ?? "No rows"}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={`${row.id}-${rowIndex}`}>
                {row.cells.map((cell, index) => (
                  <td
                    key={`${row.id}-${index}`}
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid var(--border-subtle)",
                      fontSize: 14,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
