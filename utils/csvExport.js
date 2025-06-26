// utils/csvExport.js

// Convert inventory data to CSV format and trigger download
export const exportInventoryToCSV = ( inventory, filename = 'card_inventory.csv' ) => {
    if ( !inventory || inventory.length === 0 ) {
        throw new Error( 'No inventory data to export' );
    }

    const headers = [
        'Card Name',
        'Set Name',
        'Set Code',
        'Edition',
        'Rarity',
        'Condition',
        'Description',
        'Image URL',
        'eBay Price',
        'TCGPlayer Price',
        'Cardmarket Price'
    ];

    // Create CSV content
    const csvContent = [
        // Header row
        headers.join( ',' ),
        // Data rows
        ...inventory.map( item => [
            `"${ ( item.cardName || '' ).replace( /"/g, '""' ) }"`,
            `"${ ( item.setName || '' ).replace( /"/g, '""' ) }"`,
            `"${ ( item.setCode || '' ).replace( /"/g, '""' ) }"`,
            `"${ ( item.edition || '' ).replace( /"/g, '""' ) }"`,
            `"${ ( item.rarity || '' ).replace( /"/g, '""' ) }"`,
            `"${ ( item.condition || 'Near Mint' ).replace( /"/g, '""' ) }"`,
            `"${ ( item.description || '' ).replace( /"/g, '""' ) }"`,
            `"${ ( item.imageUrl || '' ).replace( /"/g, '""' ) }"`,
            item.prices?.ebay || '0.00',
            item.prices?.tcgplayer || '0.00',
            item.prices?.cardmarket || '0.00'
        ].join( ',' ) )
    ].join( '\n' );

    // Create and trigger download
    const blob = new Blob( [ csvContent ], { type: 'text/csv;charset=utf-8;' } );
    const url = URL.createObjectURL( blob );

    const link = document.createElement( 'a' );
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild( link );
    link.click();
    document.body.removeChild( link );

    // Clean up object URL
    URL.revokeObjectURL( url );

    return true;
};

// Parse CSV file content into inventory format
export const parseCSVToInventory = ( csvContent ) => {
    const lines = csvContent.split( '\n' ).filter( line => line.trim() );

    if ( lines.length < 2 ) {
        throw new Error( 'CSV file must contain headers and at least one data row' );
    }

    // Skip header row and parse data
    const dataLines = lines.slice( 1 );
    const inventory = [];

    dataLines.forEach( ( line, index ) => {
        try {
            // Simple CSV parsing (handles quoted fields)
            const fields = parseCSVLine( line );

            if ( fields.length >= 11 ) {
                const item = {
                    id: Date.now() + Math.random(),
                    cardName: fields[ 0 ] || 'Unknown Card',
                    setName: fields[ 1 ] || '',
                    setCode: fields[ 2 ] || '',
                    edition: fields[ 3 ] || '',
                    rarity: fields[ 4 ] || '',
                    condition: fields[ 5 ] || 'Near Mint',
                    description: fields[ 6 ] || '',
                    imageUrl: fields[ 7 ] || '',
                    prices: {
                        ebay: fields[ 8 ] || '0.00',
                        tcgplayer: fields[ 9 ] || '0.00',
                        cardmarket: fields[ 10 ] || '0.00'
                    }
                };
                inventory.push( item );
            }
        } catch ( error ) {
            console.warn( `Error parsing CSV line ${ index + 2 }:`, error );
        }
    } );

    return inventory;
};

// Helper function to parse a single CSV line with proper quote handling
const parseCSVLine = ( line ) => {
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;

    while ( i < line.length ) {
        const char = line[ i ];

        if ( char === '"' ) {
            if ( inQuotes && line[ i + 1 ] === '"' ) {
                // Escaped quote
                currentField += '"';
                i += 2;
            } else {
                // Start or end of quoted field
                inQuotes = !inQuotes;
                i++;
            }
        } else if ( char === ',' && !inQuotes ) {
            // Field separator
            fields.push( currentField );
            currentField = '';
            i++;
        } else {
            currentField += char;
            i++;
        }
    }

    // Add the last field
    fields.push( currentField );

    return fields;
};

// Create CSV content from inventory array (without triggering download)
export const createCSVContent = ( inventory ) => {
    const headers = [
        'Card Name',
        'Set Name',
        'Set Code',
        'Edition',
        'Rarity',
        'Condition',
        'Description',
        'Image URL',
        'eBay Price',
        'TCGPlayer Price',
        'Cardmarket Price'
    ];

    const csvContent = [
        headers.join( ',' ),
        ...inventory.map( item => [
            `"${ ( item.cardName || '' ).replace( /"/g, '""' ) }"`,
            `"${ ( item.setName || '' ).replace( /"/g, '""' ) }"`,
            `"${ ( item.setCode || '' ).replace( /"/g, '""' ) }"`,
            `"${ ( item.edition || '' ).replace( /"/g, '""' ) }"`,
            `"${ ( item.rarity || '' ).replace( /"/g, '""' ) }"`,
            `"${ ( item.condition || 'Near Mint' ).replace( /"/g, '""' ) }"`,
            `"${ ( item.description || '' ).replace( /"/g, '""' ) }"`,
            `"${ ( item.imageUrl || '' ).replace( /"/g, '""' ) }"`,
            item.prices?.ebay || '0.00',
            item.prices?.tcgplayer || '0.00',
            item.prices?.cardmarket || '0.00'
        ].join( ',' ) )
    ].join( '\n' );

    return csvContent;
};