import { createFileRoute, redirect } from "@tanstack/react-router";

import {
  Box,
  Button,
  Divider,
  Grid2 as Grid,
  Stack,
  Typography,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import Logo from "@assets/logo.svg?react";
import SignInDialog from "@libs/SignInDialog";
import { boxBorderRadius } from "@libs/consts";
import { useState } from "react";
import SignUpDialog from "@libs/SignUpDialog";
import { z } from "zod";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.user !== null) {
      throw redirect({
        to: "/home",
      });
    }
  },
  validateSearch: loginSearchSchema,
  component: Login,
});

function Login() {
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);
  const [signUpDialogOpen, setSignUpDialogOpen] = useState(false);

  const handleSignInClick = () => {
    setSignInDialogOpen(true);
    setSignUpDialogOpen(false);
  };

  const handleSignInDialogClose = () => {
    setSignInDialogOpen(false);
  };

  const handleSignUpClick = () => {
    setSignInDialogOpen(false);
    setSignUpDialogOpen(true);
  };

  const handleSignUpDialogClose = () => {
    setSignUpDialogOpen(false);
  };

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Grid
        container
        // spacing={2}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <Grid size={3}>
          <Stack alignItems="center">
            <Logo style={{ height: "100%", maxHeight: 350 }} />
          </Stack>
        </Grid>
        <Grid size={3} padding={2}>
          <Stack
            maxWidth={760}
            spacing={8}
            sx={{
              alignItems: "flex-start",
              justifyContent: "center",
            }}
          >
            <Typography variant="h2" sx={{ fontWeight: 700 }}>
              Happening now.
            </Typography>
            <Stack minWidth={320}>
              <Button
                variant="contained"
                sx={{
                  borderRadius: 20,
                }}
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
              <Button
                onClick={handleSignUpClick}
                variant="contained"
                color="secondary"
                sx={{ borderRadius: 20, textTransform: "none" }}
              >
                Create account
              </Button>
            </Stack>
            <Stack spacing={1} sx={{ minWidth: 320 }}>
              <Typography sx={{ fontWeight: 700 }}>
                Already have an account?
              </Typography>
              <Button
                onClick={handleSignInClick}
                variant="outlined"
                sx={{ borderRadius: 20, textTransform: "none" }}
              >
                Sign in
              </Button>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
      <SignInDialog
        open={signInDialogOpen}
        onClose={handleSignInDialogClose}
        onSignUpClick={handleSignUpClick}
        PaperProps={{
          sx: { height: 800, width: 600, borderRadius: boxBorderRadius },
        }}
      />
      <SignUpDialog
        open={signUpDialogOpen}
        onClose={handleSignUpDialogClose}
        onSignInClick={handleSignInClick}
        PaperProps={{
          sx: { height: 800, width: 600, borderRadius: boxBorderRadius },
        }}
      />
    </Box>
  );
}

export default Login;
