import AlmacenesPage from "@/pages/almacenes/AlmacenesPage";
import LoginPage from "@/pages/auth/LoginPage";
import ResetPage from "@/pages/auth/ResetPage";
import BalancePage from "@/pages/balance/BalancePage";
import { CategoriasPage } from "@/pages/categorias/CategoriasPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import OrdenesPage from "@/pages/ordenes/OrdenesPage";
import PaisesPage from "@/pages/paises/PaisesPage";
import PersonasPage from "@/pages/personas/PersonasPage";
import ProductoForm from "@/pages/productos/ProductoForm";
import ProductosPage from "@/pages/productos/ProductosPage";
import ReportesPage from "@/pages/reportes/ReportesPage";
import RolesPage from "@/pages/roles/RolesPage";
import SucursalesPage from "@/pages/sucursales/SucursalesPage";
import UsuariosPage from "@/pages/usuarios/UsuariosPage";
import {
  Home,
  Package,
  ShoppingCart,
  Users2,
  MapPin,
  Warehouse,
  User,
  CircleDollarSign,
  FileChartColumn,
  IdCard,
  KeyRoundIcon,
  EarthIcon,
} from "lucide-react";

export const routes = {
  inicio: {
    path: "/",
    title: "Inicio",
    icon: Home,
    element: DashboardPage,
  },
  login: {
    path: "/login",
    title: "Login",
    icon: Users2,
    element: LoginPage,
  },
  reset: {
    path: "/reset",
    title: "Reset",
    icon: KeyRoundIcon,
    element: ResetPage,
  },
  productos: {
    path: "/productos",
    title: "Productos",
    icon: Package,
    element: ProductosPage,
  },
  producto: {
    path: "/productos/:productoId",
    title: "Producto",
    icon: Package,
    element: ProductoForm,
  },
  ordenes: {
    path: "/ordenes",
    title: "Ordenes",
    icon: ShoppingCart,
    element: OrdenesPage,
  },
  personas: {
    path: "/clientes",
    title: "Clientes",
    icon: Users2,
    element: PersonasPage,
  },
  usuarios: {
    path: "/usuarios",
    title: "Usuarios",
    icon: User,
    element: UsuariosPage,
  },
  roles: {
    path: "/roles",
    title: "Roles",
    icon: IdCard,
    element: RolesPage,
  },
  sucursales: {
    path: "/sucursales",
    title: "Sucursales",
    icon: MapPin,
    element: SucursalesPage,
  },
  almacenes: {
    path: "/almacenes",
    title: "Almacenes",
    icon: Warehouse,
    element: AlmacenesPage,
  },
  balance: {
    path: "/balance",
    title: "Balance",
    icon: CircleDollarSign,
    element: BalancePage,
  },
  reportes: {
    path: "/reportes",
    title: "Reportes",
    icon: FileChartColumn,
    element: ReportesPage,
  },
  paises: {
    path: "/paises",
    title: "Países",
    icon: EarthIcon,
    element: PaisesPage,
  },
  categorias: {
    path: "/categorias",
    title: "Categorías",
    icon: Package,
    element: CategoriasPage,
  },
};
