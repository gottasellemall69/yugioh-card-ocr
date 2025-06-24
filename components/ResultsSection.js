import { useState, useMemo } from 'react';
import Papa from 'papaparse';

export default function ResultsSection( { results } ) {
  const [ sortBy, setSortBy ] = useState( 'filename' );
  const [ filterBy, setFilterBy ] = useState( 'all' );
  const [ searchTerm, setSearchTerm ] = useState( '' );

  // Statistics
  const stats = useMemo( () => {
    const total = results.length;
    const matched = results.filter( r => r.matched ).length;
    const failed = results.filter( r => !r.matched ).length;

    return { total, matched, failed };
  }, [ results ] );

  // Filtered and sorted results
  const filteredResults = useMemo( () => {
    let filtered = results;

    // Apply search filter
    if ( searchTerm ) {
      filtered = filtered.filter( result =>
        result.filename.toLowerCase().includes( searchTerm.toLowerCase() ) ||
        ( result.cardName || '' ).toLowerCase().includes( searchTerm.toLowerCase() ) ||
        ( result.matchedName || '' ).toLowerCase().includes( searchTerm.toLowerCase() )
      );
    }

    // Apply status filter
    switch ( filterBy ) {
      case 'matched':
        filtered = filtered.filter( r => r.matched );
        break;
      case 'failed':
        filtered = filtered.filter( r => !r.matched );
        break;
    }

    // Apply sorting
    filtered.sort( ( a, b ) => {
      switch ( sortBy ) {
        case 'filename':
          return a.filename.localeCompare( b.filename );
        case 'cardName':
          return ( a.matchedName || a.cardName || '' ).localeCompare( b.matchedName || b.cardName || '' );
        case 'processingTime':
          return ( a.processingTime || 0 ) - ( b.processingTime || 0 );
        default:
          return 0;
      }
    } );

    return filtered;
  }, [ results, searchTerm, filterBy, sortBy ] );

  const exportResults = () => {
    if ( results.length === 0 ) return;

    const csvData = results.map( result => ( {
      'Filename': result.filename,
      'Card Name': result.matchedName || result.cardName || 'Unknown',
      'Set Name': result.setName || '',
      'Set Code': result.setCode || '',
      'Edition': result.edition || '',
      'Rarity': result.rarity || '',
      'Condition': result.condition || '',
      'Description': result.effectText || '',
      'Image URL': result.imageUrl || '',
      'eBay Price': result.prices?.ebay || '0.00',
      'TCGPlayer Price': result.prices?.tcgplayer || '0.00',
      'Cardmarket Price': result.prices?.cardmarket || '0.00',
      'Processing Time': result.processingTime ? `${ result.processingTime }ms` : '',
      'Matched': result.matched ? 'Yes' : 'No'
    } ) );

    const csv = Papa.unparse( csvData );
    const blob = new Blob( [ csv ], { type: 'text/csv' } );
    const url = URL.createObjectURL( blob );

    const a = document.createElement( 'a' );
    a.href = url;
    a.download = `card_recognition_results_${ new Date().toISOString().split( 'T' )[ 0 ] }.csv`;
    a.click();

    URL.revokeObjectURL( url );
  };

  if ( results.length === 0 ) {
    return null;
  }

  return (
    <header className="fixed z-50 sticky bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Header */ }
      <div className="sticky flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold mb-2 flex items-center">
            <span className="mr-3">📊</span>
            Recognition Results
          </h3>

          {/* Statistics */ }
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
              Total: { stats.total }
            </span>
            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full">
              Matched: { stats.matched }
            </span>
            <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full">
              Failed: { stats.failed }
            </span>
          </div>
        </div>

        {/* Export Button */ }
        <div className="mt-4 lg:mt-0">
          <button
            onClick={ exportResults }
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm
                     shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters and Search */ }
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Search */ }
        <div className="md:col-span-2">
          <input
            type="text"
            placeholder="Search by filename or card name..."
            value={ searchTerm }
            onChange={ ( e ) => setSearchTerm( e.target.value ) }
            className="w-full text-base p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Filter */ }
        <div>
          <select
            value={ filterBy }
            onChange={ ( e ) => setFilterBy( e.target.value ) }
            className="w-full text-base p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Results</option>
            <option value="matched">Matched Only</option>
            <option value="failed">Failed Only</option>
          </select>
        </div>

        {/* Sort */ }
        <div>
          <select
            value={ sortBy }
            onChange={ ( e ) => setSortBy( e.target.value ) }
            className="w-full text-base p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="filename">Sort by Filename</option>
            <option value="cardName">Sort by Card Name</option>
            <option value="processingTime">Sort by Processing Time</option>
          </select>
        </div>
      </div>

      {/* Results Count */ }
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing { filteredResults.length } of { results.length } results
        </p>
      </div>

      {/* Results Grid */ }
      <div className="grid gap-4">
        { filteredResults.map( ( result, index ) => (
          <ResultCard key={ `${ result.filename }-${ index }` } result={ result } />
        ) ) }
      </div>

      { filteredResults.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No results found for "{ searchTerm }"
          </p>
          <button
            onClick={ () => setSearchTerm( '' ) }
            className="text-primary hover:underline mt-2"
          >
            Clear search
          </button>
        </div>
      ) }
    </header>
  );
}

function ResultCard( { result } ) {
  const [ showFullText, setShowFullText ] = useState( false );

  return (
    <div className='max-h-[500px] z-0'>
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 
                  hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in">
        <div className="flex gap-4">
          {/* Card Image */ }
          <div className="flex-shrink-0">
            { result.imageUrl ? (
              <img
                src={ result.imageUrl }
                alt={ result.filename }
                className="w-24 h-32 object-cover rounded border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={ () => window.open( result.imageUrl, '_blank' ) }
              />
            ) : (
              <div className="w-24 h-32 bg-gray-200 dark:bg-gray-600 rounded border flex items-center justify-center">
                <span className="text-gray-400 text-xs">No Image</span>
              </div>
            ) }
            <p className="text-xs text-gray-500 mt-1 truncate w-24" title={ result.filename }>
              { result.filename }
            </p>
          </div>

          {/* Card Details */ }
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold truncate text-lg">
                { result.matchedName || result.cardName || 'Unknown Card' }
              </h3>
              <span className={ `text-xs px-2 py-1 rounded ${ result.matched
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }` }>
                { result.matched ? '✅ Matched' : '❌ Failed' }
              </span>
            </div>

            <div className="space-y-3">
              {/* OCR vs Matched Comparison */ }
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <span className="mr-2">🔍</span>
                    OCR Detected Text
                  </h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                    <div className="mb-2">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Card Name:</span>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                        { result.cardName || 'Not detected' }
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Effect Text:</span>
                      <p className={ `text-sm text-blue-800 dark:text-blue-200 mt-1 ${ showFullText ? '' : 'line-clamp-2'
                        }` }>
                        { result.effectText || 'Not detected' }
                      </p>
                      { result.effectText && result.effectText.length > 100 && (
                        <button
                          className="text-xs text-blue-600 hover:underline mt-1"
                          onClick={ () => setShowFullText( !showFullText ) }
                        >
                          { showFullText ? 'Show less' : 'Show more' }
                        </button>
                      ) }
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <span className="mr-2">🎯</span>
                    Database Match
                  </h4>
                  { result.matched ? (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                      <div className="mb-2">
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">Matched Name:</span>
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200 mt-1">
                          { result.matchedName }
                        </p>
                      </div>
                      { result.setName && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">Set:</span>
                          <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                            { result.setName }
                          </p>
                        </div>
                      ) }
                      { result.rarity && (
                        <div>
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">Rarity:</span>
                          <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                            { result.rarity }
                          </p>
                        </div>
                      ) }
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                      <p className="text-yellow-800 dark:text-yellow-200 text-sm">No match found</p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        Card may be rare, damaged, or not in inventory
                      </p>
                    </div>
                  ) }
                </div>
              </div>

              {/* Processing Info */ }
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Processing Time:</span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    { result.processingTime ? `${ result.processingTime }ms` : 'Unknown' }
                  </p>
                </div>
                { result.condition && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Condition:</span>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      { result.condition }
                    </p>
                  </div>
                ) }
                { result.edition && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Edition:</span>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      { result.edition }
                    </p>
                  </div>
                ) }
              </div>

              {/* Pricing Information */ }
              { result.prices && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <span className="mr-2">💰</span>
                    Current Market Prices
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                      <span className="text-gray-500">eBay:</span>
                      <p className="font-semibold">${ result.prices.ebay }</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                      <span className="text-gray-500">TCGPlayer:</span>
                      <p className="font-semibold">${ result.prices.tcgplayer }</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2 rounded border">
                      <span className="text-gray-500">Cardmarket:</span>
                      <p className="font-semibold">${ result.prices.cardmarket }</p>
                    </div>
                  </div>
                </div>
              ) }

              {/* Action Buttons */ }
              <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <button className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors">
                  Edit Details
                </button>
                <button className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors">
                  Re-process
                </button>
                { result.matched && (
                  <button className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors">
                    Add to Inventory
                  </button>
                ) }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}