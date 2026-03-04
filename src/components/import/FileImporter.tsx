import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Check } from 'lucide-react';
import { parseCSV, parseExcel, mapData, DELIMITERS } from '../../utils/importUtils';
import type { FieldMapping } from '../../types';

interface FileImporterProps<T> {
  title: string;
  targetFields: { key: string; label: string }[];
  onImport: (data: T[]) => void;
  transformFn: (mapped: Record<string, string>) => T;
}

export function FileImporter<T>({
  title,
  targetFields,
  onImport,
  transformFn,
}: FileImporterProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [sourceHeaders, setSourceHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
  const [delimiter, setDelimiter] = useState(',');
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [status, setStatus] = useState<'idle' | 'preview' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      setFile(selectedFile);
      setStatus('idle');
      setErrorMessage('');

      try {
        const isExcel =
          selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');

        let headers: string[];
        let data: Record<string, string>[];

        if (isExcel) {
          const buffer = await selectedFile.arrayBuffer();
          const result = parseExcel(buffer);
          headers = result.headers;
          data = result.data;
        } else {
          const content = await selectedFile.text();
          const result = await parseCSV(content, delimiter);
          headers = result.headers;
          data = result.data;
        }

        setSourceHeaders(headers);
        setPreviewData(data.slice(0, 5));
        
        const initialMappings = targetFields.map((field) => {
          const matchingHeader = headers.find(
            (h) =>
              h.toLowerCase().replace(/[_\s]/g, '') ===
              field.label.toLowerCase().replace(/[_\s]/g, '')
          );
          return {
            sourceField: matchingHeader || '',
            targetField: field.key,
          };
        });
        setMappings(initialMappings);
        setStatus('preview');
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to parse file');
      }
    },
    [delimiter, targetFields]
  );

  const handleDelimiterChange = useCallback(
    async (newDelimiter: string) => {
      setDelimiter(newDelimiter);
      if (file && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        try {
          const content = await file.text();
          const result = await parseCSV(content, newDelimiter);
          setSourceHeaders(result.headers);
          setPreviewData(result.data.slice(0, 5));
          
          const initialMappings = targetFields.map((field) => {
            const matchingHeader = result.headers.find(
              (h) =>
                h.toLowerCase().replace(/[_\s]/g, '') ===
                field.label.toLowerCase().replace(/[_\s]/g, '')
            );
            return {
              sourceField: matchingHeader || '',
              targetField: field.key,
            };
          });
          setMappings(initialMappings);
        } catch (err) {
          setStatus('error');
          setErrorMessage(err instanceof Error ? err.message : 'Failed to parse file');
        }
      }
    },
    [file, targetFields]
  );

  const updateMapping = (targetField: string, sourceField: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.targetField === targetField ? { ...m, sourceField } : m))
    );
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      let data: Record<string, string>[];

      if (isExcel) {
        const buffer = await file.arrayBuffer();
        data = parseExcel(buffer).data;
      } else {
        const content = await file.text();
        data = (await parseCSV(content, delimiter)).data;
      }

      const mappedData = mapData(
        data,
        mappings,
        transformFn
      );

      onImport(mappedData);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Import failed');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition">
            <Upload size={20} />
            Select File
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {file && (
            <div className="flex items-center gap-2 text-gray-600">
              <FileSpreadsheet size={20} />
              <span>{file.name}</span>
            </div>
          )}
        </div>

        {file && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delimiter
            </label>
            <select
              value={delimiter}
              onChange={(e) => handleDelimiterChange(e.target.value)}
              className="border rounded-lg px-3 py-2 w-48"
            >
              {DELIMITERS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {status === 'preview' && sourceHeaders.length > 0 && (
          <>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">Field Mapping</h3>
              <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                {targetFields.map((field) => {
                  const mapping = mappings.find((m) => m.targetField === field.key);
                  return (
                    <div key={field.key} className="flex items-center gap-2">
                      <span className="w-40 text-sm text-gray-700">{field.label}</span>
                      <select
                        value={mapping?.sourceField || ''}
                        onChange={(e) => updateMapping(field.key, e.target.value)}
                        className="flex-1 border rounded px-2 py-1 text-sm"
                      >
                        <option value="">-- Select --</option>
                        {sourceHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {previewData.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Preview (first 5 rows)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        {sourceHeaders.slice(0, 6).map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium">
                            {h}
                          </th>
                        ))}
                        {sourceHeaders.length > 6 && (
                          <th className="px-3 py-2 text-left font-medium">...</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr key={i} className="border-t">
                          {sourceHeaders.slice(0, 6).map((h) => (
                            <td key={h} className="px-3 py-2 truncate max-w-32">
                              {row[h]}
                            </td>
                          ))}
                          {sourceHeaders.length > 6 && (
                            <td className="px-3 py-2">...</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button
              onClick={handleImport}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Import Data (replaces existing)
            </button>
          </>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-600">
            <Check size={20} />
            <span>Data imported successfully!</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
