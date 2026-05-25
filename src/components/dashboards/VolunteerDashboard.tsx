import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, Award, Target } from "lucide-react";
import { toast } from "sonner";

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [xp, setXp] = useState<any>({ xp: 0, level: 1 });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const load = async () => {
    const [t, x, lb] = await Promise.all([
      supabase.from("volunteer_tasks").select("*, events(title)").in("status", ["open", "claimed", "in_progress"]).order("created_at", { ascending: false }),
      supabase.from("volunteer_xp").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("volunteer_xp").select("xp, level, user_id, profiles!inner(display_name)").order("xp", { ascending: false }).limit(8),
    ]);
    setTasks(t.data || []);
    setXp(x.data || { xp: 0, level: 1 });
    setLeaderboard(lb.data || []);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const claim = async (task: any) => {
    const { error } = await supabase.from("volunteer_tasks").update({ assignee_id: user!.id, status: "claimed" }).eq("id", task.id);
    if (error) return toast.error(error.message);
    toast.success("Task claimed!");
    load();
  };

  const complete = async (task: any) => {
    const { error } = await supabase.from("volunteer_tasks").update({ status: "done" }).eq("id", task.id);
    if (error) return toast.error(error.message);
    const newXp = (xp.xp || 0) + (task.xp_reward || 50);
    const level = Math.floor(newXp / 200) + 1;
    await supabase.from("volunteer_xp").upsert({ user_id: user!.id, xp: newXp, level });
    toast.success(`+${task.xp_reward} XP earned!`);
    load();
  };

  const myTasks = tasks.filter(t => t.assignee_id === user!.id);
  const openTasks = tasks.filter(t => t.status === "open");
  const progress = (xp.xp % 200) / 2;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Volunteer Arena</h1>
        <p className="text-muted-foreground text-sm">Claim tasks, level up, climb the leaderboard.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-strong rounded-2xl p-5 md:col-span-2 ring-glow">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-muted-foreground">Level {xp.level}</div>
              <div className="text-3xl font-bold text-gradient">{xp.xp} XP</div>
            </div>
            <Zap className="w-8 h-8 text-accent" />
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">{200 - (xp.xp % 200)} XP to next level</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <Award className="w-5 h-5 text-accent mb-2" />
          <div className="text-2xl font-bold">{myTasks.length}</div>
          <div className="text-xs text-muted-foreground">Active tasks</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold">Open tasks</h2>
          {openTasks.length === 0 && <div className="glass rounded-2xl p-6 text-center text-muted-foreground text-sm">No open tasks right now.</div>}
          {openTasks.map(t => (
            <div key={t.id} className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.events?.title} · {t.skill_required || "any skill"} · +{t.xp_reward} XP</div>
              </div>
              <Button size="sm" onClick={() => claim(t)}>Claim</Button>
            </div>
          ))}

          <h2 className="font-semibold pt-4">My tasks</h2>
          {myTasks.map(t => (
            <div key={t.id} className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.events?.title} · status: {t.status}</div>
              </div>
              {t.status !== "done" && <Button size="sm" variant="outline" onClick={() => complete(t)}>Mark done</Button>}
            </div>
          ))}
        </div>

        <div className="glass-strong rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4"><Trophy className="w-4 h-4 text-accent" /><span className="font-semibold">Leaderboard</span></div>
          <div className="space-y-2">
            {leaderboard.map((row, i) => (
              <div key={row.user_id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className={`w-6 text-center font-bold ${i === 0 ? "text-accent" : "text-muted-foreground"}`}>{i + 1}</span>
                  <span>{row.profiles?.display_name || "anon"}</span>
                </span>
                <span className="text-xs font-mono">Lv{row.level} · {row.xp}</span>
              </div>
            ))}
            {leaderboard.length === 0 && <div className="text-xs text-muted-foreground">No XP yet — be the first!</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
