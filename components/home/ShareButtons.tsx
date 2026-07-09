"use client";

import { useState } from "react";
import { MessageCircle, Twitter, Facebook, Link2, Check } from "lucide-react";

export function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { icon: MessageCircle, label: "WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { icon: Twitter, label: "X", href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
    { icon: Facebook, label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard erişimi yoksa sessizce yoksay
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-tuna-mist mr-1">Paylaş:</span>
      {links.map(({ icon: Icon, label, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label}'da paylaş`}
          className="p-2 rounded-full border border-white/10 text-tuna-mist hover:text-tuna-gold hover:border-tuna-gold/50 transition-colors"
        >
          <Icon size={16} />
        </a>
      ))}
      <button
        onClick={copyLink}
        aria-label="Linki kopyala"
        className="p-2 rounded-full border border-white/10 text-tuna-mist hover:text-tuna-gold hover:border-tuna-gold/50 transition-colors"
      >
        {copied ? <Check size={16} className="text-tuna-gold" /> : <Link2 size={16} />}
      </button>
    </div>
  );
}
