import CataloguePage from "@/pages/CataloguePage";
import HomePage from "@/pages/HomePage";
import PlaceholderPage from "@/pages/PlaceholderPage";
import { BoxesIcon, ContactIcon, FlagIcon, Home } from "lucide-react";
import CountriesPage from "@/pages/CountriesPage";

export const routes = {
  index: {
    path: "/",
    title: "Inflalo Inc.",
    icon: FlagIcon,
    element: CountriesPage,
  },
  home: {
    path: "/home",
    title: "Home",
    icon: Home,
    element: HomePage,
  },
  products: {
    path: "/products",
    title: "Products",
    icon: BoxesIcon,
    element: CataloguePage,
  },
  contact: {
    path: "/contact",
    title: "Contact",
    icon: ContactIcon,
    element: PlaceholderPage,
  },
} as const;
