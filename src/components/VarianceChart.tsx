'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface VarianceData {
  period: { type: string; year: number; value: number };
  previousTotal: number;
  currentTotal: number;
  change: number;
  changePercent: number;
}

interface VarianceChartProps {
  data: VarianceData[];
  height?: number;
}

export default function VarianceChart({ data, height = 300 }: VarianceChartProps) {
  const chartData = data.map((item) => ({
    name: item.period.type === 'weekly'
      ? `W${item.period.value}`
      : item.period.type === 'monthly'
      ? new Date(item.period.year, item.period.value - 1).toLocaleDateString('en-US', { month: 'short' })
      : `Q${item.period.value}`,
    change: item.change,
    changePercent: item.changePercent,
    previous: item.previousTotal,
    current: item.currentTotal,
  })).reverse();

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 12 }}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#141414',
              border: '1px solid #262626',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#fafafa' }}
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === 'change' ? 'Variance' : name,
            ]}
          />
          <ReferenceLine y={0} stroke="#262626" />
          <Bar
            dataKey="change"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
