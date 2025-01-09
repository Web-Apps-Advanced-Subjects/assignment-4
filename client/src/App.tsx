import { RouterProvider } from "@tanstack/react-router";
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

const App = () => {
  return (
    <UserProvider>
      <InnerApp />
    </UserProvider>
  );
};

export default App;
