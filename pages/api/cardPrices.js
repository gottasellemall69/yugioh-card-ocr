// pages/api/cardPrices.js

export default async function handler( req, res ) {
    if ( req.method !== 'GET' ) {
        return res.status( 405 ).json( { error: 'Method not allowed' } );
    }

    const { name } = req.query;
    if ( !name ) {
        return res.status( 400 ).json( { error: 'Missing card name' } );
    }

    try {
        const response = await fetch( `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${ encodeURIComponent( name ) }` );
        const data = await response.json();
        const prices = data.data?.[ 0 ]?.card_prices?.[ 0 ];

        res.status( 200 ).json( {
            ebay: prices?.ebay_price || '0.00',
            tcgplayer: prices?.tcgplayer_price || '0.00',
            cardmarket: prices?.cardmarket_price || '0.00'
        } );
    } catch ( error ) {
        res.status( 500 ).json( {
            ebay: '0.00',
            tcgplayer: '0.00',
            cardmarket: '0.00',
            error: error.message
        } );
    }
}
