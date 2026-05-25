import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";
import AiCopilot from "@/components/AiCopilot";

export default function SponsorDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [sponsorships, setSponsorships] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [pkg, setPkg] = useState({ package_name: "Gold", amount: 1000, industry: "Technology" });

  const load = async () => {
    const [e, s] = await Promise.all([
      supabase.from("events").select("*").neq("status", "draft").limit(20),
      supabase.from("sponsorships").select("*, events(title)").eq("sponsor_id", user!.id),
    ]);
    setEvents(e.data || []);
    setSponsorships(s.data || []);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const roiFor = (ev: any) => {
    // simple deterministic ROI signal: capacity x score x package amount
    const base = (ev.intelligence_score || 50) * Math.log10((ev.capacity || 50) + 10);
    return Math.round(base);
  };

  const propose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const roi = roiFor(selected);
    const { error } = await supabase.from("sponsorships").insert({
      event_id: selected.id, sponsor_id: user!.id, ...pkg, roi_score: roi,
    });
    if (error) return toast.error(error.message);
    toast.success("Sponsorship proposed!");
    setSelected(null); load();
  };

  const totalPledged = sponsorships.reduce((s, x) => s + Number(x.amount || 0), 0);
  const avgRoi = sponsorships.length ? Math.round(sponsorships.reduce((s, x) => s + (x.roi_score || 0), 0) / sponsorships.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sponsor Intelligence</h1>
        <p className="text-muted-foreground text-sm">AI-matched events with predicted ROI for your brand.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5"><Target className="w-5 h-5 text-accent mb-2" /><div className="text-2xl font-bold">{sponsorships.length}</div><div className="text-xs text-muted-foreground">Active sponsorships</div></div>
        <div className="glass rounded-2xl p-5"><DollarSign className="w-5 h-5 text-accent mb-2" /><div className="text-2xl font-bold">${totalPledged.toLocaleString()}</div><div className="text-xs text-muted-foreground">Total pledged</div></div>
        <div className="glass rounded-2xl p-5"><TrendingUp className="w-5 h-5 text-accent mb-2" /><div className="text-2xl font-bold text-gradient">{avgRoi}</div><div className="text-xs text-muted-foreground">Avg ROI score</div></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-semibold">Recommended events for your brand</h2>
          {events.map(ev => (
            <div key={ev.id} className="glass rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold">{ev.title}</div>
                <div className="text-xs text-muted-foreground">{ev.category} · cap {ev.capacity} · AI score {ev.intelligence_score}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right"><div className="text-xs text-muted-foreground">Predicted ROI</div><div className="font-bold text-gradient">{roiFor(ev)}</div></div>
                <Dialog open={selected?.id === ev.id} onOpenChange={(o) => setSelected(o ? ev : null)}>
                  <DialogTrigger asChild><Button size="sm">Sponsor</Button></DialogTrigger>
                  <DialogContent className="glass-strong">
                    <DialogHeader><DialogTitle>Propose sponsorship</DialogTitle></DialogHeader>
                    <form onSubmit={propose} className="space-y-3">
                      <div><Label>Package</Label><Input value={pkg.package_name} onChange={e => setPkg({ ...pkg, package_name: e.target.value })} /></div>
                      <div><Label>Amount ($)</Label><Input type="number" value={pkg.amount} onChange={e => setPkg({ ...pkg, amount: +e.target.value })} /></div>
                      <div><Label>Industry</Label><Input value={pkg.industry} onChange={e => setPkg({ ...pkg, industry: e.target.value })} /></div>
                      <Button type="submit" className="w-full">Propose</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}

          <h2 className="font-semibold pt-4">Your sponsorships</h2>
          {sponsorships.map(s => (
            <div key={s.id} className="glass rounded-2xl p-4 flex justify-between text-sm">
              <div><div className="font-medium">{s.events?.title}</div><div className="text-xs text-muted-foreground">{s.package_name} · ${Number(s.amount).toLocaleString()} · {s.status}</div></div>
              <div className="text-right text-xs"><div className="text-muted-foreground">ROI</div><div className="font-bold">{s.roi_score}</div></div>
            </div>
          ))}
        </div>
        <AiCopilot />
      </div>
    </div>
  );
}
