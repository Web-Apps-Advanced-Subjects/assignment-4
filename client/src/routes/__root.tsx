import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { type UserContext } from "@libs/userContext";

type RouterContext = {
  user: UserContext["user"];
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const queryClient = new QueryClient();

function RootComponent() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
      <TanStackRouterDevtools position="bottom-right" />
    </ThemeProvider>
  );
}
