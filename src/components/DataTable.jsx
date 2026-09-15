export default function DataTable({ columns, rows, emptyLabel = "No data yet." }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-dark/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-dark/10 text-dark/50">
            {columns.map((col) => (
              <th key={col.key} className="px-5 py-3" style={{ fontWeight: 600 }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-5 py-6 text-center text-dark/40">
                {emptyLabel}
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr key={row.id || i} className="border-b border-dark/5 last:border-none">
              {columns.map((col) => (
                <td key={col.key} className="px-5 py-3 text-dark">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
