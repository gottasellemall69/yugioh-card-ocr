export default function ProcessingSettings({ settings, setSettings, isProcessing }) {
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 animate-slide-up">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <span className="mr-3">⚙️</span>
        Processing Settings
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* FreeImage API Key */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium mb-2">
            FreeImage Host API Key
          </label>
          <input
            type="password"
            value={settings.freeImageApiKey}
            onChange={(e) => updateSetting('freeImageApiKey', e.target.value)}
            disabled={isProcessing}
            placeholder="Enter your FreeImage Host API key"
            className="w-full text-base p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent
                     disabled:opacity-50"
          />
          <p className="text-sm text-gray-500 mt-1">
            Required for image hosting. Get your free API key from{' '}
            <a 
              href="https://freeimage.host/page/api" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              FreeImage Host
            </a>
          </p>
        </div>

        {/* Processing Options */}
        <div>
          <label className="block text-sm font-medium mb-2">Processing Mode</label>
          <select
            value={settings.processingMode}
            onChange={(e) => updateSetting('processingMode', e.target.value)}
            disabled={isProcessing}
            className="w-full text-base p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent
                     disabled:opacity-50"
          >
            <option value="sequential">Sequential (Safer)</option>
            <option value="batch">Batch Processing</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">OCR Quality</label>
          <select
            value={settings.ocrQuality}
            onChange={(e) => updateSetting('ocrQuality', e.target.value)}
            disabled={isProcessing}
            className="w-full text-base p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent
                     disabled:opacity-50"
          >
            <option value="fast">Fast</option>
            <option value="balanced">Balanced</option>
            <option value="accurate">Accurate (Slower)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Match Threshold</label>
          <select
            value={settings.matchThreshold}
            onChange={(e) => updateSetting('matchThreshold', parseFloat(e.target.value))}
            disabled={isProcessing}
            className="w-full text-base p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent
                     disabled:opacity-50"
          >
            <option value={0.1}>Very Loose (0.1)</option>
            <option value={0.2}>Loose (0.2)</option>
            <option value={0.3}>Balanced (0.3)</option>
            <option value={0.4}>Strict (0.4)</option>
            <option value={0.5}>Very Strict (0.5)</option>
          </select>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="mt-6 space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.enableFallback}
            onChange={(e) => updateSetting('enableFallback', e.target.checked)}
            disabled={isProcessing}
            className="mr-3 rounded focus:ring-primary"
          />
          <span className="text-sm">Enable database fallback matching</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.fetchPrices}
            onChange={(e) => updateSetting('fetchPrices', e.target.checked)}
            disabled={isProcessing}
            className="mr-3 rounded focus:ring-primary"
          />
          <span className="text-sm">Fetch current market prices</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.saveDebugImages}
            onChange={(e) => updateSetting('saveDebugImages', e.target.checked)}
            disabled={isProcessing}
            className="mr-3 rounded focus:ring-primary"
          />
          <span className="text-sm">Save debug preprocessed images</span>
        </label>
      </div>
    </div>
  );
}