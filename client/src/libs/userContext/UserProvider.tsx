import { useState, ReactNode, useEffect, useMemo, useCallback } from "react";

import {
  User,
  refreshToken as refreshTokenApi,
  getUserDetails,
  login as loginApi,
  googleLogin as googleLoginApi,
  logout as logoutApi,
  UserCredentials,
} from "@libs/api";
import { EmailLoginParams, GoogleLoginParams, UserContext } from "./context";
import Cookies from "js-cookie";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useInterval } from "usehooks-ts";

const minutesToMilliseconds = (seconds: number) => {
  return seconds * 60000;
};

const getInitialState = (): UserCredentials | null => {
  const userCredentials = sessionStorage.getItem("userCredentials");

  if (userCredentials !== undefined && userCredentials !== null) {
    return JSON.parse(userCredentials);
  } else {
    sessionStorage.removeItem("userCredentials");
    Cookies.remove("access-token");
    Cookies.remove("refresh-token");

    return null;
  }
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

  const { mutate: googleLogin } = useMutation({
    mutationFn: async (credential: string) => {
      return googleLoginApi(credential);
    },
  });

  const { mutate: _logout } = useMutation({
    mutationFn: async (refreshToken: string) => {
      await logoutApi(refreshToken);
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
    enabled: userCredentials?._id !== undefined,
  });

  const user = useMemo<User | null>(() => {
    if (userDetails !== undefined && userCredentials !== null) {
      return { ...userCredentials, ...userDetails };
    }

    return null;
  }, [userCredentials, userDetails]);

  useEffect(() => {
    if (userCredentials !== null) {
      sessionStorage.setItem(
        "userCredentials",
        JSON.stringify(userCredentials)
      );
      Cookies.set("access-token", userCredentials.accessToken, {
        expires: 1 / 24,
      });

      if (rememberMe) {
        Cookies.set("refresh-token", userCredentials.refreshToken, {
          expires: 2,
          path: "/users/refresh-token",
        });
      }
    } else {
      sessionStorage.removeItem("userCredentials");
      Cookies.remove("refresh-token");
      Cookies.remove("access-token");
    }
  }, [userCredentials, rememberMe]);

  useEffect(() => {
    const storedRefreshToken = Cookies.get("refresh-token");

    if (storedRefreshToken !== undefined) {
      refreshToken(storedRefreshToken, {
        onSuccess: (data) => {
          setUserCredentials(data);
          setRememberMe(true);
        },
        onError: () => {
          setUserCredentials(null);
          setRememberMe(false);
        },
      });
    }
  }, [refreshToken]);

  useInterval(() => {
    if (user !== null) {
      refreshToken(user.refreshToken, {
        onSuccess: (data) => {
          setUserCredentials(data);
        },
      });
    }
  }, minutesToMilliseconds(10));

  const login = async (params: EmailLoginParams | GoogleLoginParams) => {
    if (user !== null) {
      return;
    }

    const onSuccess = (data: UserCredentials) => {
      setUserCredentials(data);
      setRememberMe(true);
    };

    if ("credential" in params) {
      await googleLogin(params.credential, { onSuccess });
    } else {
      await _login(params, { onSuccess });
    }
  };

  const logout = useCallback(async () => {
    if (user === null) {
      return;
    }

    await _logout(user.refreshToken, {
      onSuccess: () => {
        setUserCredentials(null);
        setRememberMe(false);
      },
    });
  }, [user, _logout]);

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
