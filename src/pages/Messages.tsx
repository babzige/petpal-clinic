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
import { MessageSquare, Send, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender_profile?: { full_name: string } | null;
  receiver_profile?: { full_name: string } | null;
}

interface UserProfile {
  user_id: string;
  full_name: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ receiver_id: "", content: "" });

  const fetchMessages = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) {
      // Fetch profiles for senders/receivers
      const userIds = [...new Set(data.flatMap((m) => [m.sender_id, m.receiver_id]))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
      
      setMessages(data.map((m) => ({
        ...m,
        sender_profile: profileMap.get(m.sender_id) ?? null,
        receiver_profile: profileMap.get(m.receiver_id) ?? null,
      })));
    }
  };

  useEffect(() => {
    fetchMessages();
    const loadUsers = async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      if (data) setUsers(data.filter((u) => u.user_id !== user?.id));
    };
    loadUsers();
  }, [user]);

  // Mark messages as read
  useEffect(() => {
    if (!user || messages.length === 0) return;
    const unread = messages.filter((m) => m.receiver_id === user.id && !m.read).map((m) => m.id);
    if (unread.length > 0) {
      supabase.from("messages").update({ read: true }).in("id", unread).then();
    }
  }, [messages, user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: form.receiver_id,
      content: form.content,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Message sent!");
    setOpen(false);
    setForm({ receiver_id: "", content: "" });
    fetchMessages();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Messages</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Message</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Send Message</DialogTitle></DialogHeader>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label>To</Label>
                <Select value={form.receiver_id} onValueChange={(v) => setForm({ ...form, receiver_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
                  <SelectContent>
                    {users.map((u) => <SelectItem key={u.user_id} value={u.user_id}>{u.full_name || u.user_id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required rows={4} />
              </div>
              <Button type="submit" className="w-full" disabled={!form.receiver_id || !form.content}>
                <Send className="w-4 h-4 mr-2" /> Send
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {messages.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No messages yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => {
            const isSent = m.sender_id === user?.id;
            return (
              <Card key={m.id} className={`glass-card ${!m.read && !isSent ? "border-primary/30" : ""}`}>
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        {isSent ? `To: ${m.receiver_profile?.full_name ?? "Unknown"}` : `From: ${m.sender_profile?.full_name ?? "Unknown"}`}
                        {!m.read && !isSent && <span className="ml-2 text-primary font-medium">• New</span>}
                      </p>
                      <p className="text-sm text-foreground">{m.content}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(m.created_at), "MMM d, p")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
