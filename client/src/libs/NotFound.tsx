import { Box, Grid2 as Grid, Stack, Typography } from "@mui/material";
import Logo from "@assets/logo.svg?react";
import { createLink } from "@tanstack/react-router";
import { Link as LinkMui } from "@mui/material";

const Link = createLink(LinkMui);

function NotFound() {
  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Grid
        container
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
              404 Not Found.
            </Typography>
            <Typography>
              Go back <Link to="/home">home</Link>
            </Typography>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}

export default NotFound;
