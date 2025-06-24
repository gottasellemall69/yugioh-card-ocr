import { processCardImage } from '@/lib/cardProcessing';

export async function startBulkProcessing( {
  images,
  cardDatabase,
  settings,
  onProgress,
  onResult,
  onComplete
} ) {
  const state = {
    isProcessing: true,
    isPaused: false,
    isStopped: false,
    processedCount: 0,
    matchedCount: 0,
    failedCount: 0,
    startTime: Date.now(),
    activeProcesses: new Set(),
    processQueue: [ ...images ],
    processedFilenames: new Set()
  };

  const {
    maxConcurrent = 2,
    batchSize = 25,
    skipDuplicates = true,
    autoRetry = true,
    errorHandling = 'continue'
  } = settings;

  // Filter duplicates if needed
  if ( skipDuplicates ) {
    state.processQueue = state.processQueue.filter( file => {
      if ( state.processedFilenames.has( file.name ) ) {
        onProgress( { message: `Skipping duplicate: ${ file.name }` } );
        return false;
      }
      return true;
    } );
  }

  // Process in batches if specified
  if ( batchSize > 0 ) {
    state.processQueue = state.processQueue.slice( 0, Math.min( batchSize, state.processQueue.length ) );
  }

  onProgress( {
    ...state,
    message: `Starting bulk processing of ${ state.processQueue.length } images with ${ maxConcurrent } concurrent processes`
  } );

  const results = [];

  // Start concurrent processing
  const promises = [];
  for ( let i = 0; i < Math.min( maxConcurrent, state.processQueue.length ); i++ ) {
    promises.push( processNextImage( state, cardDatabase, settings, onProgress, onResult, results ) );
  }

  try {
    await Promise.all( promises );
    onComplete( results );
  } catch ( error ) {
    onProgress( { message: `Bulk processing error: ${ error.message }` } );
    onComplete( results );
  }
}

export async function processNextImage( state, cardDatabase, settings, onProgress, onResult, results ) {
  while ( state.processQueue.length > 0 && !state.isStopped ) {
    // Wait if paused
    while ( state.isPaused && !state.isStopped ) {
      await new Promise( resolve => setTimeout( resolve, 100 ) );
    }

    if ( state.isStopped ) break;

    const file = state.processQueue.shift();
    if ( !file ) break;

    const processId = `process_${ Date.now() }_${ Math.random() }`;
    state.activeProcesses.add( processId );

    try {
      const result = await processCardImageWithRetry( file, cardDatabase, settings, onProgress );

      if ( result ) {
        results.push( result );
        onResult( result );

        if ( result.match ) {
          state.matchedCount++;
        }
      } else {
        state.failedCount++;
      }

      state.processedCount++;
      state.processedFilenames.add( file.name );

      onProgress( {
        ...state,
        message: `✅ Completed ${ file.name }: ${ result?.cardName || 'Unknown' }`
      } );

    } catch ( error ) {
      state.failedCount++;
      onProgress( {
        ...state,
        message: `❌ Failed to process ${ file.name }: ${ error.message }`
      } );

      if ( settings.errorHandling === 'pause' ) {
        state.isPaused = true;
        break;
      } else if ( settings.errorHandling === 'stop' ) {
        state.isStopped = true;
        break;
      }
    } finally {
      state.activeProcesses.delete( processId );
    }
  }
}

export async function processCardImageWithRetry( file, cardDatabase, settings, onProgress, retryCount = 0 ) {
  const maxRetries = settings.autoRetry ? 2 : 0;

  try {
    return await processCardImage( file, cardDatabase, onProgress );
  } catch ( error ) {
    if ( retryCount < maxRetries ) {
      onProgress( { message: `Retrying ${ file.name } (${ retryCount + 1 }/${ maxRetries })` } );
      await new Promise( resolve => setTimeout( resolve, 1000 ) ); // Wait 1 second
      return await processCardImageWithRetry( file, cardDatabase, settings, onProgress, retryCount + 1 );
    }
    throw error;
  }
}