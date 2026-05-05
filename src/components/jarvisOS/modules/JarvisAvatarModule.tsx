import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Power } from "lucide-react";
import { sendMessageToJarvis } from "@/services/huggingfaceService";
import { toast } from "@/components/ui/use-toast";
import { FeatureKey } from "../featureRegistry";

interface Props {
  onNavigate?: (key: FeatureKey) => void;
}

// Map of voice phrases -> module keys
const NAV_COMMANDS: Array<{ patterns: RegExp; target: FeatureKey; label: string }> = [
  { patterns: /\b(open|show|go to)\s+(security|shield|cyber)/i, target: "security", label: "Cyber Shield" },
  { patterns: /\b(open|show|go to)\s+(market|stock)/i, target: "stocks", label: "Markets" },
  { patterns: /\b(open|show|go to)\s+news/i, target: "news", label: "News" },
  { patterns: /\b(open|show|go to)\s+(weather|aqi)/i, target: "weather", label: "Weather" },
  { patterns: /\b(open|show|go to)\s+(sports|score)/i, target: "sports", label: "Sports" },
  { patterns: /\b(open|show|go to)\s+(transport|traffic|train|flight)/i, target: "transport", label: "Transport" },
  { patterns: /\b(open|show|go to)\s+(money|forex|gold)/i, target: "money", label: "Money" },
  { patterns: /\b(open|show|go to)\s+(earth|quake|iss|launch)/i, target: "earth", label: "Earth Pulse" },
  { patterns: /\b(open|show|go to)\s+(utilit|tools|dashboard)/i, target: "utilities", label: "Utilities" },
  { patterns: /\b(open|show|go to)\s+(home|command|center)/i, target: "command-center", label: "Command Center" },
  { patterns: /\b(open|show|go to)\s+search/i, target: "search", label: "Search" },
  { patterns: /\b(open|show|go to)\s+(business|crm)/i, target: "business", label: "Business" },
  { patterns: /\b(open|show|go to)\s+health/i, target: "health", label: "Health" },
];

export default function JarvisAvatarModule({ onNavigate }: Props) {
  const [listening, setListening] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0); // 0..1 for lip sync
  const [history, setHistory] = useState<Array<{ role: string; content: string }>>([]);

  const recognitionRef = useRef<any>(null);
  const lipSyncRafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // ---- Speech Recognition ----
  const initRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({ title: "Voice not supported", description: "Use Chrome/Edge for voice features.", variant: "destructive" });
      return null;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IN";
    return rec;
  }, []);

  const handleCommand = useCallback(async (text: string) => {
    const lower = text.toLowerCase().trim();
    if (!lower) return;

    // Wake word check in continuous mode
    const hasWake = /\bjarvis\b/i.test(lower);
    if (continuous && !hasWake) return;
    const cleaned = lower.replace(/\bjarvis\b/i, "").trim();
    if (!cleaned) return;

    setTranscript(text);

    // Check navigation commands
    for (const cmd of NAV_COMMANDS) {
      if (cmd.patterns.test(cleaned)) {
        const msg = `Opening ${cmd.label}, sir.`;
        setReply(msg);
        speak(msg);
        onNavigate?.(cmd.target);
        return;
      }
    }

    // System commands
    if (/scan\s+system|status|diagnos/i.test(cleaned)) {
      const msg = "All systems are nominal. Network online. Power at full capacity.";
      setReply(msg);
      speak(msg);
      return;
    }
    if (/stop listening|sleep|shut up/i.test(cleaned)) {
      const msg = "Going silent. Wake me when you need me.";
      setReply(msg);
      speak(msg);
      stopListening();
      return;
    }

    // Otherwise → AI brain
    setThinking(true);
    try {
      const res = await sendMessageToJarvis(cleaned, history);
      setReply(res);
      setHistory((h) => [...h, { role: "user", content: cleaned }, { role: "assistant", content: res }].slice(-10));
      speak(res);
    } catch (e) {
      const msg = "My circuits are momentarily overloaded.";
      setReply(msg);
      speak(msg);
    } finally {
      setThinking(false);
    }
  }, [continuous, history, onNavigate]);

  const startListening = () => {
    let rec = recognitionRef.current;
    if (!rec) {
      rec = initRecognition();
      if (!rec) return;
      recognitionRef.current = rec;
    }
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      setTranscript((finalText + interim).trim());
      if (finalText.trim()) {
        const t = finalText.trim();
        finalText = "";
        handleCommand(t);
      }
    };
    rec.onerror = (e: any) => {
      console.warn("SR error:", e.error);
      if (e.error === "not-allowed") {
        toast({ title: "Mic blocked", description: "Allow microphone access.", variant: "destructive" });
        setListening(false);
      }
    };
    rec.onend = () => {
      if (listening) {
        try { rec.start(); } catch {}
      }
    };
    try {
      rec.start();
      setListening(true);
    } catch (e) { /* already started */ }
  };

  const stopListening = () => {
    setListening(false);
    setContinuous(false);
    try { recognitionRef.current?.stop(); } catch {}
  };

  // ---- TTS + Lip sync ----
  const speak = (text: string) => {
    if (muted || !text) return;
    try { window.speechSynthesis.cancel(); } catch {}
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.pitch = 0.9;
    u.lang = "en-GB";
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => /male|google uk|daniel|david/i.test(v.name)) || voices.find(v => v.lang.startsWith("en"));
    if (preferred) u.voice = preferred;

    u.onstart = () => {
      setSpeaking(true);
      // Approximate lip-sync via random oscillation since SpeechSynthesis has no audio stream
      const animate = () => {
        setMouthOpen(0.2 + Math.random() * 0.8);
        lipSyncRafRef.current = requestAnimationFrame(animate);
      };
      animate();
    };
    u.onend = () => {
      setSpeaking(false);
      setMouthOpen(0);
      if (lipSyncRafRef.current) cancelAnimationFrame(lipSyncRafRef.current);
    };
    window.speechSynthesis.speak(u);
  };

  useEffect(() => {
    return () => {
      try { recognitionRef.current?.stop(); } catch {}
      try { window.speechSynthesis.cancel(); } catch {}
      if (lipSyncRafRef.current) cancelAnimationFrame(lipSyncRafRef.current);
    };
  }, []);

  const toggleContinuous = () => {
    if (continuous) {
      setContinuous(false);
      stopListening();
    } else {
      setContinuous(true);
      startListening();
      toast({ title: "Wake-word mode", description: "Say 'Jarvis…' to talk." });
    }
  };

  const greet = () => {
    const msg = "J.A.R.V.I.S. online. All systems operational. How can I assist?";
    setReply(msg);
    speak(msg);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Avatar HUD */}
      <Card className="relative overflow-hidden p-6 md:p-10 bg-gradient-to-br from-background via-primary/5 to-background border-primary/30">
        <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--primary)/0.4),transparent_60%)]" />
        <div className="relative flex flex-col items-center gap-6">
          <AvatarFace speaking={speaking} listening={listening} mouthOpen={mouthOpen} thinking={thinking} />

          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant={listening ? "default" : "outline"} className={listening ? "animate-pulse" : ""}>
              {listening ? "● LISTENING" : "○ IDLE"}
            </Badge>
            {continuous && <Badge variant="destructive">WAKE-WORD MODE</Badge>}
            {speaking && <Badge>SPEAKING</Badge>}
            {thinking && <Badge variant="secondary">THINKING…</Badge>}
            {muted && <Badge variant="outline">MUTED</Badge>}
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              size="sm"
              variant={listening && !continuous ? "destructive" : "default"}
              onClick={() => listening && !continuous ? stopListening() : startListening()}
            >
              {listening && !continuous ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
              {listening && !continuous ? "Stop" : "Talk Once"}
            </Button>
            <Button size="sm" variant={continuous ? "destructive" : "outline"} onClick={toggleContinuous}>
              <Sparkles className="w-4 h-4 mr-1" />
              {continuous ? "Stop Wake-Word" : "Continuous"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setMuted((m) => !m)}>
              {muted ? <VolumeX className="w-4 h-4 mr-1" /> : <Volume2 className="w-4 h-4 mr-1" />}
              {muted ? "Unmute" : "Mute"}
            </Button>
            <Button size="sm" variant="outline" onClick={greet}>
              <Power className="w-4 h-4 mr-1" /> Boot Greeting
            </Button>
          </div>
        </div>
      </Card>

      {/* Transcript / Reply */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-2">YOU SAID</div>
          <div className="min-h-[60px] text-sm font-mono">{transcript || "—"}</div>
        </Card>
        <Card className="p-4 border-primary/40">
          <div className="text-xs text-primary mb-2">JARVIS</div>
          <div className="min-h-[60px] text-sm">{reply || "Awaiting command…"}</div>
        </Card>
      </div>

      {/* Command Reference */}
      <Card className="p-4">
        <div className="text-xs text-muted-foreground mb-3">VOICE COMMAND REFERENCE</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {[
            "Jarvis open security",
            "Jarvis open markets",
            "Jarvis open news",
            "Jarvis open weather",
            "Jarvis scan system",
            "Jarvis open earth",
            "Jarvis open transport",
            "Jarvis what is …?",
            "Jarvis sleep",
          ].map((c) => (
            <div key={c} className="px-2 py-1.5 rounded border border-border/50 bg-card/50 font-mono">{c}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---- 3D-ish Hologram Face ----
function AvatarFace({ speaking, listening, mouthOpen, thinking }: { speaking: boolean; listening: boolean; mouthOpen: number; thinking: boolean }) {
  const ringColor = speaking ? "hsl(0 90% 60%)" : listening ? "hsl(190 100% 55%)" : "hsl(210 80% 60%)";
  const mouthH = 4 + mouthOpen * 18;

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80">
      {/* Rotating outer rings */}
      <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-spin" style={{ animationDuration: "8s" }} />
      <div className="absolute inset-3 rounded-full border border-primary/30 animate-spin" style={{ animationDuration: "12s", animationDirection: "reverse" }} />
      <div className="absolute inset-6 rounded-full border border-primary/20" />

      {/* Glow */}
      <div
        className="absolute inset-10 rounded-full blur-2xl transition-opacity"
        style={{ background: ringColor, opacity: speaking ? 0.6 : listening ? 0.4 : 0.25 }}
      />

      {/* Face SVG */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={ringColor} stopOpacity="0.9" />
            <stop offset="70%" stopColor={ringColor} stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="70" fill="url(#core)" />

        {/* Eyes */}
        <g>
          <ellipse cx="75" cy="85" rx="10" ry={listening ? 6 : 4} fill={ringColor}>
            {thinking && <animate attributeName="ry" values="2;6;2" dur="0.8s" repeatCount="indefinite" />}
          </ellipse>
          <ellipse cx="125" cy="85" rx="10" ry={listening ? 6 : 4} fill={ringColor}>
            {thinking && <animate attributeName="ry" values="2;6;2" dur="0.8s" repeatCount="indefinite" />}
          </ellipse>
        </g>

        {/* Mouth (lip-sync) */}
        <rect
          x={100 - 22}
          y={130 - mouthH / 2}
          width="44"
          height={mouthH}
          rx="3"
          fill={ringColor}
          opacity="0.9"
          style={{ transition: "all 60ms linear" }}
        />

        {/* HUD ticks */}
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const x1 = 100 + Math.cos(a) * 88;
          const y1 = 100 + Math.sin(a) * 88;
          const x2 = 100 + Math.cos(a) * 95;
          const y2 = 100 + Math.sin(a) * 95;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ringColor} strokeWidth="1.5" opacity="0.6" />;
        })}
      </svg>
    </div>
  );
}
