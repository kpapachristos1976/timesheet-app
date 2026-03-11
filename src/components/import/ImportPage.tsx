import { FileImporter } from './FileImporter';
import { useStore } from '../../store/useStore';
import {
  TIMESHEET_FIELDS,
  PROJECT_FIELDS,
  ROLE_FIELDS,
  RESOURCE_ALLOCATION_FIELDS,
  generateId,
} from '../../utils/importUtils';
import type { TimesheetEntry, Project, Role, ResourceAllocation, Stream } from '../../types';

function normalizeDate(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  // DD/MM/YYYY
  const dmy = trimmed.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  // MM/DD/YYYY
  const mdy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;
  // YYYY/MM/DD
  const ymd = trimmed.match(/^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/);
  if (ymd) return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
  // ISO datetime - take date part
  const iso = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T ]/);
  if (iso) return iso[1];
  return trimmed;
}

export const ImportPage: React.FC = () => {
  const { setTimesheets, setProjects, setRoles, setResourceAllocations, timesheets, projects, roles, resourceAllocations } = useStore();

  const timesheetTransform = (mapped: Record<string, string>): TimesheetEntry => ({
    id: generateId(),
    resourceName: mapped.resourceName || '',
    stream: mapped.stream || '',
    projectStream: mapped.projectStream || '',
    pid: mapped.pid || '',
    project: mapped.project || '',
    description: mapped.description || `${mapped.pid || ''} | ${mapped.project || ''}`,
    weekEnding: mapped.weekEnding || '',
    role: mapped.role || '',
    offshore: mapped.offshore || '',
    totalHours: parseFloat(mapped.totalHours) || 0,
    agreedRates: parseFloat(mapped.agreedRates) || 0,
    revenues: parseFloat(mapped.revenues) || 0,
    bc: parseFloat(mapped.bc) || 0,
  });

  const projectTransform = (mapped: Record<string, string>): Project => ({
    id: generateId(),
    projectId: mapped.projectId || '',
    projectTitle: mapped.projectTitle || '',
    description: mapped.description || `${mapped.projectId || ''} | ${mapped.projectTitle || ''}`,
    status: mapped.status || '',
    phase: mapped.phase || '',
    startDate: mapped.startDate || '',
    endDate: mapped.endDate || '',
    allocatedHoursEY: parseFloat(mapped.allocatedHoursEY) || 0,
    ragby: (mapped.ragby || '').trim(),
  });

  const roleTransform = (mapped: Record<string, string>): Role => ({
    id: generateId(),
    role: mapped.role || '',
    rateCard: parseFloat(mapped.rateCard?.replace(/[^0-9.-]/g, '')) || 0,
    onshoreOffshore: mapped.onshoreOffshore || '',
  });

  const allocationTransform = (mapped: Record<string, string>): ResourceAllocation => ({
    id: generateId(),
    resourceName: (mapped.resourceName || '').trim(),
    stream: ((mapped.stream || 'Data Analysis').trim()) as Stream,
    projectDescription: (mapped.projectDescription || '').trim(),
    projectId: (mapped.projectId || '').trim(),
    startDate: normalizeDate(mapped.startDate),
    endDate: normalizeDate(mapped.endDate),
    allocationPercentage: parseFloat(mapped.allocationPercentage) || 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Import Data</h1>
      <p className="text-gray-600">
        Import data from Excel or CSV files. When importing, all previous records will be replaced.
      </p>

      <div className="grid gap-6">
        <FileImporter<TimesheetEntry>
          title={`Timesheet Data (${timesheets.length} records)`}
          targetFields={TIMESHEET_FIELDS}
          onImport={setTimesheets}
          transformFn={timesheetTransform}
        />

        <FileImporter<Project>
          title={`Projects Reference (${projects.length} records)`}
          targetFields={PROJECT_FIELDS}
          onImport={setProjects}
          transformFn={projectTransform}
        />

        <FileImporter<Role>
          title={`Roles Reference (${roles.length} records)`}
          targetFields={ROLE_FIELDS}
          onImport={setRoles}
          transformFn={roleTransform}
        />

        <FileImporter<ResourceAllocation>
          title={`Resource Allocations (${resourceAllocations.length} records)`}
          targetFields={RESOURCE_ALLOCATION_FIELDS}
          onImport={setResourceAllocations}
          transformFn={allocationTransform}
        />
      </div>
    </div>
  );
};
