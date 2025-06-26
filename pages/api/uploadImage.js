export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler( req, res ) {
    if ( req.method !== 'POST' ) {
        return res.status( 405 ).json( { error: 'Method not allowed' } );
    }

    const { imageBase64 } = req.body;
    if ( !imageBase64?.startsWith( 'data:image/' ) ) {
        return res.status( 400 ).json( { error: 'Invalid image data' } );
    }

    const formData = new URLSearchParams();
    formData.append( "key", "6d207e02198a847aa98d0a2a901485a5" );
    formData.append( "action", "upload" );
    formData.append( "source", imageBase64.split( ',' )[ 1 ] );
    formData.append( "format", "json" );

    try {
        const freeImgRes = await fetch( "https://freeimage.host/api/1/upload", {
            method: "POST",
            body: formData
        } );
        const data = await freeImgRes.json();
        if ( data?.status_code !== 200 ) {
            return res.status( 500 ).json( { error: 'Upload failed', details: data } );
        }
        res.status( 200 ).json( data );
    } catch ( err ) {
        res.status( 500 ).json( { error: 'Upload error', details: err.message } );
    }
}
