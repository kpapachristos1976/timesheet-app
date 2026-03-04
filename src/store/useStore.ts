import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimesheetEntry, Project, Role, ResourceAllocation } from '../types';

interface AppState {
  timesheets: TimesheetEntry[];
  projects: Project[];
  roles: Role[];
  resourceAllocations: ResourceAllocation[];
  
  setTimesheets: (data: TimesheetEntry[]) => void;
  setProjects: (data: Project[]) => void;
  setRoles: (data: Role[]) => void;
  
  addResourceAllocation: (allocation: ResourceAllocation) => void;
  updateResourceAllocation: (id: string, allocation: Partial<ResourceAllocation>) => void;
  deleteResourceAllocation: (id: string) => void;
  setResourceAllocations: (allocations: ResourceAllocation[]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      timesheets: [],
      projects: [],
      roles: [],
      resourceAllocations: [],

      setTimesheets: (data) => set({ timesheets: data }),
      setProjects: (data) => set({ projects: data }),
      setRoles: (data) => set({ roles: data }),

      addResourceAllocation: (allocation) =>
        set((state) => ({
          resourceAllocations: [...state.resourceAllocations, allocation],
        })),

      updateResourceAllocation: (id, allocation) =>
        set((state) => ({
          resourceAllocations: state.resourceAllocations.map((a) =>
            a.id === id ? { ...a, ...allocation } : a
          ),
        })),

      deleteResourceAllocation: (id) =>
        set((state) => ({
          resourceAllocations: state.resourceAllocations.filter((a) => a.id !== id),
        })),

      setResourceAllocations: (allocations) =>
        set({ resourceAllocations: allocations }),
    }),
    {
      name: 'timesheet-app-storage',
    }
  )
);
