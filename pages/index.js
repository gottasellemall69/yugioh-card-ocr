import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import UploadSection from '@/components/UploadSection';
import ProcessingSettings from '@/components/ProcessingSettings';
import ProcessingProgress from '@/components/ProcessingProgress';
import ResultsSection from '@/components/ResultsSection';
import { loadCardDatabase } from '@/lib/cardDatabase';
import { processCardImage } from '@/lib/cardProcessor';

export default function Home() {
  const [ uploadedImages, setUploadedImages ] = useState( [] );
  const [ inventory, setInventory ] = useState( [] );
  const [ cardDatabase, setCardDatabase ] = useState( [] );
  const [ results, setResults ] = useState( [] );
  const [ isProcessing, setIsProcessing ] = useState( false );
  const [ currentImage, setCurrentImage ] = useState( '' );
  const [ processedCount, setProcessedCount ] = useState( 0 );
  const [ logs, setLogs ] = useState( [] );

  const userStoppedRef = useRef( false ); // manual flag to handle loop breaking

  const [ settings, setSettings ] = useState( {
    freeImageApiKey: '6d207e02198a847aa98d0a2a901485a5',
    processingMode: 'sequential',
    ocrQuality: 'balanced',
    matchThreshold: 0.2,
    enableFallback: true,
    fetchPrices: true,
    saveDebugImages: false
  } );

  useEffect( () => {
    const initializeDatabase = async () => {
      try {
        addLog( 'Loading card database...', 'info' );
        const db = await loadCardDatabase();
        setCardDatabase( db );
        addLog( `✅ Loaded ${ db.length } cards from database`, 'success' );
      } catch ( error ) {
        addLog( `❌ Failed to load card database: ${ error.message }`, 'error' );
      }
    };

    initializeDatabase();
  }, [] );

  const addLog = ( message, type = 'info' ) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs( prev => [ ...prev, { timestamp, message, type } ] );
    console.log( `[${ timestamp }] ${ message }` );
  };

  const clearLogs = () => {
    setLogs( [] );
  };

  const canStart = uploadedImages.length > 0 && settings.freeImageApiKey.trim() !== '';

  const startProcessing = async () => {
    if ( !canStart ) {
      addLog( '❌ Cannot start: Need images and API key', 'error' );
      return;
    }

    setIsProcessing( true );
    userStoppedRef.current = false;
    setResults( [] );
    setProcessedCount( 0 );
    clearLogs();

    addLog( `🚀 Starting processing of ${ uploadedImages.length } images`, 'info' );
    addLog( `Settings: ${ settings.processingMode } mode, threshold: ${ settings.matchThreshold }`, 'info' );

    const processedResults = [];

    try {
      for ( let i = 0; i < uploadedImages.length; i++ ) {
        if ( userStoppedRef.current ) break;

        const file = uploadedImages[ i ];
        setCurrentImage( file.name );
        addLog( `📸 Processing ${ i + 1 }/${ uploadedImages.length }: ${ file.name }`, 'info' );

        try {
          const result = await processCardImage(
            file,
            inventory,
            cardDatabase,
            settings,
            ( message ) => addLog( message, 'info' )
          );

          if ( !result ) {
            addLog( `⚠️ No result returned for ${ file.name }`, 'warning' );
            continue;
          }

          processedResults.push( result );
          setResults( prev => [ ...prev, result ] );

          if ( result.matched ) {
            addLog( `✅ ${ file.name } matched: ${ result.matchedName }`, 'success' );
          } else {
            addLog( `⚠️ ${ file.name } - no match found`, 'warning' );
          }

          setProcessedCount( i + 1 );

        } catch ( error ) {
          addLog( `❌ Error processing ${ file.name }: ${ error.message }`, 'error' );
          const failedResult = {
            filename: file.name,
            cardName: '',
            effectText: '',
            matched: false,
            matchedName: null,
            matchedRows: [],
            imageUrl: '',
            prices: null,
            processingTime: 0,
            error: error.message
          };
          processedResults.push( failedResult );
          setResults( prev => [ ...prev, failedResult ] );
          setProcessedCount( i + 1 );
        }

        if ( i < uploadedImages.length - 1 ) {
          await new Promise( resolve => setTimeout( resolve, 500 ) );
        }
      }

      const matchedCount = processedResults.filter( r => r.matched ).length;
      const failedCount = processedResults.filter( r => !r.matched ).length;

      addLog( `🎉 Processing completed!`, 'success' );
      addLog( `Results: ${ processedResults.length } processed, ${ matchedCount } matched, ${ failedCount } failed`, 'info' );

    } catch ( error ) {
      addLog( `❌ Processing error: ${ error.message }`, 'error' );
    } finally {
      setIsProcessing( false );
      setCurrentImage( '' );
    }
  };

  const stopProcessing = () => {
    userStoppedRef.current = true;
    setIsProcessing( false );
    setCurrentImage( '' );
    addLog( '⏹️ Processing stopped by user', 'warning' );
  };

  return (
    <>
      <Head>
        <title>Yu-Gi-Oh Card Recognition - AI-Powered Card Scanner</title>
        <meta name="description" content="Upload Yu-Gi-Oh card images to automatically recognize and match them against your inventory using advanced OCR technology" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="bg-bg-light dark:bg-bg-dark text-gray-900 dark:text-white min-h-screen transition-colors">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Header />

          <UploadSection
            uploadedImages={ uploadedImages }
            setUploadedImages={ setUploadedImages }
            inventory={ inventory }
            setInventory={ setInventory }
            isProcessing={ isProcessing }
          />

          <ProcessingSettings
            settings={ settings }
            setSettings={ setSettings }
            isProcessing={ isProcessing }
          />

          <ProcessingProgress
            isProcessing={ isProcessing }
            currentImage={ currentImage }
            totalImages={ uploadedImages.length }
            processedCount={ processedCount }
            results={ results }
            logs={ logs }
            onStart={ startProcessing }
            onStop={ stopProcessing }
            canStart={ canStart }
          />
          <div className='container h-[500px] w-full overflow y-auto overflow-x-hidden p-2 m-2 mx-auto'>
            <ResultsSection results={ results } />
          </div>
        </div>
      </div>
    </>
  );
}
