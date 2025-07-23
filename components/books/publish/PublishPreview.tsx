import { X } from 'lucide-react';

interface PublishPreviewProps {
  html: string;
  onClose?: () => void;
}

export default function PublishPreview({ html, onClose }: PublishPreviewProps) {
  return (
    <div className="mt-6 bg-white shadow overflow-hidden rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Preview</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="border-2 border-dashed border-gray-200 rounded-lg overflow-hidden">
          <iframe
            srcDoc={html}
            className="w-full h-[600px] border-0"
            sandbox="allow-same-origin"
            title="Document Preview"
          />
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          This is a preview. Some formatting may differ in the final exported file.
        </div>
      </div>
    </div>
  );
}
