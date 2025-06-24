import Fuse from 'fuse.js';

// Match against inventory using Fuse.js fuzzy search
export function matchAgainstInventory( cardNameText, effectText, inventory, threshold = 0.2 ) {
  if ( !inventory || inventory.length === 0 ) {
    return [];
  }

  // Structure inventory for searching
  const structuredInventory = inventory.map( ( row, index ) => ( {
    index,
    row,
    cardName: ( row[ 0 ] || '' ).trim(),
    setName: ( row[ 1 ] || '' ).trim(),
    setCode: ( row[ 2 ] || '' ).trim(),
    description: ( row[ 6 ] || '' ).trim(),
  } ) );

  const fuse = new Fuse( structuredInventory, {
    keys: [
      { name: 'cardName', weight: 0.8 },
      { name: 'setCode', weight: 0.1 },
      { name: 'description', weight: 0.7 },
    ],
    includeScore: true,
    threshold: threshold,
  } );

  // Limit effect text length for search
  const searchString = `${ cardNameText } ${ effectText.slice( 0, 50 ) }`;
  const results = fuse.search( searchString );

  if ( results.length === 0 ) return [];

  const bestMatch = results[ 0 ].item;
  return inventory.filter( ( row ) =>
    ( row[ 0 ] || '' ).trim().toLowerCase() === bestMatch.cardName.toLowerCase()
  );
}

// Fallback match against full card database
export function fallbackMatchFromDBToInventory( cardNameText, effectText, cardDB, inventory, threshold = 0.4 ) {
  if ( !cardDB || cardDB.length === 0 || !inventory || inventory.length === 0 ) {
    return null;
  }

  const clean = ( str ) => str.toLowerCase().replace( /[^\w\s\-]/g, '' ).replace( /\s+/g, ' ' ).trim();

  const getChunkMatchScore = ( ocrEffect, dbDesc, chunkSize = 5 ) => {
    const ocrWords = clean( ocrEffect ).split( ' ' );
    const db = clean( dbDesc );
    let matches = 0;

    for ( let i = 0; i <= ocrWords.length - chunkSize; i++ ) {
      const chunk = ocrWords.slice( i, i + chunkSize ).join( ' ' );
      if ( db.includes( chunk ) ) matches++;
    }
    return matches;
  };

  // Fuzzy search top candidates from card database
  const fuse = new Fuse( cardDB, {
    keys: [ 'name', 'desc' ],
    includeScore: true,
    threshold: threshold,
  } );

  const candidates = fuse.search( cardNameText ).slice( 0, 80 );

  let bestMatch = null;
  let bestScore = -1;

  for ( const { item } of candidates ) {
    const score = getChunkMatchScore( effectText, item.desc || '' );
    if ( score > bestScore ) {
      bestScore = score;
      bestMatch = item;
    }
  }

  if ( !bestMatch ) return null;

  // Check if bestMatch.name is in inventory
  const matchedInventoryRows = inventory.filter(
    ( row ) => ( row[ 0 ] || '' ).trim().toLowerCase() === bestMatch.name.trim().toLowerCase()
  );

  if ( matchedInventoryRows.length === 0 ) {
    console.warn( `⚠️ Fallback matched DB card "${ bestMatch.name }" not in inventory.` );
    return null;
  }

  console.log( `✅ Fallback matched: "${ bestMatch.name }" via chunked description.` );
  return {
    matchedName: bestMatch.name,
    matchedRows: matchedInventoryRows,
  };
}

// Calculate similarity score between two texts
export function calculateSimilarity( text1, text2 ) {
  const words1 = text1.toLowerCase().split( ' ' ).filter( w => w.length > 2 );
  const words2 = text2.toLowerCase().split( ' ' ).filter( w => w.length > 2 );

  let matches = 0;
  for ( const word of words1 ) {
    if ( words2.includes( word ) || words2.some( w => w.includes( word ) && word.length > 3 ) ) {
      matches++;
    }
  }

  return matches / Math.max( words1.length, 1 );
}