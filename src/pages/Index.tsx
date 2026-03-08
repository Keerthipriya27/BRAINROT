import { useState, useCallback } from "react";
import { ImageDropzone } from "@/components/ImageDropzone";
import { AnalysisResult } from "@/components/AnalysisResult";
import { Eye, X } from "lucide-react";
import { toast } from "sonner";

const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-image`;

const Index = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const analyzeImage = useCallback(async (base64: string) => {
    setImage(base64);
    setAnalysis("");
    setIsLoading(true);

    try {
      const resp = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Analysis failed" }));
        throw new Error(err.error || "Analysis failed");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAnalysis(fullText);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = () => {
    setImage(null);
    setAnalysis("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Eye className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Image Analyzer
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload an image and get instant AI-powered analysis
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {!image ? (
            <ImageDropzone onImageSelect={analyzeImage} disabled={isLoading} />
          ) : (
            <div className="space-y-6">
              {/* Image preview */}
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
                <button
                  onClick={reset}
                  className="absolute right-3 top-3 z-10 rounded-lg bg-background/80 p-1.5 backdrop-blur-sm transition-colors hover:bg-background"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
                <img
                  src={image}
                  alt="Uploaded"
                  className="w-full max-h-[400px] object-contain"
                />
              </div>

              {/* Analysis */}
              <AnalysisResult content={analysis} isLoading={isLoading} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
