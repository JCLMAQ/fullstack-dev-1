import { IUserLogged } from '@fe/auth';

export type AppSlice = {
  readonly user: IUserLogged | undefined;
  readonly authToken: string | undefined;
  // readonly selectedLanguage: string;
  // readonly possibleLanguages: string[];
};

export const initialAppSlice: AppSlice = {
  user: undefined,
  authToken: undefined,
  // selectedLanguage: '',
  // possibleLanguages: []
};
