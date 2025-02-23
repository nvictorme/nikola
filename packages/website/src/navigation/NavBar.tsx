import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MenuIcon } from "lucide-react";
// import { useCallback } from "react";
// import { useLocation } from "react-router-dom";
import { routes } from "./routes";

const NavBar: React.FC = () => {
  // const { pathname } = useLocation();
  // Add active class to the current route
  // const isActive = useCallback(
  //   (path: string) => {
  //     return pathname === path
  //       ? "text-foreground p-2"
  //       : "text-muted-foreground p-2";
  //   },
  //   [pathname]
  // );

  return (
    <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between">
      <a href={routes.home.path} className="flex items-center gap-2">
        <img src="favicon.png" alt="Inflalo Inc" className="h-24 w-24" />
      </a>
      <nav className="hidden md:flex items-center gap-6">
        <a href={routes.products.path} className="text-lg font-medium">
          {routes.products.title}
        </a>
        <a href={routes.contact.path} className="text-lg font-medium">
          {routes.contact.title}
        </a>
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Toggle navigation</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="md:hidden">
          <nav className="grid gap-4 p-6">
            <a href={routes.products.path} className="text-lg font-medium">
              {routes.products.title}
            </a>
            <a href={routes.contact.path} className="text-lg font-medium">
              {routes.contact.title}
            </a>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
};
export default NavBar;
