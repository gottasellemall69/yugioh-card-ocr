export async function loadCardDatabase() {
  try {
    console.log( 'Loading card database...' );
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

    console.log( `Loaded ${ cards.length } cards from database` );
    return cards;
  } catch ( error ) {
    console.error( 'Failed to load card database:', error );
    return [];
  }
}

export async function fetchCardPrices( cardName ) {
  try {
    const response = await fetch( `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${ encodeURIComponent( cardName ) }` );
    const data = await response.json();
    const prices = data.data[ 0 ]?.card_prices[ 0 ];

    return {
      ebay: prices?.ebay_price || '0.00',
      tcgplayer: prices?.tcgplayer_price || '0.00',
      cardmarket: prices?.cardmarket_price || '0.00'
    };
  } catch ( error ) {
    return { ebay: '0.00', tcgplayer: '0.00', cardmarket: '0.00' };
  }
}