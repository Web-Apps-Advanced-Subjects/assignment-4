import { createContext, Dispatch, SetStateAction } from "react";

import { User } from "@libs/api";

export type UserContext = {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
};

export const UserContext = createContext<UserContext | undefined>(undefined);
