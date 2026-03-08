import ReactMarkdown from "react-markdown";
import { Shield, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isAgent = role === "assistant";

  return (
    <div className={`flex gap-3 ${isAgent ? "" : "flex-row-reverse"}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isAgent
            ? "bg-primary/10 border border-primary/20"
            : "bg-secondary border border-border"
        }`}
      >
        {isAgent ? (
          <Shield className="h-4 w-4 text-primary" />
        ) : (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isAgent
            ? "bg-card border border-border"
            : "bg-primary/10 border border-primary/20"
        }`}
      >
        {isAgent ? (
          <div className="prose prose-invert prose-sm max-w-none font-mono text-secondary-foreground prose-headings:text-foreground prose-headings:font-sans prose-strong:text-foreground prose-a:text-primary prose-code:text-primary prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-secondary prose-pre:border prose-pre:border-border">
            <ReactMarkdown>{content || "..."}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-foreground">{content}</p>
        )}
      </div>
    </div>
  );
}
