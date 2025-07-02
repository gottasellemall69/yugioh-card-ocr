// utils/imageProcessing.js

/**
 * Crop, equalize, threshold, and moderately upscale a region for OCR.
 */
// utils/imageProcessing.js

/**
 * Crop a region, convert to straight grayscale, and upscale 2× for OCR.
 */
export async function preprocessForOCR( sourceCanvas, region ) {
    const { left, top, width, height } = region;

    // 1. Crop to region
    const canvas = document.createElement( 'canvas' );
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext( '2d' );
    ctx.drawImage( sourceCanvas, left, top, width, height, 0, 0, width, height );

    // 2. Grayscale conversion
    const imgData = ctx.getImageData( 0, 0, width, height );
    for ( let i = 0; i < imgData.data.length; i += 4 ) {
        // simple luminance
        const lum = Math.round(
            0.299 * imgData.data[ i ] +
            0.587 * imgData.data[ i + 1 ] +
            0.114 * imgData.data[ i + 2 ]
        );
        imgData.data[ i ] = lum;
        imgData.data[ i + 1 ] = lum;
        imgData.data[ i + 2 ] = lum;
        // leave alpha = 255
    }
    ctx.putImageData( imgData, 0, 0 );

    // 3. Upscale 2× without smoothing
    const scale = 2;
    const up = document.createElement( 'canvas' );
    up.width = width * scale;
    up.height = height * scale;
    const uctx = up.getContext( '2d' );
    uctx.imageSmoothingEnabled = false;
    uctx.drawImage( canvas, 0, 0, up.width, up.height );

    return up;
}


/**
 * Simple adaptive threshold: for each pixel, compare to mean of neighborhood.
 */
export function applyAdaptiveThreshold( ctx, width, height, blockSize = 15, c = 5 ) {
    const src = ctx.getImageData( 0, 0, width, height );
    const dst = ctx.createImageData( width, height );
    const half = Math.floor( blockSize / 2 );

    // integral image for fast mean
    const integral = new Uint32Array( ( width + 1 ) * ( height + 1 ) );
    for ( let y = 1; y <= height; y++ ) {
        let rowSum = 0;
        for ( let x = 1; x <= width; x++ ) {
            const idx = ( ( y - 1 ) * width + ( x - 1 ) ) * 4;
            const pix = src.data[ idx ]; // R==G==B after equalization
            rowSum += pix;
            integral[ y * ( width + 1 ) + x ] =
                integral[ ( y - 1 ) * ( width + 1 ) + x ] + rowSum;
        }
    }

    // threshold each pixel
    for ( let y = 0; y < height; y++ ) {
        for ( let x = 0; x < width; x++ ) {
            const x1 = Math.max( 0, x - half );
            const y1 = Math.max( 0, y - half );
            const x2 = Math.min( width - 1, x + half );
            const y2 = Math.min( height - 1, y + half );
            const count = ( x2 - x1 + 1 ) * ( y2 - y1 + 1 );

            const sum =
                integral[ ( y2 + 1 ) * ( width + 1 ) + ( x2 + 1 ) ] -
                integral[ ( y1 ) * ( width + 1 ) + ( x2 + 1 ) ] -
                integral[ ( y2 + 1 ) * ( width + 1 ) + ( x1 ) ] +
                integral[ ( y1 ) * ( width + 1 ) + ( x1 ) ];

            const idx = ( y * width + x ) * 4;
            const pix = src.data[ idx ];
            const threshold = sum / count - c;

            const val = pix <= threshold ? 0 : 255;
            dst.data[ idx ] = val;
            dst.data[ idx + 1 ] = val;
            dst.data[ idx + 2 ] = val;
            dst.data[ idx + 3 ] = 255;
        }
    }

    ctx.putImageData( dst, 0, 0 );
}
