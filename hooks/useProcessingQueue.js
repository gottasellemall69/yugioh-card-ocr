// hooks/useProcessingQueue.js
import { useState, useCallback } from 'react';

export function useProcessingQueue() {
    const [ processingQueue, setProcessingQueue ] = useState( [] );

    const addToQueue = useCallback( ( id, file ) => {
        const queueItem = {
            id,
            file,
            status: 'pending',
            progress: 0,
            cardName: '',
            effectText: '',
            imageUrl: URL.createObjectURL( file )
        };
        setProcessingQueue( prev => [ ...prev, queueItem ] );
    }, [] );

    const updateQueueItem = useCallback( ( id, updates ) => {
        setProcessingQueue( prev => prev.map( item =>
            item.id === id ? { ...item, ...updates } : item
        ) );
    }, [] );

    const removeFromQueue = useCallback( ( id ) => {
        setProcessingQueue( prev => prev.filter( item => item.id !== id ) );
    }, [] );

    return {
        processingQueue,
        addToQueue,
        updateQueueItem,
        removeFromQueue
    };
}