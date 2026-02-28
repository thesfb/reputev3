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
    <aside className="hidden md:flex flex-col w-56 border-r border-border/50 bg-card/30">
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-border/50">
        <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Shield className="h-3 w-3 text-primary" />
        </div>
        <span className="font-display text-sm font-semibold text-foreground tracking-tight">Repute</span>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.title}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                active
                  ? "text-primary bg-primary/[0.08]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              {active && <div className="w-0.5 h-4 rounded-full bg-primary" />}
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/50">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/30"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>
      </div>
    </aside>
  );
};

export default AppSidebar;
