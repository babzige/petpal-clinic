import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PawPrint, Calendar, MessageSquare, AlertTriangle, Users, MapPin } from "lucide-react";

export default function Dashboard() {
  const { user, role, profile } = useAuth();
  const [stats, setStats] = useState({ animals: 0, appointments: 0, messages: 0, pending: 0, users: 0, clinics: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const s: typeof stats = { animals: 0, appointments: 0, messages: 0, pending: 0, users: 0, clinics: 0 };

      if (role === "pet_owner") {
        const [a, ap, m] = await Promise.all([
          supabase.from("animals").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
          supabase.from("appointments").select("id", { count: "exact", head: true }).eq("pet_owner_id", user.id),
          supabase.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", user.id).eq("read", false),
        ]);
        s.animals = a.count ?? 0;
        s.appointments = ap.count ?? 0;
        s.messages = m.count ?? 0;
      } else if (role === "doctor") {
        const [ap, p, m] = await Promise.all([
          supabase.from("appointments").select("id", { count: "exact", head: true }),
          supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", user.id).eq("read", false),
        ]);
        s.appointments = ap.count ?? 0;
        s.pending = p.count ?? 0;
        s.messages = m.count ?? 0;
      } else if (role === "admin") {
        const [u, c, ap] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("clinics").select("id", { count: "exact", head: true }),
          supabase.from("appointments").select("id", { count: "exact", head: true }),
        ]);
        s.users = u.count ?? 0;
        s.clinics = c.count ?? 0;
        s.appointments = ap.count ?? 0;
      }
      setStats(s);
    };
    load();
  }, [user, role]);

  const ownerCards = [
    { label: "My Pets", value: stats.animals, icon: PawPrint, color: "text-primary" },
    { label: "Appointments", value: stats.appointments, icon: Calendar, color: "text-info" },
    { label: "Unread Messages", value: stats.messages, icon: MessageSquare, color: "text-warning" },
  ];

  const doctorCards = [
    { label: "Total Appointments", value: stats.appointments, icon: Calendar, color: "text-primary" },
    { label: "Pending Approval", value: stats.pending, icon: AlertTriangle, color: "text-warning" },
    { label: "Unread Messages", value: stats.messages, icon: MessageSquare, color: "text-info" },
  ];

  const adminCards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "text-primary" },
    { label: "Clinics", value: stats.clinics, icon: MapPin, color: "text-info" },
    { label: "Appointments", value: stats.appointments, icon: Calendar, color: "text-warning" },
  ];

  const cards = role === "admin" ? adminCards : role === "doctor" ? doctorCards : ownerCards;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Welcome back, {profile?.full_name || "there"}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's an overview of your activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="text-3xl font-bold mt-1">{c.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${c.color}`}>
                  <c.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
