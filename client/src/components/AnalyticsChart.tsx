import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { QuestionAnalytics } from '../types';

interface AnalyticsChartProps {
  data: QuestionAnalytics;
}

const COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  if (!data || data.total === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
        <p className="text-gray-500">暂无答卷数据</p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = Object.entries(data.counts).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / data.total) * 100).toFixed(1)
  }));

  // Sort by value descending
  chartData.sort((a, b) => b.value - a.value);

  if (data.type === 'checkbox' || data.type === 'radio') {
    const maxItems = 10;
    const displayData = chartData.slice(0, maxItems);

    return (
      <div className="space-y-6">
        {/* Bar Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={150}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} (${((value / data.total) * 100).toFixed(1)}%)`, '选择人数']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        {displayData.length <= 6 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  labelLine={false}
                >
                  {displayData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => [`${value} (${((value / data.total) * 100).toFixed(1)}%)`, name]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">选项</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">选择人数</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">占比</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chartData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900">{item.name}</td>
                  <td className="px-4 py-2 text-right text-gray-700">{item.value}</td>
                  <td className="px-4 py-2 text-right text-gray-700">{item.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Text response - show as list
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        共收到 {data.total} 条文本回复
      </p>
      <div className="space-y-2">
        {Object.entries(data.counts).map(([text, count], index) => (
          <div key={index} className="p-3 bg-gray-50 rounded-lg">
            <p className="text-gray-900">{text}</p>
            <p className="text-sm text-gray-500 mt-1">出现 {count} 次</p>
          </div>
        ))}
      </div>
    </div>
  );
}
