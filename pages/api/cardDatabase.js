// pages/api/cardDatabase.js

export default async function handler( req, res ) {
    if ( req.method !== 'GET' ) {
        return res.status( 405 ).json( { error: 'Method not allowed' } );
    }

    try {
        const response = await fetch( 'https://db.ygoprodeck.com/api/v7/cardinfo.php' );
        const data = await response.json();

        const cards = data.data.map( card => ( {
            name: card.name,
            desc: card.desc,
            type: card.type,
            race: card.race,
            archetype: card.archetype,
            atk: card.atk,
            def: card.def,
            level: card.level,
            set_codes: card.card_sets?.map( set => set.set_code )
        } ) );

        res.status( 200 ).json( cards );
    } catch ( error ) {
        res.status( 500 ).json( { error: 'Failed to load card database', message: error.message } );
    }
}
