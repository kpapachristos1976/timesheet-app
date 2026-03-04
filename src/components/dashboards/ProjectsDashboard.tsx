import { useState, useMemo, useRef, useEffect } from 'react';
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
import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { calculatePlannedHours } from '../../utils/dateUtils';

export const ProjectsDashboard = () => {
  const { timesheets, projects, resourceAllocations } = useStore();
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableProjects = useMemo(() => {
    return projects
      .filter((p) => p.status?.toLowerCase() !== 'completed')
      .map((p) => ({
        id: p.projectId,
        label: p.description || `${p.projectId} - ${p.projectTitle}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [projects]);

  const filteredDropdownOptions = useMemo(() => {
    if (!searchText) return availableProjects;
    const lower = searchText.toLowerCase();
    return availableProjects.filter(
      (p) => p.label.toLowerCase().includes(lower) || p.id.toLowerCase().includes(lower)
    );
  }, [availableProjects, searchText]);

  const toggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const removeProject = (id: string) => {
    setSelectedProjectIds((prev) => prev.filter((pid) => pid !== id));
  };

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
        projectMap.get(pid)!.actualHours += t.totalHours;
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
        projectMap.get(pid)!.plannedHours += calculatePlannedHours(
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
          plannedHours: calculatePlannedHours(a.startDate, a.endDate, a.allocationPercentage),
        });
      }
    });

    let data = Array.from(projectMap.values());

    if (selectedProjectIds.length > 0) {
      data = data.filter((d) => selectedProjectIds.includes(d.projectId));
    }

    return data
      .filter((d) => d.actualHours > 0 || d.allocatedHoursEY > 0 || d.plannedHours > 0)
      .sort((a, b) => a.projectId.localeCompare(b.projectId));
  }, [timesheets, projects, resourceAllocations, selectedProjectIds]);

  const resourceChartData = useMemo(() => {
    if (selectedProjectIds.length === 0) return [];

    const resourceMap = new Map<
      string,
      { name: string; actualHours: number; plannedHours: number }
    >();

    timesheets
      .filter((t) => selectedProjectIds.includes(t.pid))
      .forEach((t) => {
        const existing = resourceMap.get(t.resourceName) || {
          name: t.resourceName,
          actualHours: 0,
          plannedHours: 0,
        };
        existing.actualHours += t.totalHours;
        resourceMap.set(t.resourceName, existing);
      });

    resourceAllocations
      .filter((a) => selectedProjectIds.includes(a.projectId))
      .forEach((a) => {
        const existing = resourceMap.get(a.resourceName) || {
          name: a.resourceName,
          actualHours: 0,
          plannedHours: 0,
        };
        existing.plannedHours += calculatePlannedHours(
          a.startDate,
          a.endDate,
          a.allocationPercentage
        );
        resourceMap.set(a.resourceName, existing);
      });

    return Array.from(resourceMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [timesheets, resourceAllocations, selectedProjectIds]);

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Projects Dashboard</h1>
      <p className="text-gray-600">
        Actual hours vs Allocated Hours (EY) vs Planned hours by project
      </p>

      <div className="flex gap-4 items-start">
        <div className="relative min-w-80" ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Project
          </label>

          {selectedProjectIds.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {selectedProjectIds.map((id) => {
                const proj = availableProjects.find((p) => p.id === id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {proj?.label || id}
                    <button
                      onClick={() => removeProject(id)}
                      className="hover:text-blue-600"
                    >
                      <X size={14} />
                    </button>
                  </span>
                );
              })}
              <button
                onClick={() => setSelectedProjectIds([])}
                className="text-xs text-gray-500 hover:text-red-600 ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          <input
            type="text"
            placeholder="Type to search projects..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          {dropdownOpen && (
            <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredDropdownOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No matching projects</div>
              ) : (
                filteredDropdownOptions.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProjectIds.includes(p.id)}
                      onChange={() => toggleProject(p.id)}
                      className="rounded"
                    />
                    {p.label}
                  </label>
                ))
              )}
            </div>
          )}
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
          <h3 className="text-lg font-semibold mb-2">Projects Overview</h3>
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

      {selectedProjectIds.length > 0 && resourceChartData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-2">
            Resources Breakdown for Selected Project(s)
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={resourceChartData}
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

          <div className="mt-4 overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Resource</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actual Hours</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Planned Hours</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {resourceChartData.map((row) => (
                  <tr key={row.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{row.name}</td>
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
      )}

      {selectedProjectIds.length > 0 && resourceChartData.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No resource data found for the selected project(s).
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Project ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Project Title</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actual Hours</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Allocated (EY)</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Planned Hours</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actual vs Allocated</th>
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
                    row.actualHours - row.allocatedHoursEY >= 0 ? 'text-red-600' : 'text-green-600'
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
