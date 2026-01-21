'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PriceDataPoint {
  time: string;
  yes: number;
  no: number;
}

interface PriceChartProps {
  data: PriceDataPoint[];
  height?: number;
}

export default function PriceChart({ data, height = 300 }: PriceChartProps) {
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 shadow-lg">
          <p className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 font-mono">{label}</p>
          <div className="space-y-0.5">
            <p className="text-xs text-green-600 dark:text-green-400 font-mono">
              Yes: {payload[0].value}¢
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 font-mono">
              No: {payload[1].value}¢
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" opacity={0.3} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
          />
          <YAxis
            tick={{ fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: '8px',
              fontSize: '12px',
              fontFamily: 'ui-monospace, monospace',
            }}
          />
          <Line
            type="monotone"
            dataKey="yes"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Yes"
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="no"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="No"
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
