import html2canvas from 'html2canvas';

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
 * Capture a DOM element as a high-quality PNG Blob using html2canvas.
 * Ensures all images are loaded and colors are compatible before rendering.
 */
export async function captureElementToPngBlob(targetElement: HTMLElement): Promise<Blob | null> {
  // Wait for all images to load
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

  let restoreStyles: (() => void) | null = null;

  try {
    // Ensure explicit RGB color values for html2canvas compatibility
    restoreStyles = prepareElementForCanvas(targetElement);

    const canvas = await html2canvas(targetElement, {
      backgroundColor: null,
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 15000,
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (result) => {
          resolve(result);
        },
        'image/png'
      );
    });

    return blob;
  } catch (error) {
    // Suppress oklab parsing errors - they're non-critical
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('oklab') && !errorMessage.includes('oklch')) {
      // eslint-disable-next-line no-console
      console.error('Error capturing element to PNG:', error);
    }
    return null;
  } finally {
    // Restore original styles
    if (restoreStyles) {
      restoreStyles();
    }
  }
}


