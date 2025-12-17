import type { PersonalizedResponse } from '@/types/responses';
import type { Gender } from '@/types/user';
import { responseTemplates } from './response-templates';

export function getPersonalizedResponse(
  score: number,
  firstName: string,
  gender: Gender
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

  // Find matching templates
  const matchingTemplates = responseTemplates.filter(
    t => t.scoreRange === scoreRange && t.gender === gender
  );

  // Fallback to 'other' if no match
  const templates = matchingTemplates.length > 0
    ? matchingTemplates
    : responseTemplates.filter(t => t.scoreRange === scoreRange && t.gender === 'other');

  if (templates.length === 0) {
    // Ultimate fallback
    return {
      message: `Great job ${firstName}! Your smile score is ${Math.round(score)}! 😊`,
      score,
      scoreRange,
    };
  }

  // Get all responses from matching templates
  const allResponses = templates.flatMap(t => t.responses);

  // Randomly select one
  const selectedResponse = allResponses[Math.floor(Math.random() * allResponses.length)];

  // Interpolate firstName
  const message = selectedResponse.replace(/{firstName}/g, firstName);

  return {
    message,
    score,
    scoreRange,
  };
}

