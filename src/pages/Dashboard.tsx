import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles, Trophy, Target, Users } from "lucide-react";
import OrganizerDashboard from "@/components/dashboards/OrganizerDashboard";
import VolunteerDashboard from "@/components/dashboards/VolunteerDashboard";
import SponsorDashboard from "@/components/dashboards/SponsorDashboard";
import ParticipantDashboard from "@/components/dashboards/ParticipantDashboard";
import { useState } from "react";

const ICONS: any = { organizer: Sparkles, volunteer: Trophy, sponsor: Target, participant: Users };

export default function Dashboard() {
  const { user, roles, loading } = useAuth();
  const nav = useNavigate();
  const [active, setActive] = useState<string | null>(null);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;

  const current = active || roles[0] || "participant";

  const signOut = async () => {
    await supabase.auth.signOut();
    nav("/");
  };

  const renderDash = () => {
    switch (current) {
      case "organizer": return <OrganizerDashboard />;
      case "volunteer": return <VolunteerDashboard />;
      case "sponsor": return <SponsorDashboard />;
      default: return <ParticipantDashboard />;
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-30 bg-background/40">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent ring-glow" />
            <span className="font-bold">EventTech</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {roles.length === 0 && <span className="text-xs text-muted-foreground">No role assigned</span>}
            {roles.map(r => {
              const Icon = ICONS[r];
              return (
                <button key={r} onClick={() => setActive(r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition ${
                    current === r ? "bg-primary text-primary-foreground" : "glass hover:bg-secondary"
                  }`}>
                  <Icon className="w-3 h-3" />{r}
                </button>
              );
            })}
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" />Sign out</Button>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">{renderDash()}</main>
    </div>
  );
}
