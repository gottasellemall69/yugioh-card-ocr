// utils/imageProcessing.js

// Create canvas element
export const createCanvas = ( width, height ) => {
    const canvas = document.createElement( 'canvas' );
    canvas.width = width;
    canvas.height = height;
    return canvas;
};

// Load image file to canvas
export const loadImageToCanvas = ( file, targetWidth = 800 ) => {
    return new Promise( ( resolve ) => {
        const img = new Image();
        img.onload = () => {
            const aspectRatio = img.height / img.width;
            const targetHeight = targetWidth * aspectRatio;

            const canvas = createCanvas( targetWidth, targetHeight );
            const ctx = canvas.getContext( '2d' );

            // Enable image smoothing for better quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.drawImage( img, 0, 0, targetWidth, targetHeight );
            resolve( { canvas, ctx, width: targetWidth, height: targetHeight } );
        };
        img.src = URL.createObjectURL( file );
    } );
};

// Extract region from source canvas
export const extractRegion = ( sourceCanvas, region ) => {
    const canvas = createCanvas( region.width, region.height );
    const ctx = canvas.getContext( '2d' );

    ctx.drawImage(
        sourceCanvas,
        region.left, region.top, region.width, region.height,
        0, 0, region.width, region.height
    );

    return { canvas, ctx };
};

// Apply grayscale filter
export const applyGrayscale = ( ctx, width, height ) => {
    const imageData = ctx.getImageData( 0, 0, width, height );
    const data = imageData.data;

    for ( let i = 0; i < data.length; i += 4 ) {
        const gray = Math.round( 0.299 * data[ i ] + 0.587 * data[ i + 1 ] + 0.114 * data[ i + 2 ] );
        data[ i ] = gray;     // Red
        data[ i + 1 ] = gray; // Green
        data[ i + 2 ] = gray; // Blue
    }

    ctx.putImageData( imageData, 0, 0 );
};

// Apply contrast enhancement
export const applyContrast = ( ctx, width, height, contrast = 1.5 ) => {
    const imageData = ctx.getImageData( 0, 0, width, height );
    const data = imageData.data;
    const factor = ( 259 * ( contrast * 100 + 255 ) ) / ( 255 * ( 259 - contrast * 100 ) );

    for ( let i = 0; i < data.length; i += 4 ) {
        data[ i ] = Math.max( 0, Math.min( 255, factor * ( data[ i ] - 128 ) + 128 ) );         // Red
        data[ i + 1 ] = Math.max( 0, Math.min( 255, factor * ( data[ i + 1 ] - 128 ) + 128 ) ); // Green
        data[ i + 2 ] = Math.max( 0, Math.min( 255, factor * ( data[ i + 2 ] - 128 ) + 128 ) ); // Blue
    }

    ctx.putImageData( imageData, 0, 0 );
};

// Apply threshold (binary)
export const applyThreshold = ( ctx, width, height, threshold = 128 ) => {
    const imageData = ctx.getImageData( 0, 0, width, height );
    const data = imageData.data;

    for ( let i = 0; i < data.length; i += 4 ) {
        const gray = Math.round( 0.299 * data[ i ] + 0.587 * data[ i + 1 ] + 0.114 * data[ i + 2 ] );
        const value = gray > threshold ? 255 : 0;
        data[ i ] = value;     // Red
        data[ i + 1 ] = value; // Green
        data[ i + 2 ] = value; // Blue
    }

    ctx.putImageData( imageData, 0, 0 );
};

// Apply Gaussian blur
export const applyGaussianBlur = ( ctx, width, height, radius = 1 ) => {
    ctx.filter = `blur(${ radius }px)`;
    const imageData = ctx.getImageData( 0, 0, width, height );
    ctx.filter = 'none';
    ctx.putImageData( imageData, 0, 0 );
};

// Apply unsharp mask for sharpening
export const applyUnsharpMask = ( ctx, width, height, amount = 1.5, radius = 1, threshold = 0 ) => {
    const originalImageData = ctx.getImageData( 0, 0, width, height );

    // Create blurred version
    applyGaussianBlur( ctx, width, height, radius );
    const blurredImageData = ctx.getImageData( 0, 0, width, height );

    // Restore original and apply unsharp mask
    ctx.putImageData( originalImageData, 0, 0 );
    const imageData = ctx.getImageData( 0, 0, width, height );
    const data = imageData.data;
    const blurredData = blurredImageData.data;

    for ( let i = 0; i < data.length; i += 4 ) {
        const diff = data[ i ] - blurredData[ i ];
        if ( Math.abs( diff ) > threshold ) {
            data[ i ] = Math.max( 0, Math.min( 255, data[ i ] + amount * diff ) );
            data[ i + 1 ] = Math.max( 0, Math.min( 255, data[ i + 1 ] + amount * diff ) );
            data[ i + 2 ] = Math.max( 0, Math.min( 255, data[ i + 2 ] + amount * diff ) );
        }
    }

    ctx.putImageData( imageData, 0, 0 );
};

// Apply morphological operations (erosion, dilation, closing, opening)
export const applyMorphology = ( ctx, width, height, operation = 'close', kernelSize = 2 ) => {
    const imageData = ctx.getImageData( 0, 0, width, height );
    const data = imageData.data;
    const newData = new Uint8ClampedArray( data );

    for ( let y = kernelSize; y < height - kernelSize; y++ ) {
        for ( let x = kernelSize; x < width - kernelSize; x++ ) {
            const idx = ( y * width + x ) * 4;

            let minVal = 255, maxVal = 0;
            for ( let ky = -kernelSize; ky <= kernelSize; ky++ ) {
                for ( let kx = -kernelSize; kx <= kernelSize; kx++ ) {
                    const kidx = ( ( y + ky ) * width + ( x + kx ) ) * 4;
                    const val = data[ kidx ];
                    minVal = Math.min( minVal, val );
                    maxVal = Math.max( maxVal, val );
                }
            }

            const result = operation === 'erode' ? minVal :
                operation === 'dilate' ? maxVal :
                    operation === 'close' ? minVal : maxVal; // close = dilate then erode

            newData[ idx ] = result;
            newData[ idx + 1 ] = result;
            newData[ idx + 2 ] = result;
        }
    }

    const newImageData = new ImageData( newData, width, height );
    ctx.putImageData( newImageData, 0, 0 );
};

// Calculate average brightness of image
export const getAverageBrightness = ( ctx, width, height ) => {
    const imageData = ctx.getImageData( 0, 0, width, height );
    const data = imageData.data;
    let totalBrightness = 0;
    let pixelCount = 0;

    for ( let i = 0; i < data.length; i += 4 ) {
        const brightness = Math.round( 0.299 * data[ i ] + 0.587 * data[ i + 1 ] + 0.114 * data[ i + 2 ] );
        totalBrightness += brightness;
        pixelCount++;
    }

    return totalBrightness / pixelCount;
};

// Convert canvas to blob
export const canvasToBlob = ( canvas ) => {
    return new Promise( resolve => {
        canvas.toBlob( resolve, 'image/png' );
    } );
};

// Preprocess card name region with optimized settings for title text
export const preprocessCardNameRegion = async ( sourceCanvas, region ) => {
    const { canvas, ctx } = extractRegion( sourceCanvas, region );
    const { width, height } = canvas;

    // Step 1: Enhance contrast
    applyContrast( ctx, width, height, 1.8 );

    // Step 2: Apply unsharp mask for sharpening
    applyUnsharpMask( ctx, width, height, 2.0, 1 );


    // Step 4: Apply adaptive threshold
    const avgBrightness = getAverageBrightness( ctx, width, height );
    const dynamicThreshold = Math.max( 100, Math.min( 180, avgBrightness + 20 ) );
    applyThreshold( ctx, width, height, dynamicThreshold );

    // Step 5: Clean up with morphology
    applyMorphology( ctx, width, height, 'close', 1 );

    return canvas;
};

// Preprocess effect text region with optimized settings for body text
export const preprocessEffectTextRegion = async ( sourceCanvas, region ) => {
    const { canvas, ctx } = extractRegion( sourceCanvas, region );
    const { width, height } = canvas;


    // Step 2: Enhance contrast more aggressively for text
    applyContrast( ctx, width, height, 2.2 );

    // Step 3: Apply slight blur to reduce noise
    applyGaussianBlur( ctx, width, height, 0.5 );

    // Step 4: Apply threshold with different value for text
    const avgBrightness = getAverageBrightness( ctx, width, height );
    const dynamicThreshold = Math.max( 90, Math.min( 160, avgBrightness + 10 ) );
    applyThreshold( ctx, width, height, dynamicThreshold );

    // Step 5: Morphological operations to clean up text
    applyMorphology( ctx, width, height, 'close', 1 );

    // Step 6: Final sharpening
    applyUnsharpMask( ctx, width, height, 1.5, 0.5 );

    return canvas;
};

// Perform OCR with multiple configuration attempts
export const performOCRWithMultipleAttempts = async ( canvas, regionType, ocrWorker ) => {
    const configs = [
        {
            tessedit_pageseg_mode: regionType === 'cardName' ? 4 : 6, // SINGLE_TEXTLINE : SINGLE_BLOCK
            tessedit_char_whitelist: regionType === 'cardName' ?
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -.,\'' :
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -.,\'()[]{}:;!?/+*='
        },
        {
            tessedit_pageseg_mode: regionType === 'cardName' ? 4 : 6, // SINGLE_WORD : AUTO
            tessedit_char_whitelist: regionType === 'cardName' ?
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -.,\'' :
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -.,\'()[]{}:;!?/+*='
        },
        {
            tessedit_pageseg_mode: 13, // RAW_LINE
            tessedit_char_whitelist: regionType === 'cardName' ?
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -.,\'' :
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -.,\'()[]{}:;!?/+*='
        }
    ];

    let bestResult = { text: '', confidence: 0 };

    for ( const config of configs ) {
        try {
            await ocrWorker.setParameters( config );
            const result = await ocrWorker.recognize( canvas );

            if ( result.data.confidence > bestResult.confidence ) {
                bestResult = {
                    text: result.data.text,
                    confidence: result.data.confidence
                };
            }
        } catch ( error ) {
            console.warn( 'OCR attempt failed:', error );
        }
    }

    return bestResult.text || '';
};

// Clean OCR text output
export const cleanOCRText = ( text ) => {
    return text.replace( /[^\w\s\-,'']/g, '' ).replace( /\s+/g, ' ' ).trim();
};

// Fetch card prices from YGOPRODeck API
export const fetchCardPrices = async ( cardName ) => {
    try {
        const response = await fetch( `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${ encodeURIComponent( cardName ) }` );
        const json = await response.json();
        const priceData = json?.data?.[ 0 ]?.card_prices?.[ 0 ];

        return {
            ebay: priceData?.ebay_price || '0.00',
            tcgplayer: priceData?.tcgplayer_price || '0.00',
            cardmarket: priceData?.cardmarket_price || '0.00'
        };
    } catch ( error ) {
        console.warn( `Price fetch failed for "${ cardName }"` );
        return { ebay: '0.00', tcgplayer: '0.00', cardmarket: '0.00' };
    }
};

// Apply edge detection filter
export const applyEdgeDetection = ( ctx, width, height ) => {
    const imageData = ctx.getImageData( 0, 0, width, height );
    const data = imageData.data;
    const newData = new Uint8ClampedArray( data );

    // Sobel edge detection kernel
    const sobelX = [ [ -1, 0, 1 ], [ -2, 0, 2 ], [ -1, 0, 1 ] ];
    const sobelY = [ [ -1, -2, -1 ], [ 0, 0, 0 ], [ 1, 2, 1 ] ];

    for ( let y = 1; y < height - 1; y++ ) {
        for ( let x = 1; x < width - 1; x++ ) {
            let gx = 0, gy = 0;

            for ( let ky = -1; ky <= 1; ky++ ) {
                for ( let kx = -1; kx <= 1; kx++ ) {
                    const idx = ( ( y + ky ) * width + ( x + kx ) ) * 4;
                    const gray = Math.round( 0.299 * data[ idx ] + 0.587 * data[ idx + 1 ] + 0.114 * data[ idx + 2 ] );

                    gx += gray * sobelX[ ky + 1 ][ kx + 1 ];
                    gy += gray * sobelY[ ky + 1 ][ kx + 1 ];
                }
            }

            const magnitude = Math.sqrt( gx * gx + gy * gy );
            const idx = ( y * width + x ) * 4;
            const value = Math.min( 255, magnitude );

            newData[ idx ] = value;
            newData[ idx + 1 ] = value;
            newData[ idx + 2 ] = value;
        }
    }

    const newImageData = new ImageData( newData, width, height );
    ctx.putImageData( newImageData, 0, 0 );
};

// Apply noise reduction filter
export const applyNoiseReduction = ( ctx, width, height, kernelSize = 3 ) => {
    const imageData = ctx.getImageData( 0, 0, width, height );
    const data = imageData.data;
    const newData = new Uint8ClampedArray( data );
    const offset = Math.floor( kernelSize / 2 );

    for ( let y = offset; y < height - offset; y++ ) {
        for ( let x = offset; x < width - offset; x++ ) {
            let r = 0, g = 0, b = 0, count = 0;

            for ( let ky = -offset; ky <= offset; ky++ ) {
                for ( let kx = -offset; kx <= offset; kx++ ) {
                    const idx = ( ( y + ky ) * width + ( x + kx ) ) * 4;
                    r += data[ idx ];
                    g += data[ idx + 1 ];
                    b += data[ idx + 2 ];
                    count++;
                }
            }

            const idx = ( y * width + x ) * 4;
            newData[ idx ] = r / count;
            newData[ idx + 1 ] = g / count;
            newData[ idx + 2 ] = b / count;
        }
    }

    const newImageData = new ImageData( newData, width, height );
    ctx.putImageData( newImageData, 0, 0 );
};

// Apply histogram equalization
export const applyHistogramEqualization = ( ctx, width, height ) => {
    const imageData = ctx.getImageData( 0, 0, width, height );
    const data = imageData.data;

    // Calculate histogram
    const histogram = new Array( 256 ).fill( 0 );
    for ( let i = 0; i < data.length; i += 4 ) {
        const gray = Math.round( 0.299 * data[ i ] + 0.587 * data[ i + 1 ] + 0.114 * data[ i + 2 ] );
        histogram[ gray ]++;
    }

    // Calculate cumulative distribution
    const cdf = new Array( 256 );
    cdf[ 0 ] = histogram[ 0 ];
    for ( let i = 1; i < 256; i++ ) {
        cdf[ i ] = cdf[ i - 1 ] + histogram[ i ];
    }

    // Normalize CDF
    const totalPixels = width * height;
    const cdfMin = cdf.find( val => val > 0 );

    for ( let i = 0; i < data.length; i += 4 ) {
        const gray = Math.round( 0.299 * data[ i ] + 0.587 * data[ i + 1 ] + 0.114 * data[ i + 2 ] );
        const newValue = Math.round( ( ( cdf[ gray ] - cdfMin ) / ( totalPixels - cdfMin ) ) * 255 );

        data[ i ] = newValue;
        data[ i + 1 ] = newValue;
        data[ i + 2 ] = newValue;
    }

    ctx.putImageData( imageData, 0, 0 );
};

// Apply adaptive threshold based on local statistics
export const applyAdaptiveThreshold = ( ctx, width, height, blockSize = 11, C = 2 ) => {
    const imageData = ctx.getImageData( 0, 0, width, height );
    const data = imageData.data;
    const newData = new Uint8ClampedArray( data );
    const offset = Math.floor( blockSize / 2 );

    for ( let y = offset; y < height - offset; y++ ) {
        for ( let x = offset; x < width - offset; x++ ) {
            let sum = 0, count = 0;

            // Calculate local mean
            for ( let ky = -offset; ky <= offset; ky++ ) {
                for ( let kx = -offset; kx <= offset; kx++ ) {
                    const idx = ( ( y + ky ) * width + ( x + kx ) ) * 4;
                    const gray = Math.round( 0.299 * data[ idx ] + 0.587 * data[ idx + 1 ] + 0.114 * data[ idx + 2 ] );
                    sum += gray;
                    count++;
                }
            }

            const localMean = sum / count;
            const idx = ( y * width + x ) * 4;
            const currentGray = Math.round( 0.299 * data[ idx ] + 0.587 * data[ idx + 1 ] + 0.114 * data[ idx + 2 ] );
            const threshold = localMean - C;
            const value = currentGray > threshold ? 255 : 0;

            newData[ idx ] = value;
            newData[ idx + 1 ] = value;
            newData[ idx + 2 ] = value;
        }
    }

    const newImageData = new ImageData( newData, width, height );
    ctx.putImageData( newImageData, 0, 0 );
};