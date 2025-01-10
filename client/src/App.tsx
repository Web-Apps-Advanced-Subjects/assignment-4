import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { UserProvider, useUser } from "@libs/userContext";
import { router } from "./router";

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
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <InnerApp />
      </UserProvider>
    </QueryClientProvider>
  );
};

export default App;
