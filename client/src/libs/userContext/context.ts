import { createContext } from "react";

import { User } from "@libs/api";

export type UserContext = {
  user: User | null;
  login: (
    email: string,
    password: string,
    rememberMe: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
};

export const UserContext = createContext<UserContext | undefined>(undefined);
