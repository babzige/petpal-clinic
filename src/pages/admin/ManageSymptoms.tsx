import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Symptom {
  id: string;
  name: string;
  description: string | null;
  severity: string;
  first_aid_guidance: string | null;
  species: string | null;
}

export default function ManageSymptoms() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", severity: "low", first_aid_guidance: "", species: "" });

  const fetchSymptoms = async () => {
    const { data } = await supabase.from("symptoms").select("*").order("name");
    if (data) setSymptoms(data);
  };

  useEffect(() => { fetchSymptoms(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("symptoms").insert({
      name: form.name,
      description: form.description || null,
      severity: form.severity,
      first_aid_guidance: form.first_aid_guidance || null,
      species: form.species || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Symptom added!");
    setOpen(false);
    setForm({ name: "", description: "", severity: "low", first_aid_guidance: "", species: "" });
    fetchSymptoms();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("symptoms").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Symptom removed");
    fetchSymptoms();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Manage Symptoms</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Symptom</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Symptom</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Species</Label>
                  <Input value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} placeholder="e.g., dog, cat" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>First Aid Guidance</Label>
                <Textarea value={form.first_aid_guidance} onChange={(e) => setForm({ ...form, first_aid_guidance: e.target.value })} rows={4} />
              </div>
              <Button type="submit" className="w-full">Add Symptom</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {symptoms.map((s) => (
          <Card key={s.id} className="glass-card">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <div>
                    <p className="font-medium text-foreground">{s.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{s.severity} • {s.species ?? "All species"}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)}>
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
