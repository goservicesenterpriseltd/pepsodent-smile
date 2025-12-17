export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';

export interface UserData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  gender: Gender;
}

export interface UserStoreState {
  user: UserData | null;
  isComplete: boolean;
}

