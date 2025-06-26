// components/CardProcessor.js
import { useEffect, useRef } from 'react';
import { processCardImage } from '../utils/ocrProcessor';

export default function CardProcessor( {
    processingQueue,
    onUpdateQueueItem,
    onRemoveFromQueue,
    onAddCard
} ) {
    const processingRef = useRef( new Set() );

    useEffect( () => {
        const processItems = async () => {
            for ( const item of processingQueue ) {
                if ( item.status === 'pending' && !processingRef.current.has( item.id ) ) {
                    processingRef.current.add( item.id );

                    try {
                        await processCardImage(
                            item.file,
                            ( updates ) => onUpdateQueueItem( item.id, updates ),
                            ( inventoryItem ) => {
                                onAddCard( inventoryItem );
                                setTimeout( () => {
                                    onRemoveFromQueue( item.id );
                                    processingRef.current.delete( item.id );
                                }, 2000 );
                            }
                        );
                    } catch ( error ) {
                        console.error( 'Error processing card:', error );
                        onUpdateQueueItem( item.id, { status: 'error', progress: 0 } );
                        processingRef.current.delete( item.id );
                    }
                }
            }
        };

        if ( processingQueue.length > 0 ) {
            processItems();
        }
    }, [ processingQueue, onUpdateQueueItem, onRemoveFromQueue, onAddCard ] );

    return null; // This is a processing component, no UI
}