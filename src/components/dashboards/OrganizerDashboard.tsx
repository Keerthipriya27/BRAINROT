import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, TrendingUp, Users, Trophy, DollarSign } from "lucide-react";
import { toast } from "sonner";
import AiCopilot from "@/components/AiCopilot";

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "Tech", location: "", capacity: 100, budget: 0 });

  const load = async () => {
    const { data } = await supabase.from("events").select("*").eq("organizer_id", user!.id).order("created_at", { ascending: false });
    setEvents(data || []);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const score = Math.min(100, 40 + (form.capacity > 50 ? 15 : 0) + (form.budget > 1000 ? 20 : 5) + (form.description.length > 60 ? 15 : 0));
    const { error } = await supabase.from("events").insert({
      ...form, organizer_id: user!.id, status: "published", intelligence_score: score,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Event created!");
    setOpen(false);
    setForm({ title: "", description: "", category: "Tech", location: "", capacity: 100, budget: 0 });
    load();
  };

  const total = events.length;
  const totalCapacity = events.reduce((s, e) => s + (e.capacity || 0), 0);
  const totalBudget = events.reduce((s, e) => s + Number(e.budget || 0), 0);
  const avgScore = total ? Math.round(events.reduce((s, e) => s + (e.intelligence_score || 0), 0) / total) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizer Hub</h1>
          <p className="text-muted-foreground text-sm">AI-augmented command center for your events.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="ring-glow"><Plus className="w-4 h-4 mr-1" />New event</Button></DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader><DialogTitle>Create event</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
                <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
                <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: +e.target.value })} /></div>
                <div><Label>Budget ($)</Label><Input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: +e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: "Events", v: total, i: Calendar },
          { l: "Total capacity", v: totalCapacity, i: Users },
          { l: "Total budget", v: "$" + totalBudget.toLocaleString(), i: DollarSign },
          { l: "Avg AI score", v: avgScore + "/100", i: TrendingUp },
        ].map(s => (
          <div key={s.l} className="glass rounded-2xl p-5">
            <s.i className="w-5 h-5 text-accent mb-2" />
            <div className="text-2xl font-bold">{s.v}</div>
            <div className="text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-semibold">Your events</h2>
          {events.length === 0 && <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm">No events yet. Create your first one ↑</div>}
          {events.map(ev => (
            <div key={ev.id} className="glass rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold">{ev.title}</div>
                <div className="text-xs text-muted-foreground">{ev.category} · {ev.location || "TBD"} · cap {ev.capacity}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">AI Score</div>
                <div className="text-2xl font-bold text-gradient">{ev.intelligence_score}</div>
              </div>
            </div>
          ))}
        </div>
        <AiCopilot mode="event_builder" />
      </div>
    </div>
  );
}
