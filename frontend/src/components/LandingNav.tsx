import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const LandingNav = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-subtle">
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          <span className="text-lg font-semibold text-foreground tracking-tight">Repute</span>
        </Link>
        <Link to="/app">
          <Button size="sm" className="font-medium">
            Launch App
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default LandingNav;
