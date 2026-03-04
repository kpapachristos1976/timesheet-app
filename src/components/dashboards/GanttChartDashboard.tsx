import { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { STREAMS } from '../../types';
import { getTimelinePeriods, doRangesOverlap } from '../../utils/dateUtils';
import { parseISO, format, min, max } from 'date-fns';

type TimelineView = 'weekly' | 'monthly';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export const GanttChartDashboard = () => {
  const { resourceAllocations } = useStore();
  const [filterStream, setFilterStream] = useState<string>('');
  const [filterProject, setFilterProject] = useState<string>('');
  const [filterResource, setFilterResource] = useState<string>('');
  const [timelineView, setTimelineView] = useState<TimelineView>('weekly');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  const filteredAllocations = useMemo(() => {
    return resourceAllocations.filter((a) => {
      const matchesStream = !filterStream || a.stream === filterStream;
      const matchesProject =
        !filterProject ||
        a.projectId.toLowerCase().includes(filterProject.toLowerCase()) ||
        a.projectDescription.toLowerCase().includes(filterProject.toLowerCase());
      const matchesResource =
        !filterResource ||
        a.resourceName.toLowerCase().includes(filterResource.toLowerCase());
      return matchesStream && matchesProject && matchesResource;
    });
  }, [resourceAllocations, filterStream, filterProject, filterResource]);

  const uniqueResources = useMemo(() => {
    return [...new Set(filteredAllocations.map((a) => a.resourceName))].sort();
  }, [filteredAllocations]);

  const uniqueProjects = useMemo(() => {
    const fromAllocations = resourceAllocations.map((a) => ({
      id: a.projectId,
      description: a.projectDescription,
    }));
    const seen = new Set<string>();
    return fromAllocations.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [resourceAllocations]);

  const projectColorMap = useMemo(() => {
    const map = new Map<string, string>();
    uniqueProjects.forEach((p, i) => {
      map.set(p.id, COLORS[i % COLORS.length]);
    });
    return map;
  }, [uniqueProjects]);

  const timelineRange = useMemo(() => {
    if (filteredAllocations.length === 0) {
      return { start: new Date(), end: new Date() };
    }

    const dates = filteredAllocations.flatMap((a) => [
      parseISO(a.startDate),
      parseISO(a.endDate),
    ]);

    let rangeStart = min(dates);
    let rangeEnd = max(dates);

    if (dateRange.start) {
      const customStart = parseISO(dateRange.start);
      if (!isNaN(customStart.getTime())) rangeStart = customStart;
    }
    if (dateRange.end) {
      const customEnd = parseISO(dateRange.end);
      if (!isNaN(customEnd.getTime())) rangeEnd = customEnd;
    }

    return { start: rangeStart, end: rangeEnd };
  }, [filteredAllocations, dateRange]);

  const periods = useMemo(() => {
    if (filteredAllocations.length === 0) return [];
    return getTimelinePeriods(
      format(timelineRange.start, 'yyyy-MM-dd'),
      format(timelineRange.end, 'yyyy-MM-dd'),
      timelineView
    );
  }, [timelineRange, timelineView, filteredAllocations.length]);

  const getBarStyle = (
    allocation: (typeof filteredAllocations)[0],
    periodIndex: number
  ): React.CSSProperties | null => {
    const period = periods[periodIndex];
    if (!period) return null;

    const allocationStart = parseISO(allocation.startDate);
    const allocationEnd = parseISO(allocation.endDate);

    if (!doRangesOverlap(allocationStart, allocationEnd, period.start, period.end)) {
      return null;
    }

    return {
      backgroundColor: projectColorMap.get(allocation.projectId) || '#3B82F6',
      opacity: allocation.allocationPercentage / 100,
    };
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gantt Chart Dashboard</h1>
      <p className="text-gray-600">
        Resource allocation timeline across projects
      </p>

      <div className="flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stream
          </label>
          <select
            value={filterStream}
            onChange={(e) => setFilterStream(e.target.value)}
            className="border rounded-lg px-3 py-2 min-w-40"
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
            Project
          </label>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="border rounded-lg px-3 py-2 min-w-48"
          >
            <option value="">All Projects</option>
            {uniqueProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} - {p.description.substring(0, 30)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resource
          </label>
          <select
            value={filterResource}
            onChange={(e) => setFilterResource(e.target.value)}
            className="border rounded-lg px-3 py-2 min-w-40"
          >
            <option value="">All Resources</option>
            {uniqueResources.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timeline View
          </label>
          <select
            value={timelineView}
            onChange={(e) => setTimelineView(e.target.value as TimelineView)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {filteredAllocations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No resource allocations found. Add allocations to see the Gantt chart.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 bg-white rounded-lg shadow p-4">
            <span className="text-sm font-medium text-gray-700">Legend:</span>
            {uniqueProjects.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: projectColorMap.get(p.id) }}
                />
                <span className="text-sm">{p.id}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-700 border-r min-w-48 z-10">
                    Resource
                  </th>
                  {periods.map((period, i) => (
                    <th
                      key={i}
                      className="px-2 py-3 text-center text-xs font-medium text-gray-700 border-r min-w-20"
                    >
                      {period.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uniqueResources.map((resource) => {
                  const resourceAllocations = filteredAllocations.filter(
                    (a) => a.resourceName === resource
                  );
                  return (
                    <tr key={resource} className="border-t hover:bg-gray-50">
                      <td className="sticky left-0 bg-white px-4 py-2 text-sm font-medium border-r z-10">
                        {resource}
                      </td>
                      {periods.map((_, periodIdx) => {
                        const matchingAllocations = resourceAllocations.filter((a) => {
                          const style = getBarStyle(a, periodIdx);
                          return style !== null;
                        });

                        return (
                          <td key={periodIdx} className="px-1 py-2 border-r">
                            <div className="flex flex-col gap-1">
                              {matchingAllocations.map((a) => {
                                const style = getBarStyle(a, periodIdx);
                                return style ? (
                                  <div
                                    key={a.id}
                                    className="h-6 rounded text-xs text-white flex items-center justify-center"
                                    style={style}
                                    title={`${a.projectId}: ${a.allocationPercentage}%`}
                                  >
                                    {a.allocationPercentage}%
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
