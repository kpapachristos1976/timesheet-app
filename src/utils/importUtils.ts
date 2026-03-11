import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { FieldMapping } from '../types';

export function parseCSV(
  content: string,
  delimiter: string
): Promise<{ headers: string[]; data: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      delimiter,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        resolve({ headers, data: results.data as Record<string, string>[] });
      },
      error: (error: Error) => reject(error),
    });
  });
}

export function parseExcel(
  buffer: ArrayBuffer
): { headers: string[]; data: Record<string, string>[] } {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
    raw: false,
    defval: '',
  });
  
  const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
  return { headers, data: jsonData };
}

export function mapData<T>(
  data: Record<string, string>[],
  mappings: FieldMapping[],
  transform?: (mapped: Record<string, string>) => T
): T[] {
  return data.map((row) => {
    const mapped: Record<string, string> = {};
    mappings.forEach(({ sourceField, targetField }) => {
      if (sourceField && targetField) {
        mapped[targetField] = row[sourceField] || '';
      }
    });
    return transform ? transform(mapped) : (mapped as unknown as T);
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const TIMESHEET_FIELDS = [
  { key: 'resourceName', label: 'Resource Name' },
  { key: 'stream', label: 'Stream' },
  { key: 'projectStream', label: 'Project Stream' },
  { key: 'pid', label: 'PID' },
  { key: 'project', label: 'Project' },
  { key: 'description', label: 'Description' },
  { key: 'weekEnding', label: 'Week Ending' },
  { key: 'role', label: 'Role' },
  { key: 'offshore', label: 'Offshore' },
  { key: 'totalHours', label: 'Total Hours' },
  { key: 'agreedRates', label: 'Agreed Rates' },
  { key: 'revenues', label: 'Revenues' },
  { key: 'bc', label: 'BC' },
];

export const PROJECT_FIELDS = [
  { key: 'projectId', label: 'Project ID' },
  { key: 'projectTitle', label: 'Project Title' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'phase', label: 'Phase' },
  { key: 'startDate', label: 'Start Date' },
  { key: 'endDate', label: 'End Date' },
  { key: 'allocatedHoursEY', label: 'Allocated Hours EY' },
  { key: 'ragby', label: 'RAGBY' },
];

export const ROLE_FIELDS = [
  { key: 'role', label: 'Role' },
  { key: 'rateCard', label: 'Rate Card' },
  { key: 'onshoreOffshore', label: 'Onshore/Offshore' },
];

export const RESOURCE_ALLOCATION_FIELDS = [
  { key: 'resourceName', label: 'Resource Name' },
  { key: 'stream', label: 'Stream' },
  { key: 'projectDescription', label: 'Project Description' },
  { key: 'projectId', label: 'Project ID' },
  { key: 'startDate', label: 'Start Date' },
  { key: 'endDate', label: 'End Date' },
  { key: 'allocationPercentage', label: 'Allocation Percentage' },
];

export const DELIMITERS = [
  { value: ',', label: 'Comma (,)' },
  { value: ';', label: 'Semicolon (;)' },
  { value: '\t', label: 'Tab' },
  { value: '|', label: 'Pipe (|)' },
];
