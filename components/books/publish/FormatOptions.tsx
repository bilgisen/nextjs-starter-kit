import { useState, useEffect } from 'react';

const marginOptions = [
  { value: 'Small', label: 'Small (0.5&quot;)' },
  { value: 'Medium', label: 'Medium (1&quot;)' },
  { value: 'Large', label: 'Large (1.5&quot;)' },
];

const pageSizeOptions = [
  { value: 'A4', label: 'A4 (210 × 297 mm)' },
  { value: 'Letter', label: 'Letter (8.5 × 11 in)' },
  { value: 'A5', label: 'A5 (148 × 210 mm)' },
];

interface FormatOptionsProps {
  format: string;
  state: {
    pageSize: 'A4' | 'Letter' | 'A5';
    margins: 'Small' | 'Medium' | 'Large';
    embedFonts: boolean;
    includeCss: string;
    [key: string]: string | boolean;
  };
  onChange: (key: string, value: string | boolean) => void;
}

export default function FormatOptions({ format, state, onChange }: FormatOptionsProps) {
  const [localState, setLocalState] = useState({
    pageSize: state.pageSize || 'A4',
    margins: state.margins || 'Medium',
    embedFonts: state.embedFonts || false,
    includeCss: state.includeCss || 'inline',
  });

  // Update local state when parent state changes
  useEffect(() => {
    setLocalState({
      pageSize: state.pageSize || 'A4',
      margins: state.margins || 'Medium',
      embedFonts: state.embedFonts || false,
      includeCss: state.includeCss || 'inline',
    });
  }, [state]);

  const handleChange = (key: string, value: string | boolean) => {
    const newState = { ...localState, [key]: value };
    setLocalState(newState);
    onChange(key, value);
  };

  if (format === 'pdf') {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900">PDF Options</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="page-size" className="block text-sm font-medium text-gray-700">
                Page Size
              </label>
              <select
                id="page-size"
                name="page-size"
                value={localState.pageSize}
                onChange={(e) => handleLocalChange('pageSize', e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Margins</label>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={localState.margins}
                onChange={(e) => handleChange('margins', e.target.value)}
              >
                {marginOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label.replace(/\(/g, '&#40;').replace(/\)/g, '&#41;').replace(/'/g, '&apos;').replace(/"/g, '&quot;')}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                id="embed-fonts"
                name="embed-fonts"
                type="checkbox"
                checked={localState.embedFonts}
                onChange={(e) => handleChange('embedFonts', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="embed-fonts" className="ml-2 block text-sm text-gray-700">
                Embed fonts in PDF
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (format === 'epub' || format === 'mobi') {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900">
            {format === 'epub' ? 'EPUB' : 'MOBI'} Options
          </h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="embed-fonts"
                  name="embed-fonts"
                  type="checkbox"
                  checked={localState.embedFonts}
                  onChange={(e) => handleChange('embedFonts', e.target.checked)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="embed-fonts" className="font-medium text-gray-700">
                  Embed Fonts
                </label>
                <p className="text-gray-500">
                  Include font files in the {format.toUpperCase()} for consistent rendering across devices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (format === 'html') {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900">HTML Options</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CSS Handling</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="css-inline"
                    name="css-handling"
                    type="radio"
                    checked={localState.includeCss === 'inline'}
                    onChange={() => handleLocalChange('includeCss', 'inline')}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <label htmlFor="css-inline" className="ml-2 block text-sm text-gray-700">
                    Inline CSS
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="css-external"
                    name="css-handling"
                    type="radio"
                    checked={localState.includeCss === 'external'}
                    onChange={() => handleLocalChange('includeCss', 'external')}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <label htmlFor="css-external" className="ml-2 block text-sm text-gray-700">
                    External CSS File
                  </label>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {localState.includeCss === 'inline' 
                  ? 'CSS will be embedded directly in the HTML file.'
                  : 'CSS will be linked as an external stylesheet.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (format === 'docx') {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900">Word Document Options</h2>
          <div className="mt-4 space-y-4">
            <div className="text-sm text-gray-500">
              <p>Word documents will use the selected theme&apos;s styling.</p>
              <p className="mt-1">For best results, use the &quot;Modern&quot; theme for a clean, professional look.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
