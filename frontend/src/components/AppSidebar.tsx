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
    <aside className="hidden md:flex flex-col w-56 border-r border-border bg-card/40">
      <div className="h-14 flex items-center gap-2 px-5 border-b border-border">
        <Shield className="h-4.5 w-4.5 text-primary" />
        <span className="text-sm font-semibold text-foreground tracking-tight">Repute</span>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.title}
              to={item.path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/40"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>
      </div>
    </aside>
  );
};

export default AppSidebar;
