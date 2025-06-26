// utils/ocrProcessor.js
import { createWorker } from 'tesseract.js';
import {
    loadImageToCanvas,
    preprocessCardNameRegion,
    preprocessEffectTextRegion,
    performOCRWithMultipleAttempts,
    cleanOCRText,
    fetchCardPrices
} from './imageProcessing';
import { uploadImageToFreeImageHost } from '../pages/api/imageUpload';

// Region coordinates for OCR
const regions = {
    cardName: { left: 60, top: 70, width: 650, height: 160 },
    effectText: { left: 60, top: 740, width: 680, height: 210 }
};

let ocrWorker = null;

const initializeOCR = async () => {
    if ( !ocrWorker ) {
        ocrWorker = await createWorker( 'eng' );
        await ocrWorker.setParameters( {
            tessedit_pageseg_mode: 6, // SINGLE_BLOCK
        } );
    }
    return ocrWorker;
};

export const processCardImage = async ( file, onProgress, onComplete ) => {
    try {
        // Update status
        onProgress( { status: 'reading', progress: 5 } );

        // Load image to canvas for preprocessing
        onProgress( { status: 'preprocessing', progress: 10 } );
        const { canvas: sourceCanvas } = await loadImageToCanvas( file, 800 );

        // Upload original image to FreeImageHost
        onProgress( { status: 'uploading', progress: 15 } );
        let uploadedImageUrl = '';
        try {
            const uploadResult = await uploadImageToFreeImageHost( file );
            uploadedImageUrl = uploadResult.url;
            console.log( '📸 Uploaded to FreeImageHost:', uploadedImageUrl );
        } catch ( uploadError ) {
            console.warn( '⚠️ Image upload failed, using local URL:', uploadError );
            uploadedImageUrl = URL.createObjectURL( file );
        }

        // Initialize OCR worker
        await initializeOCR();
        onProgress( { status: 'ocr-setup', progress: 20 } );

        // Preprocess and perform OCR on card name region
        onProgress( { status: 'ocr-name-prep', progress: 25 } );
        const preprocessedCardNameCanvas = await preprocessCardNameRegion( sourceCanvas, regions.cardName );

        onProgress( { status: 'ocr-name', progress: 35 } );
        const cardName = cleanOCRText( await performOCRWithMultipleAttempts( preprocessedCardNameCanvas, 'cardName', ocrWorker ) );
        onProgress( { cardName, progress: 50 } );

        // Preprocess and perform OCR on effect text region
        onProgress( { status: 'ocr-effect-prep', progress: 55 } );
        const preprocessedEffectCanvas = await preprocessEffectTextRegion( sourceCanvas, regions.effectText );

        onProgress( { status: 'ocr-effect', progress: 65 } );
        const effectText = cleanOCRText( await performOCRWithMultipleAttempts( preprocessedEffectCanvas, 'effectText', ocrWorker ) );
        onProgress( { effectText, progress: 80 } );

        // Fetch prices
        onProgress( { status: 'pricing', progress: 85 } );
        const prices = await fetchCardPrices( cardName );

        // Create inventory item
        const inventoryItem = {
            cardName: cardName || 'Unknown Card',
            setName: '',
            setCode: '',
            edition: '',
            rarity: '',
            condition: 'Near Mint',
            description: effectText,
            imageUrl: uploadedImageUrl, // Use uploaded URL or fallback to local
            prices,
            preprocessedImages: {
                cardName: preprocessedCardNameCanvas.toDataURL(),
                effectText: preprocessedEffectCanvas.toDataURL()
            }
        };

        onProgress( { status: 'complete', progress: 100 } );
        onComplete( inventoryItem );

    } catch ( error ) {
        console.error( 'Error processing card:', error );
        onProgress( { status: 'error', progress: 0 } );
        throw error;
    }
};