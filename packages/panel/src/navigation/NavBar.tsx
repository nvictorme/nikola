import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CircleUser, Menu, Settings } from "lucide-react";
import { routes } from "./routes";
import { useLocation } from "react-router-dom";
import { useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";
import { canSeeBalance, isSuperAdmin } from "shared/helpers";

const NavBar: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const isAdmin = isSuperAdmin(user);
  const showBalance = canSeeBalance(user);

  const { pathname } = useLocation();
  // Add active class to the current route
  const isActive = useCallback(
    (path: string) => {
      return pathname === path
        ? "text-foreground p-2"
        : "text-muted-foreground p-2";
    },
    [pathname]
  );

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <a
          href={routes.inicio.path}
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <img src="favicon.png" className="h-10 w-10" />
          <span className="sr-only">Inflalo Inc</span>
        </a>
        <a
          href={routes.inicio.path}
          className={`flex gap-2 align-middle ${isActive(
            routes.inicio.path
          )} transition-colors hover:text-foreground`}
        >
          <routes.inicio.icon className="h-4 w-4" /> {routes.inicio.title}
        </a>
        <a
          href={routes.ordenes.path}
          className={`flex gap-1 align-middle ${isActive(
            routes.ordenes.path
          )} transition-colors hover:text-foreground`}
        >
          <routes.ordenes.icon className="h-4 w-4" /> {routes.ordenes.title}
        </a>
        <a
          href={routes.productos.path}
          className={`flex gap-2 align-middle ${isActive(
            routes.productos.path
          )} transition-colors hover:text-foreground`}
        >
          <routes.productos.icon className="h-4 w-4" /> {routes.productos.title}
        </a>
        <a
          href={routes.personas.path}
          className={`flex gap-2 align-middle ${isActive(
            routes.personas.path
          )} transition-colors hover:text-foreground`}
        >
          <routes.personas.icon className="h-4 w-4" /> {routes.personas.title}
        </a>
        {showBalance ? (
          <a
            href={routes.balance.path}
            className={`flex gap-2 align-middle ${isActive(
              routes.balance.path
            )} transition-colors hover:text-foreground`}
          >
            <routes.balance.icon className="h-4 w-4" /> {routes.balance.title}
          </a>
        ) : null}
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <a
              href={routes.inicio.path}
              className="flex items-center gap-2 text-lg font-semibold md:text-base"
            >
              <img src="favicon.png" className="h-10 w-10" />
              <span className="sr-only">Inflalo Inc</span>
            </a>
            <a
              href={routes.inicio.path}
              className={`flex gap-2 align-middle ${isActive(
                routes.inicio.path
              )} transition-colors hover:text-foreground`}
            >
              <routes.inicio.icon className="h-4 w-4" /> {routes.inicio.title}
            </a>
            <a
              href={routes.ordenes.path}
              className={`flex gap-1 align-middle ${isActive(
                routes.ordenes.path
              )} transition-colors hover:text-foreground`}
            >
              <routes.ordenes.icon className="h-4 w-4" /> {routes.ordenes.title}
            </a>
            <a
              href={routes.productos.path}
              className={`flex gap-2 align-middle ${isActive(
                routes.productos.path
              )} transition-colors hover:text-foreground`}
            >
              <routes.productos.icon className="h-4 w-4" />{" "}
              {routes.productos.title}
            </a>
            <a
              href={routes.personas.path}
              className={`flex gap-2 align-middle ${isActive(
                routes.personas.path
              )} transition-colors hover:text-foreground`}
            >
              <routes.personas.icon className="h-4 w-4" />{" "}
              {routes.personas.title}
            </a>
            {showBalance ? (
              <a
                href={routes.balance.path}
                className={`flex gap-2 align-middle ${isActive(
                  routes.balance.path
                )} transition-colors hover:text-foreground`}
              >
                <routes.balance.icon className="h-4 w-4" />{" "}
                {routes.balance.title}
              </a>
            ) : null}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex items-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <ModeToggle />

        {/* Admin menu */}
        {isAdmin ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Menu Admin</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <a
                  href={routes.usuarios.path}
                  className={`flex gap-2 align-middle transition-colors hover:text-foreground`}
                >
                  <routes.usuarios.icon className="h-4 w-4" />{" "}
                  {routes.usuarios.title}
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a
                  href={routes.roles.path}
                  className={`flex gap-2 align-middle transition-colors hover:text-foreground`}
                >
                  <routes.roles.icon className="h-4 w-4" /> {routes.roles.title}
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <a
                  href={routes.categorias.path}
                  className={`flex gap-2 align-middle transition-colors hover:text-foreground`}
                >
                  <routes.categorias.icon className="h-4 w-4" />{" "}
                  {routes.categorias.title}
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a
                  href={routes.sucursales.path}
                  className={`flex gap-2 align-middle transition-colors hover:text-foreground`}
                >
                  <routes.sucursales.icon className="h-4 w-4" />{" "}
                  {routes.sucursales.title}
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a
                  href={routes.almacenes.path}
                  className={`flex gap-2 align-middle transition-colors hover:text-foreground`}
                >
                  <routes.almacenes.icon className="h-4 w-4" />{" "}
                  {routes.almacenes.title}
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <a
                  href={routes.proveedores.path}
                  className={`flex gap-2 align-middle transition-colors hover:text-foreground`}
                >
                  <routes.proveedores.icon className="h-4 w-4" />{" "}
                  {routes.proveedores.title}
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <a
                  href={routes.reportes.path}
                  className={`flex gap-2 align-middle transition-colors hover:text-foreground`}
                >
                  <routes.reportes.icon className="h-4 w-4" />{" "}
                  {routes.reportes.title}
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a
                  href={routes.configuracion.path}
                  className={`flex gap-2 align-middle transition-colors hover:text-foreground`}
                >
                  <routes.configuracion.icon className="h-4 w-4" />{" "}
                  {routes.configuracion.title}
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {/* Account */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Ajustes</DropdownMenuItem>
            <DropdownMenuItem>Soporte</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>Salir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
export default NavBar;
