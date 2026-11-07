import { cn } from '../../lib/utils'
import EmptyState from './EmptyState'

export default function DataTable({
  columns,
  rows,
  rowKey = 'id',
  empty,
  className,
  tableClassName,
  onRowClick,
}) {
  const getKey = (row, index) =>
    typeof rowKey === 'function' ? rowKey(row, index) : row[rowKey] || index

  return (
    <div className={cn('overflow-hidden', className)}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className={cn('w-full border-collapse', tableClassName)}>
          <thead className="border-b border-slate-200 bg-slate-50/80">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn('table-th', column.headerClassName)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10">
                  {empty || (
                    <EmptyState
                      title="No records found"
                      description="Try adjusting your filters or search terms."
                    />
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={getKey(row, index)}
                  onClick={
                    onRowClick ? () => onRowClick(row, index) : undefined
                  }
                  className={cn(
                    'bg-white transition-colors hover:bg-slate-50/80',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn('table-td', column.className)}
                    >
                      {column.render
                        ? column.render(row, index)
                        : row[column.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
