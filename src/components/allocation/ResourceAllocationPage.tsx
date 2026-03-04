import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, X, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { ResourceAllocation, Stream } from '../../types';
import { STREAMS } from '../../types';
import { generateId } from '../../utils/importUtils';

interface AllocationFormData {
  resourceName: string;
  stream: Stream;
  projectDescription: string;
  projectId: string;
  startDate: string;
  endDate: string;
  allocationPercentage: number;
}

const emptyForm: AllocationFormData = {
  resourceName: '',
  stream: 'Data Analysis',
  projectDescription: '',
  projectId: '',
  startDate: '',
  endDate: '',
  allocationPercentage: 100,
};

export const ResourceAllocationPage: React.FC = () => {
  const {
    resourceAllocations,
    projects,
    addResourceAllocation,
    updateResourceAllocation,
    deleteResourceAllocation,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStream, setFilterStream] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AllocationFormData>(emptyForm);

  const filteredAllocations = useMemo(() => {
    return resourceAllocations.filter((a) => {
      const matchesSearch =
        searchTerm === '' ||
        a.resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.projectDescription.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStream = filterStream === '' || a.stream === filterStream;
      return matchesSearch && matchesStream;
    });
  }, [resourceAllocations, searchTerm, filterStream]);

  const handleProjectSelect = (description: string) => {
    const project = projects.find((p) => p.description === description);
    setFormData((prev) => ({
      ...prev,
      projectDescription: description,
      projectId: project?.projectId || '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateResourceAllocation(editingId, formData);
    } else {
      addResourceAllocation({
        id: generateId(),
        ...formData,
      });
    }

    setFormData(emptyForm);
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleEdit = (allocation: ResourceAllocation) => {
    setFormData({
      resourceName: allocation.resourceName,
      stream: allocation.stream,
      projectDescription: allocation.projectDescription,
      projectId: allocation.projectId,
      startDate: allocation.startDate,
      endDate: allocation.endDate,
      allocationPercentage: allocation.allocationPercentage,
    });
    setEditingId(allocation.id);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this allocation?')) {
      deleteResourceAllocation(id);
    }
  };

  const handleCancel = () => {
    setFormData(emptyForm);
    setIsFormOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Resource Allocation</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Add Allocation
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by resource or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={filterStream}
          onChange={(e) => setFilterStream(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">All Streams</option>
          {STREAMS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Edit Allocation' : 'New Allocation'}
              </h2>
              <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.resourceName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, resourceName: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stream
                </label>
                <select
                  required
                  value={formData.stream}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, stream: e.target.value as Stream }))
                  }
                  className="w-full border rounded-lg px-3 py-2"
                >
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
                  required
                  value={formData.projectDescription}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.description}>
                      {p.description}
                    </option>
                  ))}
                </select>
                {projects.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    No projects loaded. Import projects first.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allocation Percentage
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={formData.allocationPercentage}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      allocationPercentage: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Check size={20} />
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                Resource Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stream</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Project</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Start</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">End</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                Allocation %
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAllocations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No allocations found. Click "Add Allocation" to create one.
                </td>
              </tr>
            ) : (
              filteredAllocations.map((allocation) => (
                <tr key={allocation.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{allocation.resourceName}</td>
                  <td className="px-4 py-3 text-sm">{allocation.stream}</td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">
                    {allocation.projectDescription}
                  </td>
                  <td className="px-4 py-3 text-sm">{allocation.startDate}</td>
                  <td className="px-4 py-3 text-sm">{allocation.endDate}</td>
                  <td className="px-4 py-3 text-sm">{allocation.allocationPercentage}%</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(allocation)}
                      className="p-1 text-blue-600 hover:text-blue-800 mr-2"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(allocation.id)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
