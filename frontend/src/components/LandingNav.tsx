import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const LandingNav = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-xl" />
      <div className="container mx-auto flex items-center justify-between h-14 px-6 relative">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-display text-sm font-semibold text-foreground tracking-tight">Repute</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            to="/pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted/30 hidden sm:block"
          >
            Pricing
          </Link>
          <Link
            to="/app/docs"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-muted/30 hidden sm:block"
          >
            Docs
          </Link>
          <div className="w-px h-5 bg-border/50 mx-2 hidden sm:block" />
          <Link to="/app">
            <Button size="sm" className="h-8 text-xs font-medium px-4 rounded-lg glow-primary">
              Launch App
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
