import {
  Button,
  Checkbox,
  Dialog,
  DialogProps,
  Divider,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { buttonBorderRadius } from "@libs/consts";
import GoogleIcon from "@mui/icons-material/Google";
import Logo from "@assets/logo.svg?react";
import { ChangeEvent, useEffect, useState } from "react";
import { useUser } from "@libs/userContext";
import { LoadingButton } from "@mui/lab";
import { getRouteApi, useNavigate, useRouter } from "@tanstack/react-router";

const routeApi = getRouteApi("/login");

type SignInDialogProps = {
  onSignUpClick?: () => void;
} & Omit<DialogProps, "children">;

function SignInDialog(props: SignInDialogProps) {
  const { onSignUpClick, onClose, ...restProps } = props;
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const router = useRouter();
  const { redirect } = routeApi.useSearch();

  const { user, login } = useUser();

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleRememberMeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRememberMe(event.target.checked);
  };

  const handleClickSignin = async () => {
    await login(email, password, rememberMe);
  };

  const handleClose = (
    event: object,
    reason: "backdropClick" | "escapeKeyDown"
  ) => {
    if (onClose !== undefined) {
      onClose(event, reason);
    }

    setEmail("");
    setPassword("");
  };

  useEffect(() => {
    if (user !== null) {
      if (redirect !== undefined) {
        router.history.push(redirect);
      } else {
        navigate({ to: "/home" });
      }
    }
  }, [user, redirect, router, navigate]);

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
              label="email"
              slotProps={{ inputLabel: { shrink: true } }}
              value={email}
              autoComplete="current-email"
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
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                />
              }
              label="Remember me"
            />
            <LoadingButton
              variant="contained"
              sx={{ borderRadius: buttonBorderRadius, textTransform: "none" }}
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
