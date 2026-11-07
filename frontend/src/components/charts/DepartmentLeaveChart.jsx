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

export default function DepartmentLeaveChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
        barCategoryGap={10}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8edf4" />
        <XAxis
          type="number"
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
        />
        <YAxis
          type="category"
          dataKey="code"
          axisLine={false}
          tickLine={false}
          width={48}
          tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0, 32, 96, 0.04)' }} />
        <Legend
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        <Bar dataKey="approved" name="Approved" stackId="leaves" fill="#059669" radius={[0, 0, 0, 0]} maxBarSize={16} />
        <Bar dataKey="pending" name="Pending" stackId="leaves" fill="#d97706" maxBarSize={16} />
        <Bar dataKey="reopened" name="Reopened" stackId="leaves" fill="#0284c7" maxBarSize={16} />
        <Bar dataKey="rejected" name="Rejected" stackId="leaves" fill="#e11d48" radius={[0, 3, 3, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  )
}
