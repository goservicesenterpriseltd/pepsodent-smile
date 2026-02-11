import type { PersonalizedResponse } from '@/types/responses';
import { responseTemplates } from './response-templates';

export function getPersonalizedResponse(
  score: number,
  name: string
): PersonalizedResponse {
  // Determine score range
  let scoreRange: string;
  if (score >= 81) {
    scoreRange = '81-100';
  } else if (score >= 61) {
    scoreRange = '61-80';
  } else if (score >= 41) {
    scoreRange = '41-60';
  } else if (score >= 21) {
    scoreRange = '21-40';
  } else {
    scoreRange = '0-20';
  }

  // Get all templates for this score range (ignore gender)
  const templates = responseTemplates.filter(
    t => t.scoreRange === scoreRange
  );

  if (templates.length === 0) {
    // Ultimate fallback
    return {
      message: `Great job ${name}! Your smile score is ${Math.round(score)}! 😊`,
      score,
      scoreRange,
    };
  }

  // Get all responses from matching templates
  const allResponses = templates.flatMap(t => t.responses);

  // Randomly select one
  const selectedResponse = allResponses[Math.floor(Math.random() * allResponses.length)];

  // Extract first name from full name for interpolation
  const firstName = name.trim().split(/\s+/)[0] || name;

  // Interpolate firstName
  const message = selectedResponse.replace(/{firstName}/g, firstName);

  return {
    message,
    score,
    scoreRange,
  };
}

