import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Appointment {
  id: string;
  appointment_date: string;
  status: string;
  reason: string | null;
  notes: string | null;
  animal_id: string;
  pet_owner_id: string;
  animals?: { name: string; species: string } | null;
}

interface Animal {
  id: string;
  name: string;
  species: string;
}

export default function Appointments() {
  const { user, role } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ animal_id: "", date: "", reason: "" });

  const fetchAll = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("appointments")
      .select("*, animals(name, species)")
      .order("appointment_date", { ascending: false });
    if (data) setAppointments(data);

    if (role === "pet_owner") {
      const { data: a } = await supabase.from("animals").select("id, name, species").eq("owner_id", user.id);
      if (a) setAnimals(a);
    }
  };

  useEffect(() => { fetchAll(); }, [user, role]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("appointments").insert({
      pet_owner_id: user.id,
      animal_id: form.animal_id,
      appointment_date: new Date(form.date).toISOString(),
      reason: form.reason || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Appointment requested!");
    setOpen(false);
    setForm({ animal_id: "", date: "", reason: "" });
    fetchAll();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Appointment ${status}`);
    fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Appointments</h1>
        {role === "pet_owner" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Book Appointment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Book Appointment</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Pet</Label>
                  <Select value={form.animal_id} onValueChange={(v) => setForm({ ...form, animal_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choose a pet" /></SelectTrigger>
                    <SelectContent>
                      {animals.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name} ({a.species})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  <Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Describe the reason for the visit..." />
                </div>
                <Button type="submit" className="w-full" disabled={!form.animal_id}>Book Appointment</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {appointments.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No appointments yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <Card key={apt.id} className="glass-card">
              <CardContent className="py-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {apt.animals?.name ?? "Unknown Pet"} — {apt.animals?.species ?? ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(apt.appointment_date), "PPP 'at' p")}
                      </p>
                      {apt.reason && <p className="text-sm text-muted-foreground mt-1">{apt.reason}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`status-badge status-${apt.status}`}>{apt.status}</span>
                    {(role === "doctor" || role === "admin") && apt.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(apt.id, "approved")}>
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(apt.id, "rejected")}>
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
