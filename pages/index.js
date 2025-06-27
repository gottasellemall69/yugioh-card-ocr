import React, { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';
import Papa from 'papaparse';

export default function Home() {
  const [ images, setImages ] = useState( [] );
  const [ inventory, setInventory ] = useState( [] );
  const [ results, setResults ] = useState( [] );
  const [ processing, setProcessing ] = useState( false );
  const [ logs, setLogs ] = useState( [] );
  const [ filter, setFilter ] = useState( 'all' );
  const [ cropName, setCropName ] = useState( { x: 150, y: 200, width: 1300, height: 190 } );
  const [ cropEffect, setCropEffect ] = useState( { x: 150, y: 1500, width: 1300, height: 350 } );
  const [ useAutoCrop, setUseAutoCrop ] = useState( false );
  const [ activePreview, setActivePreview ] = useState( null );
  const dropRef = useRef( null ), overlayRef = useRef( null );

  const log = msg => setLogs( l => [ ...l, `[${ new Date().toLocaleTimeString() }] ${ msg }` ] );
  const cleanText = t => t.toLowerCase().replace( /[^a-z0-9]/gi, ' ' ).replace( /\s+/g, ' ' ).trim();
  const sim = ( a, b ) => {
    const A = new Set( cleanText( a ).split( ' ' ) ), B = new Set( cleanText( b ).split( ' ' ) );
    const I = [ ...A ].filter( x => B.has( x ) ).length; return I / Math.max( A.size, B.size, 1 );
  };

  useEffect( () => {
    const cropNameS = localStorage.getItem( 'cropName' );
    const cropEffS = localStorage.getItem( 'cropEffect' );
    if ( cropNameS ) setCropName( JSON.parse( cropNameS ) );
    if ( cropEffS ) setCropEffect( JSON.parse( cropEffS ) );
  }, [] );
  useEffect( () => localStorage.setItem( 'cropName', JSON.stringify( cropName ) ), [ cropName ] );
  useEffect( () => localStorage.setItem( 'cropEffect', JSON.stringify( cropEffect ) ), [ cropEffect ] );

  const handleCSVUpload = e => {
    const file = e.target.files[ 0 ];
    Papa.parse( file, {
      header: false, skipEmptyLines: true, complete: res => {
        setInventory( res.data.map( r => ( {
          name: r[ 0 ], set: r[ 1 ], number: r[ 2 ], edition: r[ 3 ], rarity: r[ 4 ], condition: r[ 5 ]
        } ) ) );
        log( `Loaded ${ res.data.length } inventory lines` );
      }
    } );
  };

  const renderOverlay = async file => {
    const img = await createImageBitmap( file );
    const c = overlayRef.current;
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext( '2d' );
    ctx.clearRect( 0, 0, c.width, c.height );
    ctx.drawImage( img, 0, 0 );
    const drawBox = ( r, c ) => { ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.strokeRect( r.x, r.y, r.width, r.height ); };

    if ( useAutoCrop && window.cv ) {
      const mat = cv.imread( c ), gray = new cv.Mat();
      cv.cvtColor( mat, gray, cv.COLOR_RGBA2GRAY );
      cv.GaussianBlur( gray, gray, new cv.Size( 5, 5 ), 0 );
      cv.Canny( gray, gray, 75, 200 );
      const ctr = new cv.MatVector(), h = new cv.Mat();
      cv.findContours( gray, ctr, h, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE );
      let best = null, mx = 0;
      for ( let i = 0; i < ctr.size(); i++ ) {
        const cnt = ctr.get( i ), area = cv.contourArea( cnt );
        if ( area > mx ) { mx = area; best = cnt; }
      }
      if ( best ) {
        const r = cv.boundingRect( best );
        drawBox( r, '#10b981' );
        drawBox( { x: r.x + 40, y: r.y + 40, width: r.width - 80, height: 100 }, '#3b82f6' );
        drawBox( { x: r.x + 40, y: r.y + r.height - 290, width: r.width - 80, height: 220 }, '#f59e0b' );
      }
      mat.delete(); gray.delete(); ctr.delete(); h.delete();
    } else {
      drawBox( cropName, '#3b82f6' ); drawBox( cropEffect, '#f59e0b' );
    }
  };

  const handleImageFiles = files => {
    const imgs = Array.from( files ).filter( f => f.type.startsWith( 'image/' ) );
    setImages( imgs );
    log( `Selected ${ imgs.length } images` );
    if ( imgs.length > 0 ) {
      setActivePreview( imgs[ 0 ] );
      setTimeout( () => renderOverlay( imgs[ 0 ] ), 100 );
    }
  };
  useEffect( () => {
    const dz = dropRef.current;
    if ( !dz ) return;
    const prevent = e => { e.preventDefault(); dz.classList.add( 'ring-4', 'ring-indigo-500' ); };
    const leave = e => { e.preventDefault(); dz.classList.remove( 'ring-4', 'ring-indigo-500' ); };
    dz.addEventListener( 'drop', e => { e.preventDefault(); dz.classList.remove( 'ring-4', 'ring-indigo-500' ); handleImageFiles( e.dataTransfer.files ); } );
    dz.addEventListener( 'dragover', prevent );
    dz.addEventListener( 'dragleave', leave );
    return () => {
      dz.removeEventListener( 'drop', () => { } ); dz.removeEventListener( 'dragover', prevent ); dz.removeEventListener( 'dragleave', leave );
    };
  }, [] );

  const extract = ( canvas, r ) => {
    const c = document.createElement( 'canvas' );
    c.width = r.width; c.height = r.height;
    c.getContext( '2d' ).drawImage( canvas, r.x, r.y, r.width, r.height, 0, 0, r.width, r.height );
    return c;
  };

  const autoCropBB = canvas => {
    const mat = cv.imread( canvas ), dst = new cv.Mat();
    cv.cvtColor( mat, dst, cv.COLOR_RGBA2GRAY );
    cv.GaussianBlur( dst, dst, new cv.Size( 5, 5 ), 0 );
    cv.Canny( dst, dst, 75, 200 );
    const ctr = new cv.MatVector(), h = new cv.Mat();
    cv.findContours( dst, ctr, h, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE );
    let best = null, mx = 0;
    for ( let i = 0; i < ctr.size(); i++ ) {
      const cnt = ctr.get( i ), area = cv.contourArea( cnt );
      if ( area > mx ) { mx = area; best = cnt; }
    }
    const r = cv.boundingRect( best );
    mat.delete(); dst.delete(); ctr.delete(); h.delete();
    return r;
  };

  const doOCR = async file => {
    log( `OCR: ${ file.name }` );
    const img = await createImageBitmap( file );
    const c = document.createElement( 'canvas' );
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext( '2d' ); ctx.drawImage( img, 0, 0 );
    let nch, ech;
    if ( useAutoCrop && window.cv ) {
      const bb = autoCropBB( c );
      const cc = extract( c, bb );
      nch = extract( cc, { x: 40, y: 40, width: bb.width - 80, height: 100 } );
      ech = extract( cc, { x: 40, y: bb.height - 290, width: bb.width - 80, height: 220 } );
    } else {
      nch = extract( c, cropName ); ech = extract( c, cropEffect );
    }
    const nr = await Tesseract.recognize( nch, 'eng' ), er = await Tesseract.recognize( ech, 'eng' );
    const nm = cleanText( nr.data.text ), ef = cleanText( er.data.text );
    log( `OCR done: ${ file.name }` );
    return { cardName: nm, effectText: ef, base64: c.toDataURL( 'image/jpeg', 0.8 ) };
  };

  const upload = async base64 => {
    try {
      const res = await fetch( '/api/uploadImage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify( { imageBase64: base64 } )
      } );
      const d = await res.json();
      if ( d.status_code !== 200 ) { console.error( 'upload fail', d ); return null; }
      return d.image.url;
    } catch ( e ) { console.error( e ); return null; }
  };

  const dbMatch = async ( nm, ef ) => {
    const res = await fetch( 'https://db.ygoprodeck.com/api/v7/cardinfo.php' ); const d = await res.json();
    const inp = `${ nm } ${ ef }`; let bc = null, bs = 0;
    for ( const cd of d.data ) {
      const s = sim( inp, cd.name + ' ' + cd.desc );
      if ( s > bs ) { bs = s; bc = cd; }
    }
    return bs >= 0.3 ? bc : null;
  };

  const invMatch = card => {
    if ( !card ) return null;
    const code = card.card_sets?.[ 0 ]?.set_code.toLowerCase();
    return inventory.find( inv => sim( inv.name, card.name ) >= 0.5 && inv.number.toLowerCase() === code );
  };

  const processAll = async () => {
    setProcessing( true ); setResults( [] ); setLogs( [] );
    const out = [];
    for ( const f of images ) {
      log( `Processing ${ f.name }` );
      const { cardName, effectText, base64 } = await doOCR( f );
      const mc = await dbMatch( cardName, effectText );
      const url = await upload( base64 );
      const inv = invMatch( mc );
      const prices = mc?.card_prices?.[ 0 ] || {};
      out.push( { file: f.name, image: url, card: mc, inventory: inv, cardName, effectText, prices, matched: !!mc } );
      log( `Done ${ f.name }` );
    }
    setResults( out ); setProcessing( false ); log( `All done` );
  };

  const exportCSV = () => {
    const csv = Papa.unparse( results.map( r => ( {
      Filename: r.file, CardName: r.card?.name || 'N/A', OCR_Text: `${ r.cardName } ${ r.effectText }`,
      SetCode: r.card?.card_sets?.[ 0 ]?.set_code || '', Edition: r.inventory?.edition || '',
      Rarity: r.inventory?.rarity || '', Condition: r.inventory?.condition || '', eBay: r.prices?.ebay_price || '0.00',
      TCG: r.prices?.tcgplayer_price || '0.00', CM: r.prices?.cardmarket_price || '0.00', ImageURL: r.image || ''
    } ) ) );
    const b = new Blob( [ csv ], { type: 'text/csv' } ), a = document.createElement( 'a' );
    a.href = URL.createObjectURL( b ); a.download = 'results.csv'; a.click();
  };

  const filteredResults = results.filter( r => filter === 'all' || ( filter === 'matched' && r.matched ) || ( filter === 'unmatched' && !r.matched ) );
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto text-black">
      <h1 className="text-3xl font-bold text-indigo-700">Yu-Gi-Oh OCR Matcher</h1>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">1. Upload Inventory CSV</h2>
        <input type="file" accept=".csv" onChange={ handleCSVUpload } />
      </div>

      <div
        ref={ dropRef }
        className="bg-white p-6 rounded shadow border-2 border-dashed border-gray-300 text-center cursor-pointer"
        onClick={ () => document.getElementById( "fileInput" ).click() }
      >
        <h2 className="font-semibold text-lg">2. Upload or Drag Card Images</h2>
        <p className="text-sm text-black">JPG, PNG supported — multiple allowed</p>
        <input
          type="file"
          id="fileInput"
          multiple
          accept="image/*"
          className="hidden"
          onChange={ ( e ) => handleImageFiles( e.target.files ) }
        />
      </div>

      { activePreview && (
        <div className="bg-white p-4 rounded shadow mt-4">
          <h3 className="font-semibold mb-2">Preview & Overlay</h3>
          <canvas ref={ overlayRef } className="max-w-full border" />
          <div className="mt-2">
            <label className="inline-flex items-center">
              <input type="checkbox" checked={ useAutoCrop } onChange={ () => setUseAutoCrop( !useAutoCrop ) } className="mr-2" />
              Use OpenCV Auto-Crop
            </label>
          </div>
        </div>
      ) }

      { !useAutoCrop && (
        <div className="bg-white p-4 rounded shadow space-y-3">
          <h3 className="font-semibold">Manual Cropping</h3>

          <p className="text-sm text-black font-semibold mt-2">Card Name Region</p>
          <div className="grid grid-cols-4 gap-2">
            { [ 'x', 'y', 'width', 'height' ].map( ( key ) => (
              <input
                key={ `name-${ key }` }
                type="number"
                className="border p-1 rounded"
                value={ cropName[ key ] }
                onChange={ ( e ) => {
                  const updated = { ...cropName, [ key ]: parseInt( e.target.value ) };
                  setCropName( updated );
                  if ( activePreview ) renderOverlay( activePreview );
                } }
              />
            ) ) }
          </div>

          <p className="text-sm text-black font-semibold mt-4">Effect Text Region</p>
          <div className="grid grid-cols-4 gap-2">
            { [ 'x', 'y', 'width', 'height' ].map( ( key ) => (
              <input
                key={ `eff-${ key }` }
                type="number"
                className="border p-1 rounded"
                value={ cropEffect[ key ] }
                onChange={ ( e ) => {
                  const updated = { ...cropEffect, [ key ]: parseInt( e.target.value ) };
                  setCropEffect( updated );
                  if ( activePreview ) renderOverlay( activePreview );
                } }
              />
            ) ) }
          </div>
        </div>
      ) }

      <button
        onClick={ processAll }
        disabled={ processing || images.length === 0 }
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        { processing ? "Processing..." : "Start Matching" }
      </button>

      { results.length > 0 && (
        <>
          <div className="flex justify-between items-center mt-6">
            <h2 className="text-2xl font-semibold text-white">Results</h2>
            <div className="space-x-2">
              <button onClick={ () => setFilter( "all" ) } className="px-3 py-1 bg-gray-700 text-white rounded">All</button>
              <button onClick={ () => setFilter( "matched" ) } className="px-3 py-1 bg-green-700 text-white rounded">Matched</button>
              <button onClick={ () => setFilter( "unmatched" ) } className="px-3 py-1 bg-red-700 text-white rounded">Unmatched</button>
              <button onClick={ exportCSV } className="px-3 py-1 bg-blue-700 text-white rounded">Export CSV</button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            { filteredResults.map( ( r, i ) => (
              <div key={ i } className={ `p-4 rounded shadow ${ r.matched ? 'bg-green-100' : 'bg-red-100' }` }>
                <div className="flex gap-4">
                  <img src={ r.image } className="h-48 w-auto object-scale-down aspect-1 rounded border" />
                  <div className="flex-1 text-sm">
                    <p className="text-lg text-black"><strong>{ r.card?.name || '❌ No Match' }</strong></p>
                    <p className="text-xs text-black"><b>OCR:</b> { r.cardName }</p>
                    <p className="text-xs text-black"><b>Effect:</b> { r.effectText }</p>
                    { r.inventory ? (
                      <p className="text-green-700 mt-1">
                        ✅ { r.inventory.edition }, { r.inventory.rarity }, { r.inventory.condition }
                      </p>
                    ) : (
                      <p className="text-red-600 mt-1">No inventory match</p>
                    ) }

                    <p className="text-sm mt-1 text-black max-w-prose"><p className="text-sm font-semibold mt-1 text-black">Prices:<br /><span className="text-xs mt-1 text-black">eBay: ${ r.prices?.ebay_price }</span><br /><span className="text-xs mt-1 text-black">TCGPlayer: ${ r.prices?.tcgplayer_price }</span></p> </p>
                  </div>
                </div>
              </div>
            ) ) }
          </div>
        </>
      ) }

      { logs.length > 0 && (
        <div className="mt-8 bg-white p-4 rounded shadow max-h-64 overflow-y-auto">
          <h3 className="font-semibold">Logs</h3>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">{ logs.join( "\n" ) }</pre>
        </div>
      ) }
    </div>
  );
}
