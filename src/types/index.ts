export interface TimesheetEntry {
  id: string;
  resourceName: string;
  stream: string;
  projectStream: string;
  pid: string;
  project: string;
  description: string;
  weekEnding: string;
  role: string;
  offshore: string;
  totalHours: number;
  agreedRates: number;
  revenues: number;
  bc: number;
}

export interface Project {
  id: string;
  projectId: string;
  projectTitle: string;
  description: string;
  status: string;
  phase: string;
  startDate: string;
  endDate: string;
  allocatedHoursEY: number;
}

export interface Role {
  id: string;
  role: string;
  rateCard: number;
  onshoreOffshore: string;
}

export interface ResourceAllocation {
  id: string;
  resourceName: string;
  stream: Stream;
  projectDescription: string;
  projectId: string;
  startDate: string;
  endDate: string;
  allocationPercentage: number;
}

export type Stream =
  | 'Data Analysis'
  | 'Data Management'
  | 'Data Governance'
  | 'Data Analytics & AI'
  | 'Regulatory Technology'
  | 'RDARR'
  | 'Operational Risk'
  | 'QPR';

export const STREAMS: Stream[] = [
  'Data Analysis',
  'Data Management',
  'Data Governance',
  'Data Analytics & AI',
  'Regulatory Technology',
  'RDARR',
  'Operational Risk',
  'QPR',
];

export interface FieldMapping {
  sourceField: string;
  targetField: string;
}

export interface ImportConfig {
  delimiter: string;
  fieldMappings: FieldMapping[];
}
