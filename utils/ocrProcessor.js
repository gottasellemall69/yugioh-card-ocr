// utils/ocrProcessor.js

import { createWorker, PSM, OEM } from 'tesseract.js';
import { preprocessForOCR } from './imageProcessing';
import { cleanOCRText } from './ocrUtils';

let ocrWorker = null;

/** Initialize the Tesseract worker */
export async function initializeOCR() {
    if ( !ocrWorker ) {
        ocrWorker = createWorker( {
            logger: m => console.log( `[TESS] ${ m.status } ${ Math.round( m.progress * 100 ) }%` )
        } );
        await ocrWorker.load();
        await ocrWorker.loadLanguage( 'eng' );
        await ocrWorker.initialize( 'eng' );
        await ocrWorker.setParameters( {
            tessedit_pageseg_mode: PSM.AUTO,
            tessedit_ocr_engine_mode: OEM.LSTM_ONLY
        } );
    }
    return ocrWorker;
}

/** Simple retry wrapper */
async function recognizeWithRetry( worker, canvas, label ) {
    try {
        const { data } = await worker.recognize( canvas );
        return data.text;
    } catch {
        await new Promise( r => setTimeout( r, 300 ) );
        const { data } = await worker.recognize( canvas );
        return data.text;
    }
}

/** Full OCR on both name and effect regions */
export async function processCardImage(
    file,
    cardDatabase,
    onProgress,
    customRegions,
    regions
) {
    // Load image into canvas
    const img = await new Promise( ( res, rej ) => {
        const i = new Image();
        i.onload = () => res( i );
        i.onerror = rej;
        i.src = URL.createObjectURL( file );
    } );
    const sourceCanvas = document.createElement( 'canvas' );
    sourceCanvas.width = img.naturalWidth;
    sourceCanvas.height = img.naturalHeight;
    sourceCanvas.getContext( '2d' ).drawImage( img, 0, 0 );

    const worker = await initializeOCR();

    // Card Name
    onProgress( { message: 'OCR → Card Name…' } );
    const nameRegion = customRegions?.cardName || regions.cardName;
    const nameCanvas = await preprocessForOCR( sourceCanvas, nameRegion );
    const rawName = await recognizeWithRetry( worker, nameCanvas, 'cardName' );
    const cardName = cleanOCRText( rawName );

    // Effect Text
    onProgress( { message: 'OCR → Effect Text…' } );
    const effectRegion = customRegions?.effectText || regions.effectText;
    const effectCanvas = await preprocessForOCR( sourceCanvas, effectRegion );
    const rawEffect = await recognizeWithRetry( worker, effectCanvas, 'effectText' );
    const effectText = cleanOCRText( rawEffect );

    return { cardName, effectText, fileUrl: URL.createObjectURL( file ) };
}
