import { useState, useEffect, useRef } from 'react';

export default function ProcessingProgress({ 
  isProcessing, 
  currentImage, 
  totalImages, 
  processedCount,
  results,
  logs,
  onStart,
  onStop,
  canStart
}) {
  const [processingRate, setProcessingRate] = useState(0);
  const [eta, setETA] = useState('Calculating...');
  const [startTime, setStartTime] = useState(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (isProcessing && !startTime) {
      setStartTime(Date.now());
    } else if (!isProcessing) {
      setStartTime(null);
    }
  }, [isProcessing]);

  useEffect(() => {
    if (isProcessing && startTime && processedCount > 0) {
      const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
      const rate = elapsed > 0 ? (processedCount / elapsed).toFixed(1) : 0;
      setProcessingRate(rate);

      const remaining = totalImages - processedCount;
      if (remaining === 0) {
        setETA('Complete');
      } else if (rate > 0) {
        const etaMinutes = remaining / rate;
        const etaText = etaMinutes < 1 ? '<1 min' : `${Math.round(etaMinutes)} min`;
        setETA(etaText);
      } else {
        setETA('Calculating...');
      }
    }
  }, [isProcessing, startTime, processedCount, totalImages]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const progress = totalImages > 0 ? (processedCount / totalImages) * 100 : 0;
  const matchedCount = results.filter(r => r.matched).length;
  const failedCount = results.filter(r => !r.matched).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center">
          <span className="mr-3">🔄</span>
          Processing Status
        </h3>
        
        <div className="flex gap-3">
          {!isProcessing ? (
            <button
              onClick={onStart}
              disabled={!canStart}
              className="bg-primary text-white py-2 px-6 rounded-lg font-semibold 
                       disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-purple-600 
                       transition-colors shadow-lg hover:shadow-xl transform hover:scale-105
                       disabled:transform-none"
            >
              Start Processing
            </button>
          ) : (
            <button
              onClick={onStop}
              className="bg-red-500 text-white py-2 px-6 rounded-lg font-semibold 
                       hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl"
            >
              Stop Processing
            </button>
          )}
        </div>
      </div>

      {(isProcessing || results.length > 0) && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalImages}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">Total Images</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {processedCount}
              </div>
              <div className="text-sm text-green-800 dark:text-green-200">Processed</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {matchedCount}
              </div>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">Matched</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {failedCount}
              </div>
              <div className="text-sm text-red-800 dark:text-red-200">Failed</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {isProcessing && (
              <div className="flex justify-between text-sm mt-2 text-gray-600 dark:text-gray-400">
                <span>Processing Rate: {processingRate} images/min</span>
                <span>ETA: {eta}</span>
              </div>
            )}
          </div>

          {/* Current Processing */}
          {isProcessing && currentImage && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center">
                <div className="spinner mr-3"></div>
                <div>
                  <div className="font-medium text-blue-800 dark:text-blue-200">
                    Currently Processing
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-300">
                    {currentImage}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Processing Log */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-medium">Processing Log</h4>
              <span className="text-sm text-gray-500">
                {logs.length} entries
              </span>
            </div>
            <div
              ref={logRef}
              className="h-40 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 rounded-lg font-mono text-sm
                       border border-gray-200 dark:border-gray-700"
            >
              {logs.length === 0 ? (
                <div className="text-gray-500 italic">No logs yet...</div>
              ) : (
                logs.map((entry, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-gray-500">[{entry.timestamp}]</span>{' '}
                    <span className={entry.type === 'error' ? 'text-red-500' : 
                                   entry.type === 'success' ? 'text-green-500' : 
                                   entry.type === 'warning' ? 'text-yellow-500' : ''}>
                      {entry.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}