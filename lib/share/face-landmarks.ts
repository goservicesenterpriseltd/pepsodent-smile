export interface FaceLandmarkPoint {
  x: number;
  y: number;
}

/**
 * Generate AI-style face landmarks based on face region
 * Creates a realistic facial recognition overlay pattern
 * This approach is simpler, faster, and doesn't require heavy ML models
 */
export function generateFaceLandmarks(
  faceRegion: { x: number; y: number; w: number; h: number },
  imageWidth: number,
  imageHeight: number
): FaceLandmarkPoint[] {
  const { x, y, w, h } = faceRegion;
  const centerX = x + w / 2;
  const centerY = y + h / 2;

  // Generate AI-style facial recognition overlay points
  // Creates a realistic pattern similar to face detection systems
  const landmarks: FaceLandmarkPoint[] = [];

  // Face outline (oval shape) - more points for smoother curve
  const faceWidth = w;
  const faceHeight = h;
  const numOutlinePoints = 32;
  for (let i = 0; i < numOutlinePoints; i++) {
    const angle = (i / numOutlinePoints) * Math.PI * 2;
    // Slightly elliptical shape
    const radiusX = (faceWidth / 2) * (1 + 0.1 * Math.cos(angle * 2));
    const radiusY = (faceHeight / 2) * (1 + 0.1 * Math.sin(angle * 2));
    landmarks.push({
      x: centerX + radiusX * Math.cos(angle),
      y: centerY + radiusY * Math.sin(angle),
    });
  }

  // Left eyebrow (5 points)
  for (let i = 0; i < 5; i++) {
    const offsetX = -w * 0.2 + (i * w * 0.1);
    landmarks.push({ 
      x: centerX + offsetX, 
      y: centerY - h * 0.25 
    });
  }

  // Right eyebrow (5 points)
  for (let i = 0; i < 5; i++) {
    const offsetX = w * 0.1 + (i * w * 0.1);
    landmarks.push({ 
      x: centerX + offsetX, 
      y: centerY - h * 0.25 
    });
  }

  // Left eye (8 points in circular pattern)
  const leftEyeX = centerX - w * 0.15;
  const leftEyeY = centerY - h * 0.1;
  const eyeRadius = w * 0.08;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    landmarks.push({
      x: leftEyeX + eyeRadius * Math.cos(angle),
      y: leftEyeY + eyeRadius * Math.sin(angle),
    });
  }

  // Right eye (8 points in circular pattern)
  const rightEyeX = centerX + w * 0.15;
  const rightEyeY = centerY - h * 0.1;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    landmarks.push({
      x: rightEyeX + eyeRadius * Math.cos(angle),
      y: rightEyeY + eyeRadius * Math.sin(angle),
    });
  }

  // Nose bridge and tip (6 points)
  landmarks.push({ x: centerX, y: centerY - h * 0.05 }); // Top
  landmarks.push({ x: centerX, y: centerY }); // Middle
  landmarks.push({ x: centerX, y: centerY + h * 0.08 }); // Tip
  landmarks.push({ x: centerX - w * 0.05, y: centerY + h * 0.1 }); // Left nostril
  landmarks.push({ x: centerX + w * 0.05, y: centerY + h * 0.1 }); // Right nostril
  landmarks.push({ x: centerX, y: centerY + h * 0.12 }); // Bottom

  // Mouth (10 points in curved pattern)
  const mouthY = centerY + h * 0.2;
  for (let i = 0; i < 10; i++) {
    const t = i / 9; // 0 to 1
    const mouthWidth = w * 0.3;
    const xPos = centerX - mouthWidth / 2 + (t * mouthWidth);
    // Curved mouth shape
    const yOffset = Math.sin(t * Math.PI) * h * 0.05;
    landmarks.push({
      x: xPos,
      y: mouthY + yOffset,
    });
  }

  // Cheek points (6 points on each side)
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const cheekY = centerY - h * 0.1 + (t * h * 0.3);
    // Left cheek
    landmarks.push({
      x: centerX - w * 0.35,
      y: cheekY,
    });
    // Right cheek
    landmarks.push({
      x: centerX + w * 0.35,
      y: cheekY,
    });
  }

  // Chin points (5 points)
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const chinX = centerX - w * 0.15 + (t * w * 0.3);
    landmarks.push({
      x: chinX,
      y: centerY + h * 0.35,
    });
  }

  return landmarks;
}

