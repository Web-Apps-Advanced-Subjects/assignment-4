import { createContext } from "react";

import { User } from "@libs/api";

export type EmailLoginParams = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type GoogleLoginParams = {
  credential: string;
  rememberMe: boolean;
};

export type UserContext = {
  user: User | null;
  login: (params: EmailLoginParams | GoogleLoginParams) => Promise<void>;
  logout: () => Promise<void>;
};

export const UserContext = createContext<UserContext | undefined>(undefined);
