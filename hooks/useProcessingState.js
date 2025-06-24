import { useState, useCallback } from 'react';

export function useProcessingState() {
  const [processingState, setProcessingState] = useState({
    isProcessing: false,
    isPaused: false,
    isStopped: false,
    processedCount: 0,
    matchedCount: 0,
    failedCount: 0,
    startTime: null,
    activeProcesses: new Set(),
    processQueue: [],
    processedFilenames: new Set()
  });

  const updateProcessingState = useCallback((updates) => {
    setProcessingState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const resetProcessingState = useCallback(() => {
    setProcessingState({
      isProcessing: false,
      isPaused: false,
      isStopped: false,
      processedCount: 0,
      matchedCount: 0,
      failedCount: 0,
      startTime: null,
      activeProcesses: new Set(),
      processQueue: [],
      processedFilenames: new Set()
    });
  }, []);

  return {
    processingState,
    updateProcessingState,
    resetProcessingState
  };
}