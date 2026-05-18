import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon, Sparkles, Copy, Loader2, Zap, Code2 } from "lucide-react";
import { toast } from "sonner";

const PREDICT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/predict-image`;

type Prediction = {
  success: boolean;
  model: string;
  processing_time_ms: number;
  predictions: {
    caption?: string;
    labels?: { label: string; confidence: number }[];
    categories?: string[];
    dominant_colors?: string[];
    detected_text?: string;
    nsfw?: boolean;
    safe_for_work?: boolean;
  };
};

const Index = () => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Prediction | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageData(reader.result);
        setResult(null);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const predict = useCallback(async () => {
    if (!imageData) return;
    setLoading(true);
    setResult(null);
    try {
      const resp = await fetch(PREDICT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ image: imageData }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Prediction failed");
      setResult(json);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  }, [imageData]);

  const copyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast.success("Copied JSON to clipboard");
  };

  const curlExample = `curl -X POST '${PREDICT_URL}' \\
  -H 'Content-Type: application/json' \\
  -H 'apikey: ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}' \\
  -d '{"image": "https://example.com/photo.jpg"}'`;

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-10">
        {/* Header */}
        <header className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/40">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">Image Prediction API</h1>
              <p className="text-xs text-muted-foreground">Vision-powered classification, captioning & metadata</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider text-emerald-300">API Live</span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload + Preview */}
          <section className="glass-strong rounded-3xl p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Upload className="h-4 w-4" /> Try the API
            </h2>

            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false);
                const f = e.dataTransfer.files[0]; if (f) handleFile(f);
              }}
              className={`relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
                dragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              {imageData ? (
                <img src={imageData} alt="Selected" className="h-full w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="rounded-xl bg-secondary p-3">
                    <ImageIcon className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-foreground">Drop an image or <span className="text-accent underline underline-offset-4">browse</span></p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP · up to 8MB</p>
                </div>
              )}
              <input
                type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </label>

            <button
              onClick={predict}
              disabled={!imageData || loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Predicting…</> : <><Zap className="h-4 w-4" /> Run Prediction</>}
            </button>
          </section>

          {/* Result */}
          <section className="glass-strong rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-4 w-4" /> Predictions
              </h2>
              {result && (
                <button onClick={copyJson} className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground hover:text-foreground">
                  <Copy className="h-3 w-3" /> Copy JSON
                </button>
              )}
            </div>

            {!result && !loading && (
              <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                Run a prediction to see results
              </div>
            )}
            {loading && (
              <div className="flex h-[300px] items-center justify-center rounded-2xl text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing image…
              </div>
            )}
            {result && (
              <div className="space-y-4">
                {result.predictions.caption && (
                  <div className="rounded-2xl bg-secondary/60 p-4">
                    <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Caption</p>
                    <p className="text-sm text-foreground">{result.predictions.caption}</p>
                  </div>
                )}
                {result.predictions.labels && (
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Labels</p>
                    <div className="space-y-1.5">
                      {result.predictions.labels.slice(0, 8).map((l, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-32 shrink-0 truncate text-xs text-foreground">{l.label}</span>
                          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent"
                              style={{ width: `${Math.round((l.confidence ?? 0) * 100)}%` }}
                            />
                          </div>
                          <span className="w-10 text-right font-mono text-[10px] text-muted-foreground">
                            {Math.round((l.confidence ?? 0) * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.predictions.dominant_colors && (
                  <div>
                    <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Dominant Colors</p>
                    <div className="flex gap-2">
                      {result.predictions.dominant_colors.map((c, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div className="h-10 w-10 rounded-lg border border-border" style={{ background: c }} />
                          <span className="font-mono text-[9px] text-muted-foreground">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.predictions.detected_text && (
                  <div className="rounded-2xl bg-secondary/60 p-4">
                    <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Detected Text</p>
                    <p className="text-sm text-foreground">{result.predictions.detected_text}</p>
                  </div>
                )}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Model: {result.model}</span>
                  <span>{result.processing_time_ms}ms</span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* API Docs */}
        <section className="glass-strong rounded-3xl p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Code2 className="h-4 w-4" /> API Reference
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Endpoint</p>
              <pre className="overflow-x-auto rounded-xl bg-background/60 p-3 font-mono text-xs text-accent">POST {PREDICT_URL}</pre>
              <p className="mt-4 mb-2 text-xs text-muted-foreground">Request body</p>
              <pre className="overflow-x-auto rounded-xl bg-background/60 p-3 font-mono text-xs text-foreground">{`{
  "image": "<image URL or base64 data URL>"
}`}</pre>
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">cURL example</p>
              <pre className="overflow-x-auto rounded-xl bg-background/60 p-3 font-mono text-[11px] leading-relaxed text-foreground">{curlExample}</pre>
              <p className="mt-4 mb-2 text-xs text-muted-foreground">Response shape</p>
              <pre className="overflow-x-auto rounded-xl bg-background/60 p-3 font-mono text-[11px] text-muted-foreground">{`{
  "success": true,
  "model": "...",
  "processing_time_ms": 1234,
  "predictions": {
    "caption": "...",
    "labels": [{ "label": "...", "confidence": 0.95 }],
    "categories": ["..."],
    "dominant_colors": ["#rrggbb"],
    "detected_text": "..."
  }
}`}</pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
