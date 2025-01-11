import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { UserProvider, useUser } from "@libs/userContext";
import { router } from "./router";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Register things for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const InnerApp = () => {
  const { user } = useUser();

  return <RouterProvider router={router} context={{ user }} />;
};

const queryClient = new QueryClient();

const App = () => {
  return (
    <GoogleOAuthProvider clientId="730785686819-6drdihn4664d094p8ohrj4hk9vfo3f0r.apps.googleusercontent.com">
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <InnerApp />
        </UserProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
