import type { ReactNode } from "react";

// Generic table configuration. Each column defines how to read a property and optionally
// how to render a custom cell, keeping the table reusable across many record shapes.
type TableColumn<T extends Record<string, unknown>> = {
  key: keyof T | string;
  header: ReactNode;
  render?: (value: T[keyof T], row: T) => ReactNode;
};

type TableProps<T extends Record<string, unknown>> = {
  columns: TableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
  // Allow the caller to supply a stable row identity so React can reconcile updates
  // without issues when rows are filtered, sorted, or inserted dynamically.
  getRowKey?: (row: T, index: number) => string | number;
};

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "No records found.",
  className = "",
  getRowKey,
}: TableProps<T>) {
  // Use a stable row key when available; otherwise prefer a row.id if it exists.
  // This avoids key instability from index-only keys when the list changes.
  const resolveRowKey = (row: T, index: number) => {
    if (getRowKey) return getRowKey(row, index);
    if (typeof row.id === "string" || typeof row.id === "number") return row.id;
    return `${String(Object.values(row)[0] ?? "row")}-${index}`;
  };

  return (
    <div className={`table-wrapper ${className}`.trim()}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            // Keep the table structure intact even when there are no rows so the header
            // remains visible and the empty state is presented inside the same layout.
            <tr>
              <td className="table-empty" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={resolveRowKey(row, index)}>
                {columns.map((column) => {
                  const value = row[column.key as keyof T];
                  const cellContent: ReactNode = column.render
                    ? column.render(value, row)
                    : String(value ?? "");

                  return (
                    <td key={`${String(column.key)}-${String(resolveRowKey(row, index))}`}>
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
