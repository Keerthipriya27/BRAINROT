import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Ticket, MapPin, Users, QrCode } from "lucide-react";
import { toast } from "sonner";

export default function ParticipantDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [regs, setRegs] = useState<any[]>([]);

  const load = async () => {
    const [e, r] = await Promise.all([
      supabase.from("events").select("*").neq("status", "draft").order("created_at", { ascending: false }),
      supabase.from("registrations").select("*, events(*)").eq("participant_id", user!.id),
    ]);
    setEvents(e.data || []);
    setRegs(r.data || []);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const register = async (id: string) => {
    const { error } = await supabase.from("registrations").insert({ event_id: id, participant_id: user!.id });
    if (error) return toast.error(error.message);
    toast.success("Registered! QR ticket generated.");
    load();
  };

  const registeredIds = new Set(regs.map(r => r.event_id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Discover</h1>
        <p className="text-muted-foreground text-sm">Find events that match your interests.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-semibold">Upcoming events</h2>
          {events.length === 0 && <div className="glass rounded-2xl p-6 text-center text-muted-foreground text-sm">No published events yet.</div>}
          {events.map(ev => (
            <div key={ev.id} className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{ev.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{ev.description}</div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location || "TBD"}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ev.capacity} seats</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary">{ev.category}</span>
                  </div>
                </div>
                {registeredIds.has(ev.id) ? (
                  <Button size="sm" variant="outline" disabled>Registered</Button>
                ) : (
                  <Button size="sm" onClick={() => register(ev.id)}>Register</Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="glass-strong rounded-2xl p-5 h-fit">
          <div className="flex items-center gap-2 mb-4"><Ticket className="w-4 h-4 text-accent" /><span className="font-semibold">My tickets</span></div>
          <div className="space-y-3">
            {regs.length === 0 && <div className="text-xs text-muted-foreground">No tickets yet.</div>}
            {regs.map(r => (
              <div key={r.id} className="glass rounded-xl p-3">
                <div className="text-sm font-medium">{r.events?.title}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><QrCode className="w-3 h-3" />{r.qr_code.slice(0, 12)}…</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
