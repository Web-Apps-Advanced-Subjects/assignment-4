import {
  Box,
  Button,
  Dialog,
  DialogProps,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { buttonBorderRadius } from "@libs/consts";
import GoogleIcon from "@mui/icons-material/Google";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Logo from "@assets/logo.svg?react";
import { ChangeEvent, useState } from "react";
import { register as registerApi } from "@libs/api";
import { useMutation } from "@tanstack/react-query";
import { LoadingButton } from "@mui/lab";
import { useDropzone } from "react-dropzone";
import VisuallyHiddenInput from "@libs/VisuallyHiddenInput";

type SignUpDialogProps = {
  onSignInClick?: () => void;
} & Omit<DialogProps, "children">;

function SignUpDialog(props: SignUpDialogProps) {
  const { onSignInClick, onClose, ...restProps } = props;
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [avatar, setAvatar] = useState<File | null>(null);

  const { getInputProps, getRootProps } = useDropzone({
    maxFiles: 1,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    onDrop: (files) => {
      setAvatar(files[0]);
    },
  });

  const { mutate: register, isPending: isPendingRegister } = useMutation({
    mutationFn: async ({
      username,
      password,
      email,
      avatar,
    }: {
      username: string;
      password: string;
      email: string;
      avatar: File;
    }) => {
      return await registerApi(username, password, email, avatar);
    },
  });

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleClickSignUp = async () => {
    if (avatar === null) {
      return;
    }

    await register(
      { username, password, email, avatar },
      {
        onSuccess: () => {
          if (onSignInClick !== undefined) {
            onSignInClick();
          }
        },
      }
    );
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
    setEmail("");
    setAvatar(null);
  };

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
          spacing={3}
          sx={{
            justifyContent: "center",
            height: "100%",
            width: "100%",
            maxWidth: 300,
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            Create your account
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
                  Sign up with Google
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
              value={password}
              type="password"
              autoComplete="current-password"
              onChange={handlePasswordChange}
            />
            <TextField
              label="email"
              slotProps={{ inputLabel: { shrink: true } }}
              value={email}
              autoComplete="current-email"
              onChange={handleEmailChange}
            />
            <Box {...getRootProps()}>
              <TextField
                label="avatar"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: "100%" }}
                {...(avatar === null && {
                  slotProps: {
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CloudUploadIcon />
                        </InputAdornment>
                      ),
                    },
                  },
                })}
                value={avatar !== null ? avatar.name : "upload avatar image"}
              />
              <VisuallyHiddenInput
                {...getInputProps({ style: { margin: 0 } })}
              />
            </Box>
            <LoadingButton
              variant="contained"
              sx={{ borderRadius: buttonBorderRadius, textTransform: "none" }}
              loading={isPendingRegister}
              onClick={handleClickSignUp}
              loadingPosition="center"
              disabled={
                username === "" ||
                password === "" ||
                email === "" ||
                avatar === null
              }
            >
              Sign up
            </LoadingButton>
          </Stack>
        </Stack>

        <Stack direction="row" sx={{ alignItems: "center" }}>
          <Typography sx={{ fontWeight: 700 }}>
            Already have an account?
          </Typography>
          <Button onClick={onSignInClick} sx={{ textTransform: "none" }}>
            sign in
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
}

export default SignUpDialog;
