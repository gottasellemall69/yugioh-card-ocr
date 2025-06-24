import { extractRegion, performOCR, cardNameRegion, effectTextRegion } from '@/lib/ocrUtils';
import { fetchCardPrices } from '@/lib/cardDatabase';
import { calculateSimilarity } from '@/lib/utils';

export async function processCardImage( file, cardDatabase, onProgress ) {
  const startTime = Date.now();

  try {
    onProgress?.( { message: `Processing ${ file.name }...` } );

    // Create image element and canvas
    const img = new Image();
    const canvas = document.createElement( 'canvas' );
    const ctx = canvas.getContext( '2d' );

    return new Promise( ( resolve ) => {
      img.onload = async () => {
        try {
          // Resize image to standard size
          const maxWidth = 800;
          const scale = img.width > maxWidth ? maxWidth / img.width : 1;
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          ctx.drawImage( img, 0, 0, canvas.width, canvas.height );

          // Extract and OCR card name region
          const cardNameCanvas = extractRegion( canvas, cardNameRegion, scale );
          const cardNameText = await performOCR( cardNameCanvas, 'Card Name', onProgress ).catch( () => '' );

          // Extract and OCR effect text region
          const effectCanvas = extractRegion( canvas, effectTextRegion, scale );
          const effectText = await performOCR( effectCanvas, 'Effect Text', onProgress ).catch( () => '' );

          // Match against database
          const match = await findCardMatch( cardNameText, effectText, cardDatabase );

          // Get image data URL for display
          const imageDataUrl = canvas.toDataURL( 'image/jpeg', 0.8 );

          // Fetch prices if we have a match
          const prices = match ? await fetchCardPrices( match.name ) : null;

          const result = {
            filename: file.name,
            imageUrl: imageDataUrl,
            cardName: cardNameText,
            effectText: effectText,
            match: match,
            prices: prices,
            confidence: match ? calculateMatchConfidence( cardNameText, effectText, match ) : 0,
            processingTime: Date.now() - startTime
          };

          resolve( result );

        } catch ( ocrError ) {
          onProgress?.( { message: `❌ OCR failed for ${ file.name }: ${ ocrError.message }` } );
          resolve( null );
        }
      };

      img.onerror = () => {
        onProgress?.( { message: `❌ Failed to load image ${ file.name }` } );
        resolve( null );
      };

      img.src = URL.createObjectURL( file );
    } );

  } catch ( error ) {
    onProgress?.( { message: `❌ Error processing ${ file.name }: ${ error.message }` } );
    return null;
  }
}

export async function findCardMatch( cardName, effectText, cardDatabase ) {
  if ( !cardName && !effectText ) return null;

  const searchText = `${ cardName } ${ effectText }`.toLowerCase();

  let bestMatch = null;
  let bestScore = 0;

  // First, try exact name matching
  for ( const card of cardDatabase ) {
    if ( card.name.toLowerCase() === cardName.toLowerCase() ) {
      return {
        ...card,
        matchType: 'exact'
      };
    }
  }

  // Then try fuzzy matching
  for ( const card of cardDatabase ) {
    const cardText = `${ card.name } ${ card.desc || '' }`.toLowerCase();
    const score = calculateSimilarity( searchText, cardText );

    if ( score > bestScore && score > 0.3 ) {
      bestScore = score;
      bestMatch = {
        ...card,
        matchType: 'fuzzy',
        score: score
      };
    }
  }

  // Additional matching strategies
  if ( !bestMatch && cardName ) {
    bestMatch = await findPartialNameMatch( cardName, cardDatabase );
  }

  if ( !bestMatch && effectText ) {
    bestMatch = await findEffectTextMatch( effectText, cardDatabase );
  }

  return bestMatch;
}

export async function findPartialNameMatch( cardName, cardDatabase ) {
  const cleanCardName = cardName.toLowerCase().replace( /[^\w\s]/g, '' ).trim();
  const words = cleanCardName.split( ' ' ).filter( w => w.length > 2 );

  if ( words.length === 0 ) return null;

  let bestMatch = null;
  let bestScore = 0;

  for ( const card of cardDatabase ) {
    const cleanDbName = card.name.toLowerCase().replace( /[^\w\s]/g, '' );
    let matches = 0;

    for ( const word of words ) {
      if ( cleanDbName.includes( word ) ) {
        matches++;
      }
    }

    const score = matches / words.length;
    if ( score > bestScore && score > 0.5 ) {
      bestScore = score;
      bestMatch = {
        ...card,
        matchType: 'partial',
        score: score
      };
    }
  }

  return bestMatch;
}

export async function findEffectTextMatch( effectText, cardDatabase ) {
  const cleanEffectText = effectText.toLowerCase().replace( /[^\w\s]/g, '' ).trim();
  const words = cleanEffectText.split( ' ' ).filter( w => w.length > 3 );

  if ( words.length < 3 ) return null;

  let bestMatch = null;
  let bestScore = 0;

  for ( const card of cardDatabase ) {
    if ( !card.desc ) continue;

    const cleanDesc = card.desc.toLowerCase().replace( /[^\w\s]/g, '' );
    let matches = 0;

    // Check for phrase matches (3+ word sequences)
    for ( let i = 0; i <= words.length - 3; i++ ) {
      const phrase = words.slice( i, i + 3 ).join( ' ' );
      if ( cleanDesc.includes( phrase ) ) {
        matches += 3;
      }
    }

    const score = matches / words.length;
    if ( score > bestScore && score > 0.3 ) {
      bestScore = score;
      bestMatch = {
        ...card,
        matchType: 'effect',
        score: score
      };
    }
  }

  return bestMatch;
}

export function calculateMatchConfidence( cardName, effectText, match ) {
  let confidence = 0;

  if ( match.matchType === 'exact' ) {
    confidence = 1.0;
  } else if ( match.score ) {
    confidence = match.score;
  } else {
    // Calculate based on text similarity
    const cardNameSimilarity = cardName ?
      calculateSimilarity( cardName.toLowerCase(), match.name.toLowerCase() ) : 0;
    const effectSimilarity = effectText && match.desc ?
      calculateSimilarity( effectText.toLowerCase(), match.desc.toLowerCase() ) : 0;

    confidence = Math.max( cardNameSimilarity, effectSimilarity * 0.7 );
  }

  return Math.min( Math.max( confidence, 0 ), 1 );
}