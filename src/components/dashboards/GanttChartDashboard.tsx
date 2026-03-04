import { useState, useMemo, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { STREAMS } from '../../types';
import { getTimelinePeriods, doRangesOverlap } from '../../utils/dateUtils';
import { parseISO, format, min, max } from 'date-fns';

type TimelineView = 'weekly' | 'monthly';

const BAR_COLOR = '#3B82F6';

export const GanttChartDashboard = () => {
  const { resourceAllocations } = useStore();
  const [filterStream, setFilterStream] = useState<string>('');
  const [filterProject, setFilterProject] = useState<string>('');
  const [projectSearchText, setProjectSearchText] = useState('');
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [filterResource, setFilterResource] = useState<string>('');
  const [timelineView, setTimelineView] = useState<TimelineView>('weekly');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: { projectDescription: string; percentage: number }[];
    total: number;
  }>({ visible: false, x: 0, y: 0, content: [], total: 0 });

  const projectDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const filteredProjectOptions = useMemo(() => {
    if (!projectSearchText) return uniqueProjects;
    const lower = projectSearchText.toLowerCase();
    return uniqueProjects.filter(
      (p) =>
        p.id.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower)
    );
  }, [uniqueProjects, projectSearchText]);

  const handleProjectFilterSelect = (projectId: string) => {
    const proj = uniqueProjects.find((p) => p.id === projectId);
    setFilterProject(projectId);
    setProjectSearchText(proj ? proj.description : projectId);
    setProjectDropdownOpen(false);
  };

  const clearProjectFilter = () => {
    setFilterProject('');
    setProjectSearchText('');
  };

  const filteredAllocations = useMemo(() => {
    return resourceAllocations.filter((a) => {
      const matchesStream = !filterStream || a.stream === filterStream;
      const matchesProject = !filterProject || a.projectId === filterProject;
      const matchesResource =
        !filterResource ||
        a.resourceName.toLowerCase().includes(filterResource.toLowerCase());
      return matchesStream && matchesProject && matchesResource;
    });
  }, [resourceAllocations, filterStream, filterProject, filterResource]);

  const uniqueResources = useMemo(() => {
    return [...new Set(filteredAllocations.map((a) => a.resourceName))].sort();
  }, [filteredAllocations]);

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

  const getAggregatedData = (
    allocations: typeof filteredAllocations,
    periodIndex: number
  ): { total: number; breakdown: { projectDescription: string; percentage: number }[] } => {
    const period = periods[periodIndex];
    if (!period) return { total: 0, breakdown: [] };

    const breakdown: { projectDescription: string; percentage: number }[] = [];
    let total = 0;

    allocations.forEach((a) => {
      const allocationStart = parseISO(a.startDate);
      const allocationEnd = parseISO(a.endDate);

      if (doRangesOverlap(allocationStart, allocationEnd, period.start, period.end)) {
        breakdown.push({
          projectDescription: a.projectDescription || a.projectId,
          percentage: a.allocationPercentage,
        });
        total += a.allocationPercentage;
      }
    });

    return { total, breakdown };
  };

  const handleMouseEnter = (
    e: React.MouseEvent,
    breakdown: { projectDescription: string; percentage: number }[],
    total: number
  ) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      content: breakdown,
      total,
    });
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gantt Chart Dashboard</h1>
      <p className="text-gray-600">
        Resource allocation timeline across projects
      </p>

      <div className="flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
          <select
            value={filterStream}
            onChange={(e) => setFilterStream(e.target.value)}
            className="border rounded-lg px-3 py-2 min-w-40"
          >
            <option value="">All Streams</option>
            {STREAMS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="relative min-w-56" ref={projectDropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Type to search projects..."
              value={projectSearchText}
              onChange={(e) => {
                setProjectSearchText(e.target.value);
                setProjectDropdownOpen(true);
                if (!e.target.value) {
                  setFilterProject('');
                }
              }}
              onFocus={() => setProjectDropdownOpen(true)}
              className="w-full border rounded-lg px-3 py-2 pr-8 text-sm"
              autoComplete="off"
            />
            {filterProject && (
              <button
                onClick={clearProjectFilter}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {projectDropdownOpen && (
            <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              <button
                type="button"
                onClick={() => { clearProjectFilter(); setProjectDropdownOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${!filterProject ? 'bg-blue-50 text-blue-700' : ''}`}
              >
                All Projects
              </button>
              {filteredProjectOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No matching projects</div>
              ) : (
                filteredProjectOptions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProjectFilterSelect(p.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${filterProject === p.id ? 'bg-blue-50 text-blue-700' : ''}`}
                  >
                    {p.description}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
          <select
            value={filterResource}
            onChange={(e) => setFilterResource(e.target.value)}
            className="border rounded-lg px-3 py-2 min-w-40"
          >
            <option value="">All Resources</option>
            {uniqueResources.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timeline View</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
            className="border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
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
        <div className="bg-white rounded-lg shadow overflow-x-auto relative">
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
                const resAllocations = filteredAllocations.filter(
                  (a) => a.resourceName === resource
                );
                return (
                  <tr key={resource} className="border-t hover:bg-gray-50">
                    <td className="sticky left-0 bg-white px-4 py-2 text-sm font-medium border-r z-10">
                      {resource}
                    </td>
                    {periods.map((_, periodIdx) => {
                      const { total, breakdown } = getAggregatedData(resAllocations, periodIdx);

                      if (total === 0) {
                        return <td key={periodIdx} className="px-1 py-2 border-r" />;
                      }

                      const cappedOpacity = Math.min(total, 100) / 100;

                      return (
                        <td key={periodIdx} className="px-1 py-2 border-r">
                          <div
                            className="h-6 rounded text-xs text-white flex items-center justify-center cursor-pointer"
                            style={{
                              backgroundColor: BAR_COLOR,
                              opacity: cappedOpacity,
                            }}
                            onMouseEnter={(e) => handleMouseEnter(e, breakdown, total)}
                            onMouseLeave={handleMouseLeave}
                          >
                            {total}%
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {tooltip.visible && (
            <div
              className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none"
              style={{
                left: tooltip.x,
                top: tooltip.y,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="font-semibold mb-1">
                Total: {tooltip.total}%
              </div>
              {tooltip.content.map((item, i) => (
                <div key={i} className="whitespace-nowrap">
                  {item.projectDescription}: {item.percentage}%
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
