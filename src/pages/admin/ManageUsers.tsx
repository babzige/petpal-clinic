import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface UserWithRole {
  user_id: string;
  full_name: string;
  phone: string | null;
  role?: string;
}

export default function ManageUsers() {
  const [users, setUsers] = useState<UserWithRole[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, phone");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) ?? []);
      if (profiles) {
        setUsers(profiles.map((p) => ({ ...p, role: roleMap.get(p.user_id) ?? "unknown" })));
      }
    };
    load();
  }, []);

  const roleBadgeColor = (role: string) => {
    if (role === "admin") return "destructive" as const;
    if (role === "doctor") return "default" as const;
    return "secondary" as const;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Manage Users</h1>

      {users.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No users found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.user_id} className="glass-card">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{u.full_name || "Unnamed"}</p>
                    <p className="text-sm text-muted-foreground">{u.phone ?? "No phone"}</p>
                  </div>
                  <Badge variant={roleBadgeColor(u.role ?? "")}>{u.role}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
