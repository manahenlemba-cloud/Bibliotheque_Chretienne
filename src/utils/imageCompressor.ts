/**
 * Client-side image compressor utility for avatars, book covers and site photos.
 * Resizes large photos from smartphones/cameras into crisp, lightweight web images (max 800px, ~70-120KB)
 * to guarantee instantaneous loading, persistent storage in JSON/localStorage, and zero file loss.
 */
export function compressImageToDataUrl(
  fileOrDataUrl: File | string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    const processImage = (src: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG (or PNG if transparent)
        const mime = src.startsWith('data:image/png') && !src.includes('jpeg') ? 'image/png' : 'image/jpeg';
        const compressed = canvas.toDataURL(mime, quality);
        resolve(compressed);
      };
      img.onerror = () => {
        resolve(src);
      };
      img.src = src;
    };

    if (typeof fileOrDataUrl === 'string') {
      if (fileOrDataUrl.startsWith('data:image/')) {
        processImage(fileOrDataUrl);
      } else {
        // Plain URL, return as is
        resolve(fileOrDataUrl);
      }
    } else if (fileOrDataUrl instanceof File) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          processImage(reader.result);
        } else {
          reject(new Error('Erreur de lecture du fichier image'));
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier image'));
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      resolve('');
    }
  });
}
