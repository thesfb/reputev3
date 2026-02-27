import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const LandingNav = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-14 px-6">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground tracking-tight">Repute</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            to="/pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted/50 hidden sm:block"
          >
            Pricing
          </Link>
          <Link
            to="/app/docs"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted/50 hidden sm:block"
          >
            Docs
          </Link>
          <div className="w-px h-5 bg-border mx-2 hidden sm:block" />
          <Link to="/app">
            <Button size="sm" className="h-8 text-xs font-medium px-4">
              Launch App
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
