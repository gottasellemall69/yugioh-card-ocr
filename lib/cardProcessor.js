import { performOCR, cardNameRegion, effectTextRegion } from './ocrUtils';
import { uploadImageToFreeImageHost, createCanvasFromImage, canvasToBlob } from './imageUtils';
import { matchAgainstInventory, fallbackMatchFromDBToInventory } from './matchingUtils';
import { fetchCardPrices } from './cardDatabase';

export async function processCardImage(
  file,
  inventory,
  cardDatabase,
  settings,
  onProgress
) {
  const startTime = Date.now();

  try {
    onProgress( `🔍 Processing ${ file.name }...` );

    const canvas = await createCanvasFromImage( file );
    if ( !canvas ) {
      onProgress( `❌ Failed to create canvas for ${ file.name }` );
      throw new Error( 'Canvas creation failed' );
    }

    const cardNameText = await performOCR( canvas, cardNameRegion, 'Card Name', true, onProgress );
    onProgress( `🔠 OCR Name Result: "${ cardNameText }"` );

    const effectText = await performOCR( canvas, effectTextRegion, 'Effect Text', false, onProgress );
    onProgress( `🧾 OCR Effect Result: "${ effectText }"` );

    if ( !cardNameText || cardNameText.trim() === '' ) {
      onProgress( `❌ No card name text detected in ${ file.name }` );
      throw new Error( 'No card name detected' );
    }

    let matchedRows = matchAgainstInventory( cardNameText, effectText, inventory, settings.matchThreshold );
    onProgress( `📈 Inventory Matches Found: ${ matchedRows.length }` );

    let finalMatchedRows = matchedRows;
    let matchedName = cardNameText;

    if ( finalMatchedRows.length === 0 && settings.enableFallback ) {
      onProgress( `🔄 Trying fallback match...` );
      const fallback = fallbackMatchFromDBToInventory( cardNameText, effectText, cardDatabase, inventory );

      if ( fallback && fallback.matchedRows.length > 0 ) {
        finalMatchedRows = fallback.matchedRows;
        matchedName = fallback.matchedName;
        onProgress( `✅ Fallback match succeeded: ${ matchedName }` );
      } else {
        onProgress( `⚠️ Fallback failed` );
      }
    }

    let imageUrl = '';
    let prices = null;

    if ( finalMatchedRows.length > 0 && settings.freeImageApiKey ) {
      try {
        const blob = await canvasToBlob( canvas );
        imageUrl = await uploadImageToFreeImageHost( blob, settings.freeImageApiKey, file.name );
        onProgress( `📤 Uploaded image URL: ${ imageUrl }` );
      } catch ( uploadError ) {
        onProgress( `⚠️ Upload error: ${ uploadError.message }` );
      }
    }

    if ( finalMatchedRows.length > 0 && settings.fetchPrices ) {
      try {
        prices = await fetchCardPrices( matchedName );
        onProgress( `💰 Prices fetched for ${ matchedName }` );
      } catch ( priceError ) {
        onProgress( `⚠️ Price fetch error: ${ priceError.message }` );
      }
    }

    const processingTime = Date.now() - startTime;
    const matched = finalMatchedRows.length > 0;

    const result = {
      filename: file.name,
      cardName: cardNameText,
      effectText: effectText,
      matched: matched,
      matchedName: matched ? matchedName : null,
      matchedRows: finalMatchedRows,
      imageUrl: imageUrl,
      prices: prices,
      processingTime: processingTime,
      setName: matched && finalMatchedRows[ 0 ] ? finalMatchedRows[ 0 ][ 1 ] : '',
      setCode: matched && finalMatchedRows[ 0 ] ? finalMatchedRows[ 0 ][ 2 ] : '',
      edition: matched && finalMatchedRows[ 0 ] ? finalMatchedRows[ 0 ][ 3 ] : '',
      rarity: matched && finalMatchedRows[ 0 ] ? finalMatchedRows[ 0 ][ 4 ] : '',
      condition: matched && finalMatchedRows[ 0 ] ? finalMatchedRows[ 0 ][ 5 ] : '',
    };

    return result;

  } catch ( error ) {
    const processingTime = Date.now() - startTime;
    onProgress( `❌ Exception thrown for ${ file.name }: ${ error.message }` );
    return {
      filename: file.name,
      cardName: '',
      effectText: '',
      matched: false,
      matchedName: null,
      matchedRows: [],
      imageUrl: '',
      prices: null,
      processingTime: processingTime,
      error: error.message
    };
  }
}
