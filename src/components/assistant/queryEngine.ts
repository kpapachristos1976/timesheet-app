import type { TimesheetEntry, Project, Role, ResourceAllocation } from '../../types';
import { calculatePlannedHours } from '../../utils/dateUtils';

export interface QueryResult {
  title: string;
  columns: string[];
  rows: Record<string, string | number>[];
  summary?: string;
}

interface DataContext {
  timesheets: TimesheetEntry[];
  projects: Project[];
  roles: Role[];
  resourceAllocations: ResourceAllocation[];
}

interface QueryTemplate {
  patterns: RegExp[];
  extractParam: (match: RegExpMatchArray) => string;
  execute: (param: string, data: DataContext) => QueryResult | null;
  label: string;
  placeholder: string;
}

const templates: QueryTemplate[] = [
  {
    label: 'Projects allocated to a resource',
    placeholder: 'Which projects is John allocated to?',
    patterns: [
      /(?:which|what)\s+projects?\s+(?:is|are)\s+(.+?)\s+(?:allocated|assigned|planned)/i,
      /(?:allocations?|planning)\s+(?:for|of)\s+(?:resource\s+)?(.+)/i,
      /(.+?)\s+(?:allocations?|is allocated|assigned to)/i,
    ],
    extractParam: (m) => m[1].trim().replace(/[?"]/g, ''),
    execute: (resource, { resourceAllocations }) => {
      const matches = resourceAllocations.filter(
        (a) => a.resourceName.toLowerCase().includes(resource.toLowerCase())
      );
      if (matches.length === 0) return null;
      return {
        title: `Allocations for "${resource}"`,
        columns: ['Project', 'Stream', 'Start Date', 'End Date', 'Allocation %', 'Planned Hours'],
        rows: matches.map((a) => ({
          Project: a.projectDescription,
          Stream: a.stream,
          'Start Date': a.startDate,
          'End Date': a.endDate,
          'Allocation %': a.allocationPercentage,
          'Planned Hours': Math.round(calculatePlannedHours(a.startDate, a.endDate, a.allocationPercentage)),
        })),
        summary: `Found ${matches.length} allocation(s) for resources matching "${resource}".`,
      };
    },
  },
  {
    label: 'Resources allocated to a project',
    placeholder: 'Which resources are allocated to project X?',
    patterns: [
      /(?:which|what)\s+resources?\s+(?:are|is)\s+(?:allocated|assigned|planned)\s+(?:to|for|on)\s+(?:project\s+)?(.+)/i,
      /resources?\s+(?:on|in|for)\s+(?:project\s+)?(.+)/i,
      /(?:who|whom)\s+(?:is|are)\s+(?:allocated|assigned|working)\s+(?:on|to|in)\s+(?:project\s+)?(.+)/i,
    ],
    extractParam: (m) => m[1].trim().replace(/[?"]/g, ''),
    execute: (project, { resourceAllocations }) => {
      const matches = resourceAllocations.filter(
        (a) =>
          a.projectDescription.toLowerCase().includes(project.toLowerCase()) ||
          a.projectId.toLowerCase().includes(project.toLowerCase())
      );
      if (matches.length === 0) return null;
      return {
        title: `Resources allocated to "${project}"`,
        columns: ['Resource', 'Stream', 'Start Date', 'End Date', 'Allocation %', 'Planned Hours'],
        rows: matches.map((a) => ({
          Resource: a.resourceName,
          Stream: a.stream,
          'Start Date': a.startDate,
          'End Date': a.endDate,
          'Allocation %': a.allocationPercentage,
          'Planned Hours': Math.round(calculatePlannedHours(a.startDate, a.endDate, a.allocationPercentage)),
        })),
        summary: `Found ${matches.length} resource(s) allocated to projects matching "${project}".`,
      };
    },
  },
  {
    label: 'Actual effort for a resource',
    placeholder: 'What is the actual effort for Jane?',
    patterns: [
      /(?:actual|total)\s+(?:effort|hours|work)\s+(?:for|of|by)\s+(?:resource\s+)?(.+)/i,
      /(?:how many|how much)\s+hours?\s+(?:did|has|does)\s+(.+?)\s+(?:work|log|register)/i,
      /timesheet\s+(?:for|of)\s+(.+)/i,
    ],
    extractParam: (m) => m[1].trim().replace(/[?"]/g, ''),
    execute: (resource, { timesheets }) => {
      const matches = timesheets.filter(
        (t) => t.resourceName.toLowerCase().includes(resource.toLowerCase())
      );
      if (matches.length === 0) return null;

      const byProject = new Map<string, { project: string; hours: number; weeks: number }>();
      matches.forEach((t) => {
        const key = t.pid || t.project;
        const existing = byProject.get(key) || { project: t.description || t.project, hours: 0, weeks: 0 };
        existing.hours += t.totalHours;
        existing.weeks += 1;
        byProject.set(key, existing);
      });

      const totalHours = matches.reduce((sum, t) => sum + t.totalHours, 0);

      return {
        title: `Actual effort for "${resource}"`,
        columns: ['Project', 'Total Hours', 'Timesheet Entries'],
        rows: Array.from(byProject.values()).map((v) => ({
          Project: v.project,
          'Total Hours': Math.round(v.hours * 10) / 10,
          'Timesheet Entries': v.weeks,
        })),
        summary: `Total actual effort: ${Math.round(totalHours * 10) / 10} hours across ${byProject.size} project(s).`,
      };
    },
  },
  {
    label: 'Actual hours for a project',
    placeholder: 'What are the total actual hours for project ABC?',
    patterns: [
      /(?:actual|total)\s+hours?\s+(?:for|of|on|in)\s+(?:project\s+)?(.+)/i,
      /(?:how many|how much)\s+(?:actual\s+)?hours?\s+(?:on|for|in)\s+(?:project\s+)?(.+)/i,
    ],
    extractParam: (m) => m[1].trim().replace(/[?"]/g, ''),
    execute: (project, { timesheets }) => {
      const matches = timesheets.filter(
        (t) =>
          t.pid.toLowerCase().includes(project.toLowerCase()) ||
          t.project.toLowerCase().includes(project.toLowerCase()) ||
          t.description.toLowerCase().includes(project.toLowerCase())
      );
      if (matches.length === 0) return null;

      const byResource = new Map<string, { resource: string; hours: number }>();
      matches.forEach((t) => {
        const existing = byResource.get(t.resourceName) || { resource: t.resourceName, hours: 0 };
        existing.hours += t.totalHours;
        byResource.set(t.resourceName, existing);
      });

      const totalHours = matches.reduce((sum, t) => sum + t.totalHours, 0);

      return {
        title: `Actual hours for project "${project}"`,
        columns: ['Resource', 'Total Hours'],
        rows: Array.from(byResource.values()).map((v) => ({
          Resource: v.resource,
          'Total Hours': Math.round(v.hours * 10) / 10,
        })),
        summary: `Total: ${Math.round(totalHours * 10) / 10} hours by ${byResource.size} resource(s).`,
      };
    },
  },
  {
    label: 'Utilization of a resource',
    placeholder: 'What is the utilization of John?',
    patterns: [
      /utiliz?ation\s+(?:of|for)\s+(?:resource\s+)?(.+)/i,
      /(?:actual\s+vs\s+plan|plan\s+vs\s+actual)\s+(?:for|of)\s+(?:resource\s+)?(.+)/i,
    ],
    extractParam: (m) => m[1].trim().replace(/[?"]/g, ''),
    execute: (resource, { timesheets, resourceAllocations }) => {
      const tsMatches = timesheets.filter(
        (t) => t.resourceName.toLowerCase().includes(resource.toLowerCase())
      );
      const allocMatches = resourceAllocations.filter(
        (a) => a.resourceName.toLowerCase().includes(resource.toLowerCase())
      );

      if (tsMatches.length === 0 && allocMatches.length === 0) return null;

      const actualHours = tsMatches.reduce((sum, t) => sum + t.totalHours, 0);
      const plannedHours = allocMatches.reduce(
        (sum, a) => sum + calculatePlannedHours(a.startDate, a.endDate, a.allocationPercentage),
        0
      );
      const utilization = plannedHours > 0 ? (actualHours / plannedHours) * 100 : 0;

      return {
        title: `Utilization for "${resource}"`,
        columns: ['Metric', 'Value'],
        rows: [
          { Metric: 'Actual Hours', Value: Math.round(actualHours * 10) / 10 },
          { Metric: 'Planned Hours', Value: Math.round(plannedHours * 10) / 10 },
          { Metric: 'Variance', Value: Math.round((actualHours - plannedHours) * 10) / 10 },
          { Metric: 'Utilization %', Value: `${Math.round(utilization)}%` },
        ],
        summary: `Actual: ${Math.round(actualHours * 10) / 10}h, Planned: ${Math.round(plannedHours * 10) / 10}h, Utilization: ${Math.round(utilization)}%.`,
      };
    },
  },
  {
    label: 'Allocations for a stream',
    placeholder: 'Show all allocations for Data Management',
    patterns: [
      /(?:allocations?|resources?|planning)\s+(?:for|in|of)\s+(?:stream\s+)?(.+)/i,
      /(?:show|list|display)\s+(?:all\s+)?(?:allocations?|resources?)\s+(?:for|in)\s+(?:stream\s+)?(.+)/i,
      /stream\s+(.+)/i,
    ],
    extractParam: (m) => m[1].trim().replace(/[?"]/g, ''),
    execute: (stream, { resourceAllocations }) => {
      const matches = resourceAllocations.filter(
        (a) => a.stream.toLowerCase().includes(stream.toLowerCase())
      );
      if (matches.length === 0) return null;
      return {
        title: `Allocations for stream "${stream}"`,
        columns: ['Resource', 'Project', 'Start Date', 'End Date', 'Allocation %'],
        rows: matches.map((a) => ({
          Resource: a.resourceName,
          Project: a.projectDescription,
          'Start Date': a.startDate,
          'End Date': a.endDate,
          'Allocation %': a.allocationPercentage,
        })),
        summary: `Found ${matches.length} allocation(s) in streams matching "${stream}".`,
      };
    },
  },
  {
    label: 'Project details',
    placeholder: 'Show details for project ABC',
    patterns: [
      /(?:show|get|display|find)\s+(?:details?|info|information)\s+(?:for|of|about)\s+(?:project\s+)?(.+)/i,
      /project\s+(?:details?|info)\s+(?:for\s+)?(.+)/i,
    ],
    extractParam: (m) => m[1].trim().replace(/[?"]/g, ''),
    execute: (project, { projects }) => {
      const matches = projects.filter(
        (p) =>
          p.projectId.toLowerCase().includes(project.toLowerCase()) ||
          p.projectTitle.toLowerCase().includes(project.toLowerCase()) ||
          p.description.toLowerCase().includes(project.toLowerCase())
      );
      if (matches.length === 0) return null;
      return {
        title: `Project details for "${project}"`,
        columns: ['Project ID', 'Title', 'Status', 'Phase', 'Start Date', 'End Date', 'Allocated Hours EY'],
        rows: matches.map((p) => ({
          'Project ID': p.projectId,
          Title: p.projectTitle,
          Status: p.status,
          Phase: p.phase,
          'Start Date': p.startDate,
          'End Date': p.endDate,
          'Allocated Hours EY': p.allocatedHoursEY,
        })),
        summary: `Found ${matches.length} project(s) matching "${project}".`,
      };
    },
  },
  {
    label: 'Role and rate information',
    placeholder: 'What is the rate for Senior Consultant?',
    patterns: [
      /(?:rate|cost|price)\s+(?:for|of)\s+(?:role\s+)?(.+)/i,
      /(?:role|roles)\s+(?:info|details?|rate)\s+(?:for\s+)?(.+)/i,
    ],
    extractParam: (m) => m[1].trim().replace(/[?"]/g, ''),
    execute: (role, { roles }) => {
      const matches = roles.filter(
        (r) => r.role.toLowerCase().includes(role.toLowerCase())
      );
      if (matches.length === 0) return null;
      return {
        title: `Role information for "${role}"`,
        columns: ['Role', 'Rate Card', 'Onshore/Offshore'],
        rows: matches.map((r) => ({
          Role: r.role,
          'Rate Card': r.rateCard,
          'Onshore/Offshore': r.onshoreOffshore,
        })),
        summary: `Found ${matches.length} role(s) matching "${role}".`,
      };
    },
  },
];

function freeTextSearch(query: string, data: DataContext): QueryResult[] {
  const results: QueryResult[] = [];
  const lower = query.toLowerCase().trim();

  const tsMatches = data.timesheets.filter(
    (t) =>
      t.resourceName.toLowerCase().includes(lower) ||
      t.pid.toLowerCase().includes(lower) ||
      t.project.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower) ||
      t.stream.toLowerCase().includes(lower)
  );
  if (tsMatches.length > 0) {
    const limited = tsMatches.slice(0, 50);
    results.push({
      title: `Timesheet entries matching "${query}"`,
      columns: ['Resource', 'Project', 'Week Ending', 'Hours', 'Stream'],
      rows: limited.map((t) => ({
        Resource: t.resourceName,
        Project: t.description || t.project,
        'Week Ending': t.weekEnding,
        Hours: t.totalHours,
        Stream: t.stream,
      })),
      summary: `Found ${tsMatches.length} timesheet entries (showing first ${limited.length}).`,
    });
  }

  const allocMatches = data.resourceAllocations.filter(
    (a) =>
      a.resourceName.toLowerCase().includes(lower) ||
      a.projectId.toLowerCase().includes(lower) ||
      a.projectDescription.toLowerCase().includes(lower) ||
      a.stream.toLowerCase().includes(lower)
  );
  if (allocMatches.length > 0) {
    results.push({
      title: `Resource allocations matching "${query}"`,
      columns: ['Resource', 'Project', 'Stream', 'Start', 'End', 'Allocation %'],
      rows: allocMatches.map((a) => ({
        Resource: a.resourceName,
        Project: a.projectDescription,
        Stream: a.stream,
        Start: a.startDate,
        End: a.endDate,
        'Allocation %': a.allocationPercentage,
      })),
      summary: `Found ${allocMatches.length} allocation(s).`,
    });
  }

  const projMatches = data.projects.filter(
    (p) =>
      p.projectId.toLowerCase().includes(lower) ||
      p.projectTitle.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower)
  );
  if (projMatches.length > 0) {
    results.push({
      title: `Projects matching "${query}"`,
      columns: ['Project ID', 'Title', 'Status', 'Phase', 'Allocated Hours EY'],
      rows: projMatches.map((p) => ({
        'Project ID': p.projectId,
        Title: p.projectTitle,
        Status: p.status,
        Phase: p.phase,
        'Allocated Hours EY': p.allocatedHoursEY,
      })),
      summary: `Found ${projMatches.length} project(s).`,
    });
  }

  return results;
}

export function executeQuery(query: string, data: DataContext): QueryResult[] {
  const results: QueryResult[] = [];

  for (const template of templates) {
    for (const pattern of template.patterns) {
      const match = query.match(pattern);
      if (match) {
        const param = template.extractParam(match);
        if (param) {
          const result = template.execute(param, data);
          if (result) {
            results.push(result);
            return results;
          }
        }
      }
    }
  }

  const freeResults = freeTextSearch(query, data);
  if (freeResults.length > 0) return freeResults;

  return [{
    title: 'No results found',
    columns: [],
    rows: [],
    summary: `No data found matching "${query}". Try one of the suggested questions or search by a resource name, project name, or stream.`,
  }];
}

export function getTemplateLabels(): { label: string; placeholder: string }[] {
  return templates.map((t) => ({ label: t.label, placeholder: t.placeholder }));
}
