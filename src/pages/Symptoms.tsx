import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Search, Plus, ShieldAlert, Heart } from "lucide-react";
import { toast } from "sonner";

interface Symptom {
  id: string;
  name: string;
  description: string | null;
  severity: string;
  first_aid_guidance: string | null;
  species: string | null;
}

interface Animal {
  id: string;
  name: string;
  species: string;
}

export default function Symptoms() {
  const { user, role } = useAuth();
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [search, setSearch] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ animal_id: "", symptom_id: "", description: "", severity: "low" });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("symptoms").select("*").order("severity");
      if (data) setSymptoms(data);
      if (user && role === "pet_owner") {
        const { data: a } = await supabase.from("animals").select("id, name, species").eq("owner_id", user.id);
        if (a) setAnimals(a);
      }
    };
    load();
  }, [user, role]);

  const filtered = symptoms.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.species?.toLowerCase().includes(search.toLowerCase())
  );

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("symptom_reports").insert({
      animal_id: reportForm.animal_id,
      owner_id: user.id,
      symptom_id: reportForm.symptom_id || null,
      description: reportForm.description,
      severity: reportForm.severity,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Symptom reported successfully!");
    setReportOpen(false);
    setReportForm({ animal_id: "", symptom_id: "", description: "", severity: "low" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold">Symptoms & First Aid</h1>
        {role === "pet_owner" && (
          <Dialog open={reportOpen} onOpenChange={setReportOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Report Symptom</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Report a Symptom</DialogTitle></DialogHeader>
              <form onSubmit={handleReport} className="space-y-4">
                <div className="space-y-2">
                  <Label>Pet</Label>
                  <Select value={reportForm.animal_id} onValueChange={(v) => setReportForm({ ...reportForm, animal_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select pet" /></SelectTrigger>
                    <SelectContent>
                      {animals.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Related Symptom (optional)</Label>
                  <Select value={reportForm.symptom_id} onValueChange={(v) => setReportForm({ ...reportForm, symptom_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select symptom" /></SelectTrigger>
                    <SelectContent>
                      {symptoms.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={reportForm.description} onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Severity</Label>
                  <Select value={reportForm.severity} onValueChange={(v) => setReportForm({ ...reportForm, severity: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={!reportForm.animal_id || !reportForm.description}>Submit Report</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search symptoms by name or species..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((s) => (
          <Card key={s.id} className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  {s.name}
                </CardTitle>
                <span className={`status-badge severity-${s.severity}`}>{s.severity}</span>
              </div>
              {s.species && <p className="text-xs text-muted-foreground capitalize mt-1">Common in: {s.species}</p>}
            </CardHeader>
            <CardContent>
              {s.description && <p className="text-sm text-muted-foreground mb-3">{s.description}</p>}
              {s.first_aid_guidance && (
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs font-semibold text-secondary-foreground flex items-center gap-1 mb-1">
                    <Heart className="w-3 h-3" /> First Aid Guidance
                  </p>
                  <p className="text-sm text-secondary-foreground/80">{s.first_aid_guidance}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
