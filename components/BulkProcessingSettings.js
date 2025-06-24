export default function BulkProcessingSettings() {
  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-slide-up">
      <h3 className="text-lg font-medium mb-3">Bulk Processing Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Concurrent Processes</label>
          <select
            id="concurrentProcesses"
            defaultValue="2"
            className="w-full text-base p-2 border border-gray-300 dark:border-gray-600 rounded 
                     bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="1">1 (Sequential)</option>
            <option value="2">2 (Recommended)</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5 (Max)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Batch Size</label>
          <select
            id="batchSizeSelect"
            defaultValue="25"
            className="w-full text-base p-2 border border-gray-300 dark:border-gray-600 rounded 
                     bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="10">10 images</option>
            <option value="25">25 images</option>
            <option value="50">50 images</option>
            <option value="100">100 images</option>
            <option value="0">Process All</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Error Handling</label>
          <select
            id="errorHandling"
            defaultValue="continue"
            className="w-full text-base p-2 border border-gray-300 dark:border-gray-600 rounded 
                     bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="continue">Continue on Error</option>
            <option value="pause">Pause on Error</option>
            <option value="stop">Stop on Error</option>
          </select>
        </div>
      </div>

      {/* Processing Options */}
      <div className="mt-4 space-y-2">
        <label className="flex items-center">
          <input type="checkbox" id="skipDuplicates" defaultChecked className="mr-2 rounded" />
          <span className="text-sm">Skip duplicate filenames</span>
        </label>
        <label className="flex items-center">
          <input type="checkbox" id="autoRetry" defaultChecked className="mr-2 rounded" />
          <span className="text-sm">Auto-retry failed OCR (up to 2 times)</span>
        </label>
      </div>
    </div>
  );
}