import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Clock } from "lucide-react";

interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  opening_hours: string | null;
}

export default function Clinics() {
  const [clinics, setClinics] = useState<Clinic[]>([]);

  useEffect(() => {
    supabase.from("clinics").select("*").order("name").then(({ data }) => {
      if (data) setClinics(data);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Find Clinics</h1>

      {clinics.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No clinics registered yet. Ask an administrator to add clinics.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clinics.map((c) => (
            <Card key={c.id} className="glass-card hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    <p className="text-sm text-muted-foreground">{c.address}</p>
                  </div>
                </div>
                {c.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" /> {c.phone}
                  </div>
                )}
                {c.opening_hours && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" /> {c.opening_hours}
                  </div>
                )}
                {c.lat && c.lng && (
                  <a
                    href={`https://www.google.com/maps?q=${c.lat},${c.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm text-primary hover:underline font-medium"
                  >
                    View on Map →
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
