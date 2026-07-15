"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Paperclip, Mic, Volume2, FileText } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  needsHuman?: boolean;
}

interface PendingAttachment {
  file: File;
  previewUrl: string;
  kind: "image" | "document";
}

const QUICK_PROMPTS = [
  "Son maç kaç kaç bitti?",
  "Akademi kaç yaş alıyor?",
  "Yaz futbol okulu ne zaman?",
  "İletişim bilgileriniz nedir?",
];

const WHATSAPP_PREFILL =
  "Merhaba, Tunaspor 1954 web sitesindeki yapay zeka asistanı Golden Wolf soruma cevap veremedi. Konu hakkında bilgi almak istiyorum.";

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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Web Speech API tarayıcıdan tarayıcıya farklı isimlerle bulunur (Chrome:
// webkitSpeechRecognition) — yalnızca destekleniyorsa mikrofon düğmesi gösterilir.
function getSpeechRecognition(): any {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function GoldenWolfBubble() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [assistantName, setAssistantName] = useState("Golden Wolf");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Merhaba! Ben Golden Wolf 🐺 — Tunaspor 1954'ün resmî yapay zeka asistanıyım. Kulüple ilgili her şeyi ya da aklına takılan başka bir konuyu sorabilirsin.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const sessionId = useSessionId();

  useEffect(() => {
    fetch("/api/ai-settings-public")
      .then((r) => r.json())
      .then((d) => {
        setAssistantName(d.assistant_name || "Golden Wolf");
        if (d.welcome_message) {
          setMessages([{ role: "assistant", content: d.welcome_message }]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      alert("Yalnızca görsel (JPEG/PNG/WebP) veya PDF dosyası yükleyebilirsin.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert("Dosya 8MB'tan büyük olamaz.");
      return;
    }
    setPendingAttachment({ file, previewUrl: isImage ? URL.createObjectURL(file) : "", kind: isImage ? "image" : "document" });
  }

  function toggleMic() {
    const Recognition = getSpeechRecognition();
    if (!Recognition) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "tr-TR";
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results?.[0]?.[0]?.transcript;
      if (transcript) setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if ((!text && !pendingAttachment) || loading) return;
    const next = [...messages, { role: "user" as const, content: text || "(dosya gönderildi)" }];
    setMessages(next);
    setInput("");
    setLoading(true);

    const attachment = pendingAttachment;
    setPendingAttachment(null);

    try {
      const body: Record<string, unknown> = { messages: next, sessionId };
      if (attachment) {
        body.attachment = {
          kind: attachment.kind,
          mediaType: attachment.file.type,
          base64: await fileToBase64(attachment.file),
        };
      }
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  const micSupported = typeof window !== "undefined" && Boolean(getSpeechRecognition());
  const speechSupported = typeof window !== "undefined" && Boolean(window.speechSynthesis);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="glass-panel border border-tuna-gold/30 w-80 sm:w-96 h-[28rem] flex flex-col mb-3 overflow-hidden shadow-goldGlowLg">
          <div className="px-4 py-3 border-b border-tuna-gold/20 flex items-center justify-between bg-gradient-to-r from-tuna-black via-tuna-charcoal to-tuna-black">
            <span className="font-display text-sm tracking-wide text-tuna-gold flex items-center gap-1.5">
              🐺 {assistantName}
            </span>
            <button aria-label="Sohbeti kapat" onClick={() => setOpen(false)} className="text-tuna-mist hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%]" : "max-w-[85%]"}>
                <div className={`px-3 py-2 rounded-xl whitespace-pre-wrap ${m.role === "user" ? "bg-tuna-gold text-tuna-black" : "bg-white/10 border border-tuna-gold/10"}`}>
                  {m.content}
                </div>
                {m.role === "assistant" && speechSupported && (
                  <button
                    onClick={() => speak(m.content)}
                    aria-label="Sesli oku"
                    className="mt-1 text-[11px] text-tuna-mist hover:text-tuna-gold inline-flex items-center gap-1"
                  >
                    <Volume2 size={11} /> Sesli oku
                  </button>
                )}
                {m.needsHuman && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <a
                      href={whatsappHref()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 rounded-full px-3 py-1.5 hover:bg-emerald-500/25 transition-colors"
                    >
                      💬 WhatsApp ile İletişime Geç
                    </a>
                    <a
                      href="/iletisim"
                      className="inline-flex items-center gap-1.5 text-xs bg-tuna-gold/10 text-tuna-gold border border-tuna-gold/30 rounded-full px-3 py-1.5 hover:bg-tuna-gold/20 transition-colors"
                    >
                      ✉️ İletişim Formu
                    </a>
                  </div>
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
          {pendingAttachment && (
            <div className="px-3 pb-1 flex items-center gap-2">
              {pendingAttachment.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pendingAttachment.previewUrl} alt="" className="w-8 h-8 rounded object-cover" />
              ) : (
                <FileText size={16} className="text-tuna-gold" />
              )}
              <span className="text-xs text-tuna-mist truncate flex-1">{pendingAttachment.file.name}</span>
              <button onClick={() => setPendingAttachment(null)} className="text-tuna-mist hover:text-white">
                <X size={14} />
              </button>
            </div>
          )}
          <div className="p-2 border-t border-white/10 flex items-center gap-1.5">
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Dosya ekle"
              className="text-tuna-mist hover:text-tuna-gold p-1.5 shrink-0"
            >
              <Paperclip size={17} />
            </button>
            {micSupported && (
              <button
                onClick={toggleMic}
                aria-label="Sesle yaz"
                className={`p-1.5 shrink-0 ${listening ? "text-red-400 animate-pulse" : "text-tuna-mist hover:text-tuna-gold"}`}
              >
                <Mic size={17} />
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={`${assistantName}'a bir şey sor...`}
              className="flex-1 bg-white/5 rounded-full px-3 py-2 text-sm outline-none min-w-0"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading}
              aria-label="Gönder"
              className="bg-tuna-gold text-tuna-black rounded-full p-2 disabled:opacity-50 shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`${assistantName}'ı aç`}
        className="bg-gradient-to-br from-tuna-gold to-tuna-amber text-tuna-black rounded-full p-4 shadow-glass hover:scale-105 hover:shadow-goldGlowLg transition-all text-xl leading-none"
      >
        🐺
      </button>
    </div>
  );
}
