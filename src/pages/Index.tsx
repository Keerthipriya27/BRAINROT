import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, Target, Users, Brain, Activity, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const features = [
  { icon: Brain, title: "AI Event Copilot", desc: "Conversational assistant that builds timelines, predicts risks and writes marketing copy." },
  { icon: Trophy, title: "Gamified Volunteers", desc: "XP, levels, badges, leaderboard. Tasks auto-assigned by skill + availability." },
  { icon: Target, title: "Sponsor ROI Intelligence", desc: "AI-matched sponsors with predicted ROI, smart packages and engagement tracking." },
  { icon: Users, title: "Participant Experience", desc: "One-click discovery, QR tickets, networking, certificate vault and live feed." },
  { icon: Activity, title: "Live Command Center", desc: "Realtime dashboard during execution: tasks, alerts, volunteer pings, attendance." },
  { icon: Sparkles, title: "Event Intelligence Score", desc: "Every event gets a score: success rate, engagement fit, sponsor fit, volunteer strength." },
];

export default function Index() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent ring-glow" />
          <span className="font-bold text-lg tracking-tight">EventTech</span>
        </div>
        <nav className="flex items-center gap-3">
          {user ? (
            <Button asChild><Link to="/app">Open dashboard</Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
              <Button asChild><Link to="/auth?mode=signup">Get started</Link></Button>
            </>
          )}
        </nav>
      </header>

      <section className="container mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-xs uppercase tracking-widest mb-8 text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-accent" /> The intelligent event operating system
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] max-w-4xl mx-auto">
          Events that <span className="text-gradient">think for themselves.</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          EventTech connects organizers, volunteers, sponsors and participants in one AI-powered ecosystem —
          with gamified workflows, predictive ROI and a real-time command center.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button asChild size="lg" className="ring-glow">
            <Link to="/auth?mode=signup">Launch your event <ArrowRight className="ml-1" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">I'm a volunteer / sponsor</Link>
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 hover:ring-glow transition">
              <f.icon className="w-7 h-7 text-accent mb-4" />
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-6 pb-32">
        <div className="glass-strong rounded-3xl p-10 md:p-16 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Built for the next generation of events.</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            From a 50-person hackathon to a 50,000-person festival. One platform, four roles, infinite intelligence.
          </p>
          <Button asChild size="lg" className="ring-glow">
            <Link to="/auth?mode=signup">Create your free account</Link>
          </Button>
        </div>
      </section>

      <footer className="container mx-auto px-6 py-10 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} EventTech — Intelligent Event Ecosystem Platform
      </footer>
    </div>
  );
}
