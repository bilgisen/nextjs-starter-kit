import { Download, Eye, Loader2 } from 'lucide-react';

export default function ActionButtons({
  onPublish,
  onPreview,
  isPreviewLoading = false,
  isPublishing = false,
  isDisabled = false,
}: {
  onPublish: () => void;
  onPreview: () => void;
  isPreviewLoading?: boolean;
  isPublishing?: boolean;
  isDisabled?: boolean;
}) {
  return (
    <div className="bg-white px-4 py-3 text-right sm:px-6 rounded-lg shadow">
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onPreview}
          disabled={isDisabled || isPreviewLoading}
          className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isDisabled || isPreviewLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isPreviewLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Eye className="-ml-1 mr-2 h-4 w-4" />
              Preview
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={isDisabled || isPublishing}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isDisabled || isPublishing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isPublishing ? (
            <>
              <Loader2 className="-ml-1 mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Download className="-ml-1 mr-2 h-4 w-4" />
              Generate & Download
            </>
          )}
        </button>
      </div>
    </div>
  );
}
