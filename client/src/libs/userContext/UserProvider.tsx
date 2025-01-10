import { useState, ReactNode, useEffect, useMemo } from "react";

import {
  User,
  refreshToken as refreshTokenApi,
  getUserDetails,
  login as loginApi,
  UserCredentials,
} from "@libs/api";
import { UserContext } from "./context";
import Cookies from "js-cookie";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useInterval } from "usehooks-ts";

// const getInitialState = (): User | null => {
//   const user = sessionStorage.getItem("user");
//   return user ? JSON.parse(user) : null;
// };

const minutesToMilliseconds = (seconds: number) => {
  return seconds * 60000;
};

const getInitialState = (): UserCredentials | null => {
  const userCredentials = sessionStorage.getItem("userCredentials");
  return userCredentials ? JSON.parse(userCredentials) : null;
};

const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userCredentials, setUserCredentials] =
    useState<UserCredentials | null>(getInitialState);
  const [rememberMe, setRememberMe] = useState(false);
  
  const { mutate: _login } = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      return loginApi(email, password);
    },
  });

  const { mutate: refreshToken } = useMutation({
    mutationFn: async (refreshToken: string) => {
      return refreshTokenApi(refreshToken);
    },
  });

  const { data: userDetails } = useQuery({
    queryKey: ["userDetails", userCredentials?._id],
    queryFn: () => {
      if (userCredentials?._id === undefined) {
        throw new Error("should never be called with unknown user");
      }

      return getUserDetails(userCredentials._id);
    },
    enabled: userCredentials?._id === undefined,
  });

  const user = useMemo<User | null>(() => {
    if (userDetails !== undefined && userCredentials !== null) {
      return { ...userCredentials, ...userDetails };
    }

    return null;
  }, [userCredentials, userDetails]);

  useEffect(() => {
    const storedRefreshToken = Cookies.get("refresh-token");

    if (storedRefreshToken !== undefined) {
      refreshToken(storedRefreshToken, {
        onSuccess: (data) => {
          setUserCredentials(data);
        },
      });
    }
  }, [refreshToken]);

  useEffect(() => {
    if (rememberMe && userCredentials !== null) {
      Cookies.set("refresh-token", userCredentials.refreshToken);
    }
  }, [userCredentials, rememberMe]);

  useEffect(() => {
    if (userCredentials !== null) {
      Cookies.set("access-token", userCredentials.accessToken);
    }
  }, [userCredentials]);

  useInterval(() => {
    if (user !== null) {
      refreshToken(user.refreshToken, {
        onSuccess: (data) => {
          setUserCredentials(data);
        },
      });
    }
  }, minutesToMilliseconds(10));

  

  

  // const { mutate: refreshToken, data: userCredentials } = useMutation({
  //   mutationFn: async (refreshToken: string) => {
  //     return refreshTokenApi(refreshToken);
  //   },
  // });

  // const {
  //   mutate: login,
  //   data: userCredentials,
  //   isPending: isPendingLogin,
  // } = useMutation({
  //   mutationFn: async ({
  //     email,
  //     password,
  //   }: {
  //     email: string;
  //     password: string;
  //   }) => {
  //     return loginApi(email, password);
  //   },
  // });

  useEffect(() => {
    sessionStorage.setItem("user", JSON.stringify(user));

    if (user !== null) {
      Cookies.set("token", user.accessToken);
    } else {
      Cookies.remove("token");
    }
  }, [user]);

  const logIn = (email: string, password: string, rememberMe: boolean) => {};

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
