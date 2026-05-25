import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Trophy, Target, Sparkles } from "lucide-react";

type Role = "organizer" | "volunteer" | "sponsor" | "participant";
const ROLES: { value: Role; label: string; icon: any; desc: string }[] = [
  { value: "organizer", label: "Organizer", icon: Sparkles, desc: "Run events" },
  { value: "volunteer", label: "Volunteer", icon: Trophy, desc: "Earn XP" },
  { value: "sponsor", label: "Sponsor", icon: Target, desc: "Reach audiences" },
  { value: "participant", label: "Participant", icon: Users, desc: "Attend events" },
];

export default function Auth() {
  const [params] = useSearchParams();
  const initial = params.get("mode") === "signup";
  const [isSignup, setIsSignup] = useState(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("organizer");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin + "/app",
            data: { display_name: name },
          },
        });
        if (error) throw error;
        const uid = data.user?.id;
        if (uid) {
          await supabase.from("user_roles").insert({ user_id: uid, role });
        }
        toast.success("Account created — welcome to EventTech!");
        nav("/app");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        nav("/app");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent" />
          <span className="font-bold">EventTech</span>
        </Link>
        <div className="glass-strong rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-1">{isSignup ? "Create account" : "Welcome back"}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {isSignup ? "Join the intelligent event ecosystem." : "Sign in to your EventTech account."}
          </p>
          <form onSubmit={submit} className="space-y-4">
            {isSignup && (
              <>
                <div>
                  <Label htmlFor="name">Display name</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <Label>I am a…</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {ROLES.map(r => (
                      <button
                        type="button"
                        key={r.value}
                        onClick={() => setRole(r.value)}
                        className={`p-3 rounded-lg text-left border transition ${
                          role === r.value
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <r.icon className="w-4 h-4 mb-1 text-accent" />
                        <div className="text-sm font-medium">{r.label}</div>
                        <div className="text-[10px] text-muted-foreground">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full ring-glow" disabled={loading}>
              {loading ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
            </Button>
          </form>
          <button onClick={() => setIsSignup(s => !s)} className="block text-center w-full mt-4 text-sm text-muted-foreground hover:text-foreground">
            {isSignup ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
