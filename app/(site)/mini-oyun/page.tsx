"use client";

import { useEffect, useState } from "react";
import { PenaltyGame } from "@/components/game/PenaltyGame";

interface ScoreRow {
  nickname: string;
  score: number;
  created_at: string;
}

export default function MiniOyunPage() {
  const [playing, setPlaying] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ScoreRow[]>([]);

  async function loadLeaderboard() {
    const res = await fetch("/api/game-scores");
    const data = await res.json();
    setLeaderboard(data.data ?? []);
  }
  useEffect(() => {
    loadLeaderboard();
  }, []);

  async function handleSubmitScore(e: React.FormEvent) {
    e.preventDefault();
    if (finalScore === null) return;
    setSubmitting(true);
    setSubmitError(null);
    const res = await fetch("/api/game-scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, score: finalScore }),
    });
    setSubmitting(false);
    const data = await res.json();
    if (!res.ok) {
      setSubmitError(data.error ?? "Kaydedilemedi.");
      return;
    }
    setSubmitted(true);
    loadLeaderboard();
  }

  function resetGame() {
    setPlaying(false);
    setFinalScore(null);
    setNickname("");
    setSubmitted(false);
    setSubmitError(null);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <p className="eyebrow mb-3">Tunaspor 1954</p>
      <h1 className="font-display text-4xl mb-2">Penaltı Atışı</h1>
      <p className="text-tuna-mist mb-10">5 penaltı at, kaç gol atabileceğine bak, haftalık liderlik tablosuna gir!</p>

      <div className="glass-panel p-8 mb-10">
        {!playing && finalScore === null && (
          <div className="text-center py-6">
            <button
              onClick={() => setPlaying(true)}
              className="bg-tuna-gold text-tuna-black font-semibold px-8 py-3 rounded-lg text-lg"
            >
              ⚽ Oyuna Başla
            </button>
          </div>
        )}

        {playing && finalScore === null && (
          <PenaltyGame
            onFinish={(score) => {
              setFinalScore(score);
              setPlaying(false);
            }}
          />
        )}

        {finalScore !== null && !submitted && (
          <div className="text-center py-4">
            <p className="font-display text-3xl text-tuna-gold mb-4">{finalScore}/5 Gol!</p>
            <form onSubmit={handleSubmitScore} className="flex flex-col items-center gap-3 max-w-xs mx-auto">
              <input
                required
                minLength={2}
                maxLength={20}
                placeholder="Rumuzunu yaz"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-white/5 rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-tuna-gold text-center"
              />
              {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
              <button
                disabled={submitting}
                className="w-full bg-tuna-gold text-tuna-black font-semibold px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {submitting ? "Kaydediliyor..." : "Liderlik Tablosuna Kaydet"}
              </button>
              <button type="button" onClick={resetGame} className="text-sm text-tuna-mist hover:text-white">
                Kaydetmeden tekrar oyna
              </button>
            </form>
          </div>
        )}

        {submitted && (
          <div className="text-center py-6">
            <p className="text-tuna-gold font-display text-xl mb-4">Kaydedildi! 🏆</p>
            <button
              onClick={resetGame}
              className="bg-tuna-gold text-tuna-black font-semibold px-6 py-2 rounded-lg"
            >
              Tekrar Oyna
            </button>
          </div>
        )}
      </div>

      {/* Haftalık liderlik tablosu */}
      <section>
        <h2 className="font-display text-2xl mb-6">Bu Haftanın Liderlik Tablosu</h2>
        <div className="space-y-1">
          {leaderboard.map((row, i) => (
            <div key={i} className="glass-panel px-4 py-3 flex items-center justify-between">
              <span className="flex items-center gap-3">
                <span className="text-tuna-gold font-display w-6">{i + 1}.</span>
                <span>{row.nickname}</span>
              </span>
              <span className="font-display text-tuna-gold">{row.score}/5</span>
            </div>
          ))}
          {!leaderboard.length && <p className="text-tuna-mist">Bu hafta henüz kimse oynamadı — ilk sen ol!</p>}
        </div>
      </section>
    </div>
  );
}
