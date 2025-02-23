import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

export function AppLayout() {
  return (
    <div className="flex flex-col min-h-[100dvh] w-full">
      <NavBar />
      <Outlet />
      <footer className="bg-primary text-primary-foreground p-6 md:p-12">
        <div className="container max-w-7xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 text-sm">
          <div className="grid gap-1">
            <h3 className="font-semibold">Products</h3>
            <a href="#">Fun Inflatables</a>
            <a href="#">InflaPlay Bouncy Castles</a>
            <a href="#">Advertising Inflatables</a>
            <a href="#">Blowers</a>
          </div>
          <div className="grid gap-1">
            <h3 className="font-semibold">Company</h3>
            <a href="#">About Us</a>
            <a href="#">Our Team</a>
            <a href="#">Careers</a>
            <a href="#">Contact</a>
          </div>
          <div className="grid gap-1">
            <h3 className="font-semibold">Resources</h3>
            <a href="#">Blog</a>
            <a href="#">FAQs</a>
            <a href="#">Testimonials</a>
            <a href="#">Downloads</a>
          </div>
          <div className="grid gap-1">
            <h3 className="font-semibold">Legal</h3>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
          <div className="grid gap-1">
            <h3 className="font-semibold">Connect</h3>
            <a href="#">Facebook</a>
            <a href="#">Twitter</a>
            <a href="#">Instagram</a>
            <a href="#">aedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
