// Upload image to FreeImage Host API


// Create canvas from image file and resize to 800px width

export function createCanvasFromImage( file ) {
  return new Promise( ( resolve, reject ) => {
    const img = new Image();
    const canvas = document.createElement( 'canvas' );
    const ctx = canvas.getContext( '2d' );

    img.onload = () => {
      // Resize to 800px width while maintaining aspect ratio
      const targetWidth = 800;
      const scale = targetWidth / img.width;

      canvas.width = targetWidth;
      canvas.height = img.height * scale;

      ctx.drawImage( img, 0, 0, canvas.width, canvas.height );
      resolve( canvas );
    };

    img.onerror = () => {
      reject( new Error( `Failed to load image: ${ file.name }` ) );
    };

    img.src = URL.createObjectURL( file );
  } );
}

// Convert canvas to blob for uploading
export function canvasToBlob( canvas, quality = 0.8 ) {
  return new Promise( ( resolve ) => {
    canvas.toBlob( resolve, 'image/jpeg', quality );
  } );
}