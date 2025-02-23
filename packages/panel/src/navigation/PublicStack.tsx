import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { routes } from "./routes";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Outlet />,
    children: [
      {
        path: "/",
        element: <routes.login.element />,
      },
      {
        path: routes.login.path,
        element: <routes.login.element />,
      },
      {
        path: routes.reset.path,
        element: <routes.reset.element />,
      },
    ],
  },
]);

export const PublicStack = () => {
  return <RouterProvider router={router} />;
};
