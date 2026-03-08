import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  PawPrint, Calendar, MessageSquare, MapPin, Stethoscope,
  LayoutDashboard, Users, Settings, LogOut, Menu, X, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const roleLabels = { admin: "Administrator", doctor: "Veterinary Doctor", pet_owner: "Pet Owner" };

const navItems = {
  pet_owner: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/animals", icon: PawPrint, label: "My Pets" },
    { to: "/symptoms", icon: AlertTriangle, label: "Symptoms & First Aid" },
    { to: "/appointments", icon: Calendar, label: "Appointments" },
    { to: "/messages", icon: MessageSquare, label: "Messages" },
    { to: "/clinics", icon: MapPin, label: "Find Clinics" },
  ],
  doctor: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/appointments", icon: Calendar, label: "Appointments" },
    { to: "/animals", icon: PawPrint, label: "Patients" },
    { to: "/messages", icon: MessageSquare, label: "Messages" },
    { to: "/symptoms", icon: Stethoscope, label: "Symptom Reports" },
  ],
  admin: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/users", icon: Users, label: "Manage Users" },
    { to: "/admin/clinics", icon: MapPin, label: "Manage Clinics" },
    { to: "/admin/symptoms", icon: AlertTriangle, label: "Manage Symptoms" },
    { to: "/appointments", icon: Calendar, label: "All Appointments" },
    { to: "/messages", icon: MessageSquare, label: "Messages" },
  ],
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, role, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const items = navItems[role ?? "pet_owner"];

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <PawPrint className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-sidebar-foreground">VetCare</h1>
            <p className="text-xs text-sidebar-foreground/60">{roleLabels[role ?? "pet_owner"]}</p>
          </div>
          <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-semibold text-sidebar-primary">
              {(profile?.full_name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || "User"}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-6 h-14 flex items-center gap-4">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="font-display text-lg font-semibold text-foreground">
            {items.find((i) => i.to === location.pathname)?.label ?? "Dashboard"}
          </h2>
        </header>
        <main className="flex-1 p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
