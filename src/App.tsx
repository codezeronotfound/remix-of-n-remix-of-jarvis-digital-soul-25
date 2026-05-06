import React, { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw = localStorage.getItem("jarvis_messages");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem("jarvis_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    // Setup Web Speech API (if available)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  const send = (text?: string) => {
    const t = (text ?? input).trim();
    if (!t) return;
    const userMsg: Message = { id: String(Date.now()) + "-u", role: "user", text: t };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    // Mock assistant response to keep this module fully working offline
    setTimeout(() => {
      const reply: Message = {
        id: String(Date.now()) + "-a",
        role: "assistant",
        text: `I heard you say: "${t}" — this is a mock response. Replace this with your API call to your AI provider.`,
      };
      setMessages((m) => [...m, reply]);
    }, 700);
  };

  const toggleListen = () => {
    if (!recognitionRef.current) return alert("Speech recognition not available in this browser.");
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const clear = () => {
    setMessages([]);
    localStorage.removeItem("jarvis_messages");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">JARVIS — Local Demo</h1>
          <div className="space-x-2">
            <button
              onClick={toggleListen}
              className={`px-3 py-1 rounded-md bg-slate-700 hover:bg-slate-600 ${listening ? "ring-2 ring-emerald-400" : ""}`}
            >
              {listening ? "Stop" : "Voice"}
            </button>
            <button onClick={clear} className="px-3 py-1 rounded-md bg-red-700 hover:bg-red-600">
              Clear
            </button>
          </div>
        </header>

        <main className="bg-slate-900/40 rounded-lg p-4 shadow-inner">
          <ul className="space-y-3 max-h-96 overflow-auto mb-4">
            {messages.length === 0 && <li className="text-slate-400">No messages yet — say something or type below.</li>}
            {messages.map((m) => (
              <li key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block px-4 py-2 rounded-lg ${m.role === "user" ? "bg-emerald-500/20" : "bg-slate-700/60"}`}
                >
                  <div className="text-sm">{m.text}</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Type a message and press Enter"
              className="flex-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700"
            />
            <button onClick={() => send()} className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500">
              Send
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-3">This demo uses the browser Web Speech API and localStorage. Replace the mocked response with a real AI call to integrate.</p>
        </main>
      </div>
    </div>
  );
}
