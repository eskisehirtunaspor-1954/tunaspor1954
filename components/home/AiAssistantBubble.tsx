"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  needsHuman?: boolean;
}

const QUICK_PROMPTS = [
  "Son maç kaç kaç bitti?",
  "Akademi kaç yaş alıyor?",
  "Yaz futbol okulu ne zaman?",
  "İletişim bilgileriniz nedir?",
];

const WHATSAPP_PREFILL =
  "Merhaba, Tunaspor 1954 web sitesindeki yapay zeka asistanı soruma cevap veremedi. Konu hakkında bilgi almak istiyorum.";

function whatsappHref() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  return `https://wa.me/${number}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`;
}

// Her sohbet oturumu tek bir session_id ile etiketlenir (admin panelinde
// konuşma geçmişini gruplamak için) — sekme yenilense de aynı kalır.
function useSessionId(): string {
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return "";
    const existing = sessionStorage.getItem("tuna_ai_session_id");
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    sessionStorage.setItem("tuna_ai_session_id", fresh);
    return fresh;
  });
  return sessionId;
}

export function AiAssistantBubble() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Merhaba! Ben TUNA AI 🐺 — Tunaspor 1954'ün kendi yapay zekâ asistanıyım. Son maç sonucu, akademi kayıtları, kamp tarihleri gibi güncel her şeyi sorabilirsin.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const sessionId = useSessionId();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, sessionId }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply, needsHuman: Boolean(data.needsHuman) }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Şu anda yanıt veremiyorum, lütfen WhatsApp üzerinden bize ulaşın.", needsHuman: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="glass-panel border border-tuna-gold/25 w-80 h-96 flex flex-col mb-3 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-tuna-gold/5">
            <span className="font-display text-sm tracking-wide text-tuna-gold flex items-center gap-1.5">
              <Sparkles size={14} /> TUNA AI
            </span>
            <button aria-label="Sohbeti kapat" onClick={() => setOpen(false)} className="text-tuna-mist hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%]" : "max-w-[85%]"}>
                <div className={`px-3 py-2 rounded-xl ${m.role === "user" ? "bg-tuna-gold text-tuna-black" : "bg-white/10"}`}>
                  {m.content}
                </div>
                {m.needsHuman && (
                  <a
                    href={whatsappHref()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1.5 text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 rounded-full px-3 py-1.5 hover:bg-emerald-500/25 transition-colors"
                  >
                    💬 WhatsApp ile İletişime Geç
                  </a>
                )}
              </div>
            ))}
            {loading && (
              <div className="bg-white/10 max-w-[60%] px-3 py-2 rounded-xl flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tuna-gold animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-tuna-gold animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-tuna-gold animate-bounce" />
              </div>
            )}
            <div ref={endRef} />
          </div>
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs border border-tuna-gold/30 text-tuna-gold rounded-full px-3 py-1.5 hover:bg-tuna-gold/10 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className="p-2 border-t border-white/10 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="TUNA AI'a bir şey sor..."
              className="flex-1 bg-white/5 rounded-full px-3 py-2 text-sm outline-none"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading}
              aria-label="Gönder"
              className="bg-tuna-gold text-tuna-black rounded-full p-2 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="TUNA AI'ı aç"
        className="bg-tuna-gold text-tuna-black rounded-full p-4 shadow-glass hover:scale-105 hover:shadow-goldGlow transition-all"
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
}
