import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = {
  pending: '#d97706',
  approved: '#059669',
  rejected: '#e11d48',
  reopened: '#0284c7',
}

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px rgba(0, 27, 61, 0.12)',
  fontSize: 12,
}

export default function LeaveStatusChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-full">
        <ResponsiveContainer width="100%" height={210}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={COLORS[entry.key] || '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-7">
          <span className="font-display text-2xl font-bold leading-none text-navy-900">
            {total}
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Total
          </span>
        </div>
      </div>
    </div>
  )
}

export { COLORS as STATUS_COLORS }
