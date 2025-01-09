import {
  Button,
  Dialog,
  DialogProps,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { buttonBorderRadius } from "@libs/consts";
import GoogleIcon from "@mui/icons-material/Google";
import Logo from "@assets/logo.svg?react";
import { ChangeEvent, useEffect, useState } from "react";
import { useUser } from "@libs/userContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LoadingButton } from "@mui/lab";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { getUserDetails, login as loginApi } from "@libs/api";

const routeApi = getRouteApi("/login");

type SignInDialogProps = {
  onSignUpClick?: () => void;
} & Omit<DialogProps, "children">;

function SignInDialog(props: SignInDialogProps) {
  const { onSignUpClick, onClose, ...restProps } = props;
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const navigate = useNavigate();
  const { redirect } = routeApi.useSearch();

  const { user, setUser } = useUser();

  const {
    mutate: login,
    data: userCredentials,
    isPending: isPendingLogin,
  } = useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {
      return loginApi(username, password);
    },
  });

  const { data: userDetails, isFetching: isFetchingUserDetails } = useQuery({
    queryKey: [userCredentials],
    queryFn: () => {
      if (userCredentials === undefined) {
        throw new Error("should never be called with unknown user");
      }

      return getUserDetails(userCredentials.accessToken, userCredentials._id);
    },
    enabled: userCredentials !== undefined,
  });

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleClickSignin = async () => {
    await login({ username, password });
  };

  const handleClose = (
    event: object,
    reason: "backdropClick" | "escapeKeyDown"
  ) => {
    if (onClose !== undefined) {
      onClose(event, reason);
    }

    setUsername("");
    setPassword("");
  };

  useEffect(() => {
    if (userCredentials !== undefined && userDetails !== undefined) {
      setUser({ ...userCredentials, ...userDetails });
    }
  }, [userCredentials, userDetails, setUser, navigate]);

  useEffect(() => {
    if (user !== null) {
      navigate({ to: redirect ?? "/home" });
    }
  }, [user, redirect, navigate]);

  return (
    <Dialog {...restProps} onClose={handleClose}>
      <Stack
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          paddingY: 2,
          paddingX: 2,
          height: "100%",
        }}
      >
        <Logo width={96} height={96} />
        <Stack
          sx={{
            justifyContent: "center",
            height: "100%",
            width: "100%",
            maxWidth: 300,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Sign in to X.AI
          </Typography>
          <Stack
            component="form"
            noValidate
            spacing={3}
            sx={{ justifyContent: "center", minHeight: 350 }}
          >
            <Button
              variant="contained"
              sx={{ borderRadius: buttonBorderRadius }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <GoogleIcon />
                <Typography sx={{ textTransform: "none" }}>
                  Sign in with Google
                </Typography>
              </Stack>
            </Button>
            <Divider>or</Divider>
            <TextField
              label="username"
              slotProps={{ inputLabel: { shrink: true } }}
              value={username}
              autoComplete="current-username"
              onChange={handleUsernameChange}
            />
            <TextField
              label="password"
              slotProps={{ inputLabel: { shrink: true } }}
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={handlePasswordChange}
            />
            <LoadingButton
              variant="contained"
              sx={{ borderRadius: buttonBorderRadius, textTransform: "none" }}
              loading={isPendingLogin || isFetchingUserDetails}
              onClick={handleClickSignin}
              loadingPosition="center"
            >
              Sign in
            </LoadingButton>
          </Stack>
        </Stack>

        <Stack direction="row" sx={{ alignItems: "center" }}>
          <Typography sx={{ fontWeight: 700 }}>
            Don't have an account?
          </Typography>
          <Button onClick={onSignUpClick} sx={{ textTransform: "none" }}>
            sign up
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}

export default SignInDialog;
