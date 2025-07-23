import { RadioGroup } from '@headlessui/react';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface CommonOptionsProps {
  state: {
    format: 'epub' | 'pdf' | 'docx' | 'html' | 'mobi';
    theme: string;
    includeToc: boolean;
    [key: string]: string | boolean;
  };
  onChange: (key: string, value: string | boolean) => void;
}

export default function CommonOptions({ state, onChange }: CommonOptionsProps) {
  const formats = [
    { id: 'epub', name: 'EPUB', description: 'Standard e-book format compatible with most e-readers' },
    { id: 'pdf', name: 'PDF', description: 'Portable Document Format, good for printing' },
    { id: 'docx', name: 'Word', description: 'Microsoft Word document' },
    { id: 'html', name: 'HTML', description: 'Web page format' },
    { id: 'mobi', name: 'MOBI', description: 'Kindle format (legacy)' },
  ];

  const themes = [
    { id: 'default', name: 'Default', description: 'Clean and simple styling' },
    { id: 'modern', name: 'Modern', description: 'Contemporary design with ample whitespace' },
    { id: 'classic', name: 'Classic', description: 'Traditional book styling' },
  ];

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900">Publishing Options</h2>
        
        <div className="mt-6 space-y-6">
          {/* Format Selection */}
          <div>
            <RadioGroup value={state.format} onChange={(value) => onChange('format', value)}>
              <RadioGroup.Label className="block text-sm font-medium text-gray-700">
                Output Format
              </RadioGroup.Label>
              <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-4">
                {formats.map((format) => (
                  <RadioGroup.Option
                    key={format.id}
                    value={format.id}
                    className={({ checked, active }) =>
                      classNames(
                        checked ? 'border-transparent' : 'border-gray-300',
                        active ? 'ring-2 ring-blue-500' : '',
                        'relative bg-white border rounded-lg shadow-sm p-4 flex cursor-pointer focus:outline-none'
                      )
                    }
                  >
                    {({ checked, active }) => (
                      <>
                        <div className="flex-1 flex">
                          <div className="flex flex-col">
                            <RadioGroup.Label as="span" className="block text-sm font-medium text-gray-900">
                              {format.name}
                            </RadioGroup.Label>
                            <RadioGroup.Description as="span" className="mt-1 flex items-center text-sm text-gray-500">
                              {format.description}
                            </RadioGroup.Description>
                          </div>
                        </div>
                        {checked ? (
                          <div className="text-blue-600">
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : null}
                        <div
                          className={classNames(
                            active ? 'border' : 'border-2',
                            checked ? 'border-blue-500' : 'border-transparent',
                            'absolute -inset-px rounded-lg pointer-events-none'
                          )}
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </RadioGroup.Option>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-md font-medium text-gray-900 mb-4">Content Options</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="include-toc"
                    name="include-toc"
                    type="checkbox"
                    checked={state.includeToc}
                    onChange={(e) => onChange('includeToc', e.target.checked)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="include-toc" className="font-medium text-gray-700">
                    Include Table of Contents
                  </label>
                  <p className="text-gray-500">Add a table of contents at the beginning of the document.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="include-imprint"
                    name="include-imprint"
                    type="checkbox"
                    checked={state.includeImprint}
                    onChange={(e) => onChange('includeImprint', e.target.checked)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="include-imprint" className="font-medium text-gray-700">
                    Include Imprint Page
                  </label>
                  <p className="text-gray-500">Add copyright and publisher information page.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="split-by-chapters"
                    name="split-by-chapters"
                    type="checkbox"
                    checked={state.splitByChapters}
                    onChange={(e) => onChange('splitByChapters', e.target.checked)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="split-by-chapters" className="font-medium text-gray-700">
                    Split by Chapters
                  </label>
                  <p className="text-gray-500">Create separate files for each chapter.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-md font-medium text-gray-900 mb-4">Styling</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="apply-styles"
                    name="apply-styles"
                    type="checkbox"
                    checked={state.applyStyles}
                    onChange={(e) => onChange('applyStyles', e.target.checked)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="apply-styles" className="font-medium text-gray-700">
                    Apply Styling
                  </label>
                  <p className="text-gray-500">Apply the selected theme and styling to the output.</p>
                </div>
              </div>

              {state.applyStyles && (
                <div>
                  <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                    Theme
                  </label>
                  <select
                    id="theme"
                    name="theme"
                    value={state.theme}
                    onChange={(e) => onChange('theme', e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
