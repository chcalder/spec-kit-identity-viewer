interface ClaimsTableProps {
  claims: Record<string, unknown>
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function ClaimsTable({ claims }: ClaimsTableProps) {
  const entries = Object.entries(claims)

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 w-1/3">Claim</th>
            <th className="px-4 py-3">Value</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key} className="odd:bg-gray-800 even:bg-gray-700 border-t border-gray-600">
              <td className="px-4 py-2 font-mono text-blue-400 whitespace-nowrap">{key}</td>
              <td className="px-4 py-2 font-mono text-gray-200 break-all">{formatValue(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
