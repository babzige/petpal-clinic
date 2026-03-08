import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  opening_hours: string | null;
}

export default function ManageClinics() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "", lat: "", lng: "", opening_hours: "" });

  const fetchClinics = async () => {
    const { data } = await supabase.from("clinics").select("*").order("name");
    if (data) setClinics(data);
  };

  useEffect(() => { fetchClinics(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("clinics").insert({
      name: form.name,
      address: form.address,
      phone: form.phone || null,
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
      opening_hours: form.opening_hours || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Clinic added!");
    setOpen(false);
    setForm({ name: "", address: "", phone: "", lat: "", lng: "", opening_hours: "" });
    fetchClinics();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("clinics").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Clinic removed");
    fetchClinics();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Manage Clinics</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Clinic</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Clinic</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Opening Hours</Label>
                <Input value={form.opening_hours} onChange={(e) => setForm({ ...form, opening_hours: e.target.value })} placeholder="Mon-Fri 9am-6pm" />
              </div>
              <Button type="submit" className="w-full">Add Clinic</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {clinics.map((c) => (
          <Card key={c.id} className="glass-card">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.address}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
