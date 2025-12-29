import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  RefreshCw, 
  LayoutDashboard, 
  Store, 
  FileText, 
  Settings, 
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/stores', label: 'Lojas', icon: Store },
  { href: '/dashboard/requests', label: 'Solicitações', icon: FileText },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const userInitial = user?.user_metadata?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U';
  const userName = user?.user_metadata?.name || 'Usuário';
  const userEmail = user?.email || '';

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        {/* Logo */}
        <div className="h-16 border-b border-border flex items-center px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Trocas.app</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-medium text-muted-foreground">{userInitial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{userName}</div>
              <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="w-full justify-start mt-1 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
