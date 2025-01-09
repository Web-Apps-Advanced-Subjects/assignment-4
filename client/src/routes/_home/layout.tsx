import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { Box, Drawer, Grid2 as Grid } from "@mui/material";

import Navbar from "@libs/Navbar";
import PostFormPanel from "@libs/PostFormPanel";

export const Route = createFileRoute("/_home")({
  beforeLoad: ({ context, location }) => {
    if (context.user === null) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: HomeLayoutComponent,
});

const leftGridSize = 4;
const leftDrawerWidth = `${(leftGridSize / 12) * 100}vw`;

const rightGridSize = 4.5;
const rightDrawerWidth = `${(rightGridSize / 12) * 100}vw`;

function HomeLayoutComponent() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        overflowX: "hidden",
        paddingY: 2,
      }}
    >
      <Grid container sx={{ width: "100%", height: "100%" }}>
        <Grid size={leftGridSize}>
          <Drawer
            anchor="left"
            variant="permanent"
            sx={{
              width: leftDrawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: {
                width: leftDrawerWidth,
                boxSizing: "border-box",
              },
              justifyContent: "space-between",
            }}
          >
            <Navbar sx={{ height: "100%", paddingY: 2 }} />
          </Drawer>
        </Grid>
        <Grid size={3.5} sx={{height: "100%"}}>
          <Outlet />
        </Grid>
        <Grid size={rightGridSize}>
          <Drawer
            anchor="right"
            variant="permanent"
            sx={{
              width: rightDrawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: {
                width: rightDrawerWidth,
                boxSizing: "border-box",
              },
              justifyContent: "space-between",
            }}
          >
            <PostFormPanel sx={{ height: "100%", paddingY: 2 }} />
          </Drawer>
        </Grid>
      </Grid>
    </Box>
  );
}
