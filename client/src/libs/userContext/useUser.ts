import { useContext } from "react";

import { UserContext } from "./context";

const useUser = () => {
  const user = useContext(UserContext);

  if (user === undefined) {
    throw new Error("useUser must be inside a UserProvider with a value");
  }

  return user;
};

export default useUser;
