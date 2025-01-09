import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

export const router = createRouter({
  routeTree,
  context: {
    // user will initially be undefined
    // We'll be passing down the user state from within a React component
    user: undefined!,
  },
});
