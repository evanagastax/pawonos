"use client";

import { cn } from "@/lib/utils";

interface Column {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  render?: (value: any, row: any) => React.ReactNode;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
}

export function ResponsiveTable({ columns, data, emptyMessage = "No data", onRowClick }: ResponsiveTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "p-3 text-sm font-medium",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                    !col.align && "text-left"
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row.id || i}
                className={cn(
                  "border-b",
                  onRowClick && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "p-3 text-sm",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right"
                    )}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data.map((row, i) => (
          <div
            key={row.id || i}
            className={cn(
              "rounded-lg border p-4 space-y-2",
              onRowClick && "cursor-pointer active:bg-muted/50"
            )}
            onClick={() => onRowClick?.(row)}
          >
            {columns.map((col) => (
              <div key={col.key} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{col.label}</span>
                <span className="text-sm font-medium">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}