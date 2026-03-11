import { useState } from 'react';
import { ChevronRight, ChevronDown, FileDown } from 'lucide-react';
import { USER_MANUAL } from './userManualContent';
import { generateWordManual } from './generateWordManual';

export const HelpPage = () => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set(USER_MANUAL.map((_, i) => i))
  );
  const [generating, setGenerating] = useState(false);

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      await generateWordManual();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Help & User Guide</h1>
          <p className="text-gray-600">
            Learn how to use CapacityView to manage resources and analyze timesheet data.
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <FileDown size={20} />
          {generating ? 'Generating...' : 'Download Manual (Word)'}
        </button>
      </div>

      <div className="space-y-3">
        {USER_MANUAL.map((section, sectionIdx) => {
          const isExpanded = expandedSections.has(sectionIdx);

          return (
            <div key={sectionIdx} className="bg-white rounded-lg shadow overflow-hidden">
              <button
                onClick={() => toggleSection(sectionIdx)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition"
              >
                {isExpanded ? (
                  <ChevronDown size={20} className="text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronRight size={20} className="text-gray-500 flex-shrink-0" />
                )}
                <h2 className="text-lg font-semibold text-gray-800">{section.title}</h2>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-0 border-t border-gray-100">
                  <div className="mt-3 space-y-2">
                    {section.content.map((line, i) => (
                      <p key={i} className="text-sm text-gray-700 leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>

                  {section.subsections?.map((sub, subIdx) => (
                    <div key={subIdx} className="mt-4 ml-4">
                      <h3 className="text-md font-semibold text-gray-700 mb-2">{sub.title}</h3>
                      <div className="space-y-1.5 ml-2">
                        {sub.content.map((line, i) => (
                          <p key={i} className="text-sm text-gray-600 leading-relaxed">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
