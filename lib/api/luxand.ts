import type { LuxandEmotionResponse, SmileScoreResult } from '@/types/luxand-api';

const LUXAND_API_URL = 'https://api.luxand.cloud/photo/emotions';
const LUXAND_API_KEY = process.env.NEXT_PUBLIC_LUXAND_API_KEY || '';

export async function uploadImageToLuxand(imageFile: File): Promise<LuxandEmotionResponse> {
  if (!LUXAND_API_KEY) {
    throw new Error('Luxand API key is not configured. Please add NEXT_PUBLIC_LUXAND_API_KEY to your environment variables.');
  }

  const formData = new FormData();
  formData.append('photo', imageFile);

  try {
    const response = await fetch(LUXAND_API_URL, {
      method: 'POST',
      headers: {
        'token': LUXAND_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Luxand API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      
      // Provide user-friendly error messages based on status
      let userMessage = 'Failed to analyze your smile. Please try again.';
      if (response.status === 401 || response.status === 403) {
        userMessage = 'Authentication failed. Please check API configuration.';
      } else if (response.status === 429) {
        userMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (response.status >= 500) {
        userMessage = 'Server error. Please try again later.';
      } else if (response.status === 400) {
        userMessage = 'Invalid image. Please capture a new photo.';
      }
      
      throw new Error(userMessage);
    }

    const data: LuxandEmotionResponse = await response.json();
    
    // Log response for debugging
    console.log('Luxand API response:', {
      status: data.status,
      facesCount: data.faces?.length || 0,
      faces: data.faces,
    });

    if (data.status === 'error') {
      throw new Error('Luxand API returned an error status');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw with more context
      throw error;
    }
    throw new Error('Network error. Please check your internet connection and try again.');
  }
}

export function calculateSmileScore(response: LuxandEmotionResponse): SmileScoreResult | null {
  // Check if response has faces array
  if (!response.faces) {
    console.warn('API response missing faces array:', response);
    return null;
  }

  if (response.faces.length === 0) {
    console.warn('API response has empty faces array:', response);
    return null;
  }

  // Find face with highest happy score
  const primaryFace = response.faces.reduce((max, face) => 
    face.emotion.happy > max.emotion.happy ? face : max
  );

  // Validate that we have emotion data
  if (!primaryFace.emotion || typeof primaryFace.emotion.happy !== 'number') {
    console.error('Invalid emotion data in primary face:', primaryFace);
    return null;
  }

  return {
    score: primaryFace.emotion.happy, // 0-100
    dominantEmotion: primaryFace.dominant_emotion || 'unknown',
    allEmotions: primaryFace.emotion,
    primaryFaceIndex: response.faces.indexOf(primaryFace),
    confidence: primaryFace.emotion.happy / 100, // Normalize to 0-1
  };
}

