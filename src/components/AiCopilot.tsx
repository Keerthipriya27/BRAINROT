import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brain, Send, Loader2 } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export default function AiCopilot({ mode = "default" }: { mode?: "default" | "event_builder" }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: mode === "event_builder"
        ? "Tell me about your event idea — I'll draft a timeline, pricing, sponsor categories and volunteer roles."
        : "I'm your EventTech AI Copilot. Ask me anything about your events, sponsors, volunteers or participants." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("event-copilot", {
        body: { messages: next, mode },
      });
      if (error) throw error;
      setMessages([...next, { role: "assistant", content: data.reply || "(no response)" }]);
    } catch (e: any) {
      setMessages([...next, { role: "assistant", content: "⚠️ " + (e.message || "AI error") }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="glass-strong rounded-2xl flex flex-col h-[480px]">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Brain className="w-4 h-4 text-accent" />
        <span className="font-medium text-sm">AI Event Copilot</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}>{m.content}</div>
          </div>
        ))}
        {loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" />thinking…</div>}
      </div>
      <div className="p-3 border-t border-border flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask the copilot…" />
        <Button onClick={send} disabled={loading} size="icon"><Send className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}
