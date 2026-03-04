import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useStore } from '../../store/useStore';
import { STREAMS } from '../../types';
import { calculatePlannedHours } from '../../utils/dateUtils';

export const ResourcesDashboard: React.FC = () => {
  const { timesheets, resourceAllocations } = useStore();
  const [filterStream, setFilterStream] = useState<string>('');
  const [filterResource, setFilterResource] = useState<string>('');

  const uniqueResources = useMemo(() => {
    const fromTimesheets = timesheets.map((t) => t.resourceName);
    const fromAllocations = resourceAllocations.map((a) => a.resourceName);
    return [...new Set([...fromTimesheets, ...fromAllocations])].sort();
  }, [timesheets, resourceAllocations]);

  const chartData = useMemo(() => {
    const resourceMap = new Map<
      string,
      { name: string; actualHours: number; plannedHours: number; stream: string }
    >();

    timesheets.forEach((t) => {
      const key = t.resourceName;
      const existing = resourceMap.get(key) || {
        name: t.resourceName,
        actualHours: 0,
        plannedHours: 0,
        stream: t.stream,
      };
      existing.actualHours += t.totalHours;
      resourceMap.set(key, existing);
    });

    resourceAllocations.forEach((a) => {
      const key = a.resourceName;
      const existing = resourceMap.get(key) || {
        name: a.resourceName,
        actualHours: 0,
        plannedHours: 0,
        stream: a.stream,
      };
      existing.plannedHours += calculatePlannedHours(
        a.startDate,
        a.endDate,
        a.allocationPercentage
      );
      if (!existing.stream) existing.stream = a.stream;
      resourceMap.set(key, existing);
    });

    let data = Array.from(resourceMap.values());

    if (filterStream) {
      data = data.filter((d) => d.stream === filterStream);
    }

    if (filterResource) {
      data = data.filter((d) =>
        d.name.toLowerCase().includes(filterResource.toLowerCase())
      );
    }

    return data.sort((a, b) => a.name.localeCompare(b.name));
  }, [timesheets, resourceAllocations, filterStream, filterResource]);

  const totals = useMemo(() => {
    return chartData.reduce(
      (acc, d) => ({
        actualHours: acc.actualHours + d.actualHours,
        plannedHours: acc.plannedHours + d.plannedHours,
      }),
      { actualHours: 0, plannedHours: 0 }
    );
  }, [chartData]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Resources Dashboard</h1>
      <p className="text-gray-600">
        Actual effort hours from timesheets vs planned hours from resource allocations
      </p>

      <div className="flex gap-4 items-center flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Stream
          </label>
          <select
            value={filterStream}
            onChange={(e) => setFilterStream(e.target.value)}
            className="border rounded-lg px-3 py-2 min-w-48"
          >
            <option value="">All Streams</option>
            {STREAMS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Resource
          </label>
          <select
            value={filterResource}
            onChange={(e) => setFilterResource(e.target.value)}
            className="border rounded-lg px-3 py-2 min-w-48"
          >
            <option value="">All Resources</option>
            {uniqueResources.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Actual Hours</div>
          <div className="text-2xl font-bold text-blue-600">
            {totals.actualHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Planned Hours</div>
          <div className="text-2xl font-bold text-green-600">
            {totals.plannedHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Variance</div>
          <div
            className={`text-2xl font-bold ${
              totals.actualHours - totals.plannedHours >= 0 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {(totals.actualHours - totals.plannedHours).toLocaleString(undefined, {
              maximumFractionDigits: 1,
            })}
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No data available. Import timesheet data and create resource allocations to see the
          comparison.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-4">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value) =>
                  typeof value === 'number' 
                    ? value.toLocaleString(undefined, { maximumFractionDigits: 1 })
                    : value
                }
              />
              <Legend />
              <Bar dataKey="actualHours" name="Actual Hours" fill="#3B82F6" />
              <Bar dataKey="plannedHours" name="Planned Hours" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                Resource
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stream</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                Actual Hours
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                Planned Hours
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                Variance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {chartData.map((row) => (
              <tr key={row.name} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{row.name}</td>
                <td className="px-4 py-3 text-sm">{row.stream}</td>
                <td className="px-4 py-3 text-sm text-right">
                  {row.actualHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {row.plannedHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </td>
                <td
                  className={`px-4 py-3 text-sm text-right font-medium ${
                    row.actualHours - row.plannedHours >= 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {(row.actualHours - row.plannedHours).toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
