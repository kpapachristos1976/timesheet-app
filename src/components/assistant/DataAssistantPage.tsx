import { useState } from 'react';
import { Send, MessageSquare, HelpCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { executeQuery, getTemplateLabels } from './queryEngine';
import type { QueryResult } from './queryEngine';

export const DataAssistantPage = () => {
  const { timesheets, projects, roles, resourceAllocations } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResult[]>([]);
  const [history, setHistory] = useState<{ query: string; results: QueryResult[] }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const templateLabels = getTemplateLabels();

  const handleQuery = (q?: string) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;

    const data = { timesheets, projects, roles, resourceAllocations };
    const queryResults = executeQuery(searchQuery, data);

    setResults(queryResults);
    setHistory((prev) => [{ query: searchQuery, results: queryResults }, ...prev.slice(0, 19)]);
    setShowSuggestions(false);
    if (!q) setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleQuery();
    }
  };

  const handleSuggestionClick = (placeholder: string) => {
    setQuery(placeholder);
    handleQuery(placeholder);
  };

  const dataStats = {
    timesheets: timesheets.length,
    projects: projects.length,
    roles: roles.length,
    allocations: resourceAllocations.length,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Data Assistant</h1>
      <p className="text-gray-600">
        Ask questions about your data across timesheets, projects, roles, and resource allocations.
      </p>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <div className="text-xs text-gray-500">Timesheet Entries</div>
          <div className="text-lg font-bold text-blue-600">{dataStats.timesheets}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <div className="text-xs text-gray-500">Projects</div>
          <div className="text-lg font-bold text-purple-600">{dataStats.projects}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <div className="text-xs text-gray-500">Roles</div>
          <div className="text-lg font-bold text-green-600">{dataStats.roles}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3 text-center">
          <div className="text-xs text-gray-500">Allocations</div>
          <div className="text-lg font-bold text-amber-600">{dataStats.allocations}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MessageSquare
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => !results.length && setShowSuggestions(true)}
              placeholder="Ask a question... e.g., Which projects is John allocated to?"
              className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm"
              autoComplete="off"
            />
          </div>
          <button
            onClick={() => handleQuery()}
            disabled={!query.trim()}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {showSuggestions && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle size={18} className="text-gray-500" />
            <h3 className="font-medium text-gray-700">Suggested questions</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {templateLabels.map((t, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(t.placeholder)}
                className="text-left px-3 py-2 text-sm border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
              >
                <div className="font-medium text-gray-700">{t.label}</div>
                <div className="text-gray-400 text-xs mt-0.5">{t.placeholder}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {results.map((result, idx) => (
        <div key={idx} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-700">{result.title}</h3>
            {result.summary && (
              <p className="text-sm text-gray-500 mt-1">{result.summary}</p>
            )}
          </div>
          {result.columns.length > 0 && result.rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {result.columns.map((col) => (
                      <th
                        key={col}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-700"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {result.rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-gray-50">
                      {result.columns.map((col) => (
                        <td key={col} className="px-4 py-2 text-sm">
                          {row[col] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {history.length > 1 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium text-gray-700 mb-3">Recent queries</h3>
          <div className="space-y-1">
            {history.slice(1, 11).map((h, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(h.query);
                  handleQuery(h.query);
                }}
                className="block w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
              >
                {h.query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
