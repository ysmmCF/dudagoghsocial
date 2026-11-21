/**
 * Client-side image compression utility.
 * Downscales photos taken on mobile devices to max 1920px width/height and compresses to WebP or JPEG.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<{ file: File; dataUrl: string }> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect-ratio scaling
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Não foi possível processar a imagem no navegador."));
        }

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to Blob & File
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Erro ao comprimir imagem."));
            }

            const compressedFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const compressedFile = new File([blob], compressedFileName, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            const dataUrl = canvas.toDataURL("image/webp", quality);

            resolve({ file: compressedFile, dataUrl });
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => reject(new Error("Erro ao carregar a imagem selecionada."));
    };

    reader.onerror = () => reject(new Error("Falha ao ler o arquivo do dispositivo."));
  });
}
