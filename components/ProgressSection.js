// components/progress-section.js

import React, { useEffect, useRef } from 'react';

/**
 * Props:
 * - logEntries: string[]
 */
export function ProgressSection( { logEntries } ) {
  const containerRef = useRef( null );

  // Auto-scroll to bottom on new logs
  useEffect( () => {
    const el = containerRef.current;
    if ( el ) {
      el.scrollTop = el.scrollHeight;
    }
  }, [ logEntries ] );

  return (
    <div className="mt-4 bg-gray-100 border border-gray-300 rounded p-3 max-h-48 overflow-y-auto text-sm" ref={ containerRef }>
      <div className="space-y-1">
        { logEntries.map( ( entry, index ) => (
          <div key={ index } className="whitespace-pre-wrap">
            { entry }
          </div>
        ) ) }
      </div>
    </div>
  );
}
