import * as htmlToImage from 'html-to-image';

/**
 * Get the base URL for share links
 * In dev mode, uses IP address from NEXT_PUBLIC_DEV_URL or detects from window.location
 * In production, uses the remote URL from NEXT_PUBLIC_BASE_URL
 */
export function getShareBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development' || hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isDev) {
      // In dev, check for explicit dev URL first (user can set this with their IP)
      const devUrl = process.env.NEXT_PUBLIC_DEV_URL;
      if (devUrl) {
        return devUrl;
      }
      
      // If hostname is already an IP address, use it
      if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
      }
      
      // Otherwise, use localhost (user should set NEXT_PUBLIC_DEV_URL with their IP for sharing)
      return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    } else {
      // Production: use remote URL
      return process.env.NEXT_PUBLIC_BASE_URL || 'https://www.pepsometer.fun';
  }
  }
  
  // Fallback for SSR
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    return process.env.NEXT_PUBLIC_DEV_URL || 'http://localhost:3000';
  }
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://www.pepsometer.fun';
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
  text: string,
  url?: string
): Promise<boolean> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return false;
  }

  const shareUrl =
    url ||
    (typeof window !== 'undefined'
      ? window.location.href
      : undefined);

  try {
    const file = new File([imageBlob], 'pepsodent-smile-score.png', {
      type: 'image/png',
    });

    // First, try sharing with the image file attached.
    try {
      await (navigator as Navigator & { share(data: ShareData & { files?: File[] }): Promise<void> }).share({
        title,
        text,
        files: [file],
      });
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        // User cancelled share – don't treat as failure, just stop.
        return false;
      }

      // If file sharing isn't supported, fall back to URL-only share (if we have a URL).
      if (shareUrl && typeof navigator.share === 'function') {
        await (navigator as Navigator).share({
          title,
          text,
          url: shareUrl,
        });
        return true;
      }

      // If there is no URL to fall back to, rethrow so outer catch logs it.
      throw error;
    }
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Error sharing image:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Very small user agent helper to detect iOS (including iPadOS in desktop mode).
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || '';
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const iPadOSDesktop =
    !iOS && navigator.platform === 'MacIntel' && (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints! > 1;
  return iOS || iPadOSDesktop;
}

/**
 * Detect if the current device is a mobile device (iOS, Android, or other mobile browsers).
 */
export function isMobile(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || '';
  // Check for mobile devices
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
  return mobileRegex.test(ua) || (window.innerWidth <= 768 && window.innerHeight <= 1024);
}

/**
 * Download image as PNG.
 *
 * Note: iOS Safari has limited support for programmatic downloads with the `download` attribute.
 * For iOS, we open the image in a new tab so the user can long‑press and save it.
 */
export function downloadImage(blob: Blob, filename: string = 'pepsodent-smile-score.png'): void {
  const url = URL.createObjectURL(blob);

  if (isIOS()) {
    // Open in a new tab; user can long‑press to save.
    window.open(url, '_blank');
    // Revoke after a short delay to give the new tab time to load.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Give the browser a tick to start the download (Safari can drop it if revoked immediately)
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Ensure explicit RGB color values for html2canvas compatibility.
 * html2canvas has issues with oklab/oklch colors, so we set explicit RGB values from computed styles.
 */
const prepareElementForCanvas = (element: HTMLElement) => {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_ELEMENT,
    null
  );

  const elements: HTMLElement[] = [element];
  let node: Node | null = walker.nextNode();
  while (node) {
    if (node instanceof HTMLElement) {
      elements.push(node);
    }
    node = walker.nextNode();
  }

  const originalStyles: Map<HTMLElement, { [key: string]: string }> = new Map();

  elements.forEach((el) => {
    const computedStyle = window.getComputedStyle(el);
    const styleToRestore: { [key: string]: string } = {};

    // Set explicit RGB values for color properties to help html2canvas
    const colorProperties = [
      'color',
      'backgroundColor',
      'borderColor',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
    ];

    colorProperties.forEach((prop) => {
      const computedValue = computedStyle.getPropertyValue(prop);
      // Only set if we have a valid color value (not transparent/initial)
      if (computedValue && computedValue !== 'transparent' && computedValue !== 'rgba(0, 0, 0, 0)') {
        const currentStyle = el.style.getPropertyValue(prop);
        styleToRestore[prop] = currentStyle;
        // Set the computed RGB value explicitly
        el.style.setProperty(prop, computedValue, 'important');
      }
    });

    if (Object.keys(styleToRestore).length > 0) {
      originalStyles.set(el, styleToRestore);
    }
  });

  return () => {
    // Restore original styles
    originalStyles.forEach((styles, el) => {
      Object.entries(styles).forEach(([prop, value]) => {
        if (value) {
          el.style.setProperty(prop, value);
        } else {
          el.style.removeProperty(prop);
        }
      });
    });
  };
};

/**
 * Inline all <img> elements under the target element as data URLs so that
 * html-to-image can reliably include them in the rendered output (especially on iOS).
 * Returns a restore function to put the original src values back.
 */
async function inlineImagesForCapture(root: HTMLElement): Promise<() => void> {
  const images = Array.from(root.querySelectorAll('img'));
  const originalSrcMap = new Map<HTMLImageElement, string>();

  await Promise.all(
    images.map(async (img) => {
      const src = img.currentSrc || img.src;
      if (!src || src.startsWith('data:')) {
        return;
      }

      try {
        const response = await fetch(src);
        if (!response.ok) return;
        const blob = await response.blob();

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Failed to convert image blob to data URL'));
            }
          };
          reader.onerror = () => reject(reader.error ?? new Error('Failed to read image blob'));
          reader.readAsDataURL(blob);
        });

        originalSrcMap.set(img, img.src);
        img.src = dataUrl;
      } catch {
        // If inlining fails for a particular image, just leave it as-is.
      }
    })
  );

  return () => {
    originalSrcMap.forEach((src, img) => {
      img.src = src;
    });
  };
}

/**
 * Capture a DOM element as a high-quality PNG Blob using html-to-image.
 * Ensures all images are loaded and colors are compatible before rendering.
 */
export async function captureElementToPngBlob(targetElement: HTMLElement): Promise<Blob | null> {
  let restoreStyles: (() => void) | null = null;
  let restoreImages: (() => void) | null = null;

  try {
    // On iOS, inline all images as data URLs for more reliable capture.
    if (isIOS()) {
      restoreImages = await inlineImagesForCapture(targetElement);
    }

    // Wait for all images (possibly inlined) to load.
    const images = targetElement.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }
          })
      )
    );

    // Small delay to ensure rendering is complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Ensure explicit RGB color values for compatibility
    restoreStyles = prepareElementForCanvas(targetElement);

    // Prefer a Blob directly if available (modern browsers)
    if ('toBlob' in htmlToImage && typeof (htmlToImage as typeof htmlToImage & { toBlob?: (node: HTMLElement, options?: Parameters<typeof htmlToImage.toPng>[1]) => Promise<Blob | null> }).toBlob === 'function') {
      const extended = htmlToImage as typeof htmlToImage & {
        toBlob?: (node: HTMLElement, options?: Parameters<typeof htmlToImage.toPng>[1]) => Promise<Blob | null>;
      };
      const blob = await extended.toBlob?.(targetElement, {
        pixelRatio: 2,
        cacheBust: true,
      });
      return blob as Blob | null;
    }

    // Fallback: use data URL then convert to Blob
    const dataUrl = await htmlToImage.toPng(targetElement, {
      pixelRatio: 2,
      cacheBust: true,
    });

    const res = await fetch(dataUrl);
    return await res.blob();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.error('Error capturing element to PNG (html-to-image):', errorMessage);
    return null;
  } finally {
    // Restore original styles and image sources
    if (restoreStyles) {
      restoreStyles();
    }
    if (restoreImages) {
      restoreImages();
    }
  }
}


