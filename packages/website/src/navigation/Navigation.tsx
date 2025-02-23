import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { routes } from "./routes";
import ProductPage from "@/pages/ProductPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        path: routes.index.path,
        element: <routes.index.element />,
      },
      {
        path: routes.home.path,
        element: <routes.home.element />,
      },
      {
        path: routes.products.path,
        element: <routes.products.element />,
      },
      {
        path: routes.contact.path,
        element: <routes.contact.element />,
      },
      {
        path: "/products/:id",
        element: <ProductPage />,
      },
    ],
  },
]);

const Navigation = () => {
  return <RouterProvider router={router} />;
};

export default Navigation;
