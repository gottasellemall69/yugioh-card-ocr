export default function ResultCard({ result }) {
  if (!result) return null;

  const confidenceScore = result.confidence || 0;
  const confidenceColor =
    confidenceScore > 0.8
      ? 'text-green-600'
      : confidenceScore > 0.5
        ? 'text-yellow-600'
        : 'text-red-600';

  const confidenceIcon =
    confidenceScore > 0.8
      ? '✅'
      : confidenceScore > 0.5
        ? '⚠️'
        : '❌';

  const matchInfo = result.match ? (
    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
      <h4 className="font-semibold text-green-800 dark:text-green-200">
        Matched: {result.match.name}
      </h4>
      <p className="text-sm text-green-600 dark:text-green-300">
        {result.match.type} | {result.match.race || 'Unknown'}
      </p>
      {result.match.archetype && (
        <p className="text-xs text-green-500 dark:text-green-400 mt-1">
          Archetype: {result.match.archetype}
        </p>
      )}
      {result.prices && (
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          <div className="bg-white dark:bg-gray-800 p-1 rounded">
            <span className="text-gray-500">eBay:</span> ${result.prices.ebay}
          </div>
          <div className="bg-white dark:bg-gray-800 p-1 rounded">
            <span className="text-gray-500">TCG:</span> ${result.prices.tcgplayer}
          </div>
          <div className="bg-white dark:bg-gray-800 p-1 rounded">
            <span className="text-gray-500">CM:</span> ${result.prices.cardmarket}
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
      <p className="text-yellow-800 dark:text-yellow-200">No match found</p>
      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
        Card may be rare, damaged, or not in database
      </p>
    </div>
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 
                  hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in">
      <div className="flex gap-4">
        {/* Card Image */}
        <div className="flex-shrink-0">
          <img
            src={result.imageUrl}
            alt={result.filename}
            className="w-24 h-32 object-cover rounded border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => window.open(result.imageUrl, '_blank')}
          />
          <p className="text-xs text-gray-500 mt-1 truncate w-24" title={result.filename}>
            {result.filename}
          </p>
        </div>

        {/* Card Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold truncate text-lg">
              {result.match?.name || result.cardName || 'Unknown Card'}
            </h3>
            {result.confidence !== undefined && (
              <span className={`text-xs px-2 py-1 rounded ${confidenceColor} bg-gray-100 dark:bg-gray-800`}>
                {confidenceIcon} {Math.round(confidenceScore * 100)}% confidence
              </span>
            )}
          </div>

          <div className="space-y-3">
            {/* OCR Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Detected Name:
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {result.cardName || 'Not detected'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Processing Time:
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {result.processingTime ? `${result.processingTime}ms` : 'Unknown'}
                </p>
              </div>
            </div>

            {/* Effect Text */}
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Effect Text:
              </span>
              <p
                id={`full-text-${result.filename}`}
                className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2"
              >
                {result.effectText || 'Not detected'}
              </p>
              {result.effectText && result.effectText.length > 100 && (
                <button
                  className="text-xs text-primary hover:underline mt-1"
                  onClick={() => {
                    const element = document.getElementById(`full-text-${result.filename}`);
                    if (element) {
                      element.classList.toggle('line-clamp-2');
                    }
                  }}
                >
                  Show more
                </button>
              )}
            </div>

            {/* Match Information */}
            {matchInfo}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors">
                Edit Details
              </button>
              <button className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors">
                Re-process
              </button>
              {result.match && (
                <button className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors">
                  Add to Inventory
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}