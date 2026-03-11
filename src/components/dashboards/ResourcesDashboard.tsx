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
import { ArrowLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { STREAMS } from '../../types';
import { calculatePlannedHours, getTimelinePeriods, doRangesOverlap } from '../../utils/dateUtils';
import { parseISO, isValid, format } from 'date-fns';

export const ResourcesDashboard: React.FC = () => {
  const { timesheets, resourceAllocations } = useStore();
  const [filterStream, setFilterStream] = useState<string>('');
  const [filterResource, setFilterResource] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<'weekly' | 'monthly'>('monthly');
  const [expandedActual, setExpandedActual] = useState<Set<string>>(new Set());
  const [expandedPlanned, setExpandedPlanned] = useState<Set<string>>(new Set());

  const uniqueResources = useMemo(() => {
    const fromTimesheets = timesheets.map((t) => t.resourceName);
    const fromAllocations = resourceAllocations.map((a) => a.resourceName);
    return [...new Set([...fromTimesheets, ...fromAllocations])].sort();
  }, [timesheets, resourceAllocations]);

  const filteredTimesheets = useMemo(() => {
    return timesheets.filter((t) => {
      if (dateFrom) {
        const we = parseISO(t.weekEnding);
        if (isValid(we) && we < parseISO(dateFrom)) return false;
      }
      if (dateTo) {
        const we = parseISO(t.weekEnding);
        if (isValid(we) && we > parseISO(dateTo)) return false;
      }
      return true;
    });
  }, [timesheets, dateFrom, dateTo]);

  const filteredAllocations = useMemo(() => {
    return resourceAllocations.filter((a) => {
      const s = parseISO(a.startDate);
      const e = parseISO(a.endDate);
      if (!isValid(s) || !isValid(e)) return false;
      if (dateFrom) {
        const from = parseISO(dateFrom);
        if (isValid(from) && e < from) return false;
      }
      if (dateTo) {
        const to = parseISO(dateTo);
        if (isValid(to) && s > to) return false;
      }
      return true;
    });
  }, [resourceAllocations, dateFrom, dateTo]);

  const chartData = useMemo(() => {
    const resourceMap = new Map<
      string,
      { name: string; actualHours: number; plannedHours: number; stream: string }
    >();

    filteredTimesheets.forEach((t) => {
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

    filteredAllocations.forEach((a) => {
      const key = a.resourceName;
      const existing = resourceMap.get(key) || {
        name: a.resourceName,
        actualHours: 0,
        plannedHours: 0,
        stream: a.stream,
      };
      const effectiveStart = dateFrom && parseISO(dateFrom) > parseISO(a.startDate) ? dateFrom : a.startDate;
      const effectiveEnd = dateTo && parseISO(dateTo) < parseISO(a.endDate) ? dateTo : a.endDate;
      existing.plannedHours += calculatePlannedHours(effectiveStart, effectiveEnd, a.allocationPercentage);
      if (!existing.stream) existing.stream = a.stream;
      resourceMap.set(key, existing);
    });

    let data = Array.from(resourceMap.values());
    if (filterStream) data = data.filter((d) => d.stream === filterStream);
    if (filterResource) data = data.filter((d) => d.name.toLowerCase().includes(filterResource.toLowerCase()));
    return data.sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTimesheets, filteredAllocations, filterStream, filterResource, dateFrom, dateTo]);

  const totals = useMemo(() => {
    return chartData.reduce(
      (acc, d) => ({
        actualHours: acc.actualHours + d.actualHours,
        plannedHours: acc.plannedHours + d.plannedHours,
      }),
      { actualHours: 0, plannedHours: 0 }
    );
  }, [chartData]);

  // Detail view data for selected resource
  const detailPeriods = useMemo(() => {
    if (!selectedResource) return [];
    const resTs = timesheets.filter((t) => t.resourceName === selectedResource);
    const resAlloc = resourceAllocations.filter((a) => a.resourceName === selectedResource);

    const allDates: Date[] = [];
    resTs.forEach((t) => { const d = parseISO(t.weekEnding); if (isValid(d)) allDates.push(d); });
    resAlloc.forEach((a) => {
      const s = parseISO(a.startDate); const e = parseISO(a.endDate);
      if (isValid(s)) allDates.push(s); if (isValid(e)) allDates.push(e);
    });
    if (allDates.length === 0) return [];

    let rangeStart = allDates.reduce((min, d) => d < min ? d : min, allDates[0]);
    let rangeEnd = allDates.reduce((max, d) => d > max ? d : max, allDates[0]);
    if (dateFrom) { const f = parseISO(dateFrom); if (isValid(f)) rangeStart = f; }
    if (dateTo) { const t = parseISO(dateTo); if (isValid(t)) rangeEnd = t; }

    return getTimelinePeriods(format(rangeStart, 'yyyy-MM-dd'), format(rangeEnd, 'yyyy-MM-dd'), detailView);
  }, [selectedResource, timesheets, resourceAllocations, detailView, dateFrom, dateTo]);

  const detailActualProjects = useMemo(() => {
    if (!selectedResource) return [];
    const resTs = timesheets.filter((t) => t.resourceName === selectedResource);
    const projectSet = new Map<string, string>();
    resTs.forEach((t) => { if (!projectSet.has(t.pid)) projectSet.set(t.pid, t.description || t.project || t.pid); });
    return Array.from(projectSet.entries()).map(([pid, desc]) => ({ pid, description: desc })).sort((a, b) => a.description.localeCompare(b.description));
  }, [selectedResource, timesheets]);

  const detailPlannedProjects = useMemo(() => {
    if (!selectedResource) return [];
    const resAlloc = resourceAllocations.filter((a) => a.resourceName === selectedResource);
    const projectSet = new Map<string, string>();
    resAlloc.forEach((a) => { if (!projectSet.has(a.projectId)) projectSet.set(a.projectId, a.projectDescription || a.projectId); });
    return Array.from(projectSet.entries()).map(([pid, desc]) => ({ pid, description: desc })).sort((a, b) => a.description.localeCompare(b.description));
  }, [selectedResource, resourceAllocations]);

  const getActualHoursForPeriod = (resourceName: string, periodIdx: number, projectFilter?: string) => {
    const period = detailPeriods[periodIdx];
    if (!period) return 0;
    return timesheets
      .filter((t) => t.resourceName === resourceName && (!projectFilter || t.pid === projectFilter))
      .reduce((sum, t) => {
        const we = parseISO(t.weekEnding);
        if (isValid(we) && we >= period.start && we <= period.end) return sum + t.totalHours;
        return sum;
      }, 0);
  };

  const getPlannedHoursForPeriod = (resourceName: string, periodIdx: number, projectFilter?: string) => {
    const period = detailPeriods[periodIdx];
    if (!period) return 0;
    return resourceAllocations
      .filter((a) => a.resourceName === resourceName && (!projectFilter || a.projectId === projectFilter))
      .reduce((sum, a) => {
        const s = parseISO(a.startDate);
        const e = parseISO(a.endDate);
        if (!isValid(s) || !isValid(e)) return sum;
        if (doRangesOverlap(s, e, period.start, period.end)) {
          const effStart = s > period.start ? s : period.start;
          const effEnd = e < period.end ? e : period.end;
          return sum + calculatePlannedHours(format(effStart, 'yyyy-MM-dd'), format(effEnd, 'yyyy-MM-dd'), a.allocationPercentage);
        }
        return sum;
      }, 0);
  };

  const toggleActualExpand = (pid: string) => {
    setExpandedActual((prev) => { const next = new Set(prev); if (next.has(pid)) next.delete(pid); else next.add(pid); return next; });
  };

  const togglePlannedExpand = (pid: string) => {
    setExpandedPlanned((prev) => { const next = new Set(prev); if (next.has(pid)) next.delete(pid); else next.add(pid); return next; });
  };

  if (selectedResource) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedResource(null); setExpandedActual(new Set()); setExpandedPlanned(new Set()); }} className="p-2 hover:bg-gray-200 rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{selectedResource}</h1>
            <p className="text-gray-600">Resource detail - actual and planned hours timeline</p>
          </div>
        </div>

        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
            <select value={detailView} onChange={(e) => setDetailView(e.target.value as 'weekly' | 'monthly')} className="border rounded-lg px-3 py-2">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded-lg px-3 py-2" />
          </div>
        </div>

        {detailPeriods.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No timeline data found for this resource.</div>
        ) : (
          <>
            {/* Actual Hours Timeline */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <div className="px-4 py-3 bg-blue-50 border-b">
                <h3 className="font-semibold text-blue-800">Actual Hours</h3>
              </div>
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="sticky left-0 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-700 border-r min-w-56 z-10">Source</th>
                    {detailPeriods.map((p, i) => (
                      <th key={i} className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r min-w-20">{p.label}</th>
                    ))}
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 min-w-20">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t font-semibold bg-blue-50/30">
                    <td className="sticky left-0 bg-blue-50/30 px-4 py-2 text-sm border-r z-10">Total Actual</td>
                    {detailPeriods.map((_, i) => {
                      const hrs = getActualHoursForPeriod(selectedResource, i);
                      return <td key={i} className="px-2 py-2 text-center text-sm border-r">{hrs > 0 ? Math.round(hrs * 10) / 10 : ''}</td>;
                    })}
                    <td className="px-3 py-2 text-center text-sm font-bold">
                      {Math.round(detailPeriods.reduce((sum, _, i) => sum + getActualHoursForPeriod(selectedResource, i), 0) * 10) / 10}
                    </td>
                  </tr>
                  {detailActualProjects.map((proj) => (
                    <>
                      <tr key={`act-${proj.pid}`} className="border-t hover:bg-gray-50">
                        <td className="sticky left-0 bg-white px-4 py-1.5 text-sm border-r z-10">
                          <button onClick={() => toggleActualExpand(proj.pid)} className="flex items-center gap-1 text-left">
                            {expandedActual.has(proj.pid) ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                            <span className="truncate">{proj.description}</span>
                          </button>
                        </td>
                        {expandedActual.has(proj.pid) && detailPeriods.map((_, i) => {
                          const hrs = getActualHoursForPeriod(selectedResource, i, proj.pid);
                          return <td key={i} className="px-2 py-1.5 text-center text-xs text-gray-600 border-r">{hrs > 0 ? Math.round(hrs * 10) / 10 : ''}</td>;
                        })}
                        {!expandedActual.has(proj.pid) && detailPeriods.map((_, i) => <td key={i} className="border-r" />)}
                        <td className="px-3 py-1.5 text-center text-xs text-gray-600">
                          {expandedActual.has(proj.pid) ? Math.round(detailPeriods.reduce((s, _, i) => s + getActualHoursForPeriod(selectedResource, i, proj.pid), 0) * 10) / 10 : ''}
                        </td>
                      </tr>
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Planned Hours Timeline */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <div className="px-4 py-3 bg-green-50 border-b">
                <h3 className="font-semibold text-green-800">Planned Hours</h3>
              </div>
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="sticky left-0 bg-gray-50 px-4 py-2 text-left text-xs font-medium text-gray-700 border-r min-w-56 z-10">Source</th>
                    {detailPeriods.map((p, i) => (
                      <th key={i} className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r min-w-20">{p.label}</th>
                    ))}
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 min-w-20">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t font-semibold bg-green-50/30">
                    <td className="sticky left-0 bg-green-50/30 px-4 py-2 text-sm border-r z-10">Total Planned</td>
                    {detailPeriods.map((_, i) => {
                      const hrs = getPlannedHoursForPeriod(selectedResource, i);
                      return <td key={i} className="px-2 py-2 text-center text-sm border-r">{hrs > 0 ? Math.round(hrs * 10) / 10 : ''}</td>;
                    })}
                    <td className="px-3 py-2 text-center text-sm font-bold">
                      {Math.round(detailPeriods.reduce((sum, _, i) => sum + getPlannedHoursForPeriod(selectedResource, i), 0) * 10) / 10}
                    </td>
                  </tr>
                  {detailPlannedProjects.map((proj) => (
                    <>
                      <tr key={`plan-${proj.pid}`} className="border-t hover:bg-gray-50">
                        <td className="sticky left-0 bg-white px-4 py-1.5 text-sm border-r z-10">
                          <button onClick={() => togglePlannedExpand(proj.pid)} className="flex items-center gap-1 text-left">
                            {expandedPlanned.has(proj.pid) ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                            <span className="truncate">{proj.description}</span>
                          </button>
                        </td>
                        {expandedPlanned.has(proj.pid) && detailPeriods.map((_, i) => {
                          const hrs = getPlannedHoursForPeriod(selectedResource, i, proj.pid);
                          return <td key={i} className="px-2 py-1.5 text-center text-xs text-gray-600 border-r">{hrs > 0 ? Math.round(hrs * 10) / 10 : ''}</td>;
                        })}
                        {!expandedPlanned.has(proj.pid) && detailPeriods.map((_, i) => <td key={i} className="border-r" />)}
                        <td className="px-3 py-1.5 text-center text-xs text-gray-600">
                          {expandedPlanned.has(proj.pid) ? Math.round(detailPeriods.reduce((s, _, i) => s + getPlannedHoursForPeriod(selectedResource, i, proj.pid), 0) * 10) / 10 : ''}
                        </td>
                      </tr>
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Resources Dashboard</h1>
      <p className="text-gray-600">
        Actual effort hours from timesheets vs planned hours from resource allocations
      </p>

      <div className="flex gap-4 items-center flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
          <select value={filterStream} onChange={(e) => setFilterStream(e.target.value)} className="border rounded-lg px-3 py-2 min-w-48">
            <option value="">All Streams</option>
            {STREAMS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resource</label>
          <select value={filterResource} onChange={(e) => setFilterResource(e.target.value)} className="border rounded-lg px-3 py-2 min-w-48">
            <option value="">All Resources</option>
            {uniqueResources.map((r) => (<option key={r} value={r}>{r}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded-lg px-3 py-2" />
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
          <div className={`text-2xl font-bold ${totals.actualHours - totals.plannedHours >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {(totals.actualHours - totals.plannedHours).toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No data available. Import timesheet data and create resource allocations to see the comparison.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-4">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value} />
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
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Resource</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stream</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actual Hours</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Planned Hours</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {chartData.map((row) => (
              <tr
                key={row.name}
                className="hover:bg-blue-50 cursor-pointer transition"
                onClick={() => setSelectedResource(row.name)}
              >
                <td className="px-4 py-3 text-sm font-medium text-blue-600 underline">{row.name}</td>
                <td className="px-4 py-3 text-sm">{row.stream}</td>
                <td className="px-4 py-3 text-sm text-right">
                  {row.actualHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {row.plannedHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${row.actualHours - row.plannedHours >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {(row.actualHours - row.plannedHours).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
