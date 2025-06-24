import { useState, useEffect, useRef } from 'react';
import { startBulkProcessing } from '@/lib/bulkProcessor';
import { loadCardDatabase } from '@/lib/cardDatabase';

export default function ProgressSection({
  processingState,
  uploadedImages,
  setUploadedImages,
  inventory,
  cardDatabase,
  setCardDatabase,
  results,
  setResults,
  updateProcessingState,
  resetProcessingState
}) {
  const [progressLog, setProgressLog] = useState([]);
  const [processingRate, setProcessingRate] = useState(0);
  const [eta, setETA] = useState('Calculating...');
  const logRef = useRef(null);

  // Load card database on mount
  useEffect(() => {
    if (cardDatabase.length === 0) {
      loadCardDatabase().then(setCardDatabase);
    }
  }, [cardDatabase.length, setCardDatabase]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [progressLog]);

  // Update processing rate and ETA
  useEffect(() => {
    if (processingState.isProcessing && processingState.startTime) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - processingState.startTime) / 1000 / 60; // minutes
        const rate = elapsed > 0 ? (processingState.processedCount / elapsed).toFixed(1) : 0;
        setProcessingRate(rate);

        const remaining = processingState.processQueue.length;
        if (remaining === 0) {
          setETA('Complete');
        } else if (rate > 0) {
          const etaMinutes = remaining / rate;
          const etaText = etaMinutes < 1 ? '<1 min' : `${Math.round(etaMinutes)} min`;
          setETA(etaText);
        } else {
          setETA('Calculating...');
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [processingState]);

  const addToLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setProgressLog(prev => [...prev, { timestamp, message }]);
  };

  const clearLog = () => {
    setProgressLog([]);
  };

  const handleProcessButton = async () => {
    if (processingState.isProcessing) {
      if (processingState.isPaused) {
        updateProcessingState({ isPaused: false });
        addToLog('Processing resumed');
      } else {
        updateProcessingState({ isPaused: true });
        addToLog('Processing paused');
      }
    } else {
      await startProcessing();
    }
  };

  const startProcessing = async () => {
    if (uploadedImages.length === 0) return;

    resetProcessingState();
    setResults([]);
    setProgressLog([]);

    addToLog(`Starting bulk processing of ${uploadedImages.length} images`);

    const settings = {
      maxConcurrent: parseInt(document.getElementById('concurrentProcesses')?.value || '2'),
      batchSize: parseInt(document.getElementById('batchSizeSelect')?.value || '25'),
      skipDuplicates: document.getElementById('skipDuplicates')?.checked ?? true,
      autoRetry: document.getElementById('autoRetry')?.checked ?? true,
      errorHandling: document.getElementById('errorHandling')?.value || 'continue'
    };

    try {
      await startBulkProcessing({
        images: uploadedImages,
        cardDatabase,
        settings,
        onProgress: (progress) => {
          updateProcessingState(progress);
          if (progress.message) {
            addToLog(progress.message);
          }
        },
        onResult: (result) => {
          setResults(prev => [...prev, result]);
        },
        onComplete: (finalResults) => {
          const duration = (Date.now() - processingState.startTime) / 1000;
          addToLog(`Processing completed in ${duration.toFixed(1)}s`);
          addToLog(`Results: ${processingState.processedCount} processed, ${processingState.matchedCount} matched, ${processingState.failedCount} failed`);
          updateProcessingState({ isProcessing: false });
        }
      });
    } catch (error) {
      addToLog(`Processing error: ${error.message}`);
      updateProcessingState({ isProcessing: false });
    }
  };

  const stopProcessing = () => {
    updateProcessingState({ isStopped: true, isProcessing: false });
    addToLog('Processing stopped by user');
  };

  const getProcessButtonText = () => {
    if (processingState.isProcessing) {
      return processingState.isPaused ? 'Resume' : 'Pause';
    }
    return 'Process Cards';
  };

  const overallProgress = () => {
    const total = processingState.processQueue.length + processingState.processedCount;
    return total > 0 ? (processingState.processedCount / total) * 100 : 0;
  };

  if (!processingState.isProcessing && results.length === 0) {
    return (
      <div className="flex gap-3 mb-8">
        <button
          onClick={handleProcessButton}
          disabled={uploadedImages.length === 0}
          className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-semibold 
                   disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-purple-600 
                   transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Process Cards
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Process Controls */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={handleProcessButton}
          disabled={uploadedImages.length === 0 && !processingState.isProcessing}
          className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-semibold 
                   disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-purple-600 
                   transition-colors shadow-lg hover:shadow-xl"
        >
          {getProcessButtonText()}
        </button>
        {processingState.isProcessing && (
          <button
            onClick={stopProcessing}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold 
                     hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl"
          >
            Stop
          </button>
        )}
      </div>

      {/* Progress Section */}
      {(processingState.isProcessing || results.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 animate-slide-up">
          <h3 className="text-xl font-semibold mb-4">Bulk Processing Progress</h3>

          {/* Batch Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {processingState.processQueue.length + processingState.processedCount}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">Total Images</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {processingState.processedCount}
              </div>
              <div className="text-sm text-green-800 dark:text-green-200">Processed</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {processingState.matchedCount}
              </div>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">Matched</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {processingState.failedCount}
              </div>
              <div className="text-sm text-red-800 dark:text-red-200">Failed</div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-4">
            {/* Overall Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress())}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress()}%` }}
                ></div>
              </div>
            </div>

            {/* Processing Rate */}
            <div className="flex justify-between text-sm">
              <span>Processing Rate: {processingRate} images/min</span>
              <span>ETA: {eta}</span>
            </div>
          </div>

          {/* Active Processes */}
          {processingState.activeProcesses.size > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Active Processes</h4>
              <div className="space-y-1 text-xs">
                {Array.from(processingState.activeProcesses).map(processId => (
                  <div key={processId} className="text-blue-600 dark:text-blue-400">
                    Processing: {processId}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Processing Log</h4>
              <button
                onClick={clearLog}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300
                         px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Clear Log
              </button>
            </div>
            <div
              ref={logRef}
              className="h-32 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-3 rounded font-mono text-sm"
            >
              {progressLog.map((entry, index) => (
                <div key={index} className="mb-1">
                  <span className="text-gray-500">[{entry.timestamp}]</span> {entry.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}