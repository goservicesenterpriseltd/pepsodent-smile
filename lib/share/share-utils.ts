/**
 * Get the base URL for share links
 */
export function getShareBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for SSR
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://pepsodent-smile.vercel.app';
}

/**
 * Generate share URL for an attempt
 */
export function getShareUrl(attemptId: string): string {
  return `${getShareBaseUrl()}/share/${attemptId}`;
}

/**
 * Convert base64 image to Image element
 */
export function base64ToImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
  });
}

/**
 * Share image using Web Share API with fallback
 */
export async function shareImage(
  imageBlob: Blob,
  title: string,
  text: string
): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return false;
  }

  try {
    const file = new File([imageBlob], 'pepsodent-smile-score.png', {
      type: 'image/png',
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return true;
    } else {
      // Fallback: share URL only
      await navigator.share({
        title,
        text,
        url: window.location.href,
      });
      return true;
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // User cancelled share
      return false;
    }
    console.error('Error sharing image:', error);
    return false;
  }
}

/**
 * Download image as PNG
 */
export function downloadImage(blob: Blob, filename: string = 'pepsodent-smile-score.png'): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

