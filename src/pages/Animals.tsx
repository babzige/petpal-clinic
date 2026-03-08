import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PawPrint, Plus, Weight, Clock } from "lucide-react";
import { toast } from "sonner";

interface Animal {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  age_years: number | null;
  weight_kg: number | null;
  notes: string | null;
  owner_id: string;
}

export default function Animals() {
  const { user, role } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", species: "dog", breed: "", age_years: "", weight_kg: "", notes: "" });

  const fetchAnimals = async () => {
    if (!user) return;
    let q = supabase.from("animals").select("*").order("created_at", { ascending: false });
    if (role === "pet_owner") q = q.eq("owner_id", user.id);
    const { data } = await q;
    if (data) setAnimals(data);
  };

  useEffect(() => { fetchAnimals(); }, [user, role]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("animals").insert({
      owner_id: user.id,
      name: form.name,
      species: form.species,
      breed: form.breed || null,
      age_years: form.age_years ? Number(form.age_years) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      notes: form.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Pet added!");
    setOpen(false);
    setForm({ name: "", species: "dog", breed: "", age_years: "", weight_kg: "", notes: "" });
    fetchAnimals();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">{role === "pet_owner" ? "My Pets" : "Patients"}</h1>
        {role === "pet_owner" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Add Pet</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Pet</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Species</Label>
                  <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="bird">Bird</SelectItem>
                      <SelectItem value="rabbit">Rabbit</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Breed</Label>
                    <Input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Age (years)</Label>
                    <Input type="number" value={form.age_years} onChange={(e) => setForm({ ...form, age_years: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input type="number" step="0.1" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button type="submit" className="w-full">Add Pet</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {animals.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <PawPrint className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No pets registered yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {animals.map((a) => (
            <Card key={a.id} className="glass-card hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <PawPrint className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{a.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{a.species}{a.breed ? ` • ${a.breed}` : ""}</p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                      {a.age_years && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.age_years}y</span>}
                      {a.weight_kg && <span className="flex items-center gap-1"><Weight className="w-3 h-3" />{a.weight_kg}kg</span>}
                    </div>
                    {a.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{a.notes}</p>}
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
