import { useState, ReactNode, useEffect } from "react";

import { User } from "@libs/api";
import { UserContext } from "./context";

const getInitialState = (): User | null => {
  const user = sessionStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState(getInitialState);

  useEffect(() => {
    sessionStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
