import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { streamChat, type ChatMessage as Msg } from "@/lib/streamChat";
import { Shield, Zap, Bug, Lock, FileCode } from "lucide-react";
import { toast } from "sonner";

const SUGGESTIONS = [
  { icon: Bug, label: "Analyze a vulnerability", prompt: "What are the most critical web application vulnerabilities in 2025 and how do I defend against them?" },
  { icon: FileCode, label: "Audit my code", prompt: "Review this code for security issues:\n\n```js\napp.get('/user', (req, res) => {\n  const id = req.query.id;\n  db.query(`SELECT * FROM users WHERE id = ${id}`);\n});\n```" },
  { icon: Lock, label: "Harden a server", prompt: "Give me a comprehensive Linux server hardening checklist for a production web server." },
  { icon: Zap, label: "Incident response", prompt: "We detected unauthorized access to our database. Walk me through an incident response plan." },
];

const Index = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (input: string) => {
    const userMsg: Msg = { role: "user", content: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      const text = assistantSoFar;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: text } : m));
        }
        return [...prev, { role: "assistant", content: text }];
      });
    };

    try {
      await streamChat({
        messages: updatedMessages,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed");
      setIsLoading(false);
    }
  }, [messages]);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground font-sans">
            SENTINEL
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            Cybersecurity AI Agent
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">Online</span>
        </div>
      </header>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              How can I secure your systems?
            </h2>
            <p className="mb-8 max-w-md text-center text-sm text-muted-foreground">
              I can analyze vulnerabilities, audit code, guide incident response, and recommend security hardening strategies.
            </p>
            <div className="grid w-full max-w-lg grid-cols-2 gap-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.prompt)}
                  disabled={isLoading}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5 disabled:opacity-50"
                >
                  <s.icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm text-foreground">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((m, i) => (
              <ChatMessage key={i} role={m.role} content={m.content} />
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <ChatMessage role="assistant" content="" />
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput onSend={send} disabled={isLoading} />
          <p className="mt-2 text-center text-xs text-muted-foreground font-mono">
            SENTINEL provides guidance only. Always verify recommendations with your security team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
