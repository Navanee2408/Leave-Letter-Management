import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px rgba(0, 27, 61, 0.12)',
  fontSize: 12,
}

export default function LeaveTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf4" />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#64748b' }}
          dy={6}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          width={40}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0, 32, 96, 0.04)' }} />
        <Legend
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
        />
        <Bar dataKey="approved" name="Approved" fill="#059669" radius={[3, 3, 0, 0]} maxBarSize={18} />
        <Bar dataKey="pending" name="Pending" fill="#d97706" radius={[3, 3, 0, 0]} maxBarSize={18} />
        <Bar dataKey="reopened" name="Reopened" fill="#0284c7" radius={[3, 3, 0, 0]} maxBarSize={18} />
        <Bar dataKey="rejected" name="Rejected" fill="#e11d48" radius={[3, 3, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  )
}
