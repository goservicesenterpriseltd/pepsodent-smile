export interface UserData {
  name: string;
  phone: string;
}

export interface UserStoreState {
  user: UserData | null;
  isComplete: boolean;
}

