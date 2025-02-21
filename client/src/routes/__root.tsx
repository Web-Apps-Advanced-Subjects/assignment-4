import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { type UserContext } from "@libs/userContext";
import NotFound from "@libs/NotFound";

type RouterContext = {
  user: UserContext["user"];
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function RootComponent() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </ThemeProvider>
  );
}
