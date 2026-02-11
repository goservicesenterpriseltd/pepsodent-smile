import type { SmileAttempt } from '@/types/leaderboard';
import type { UserData } from '@/types/user';

type Identity = Partial<Pick<UserData, 'phone'>> | SmileAttempt;

const normalizeEmail = (email?: string) => {
  const trimmed = email?.trim().toLowerCase();
  return trimmed ? `email:${trimmed}` : null;
};

const normalizePhone = (phone?: string) => {
  if (!phone) return null;
  const digits = phone.replace(/\D+/g, '');
  return digits ? `phone:${digits}` : null;
};

const getIdentityTokens = (identity: Identity): string[] => {
  const tokens: string[] = [];
  const emailToken = normalizeEmail(identity.email);
  const phoneToken = normalizePhone(identity.phone);
  if (emailToken) tokens.push(emailToken);
  if (phoneToken) tokens.push(phoneToken);
  return tokens;
};

const attemptsShareIdentity = (attempt: SmileAttempt, tokens: Set<string>) => {
  const attemptTokens = getIdentityTokens(attempt);
  return attemptTokens.some(token => tokens.has(token));
};

export const groupAttemptsByIdentity = (attempts: SmileAttempt[]) => {
  const parent = attempts.map((_, index) => index);
  const find = (index: number): number => {
    if (parent[index] !== index) {
      parent[index] = find(parent[index]);
    }
    return parent[index];
  };
  const union = (a: number, b: number) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) {
      parent[rootB] = rootA;
    }
  };

  const tokenToIndex = new Map<string, number>();
  attempts.forEach((attempt, index) => {
    const tokens = getIdentityTokens(attempt);
    tokens.forEach(token => {
      const existingIndex = tokenToIndex.get(token);
      if (existingIndex !== undefined) {
        union(index, existingIndex);
      } else {
        tokenToIndex.set(token, index);
      }
    });
  });

  const groups = new Map<string, SmileAttempt[]>();
  attempts.forEach((attempt, index) => {
    const root = find(index);
    const key = String(root);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(attempt);
  });

  return groups;
};

export const getAttemptsForIdentity = (attempts: SmileAttempt[], identity: Identity) => {
  const tokens = new Set(getIdentityTokens(identity));
  if (tokens.size === 0) return [];

  const groups = groupAttemptsByIdentity(attempts);
  for (const group of groups.values()) {
    if (group.some(attempt => attemptsShareIdentity(attempt, tokens))) {
      return group;
    }
  }

  return [];
};

