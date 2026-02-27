import { Link, useLocation } from "react-router-dom";
import { Shield, Repeat, History, FileText, ArrowLeft } from "lucide-react";

const navItems = [
  { title: "Relayer", path: "/app", icon: Repeat },
  { title: "History", path: "/app/history", icon: History },
  { title: "Docs", path: "/app/docs", icon: FileText },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border/50 bg-card/30 backdrop-blur-xl">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-border/50">
        <Shield className="h-6 w-6 text-primary" />
        <span className="font-semibold text-foreground tracking-tight">Repute</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.title}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </aside>
  );
};

export default AppSidebar;
