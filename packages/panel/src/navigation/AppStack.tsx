import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { routes } from "./routes";
import ProtectedRoute from "./ProtectedRoute";
import { RouteRuleCheck } from "shared/enums";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        path: routes.inicio.path,
        element: <routes.inicio.element />,
      },
      {
        path: routes.ordenes.path,
        element: <routes.ordenes.element />,
      },
      {
        path: routes.productos.path,
        element: <routes.productos.element />,
      },
      {
        path: routes.producto.path,
        element: <routes.producto.element />,
      },
      {
        path: routes.personas.path,
        element: <routes.personas.element />,
      },
      {
        path: routes.balance.path,
        element: (
          <ProtectedRoute routeRuleCheck={RouteRuleCheck.canSeeBalance}>
            <routes.balance.element />
          </ProtectedRoute>
        ),
      },
      {
        path: routes.usuarios.path,
        element: (
          <ProtectedRoute routeRuleCheck={RouteRuleCheck.isAdmin}>
            <routes.usuarios.element />
          </ProtectedRoute>
        ),
      },
      {
        path: routes.roles.path,
        element: (
          <ProtectedRoute routeRuleCheck={RouteRuleCheck.isAdmin}>
            <routes.roles.element />
          </ProtectedRoute>
        ),
      },
      {
        path: routes.sucursales.path,
        element: (
          <ProtectedRoute routeRuleCheck={RouteRuleCheck.isAdmin}>
            <routes.sucursales.element />
          </ProtectedRoute>
        ),
      },
      {
        path: routes.almacenes.path,
        element: (
          <ProtectedRoute routeRuleCheck={RouteRuleCheck.isAdmin}>
            <routes.almacenes.element />
          </ProtectedRoute>
        ),
      },
      {
        path: routes.reportes.path,
        element: (
          <ProtectedRoute routeRuleCheck={RouteRuleCheck.isAdmin}>
            <routes.reportes.element />
          </ProtectedRoute>
        ),
      },
      {
        path: routes.categorias.path,
        element: (
          <ProtectedRoute routeRuleCheck={RouteRuleCheck.isAdmin}>
            <routes.categorias.element />
          </ProtectedRoute>
        ),
      },
      {
        path: routes.configuracion.path,
        element: (
          <ProtectedRoute routeRuleCheck={RouteRuleCheck.isAdmin}>
            <routes.configuracion.element />
          </ProtectedRoute>
        ),
      },
      {
        path: routes.proveedores.path,
        element: (
          <ProtectedRoute routeRuleCheck={RouteRuleCheck.isAdmin}>
            <routes.proveedores.element />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export const AppStack = () => {
  return <RouterProvider router={router} />;
};
