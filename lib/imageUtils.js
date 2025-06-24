// Upload image to FreeImage Host API
export async function uploadImageToFreeImageHost(file, apiKey, filename) {
  if (!apiKey) {
    throw new Error('FreeImage API key is required');
  }

  const formData = new FormData();
  formData.append('key', apiKey);
  formData.append('action', 'upload');
  formData.append('format', 'json');
  formData.append('source', file, filename);

  const response = await fetch('https://freeimage.host/api/1/upload', {
    method: 'POST',
    body: formData,
  });

  const json = await response.json();

  if (!response.ok || json.status_code !== 200) {
    console.error(json);
    throw new Error(`FreeImage upload failed: ${json?.image?.error?.message || json?.error?.message || 'Unknown error'}`);
  }

  if (!json.image || !json.image.url) {
    throw new Error('FreeImage upload response missing image URL');
  }

  return json.image.url;
}

// Create canvas from image file and resize to 800px width
export function createCanvasFromImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Resize to 800px width while maintaining aspect ratio
      const targetWidth = 800;
      const scale = targetWidth / img.width;
      
      canvas.width = targetWidth;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas);
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = URL.createObjectURL(file);
  });
}

// Convert canvas to blob for uploading
export function canvasToBlob(canvas, quality = 0.8) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });
}