// components/upload-section.js

import React, { useState } from 'react';
import { processCardImage } from '../utils/ocr-utils';
import ImagePreviewGrid from './image-preview-grid';
import ProgressSection from './progress-section';
import ResultsSection from './results-section';

export function UploadSection( { defaultRegions } ) {
    const [ files, setFiles ] = useState( [] );
    const [ customRegions, setCustomRegions ] = useState( {} );
    const [ results, setResults ] = useState( [] );
    const [ isProcessing, setIsProcessing ] = useState( false );
    const [ log, setLog ] = useState( [] );

    const handleFiles = ( e ) => {
        const selected = Array.from( e.target.files );
        setFiles( ( prev ) => [ ...prev, ...selected ] );
    };

    const handleImagesUpdate = ( updated ) => {
        setFiles( updated );
    };

    const handleRegionsUpdate = ( index, region, allRegionsOverride = null ) => {
        if ( allRegionsOverride ) {
            setCustomRegions( allRegionsOverride );
        } else {
            setCustomRegions( ( prev ) => ( { ...prev, [ index ]: region } ) );
        }
    };

    const logMessage = ( msg ) => {
        setLog( ( prev ) => [ ...prev, msg ] );
    };

    const startProcessing = async () => {
        setIsProcessing( true );
        setResults( [] );
        setLog( [] );

        for ( let i = 0; i < files.length; i++ ) {
            const file = files[ i ];
            logMessage( `📸 Processing ${ file.name }` );
            try {
                const result = await processCardImage(
                    file,
                    defaultRegions,
                    customRegions[ i ],
                    ( { message } ) => logMessage( message )
                );
                setResults( ( prev ) => [ ...prev, result ] );
                logMessage( `✅ Done: ${ file.name }` );
            } catch ( err ) {
                logMessage( `❌ Error: ${ file.name }: ${ err.message }` );
            }
        }

        setIsProcessing( false );
    };

    return (
        <div className="space-y-4">
            <div>
                <input type="file" multiple onChange={ handleFiles } accept="image/*" />
            </div>

            <ImagePreviewGrid
                files={ files }
                customRegions={ customRegions }
                onImagesUpdate={ handleImagesUpdate }
                onRegionsUpdate={ handleRegionsUpdate }
            />

            <button
                onClick={ startProcessing }
                disabled={ isProcessing || files.length === 0 }
                className="px-4 py-2 bg-blue-600 text-white rounded"
            >
                { isProcessing ? 'Processing...' : 'Start OCR' }
            </button>

            { isProcessing && <ProgressSection logEntries={ log } /> }
            { !isProcessing && results.length > 0 && <ResultsSection results={ results } /> }
        </div>
    );
}
