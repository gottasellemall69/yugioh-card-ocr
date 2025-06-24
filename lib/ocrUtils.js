import Tesseract from 'tesseract.js';

// Card regions for OCR (based on original coordinates for 800px wide images)
export const cardNameRegion = { left: 60, top: 70, width: 650, height: 160 };
export const effectTextRegion = { left: 60, top: 740, width: 680, height: 210 };

// Clean OCR text (keep letters, numbers, spaces, dashes, commas, apostrophes)
export function cleanOCR( text ) {
  return text
    .replace( /[^\w\s\-,'']/g, '' )
    .replace( /\s+/g, ' ' )
    .trim();
}

// Extract region from canvas and preprocess
export function extractAndPreprocessRegion( canvas, region, isCardName = false ) {
  const extractCanvas = document.createElement( 'canvas' );
  const extractCtx = extractCanvas.getContext( '2d' );

  extractCanvas.width = region.width;
  extractCanvas.height = region.height;

  // Extract the region
  extractCtx.drawImage(
    canvas,
    region.left, region.top, region.width, region.height,
    0, 0, region.width, region.height
  );

  // Apply preprocessing
  const imageData = extractCtx.getImageData( 0, 0, extractCanvas.width, extractCanvas.height );

  if ( isCardName ) {
    preprocessCardNameRegion( imageData );
  } else {
    preprocessEffectTextRegion( imageData );
  }

  extractCtx.putImageData( imageData, 0, 0 );

  return extractCanvas;
}

// Preprocessing for card name region: sharpen and normalize
function preprocessCardNameRegion( imageData ) {
  const data = imageData.data;

  for ( let i = 0; i < data.length; i += 4 ) {
    // Convert to grayscale
    const gray = Math.round( 0.299 * data[ i ] + 0.587 * data[ i + 1 ] + 0.114 * data[ i + 2 ] );

    // Normalize and sharpen
    const enhanced = gray > 140 ? 255 : 0; // Higher threshold for card names

    data[ i ] = enhanced;     // R
    data[ i + 1 ] = enhanced; // G
    data[ i + 2 ] = enhanced; // B
    // Alpha channel stays the same
  }
}

// Preprocessing for effect text region: grayscale, normalize, slight threshold
function preprocessEffectTextRegion( imageData ) {
  const data = imageData.data;

  for ( let i = 0; i < data.length; i += 4 ) {
    // Convert to grayscale
    const gray = Math.round( 0.299 * data[ i ] + 0.587 * data[ i + 1 ] + 0.114 * data[ i + 2 ] );

    // Apply threshold to reduce background noise
    const enhanced = gray > 120 ? 255 : 0;

    data[ i ] = enhanced;     // R
    data[ i + 1 ] = enhanced; // G
    data[ i + 2 ] = enhanced; // B
    // Alpha channel stays the same
  }
}

// OCR function with region, preprocessing and Tesseract config
export async function performOCR( canvas, region, label, isCardName = false, onProgress ) {
  try {
    if ( onProgress ) {
      onProgress( `🔍 Running OCR for ${ label }...` );
    }

    const preprocessedCanvas = extractAndPreprocessRegion( canvas, region, isCardName );

    const tesseractConfig = isCardName
      ? { tessedit_pageseg_mode: 4 } // Single text line for card names
      : { tessedit_pageseg_mode: 6 }; // Single uniform block for effect text

    const result = await Tesseract.recognize( preprocessedCanvas, 'eng', {
      ...tesseractConfig,
      logger: m => {
        if ( m.status === 'recognizing text' && onProgress ) {
          onProgress( `🔍 OCR ${ label }: ${ Math.round( m.progress * 100 ) }%` );
        }
      }
    } );

    const cleanedText = cleanOCR( result.data.text || '' );

    if ( onProgress ) {
      onProgress( `✅ OCR ${ label } result: "${ cleanedText }"` );
    }

    return cleanedText;

  } catch ( error ) {
    console.error( `OCR failed for ${ label }:`, error );
    if ( onProgress ) {
      onProgress( `❌ OCR failed for ${ label }: ${ error.message }` );
    }
    return '';
  }
}