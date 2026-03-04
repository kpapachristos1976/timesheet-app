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
import { calculatePlannedHours } from '../../utils/dateUtils';

export const ProjectsDashboard: React.FC = () => {
  const { timesheets, projects, resourceAllocations } = useStore();
  const [filterProject, setFilterProject] = useState<string>('');

  const chartData = useMemo(() => {
    const projectMap = new Map<
      string,
      {
        projectId: string;
        projectTitle: string;
        actualHours: number;
        allocatedHoursEY: number;
        plannedHours: number;
      }
    >();

    projects.forEach((p) => {
      projectMap.set(p.projectId, {
        projectId: p.projectId,
        projectTitle: p.projectTitle || p.description,
        actualHours: 0,
        allocatedHoursEY: p.allocatedHoursEY,
        plannedHours: 0,
      });
    });

    timesheets.forEach((t) => {
      const pid = t.pid;
      if (projectMap.has(pid)) {
        const existing = projectMap.get(pid)!;
        existing.actualHours += t.totalHours;
      } else {
        projectMap.set(pid, {
          projectId: pid,
          projectTitle: t.project || t.description,
          actualHours: t.totalHours,
          allocatedHoursEY: 0,
          plannedHours: 0,
        });
      }
    });

    resourceAllocations.forEach((a) => {
      const pid = a.projectId;
      if (projectMap.has(pid)) {
        const existing = projectMap.get(pid)!;
        existing.plannedHours += calculatePlannedHours(
          a.startDate,
          a.endDate,
          a.allocationPercentage
        );
      } else if (pid) {
        projectMap.set(pid, {
          projectId: pid,
          projectTitle: a.projectDescription,
          actualHours: 0,
          allocatedHoursEY: 0,
          plannedHours: calculatePlannedHours(
            a.startDate,
            a.endDate,
            a.allocationPercentage
          ),
        });
      }
    });

    let data = Array.from(projectMap.values());

    if (filterProject) {
      data = data.filter(
        (d) =>
          d.projectId.toLowerCase().includes(filterProject.toLowerCase()) ||
          d.projectTitle.toLowerCase().includes(filterProject.toLowerCase())
      );
    }

    return data
      .filter((d) => d.actualHours > 0 || d.allocatedHoursEY > 0 || d.plannedHours > 0)
      .sort((a, b) => a.projectId.localeCompare(b.projectId));
  }, [timesheets, projects, resourceAllocations, filterProject]);

  const totals = useMemo(() => {
    return chartData.reduce(
      (acc, d) => ({
        actualHours: acc.actualHours + d.actualHours,
        allocatedHoursEY: acc.allocatedHoursEY + d.allocatedHoursEY,
        plannedHours: acc.plannedHours + d.plannedHours,
      }),
      { actualHours: 0, allocatedHoursEY: 0, plannedHours: 0 }
    );
  }, [chartData]);

  const uniqueProjects = useMemo(() => {
    return chartData.map((d) => ({
      id: d.projectId,
      label: `${d.projectId} - ${d.projectTitle}`,
    }));
  }, [chartData]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Projects Dashboard</h1>
      <p className="text-gray-600">
        Actual hours vs Allocated Hours (EY) vs Planned hours by project
      </p>

      <div className="flex gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Project
          </label>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="border rounded-lg px-3 py-2 min-w-64"
          >
            <option value="">All Projects</option>
            {uniqueProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Actual Hours</div>
          <div className="text-2xl font-bold text-blue-600">
            {totals.actualHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Allocated Hours (EY)</div>
          <div className="text-2xl font-bold text-purple-600">
            {totals.allocatedHoursEY.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Planned Hours</div>
          <div className="text-2xl font-bold text-green-600">
            {totals.plannedHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Actual vs Allocated Variance</div>
          <div
            className={`text-2xl font-bold ${
              totals.actualHours - totals.allocatedHoursEY >= 0
                ? 'text-red-600'
                : 'text-green-600'
            }`}
          >
            {(totals.actualHours - totals.allocatedHoursEY).toLocaleString(undefined, {
              maximumFractionDigits: 1,
            })}
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No data available. Import timesheet and project data to see the comparison.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-4">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="projectId"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 11 }}
              />
              <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value) =>
                  typeof value === 'number'
                    ? value.toLocaleString(undefined, { maximumFractionDigits: 1 })
                    : value
                }
                labelFormatter={(label) => {
                  const project = chartData.find((d) => d.projectId === label);
                  return project ? `${label} - ${project.projectTitle}` : String(label);
                }}
              />
              <Legend />
              <Bar dataKey="actualHours" name="Actual Hours" fill="#3B82F6" />
              <Bar dataKey="allocatedHoursEY" name="Allocated Hours (EY)" fill="#8B5CF6" />
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
                Project ID
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                Project Title
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                Actual Hours
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                Allocated (EY)
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                Planned Hours
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                Actual vs Allocated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {chartData.map((row) => (
              <tr key={row.projectId} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{row.projectId}</td>
                <td className="px-4 py-3 text-sm max-w-xs truncate">{row.projectTitle}</td>
                <td className="px-4 py-3 text-sm text-right">
                  {row.actualHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {row.allocatedHoursEY.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {row.plannedHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </td>
                <td
                  className={`px-4 py-3 text-sm text-right font-medium ${
                    row.actualHours - row.allocatedHoursEY >= 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {(row.actualHours - row.allocatedHoursEY).toLocaleString(undefined, {
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
