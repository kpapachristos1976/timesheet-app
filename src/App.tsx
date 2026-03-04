import { useState } from 'react';
import {
  Upload,
  Users,
  LayoutDashboard,
  FolderKanban,
  GanttChart,
  Menu,
  X,
  BotMessageSquare,
  ScanSearch,
} from 'lucide-react';
import { ImportPage } from './components/import/ImportPage';
import { ResourceAllocationPage } from './components/allocation/ResourceAllocationPage';
import { ResourcesDashboard } from './components/dashboards/ResourcesDashboard';
import { ProjectsDashboard } from './components/dashboards/ProjectsDashboard';
import { GanttChartDashboard } from './components/dashboards/GanttChartDashboard';
import { DataAssistantPage } from './components/assistant/DataAssistantPage';

type Page = 'import' | 'allocation' | 'resources' | 'projects' | 'gantt' | 'assistant';

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'import', label: 'Import Data', icon: <Upload size={20} /> },
  { id: 'allocation', label: 'Resource Allocation', icon: <Users size={20} /> },
  { id: 'resources', label: 'Resources Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'projects', label: 'Projects Dashboard', icon: <FolderKanban size={20} /> },
  { id: 'gantt', label: 'Gantt Chart', icon: <GanttChart size={20} /> },
  { id: 'assistant', label: 'Data Assistant', icon: <BotMessageSquare size={20} /> },
];

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('import');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderPage = () => {
    switch (currentPage) {
      case 'import':
        return <ImportPage />;
      case 'allocation':
        return <ResourceAllocationPage />;
      case 'resources':
        return <ResourcesDashboard />;
      case 'projects':
        return <ProjectsDashboard />;
      case 'gantt':
        return <GanttChartDashboard />;
      case 'assistant':
        return <DataAssistantPage />;
      default:
        return <ImportPage />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-slate-800 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-700">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <ScanSearch size={24} className="text-blue-400" />
              <h1 className="text-xl font-bold">CapacityView</h1>
            </div>
          ) : (
            <ScanSearch size={24} className="text-blue-400 mx-auto" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-slate-700 rounded"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition ${
                currentPage === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-slate-700'
              }`}
              title={item.label}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto p-6">{renderPage()}</main>
    </div>
  );
}

export default App;
