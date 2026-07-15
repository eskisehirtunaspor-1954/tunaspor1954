"use client";

// Tek örnekli (module-level singleton) ses motoru — React bileşen yaşam
// döngüsünden bağımsızdır, bu yüzden sayfa/route değişiminde (App Router'da
// layout korunduğu için zaten olmuyor ama emin olmak için) YENİDEN
// OLUŞTURULMAZ, sesler kesilmez. <audio> elemanları bir kez yaratılıp
// önbelleğe alınır (her çalma isteğinde yeniden yaratılmaz — gecikme/bellek
// sızıntısı olmaz), tek seferlik efektler zaten çalarken yeniden tetiklenmez
// ("üst üste çalınmasın").
export type SoundKey =
  | "background"
  | "stadium-ambience"
  | "crowd"
  | "wolf-howl"
  | "wind"
  | "goal"
  | "whistle"
  | "click"
  | "notification"
  | "menu-open"
  | "menu-close"
  | "success"
  | "error";

export type SoundCategory = "atmosfer" | "tribun" | "kurt" | "efekt";

export const ALL_SOUND_KEYS: SoundKey[] = [
  "background", "stadium-ambience", "crowd", "wolf-howl", "wind",
  "goal", "whistle", "click", "notification", "menu-open", "menu-close", "success", "error",
];

const DEFAULT_FILES: Record<SoundKey, string> = {
  background: "/audio/background.mp3",
  "stadium-ambience": "/audio/stadium-ambience.mp3",
  crowd: "/audio/crowd.mp3",
  "wolf-howl": "/audio/wolf-howl.mp3",
  wind: "/audio/wind.mp3",
  goal: "/audio/goal.mp3",
  whistle: "/audio/whistle.mp3",
  click: "/audio/click.mp3",
  notification: "/audio/notification.mp3",
  "menu-open": "/audio/menu-open.mp3",
  "menu-close": "/audio/menu-close.mp3",
  success: "/audio/success.mp3",
  error: "/audio/error.mp3",
};

export const CATEGORY_OF: Record<SoundKey, SoundCategory> = {
  background: "atmosfer",
  "stadium-ambience": "atmosfer",
  wind: "atmosfer",
  crowd: "tribun",
  "wolf-howl": "kurt",
  goal: "efekt",
  whistle: "efekt",
  click: "efekt",
  notification: "efekt",
  "menu-open": "efekt",
  "menu-close": "efekt",
  success: "efekt",
  error: "efekt",
};

const LOOP_KEYS = new Set<SoundKey>(["background", "stadium-ambience", "crowd", "wind"]);

interface Entry {
  audio: HTMLAudioElement;
  broken: boolean;
  playingOneShot: boolean;
  pendingOneShot: boolean;
  baseLevel: number;
}

interface Override {
  url: string;
  volume: number;
  loop: boolean;
  active: boolean;
  autoplay: boolean;
}

class SoundEngine {
  private entries = new Map<SoundKey, Entry>();
  private overrides = new Map<SoundKey, Override>();
  private masterVolume = 0.7;
  private globalEnabled = false;
  private categoryVolume: Record<SoundCategory, number> = { atmosfer: 1, tribun: 1, kurt: 1, efekt: 1 };
  private categoryEnabled: Record<SoundCategory, boolean> = { atmosfer: true, tribun: true, kurt: true, efekt: true };
  private fadeHandles = new Map<SoundKey, number>();

  constructor() {
    // Tarayıcı otomatik oynatmayı engellediyse (NotAllowedError), kullanıcının
    // sayfadaki İLK dokunuşunda/tıklamasında/tuşuna basmasında tüm bekleyen
    // sesleri tekrar başlatmayı dener — bu olmadan `fadeTo`/`playOneShot`
    // tarafından reddedilen bir oynatma isteği bir daha asla denenmezdi.
    if (typeof window !== "undefined") {
      const retry = () => this.retryBlocked();
      ["pointerdown", "touchstart", "keydown"].forEach((evt) =>
        window.addEventListener(evt, retry, { once: true, passive: true })
      );
    }
  }

  // Admin panelinden yüklenen özel dosya/varsayılan ses seviyesi/loop/otomatik
  // başlatma ayarlarını uygular — kod değiştirmeden ses sistemi yönetilebilsin diye.
  setOverrides(list: { key: SoundKey; file_url: string | null; volume: number; loop: boolean; is_active: boolean; autoplay?: boolean }[]) {
    this.overrides.clear();
    list.forEach((o) => this.overrides.set(o.key, { url: o.file_url ?? "", volume: o.volume, loop: o.loop, active: o.is_active, autoplay: o.autoplay ?? false }));
  }

  // Bir sesin "Otomatik Başlat" ayarı açık mı? Admin override yoksa (henüz
  // ayarlar yüklenmediyse) çağıranın belirttiği varsayılana düşer.
  autoplayEnabled(key: SoundKey, defaultValue = true): boolean {
    const override = this.overrides.get(key);
    return override ? override.autoplay : defaultValue;
  }

  // Otomatik oynatma engeli kalktıktan (ilk kullanıcı etkileşimi) sonra, o an
  // seviyesi 0'ın üzerinde olması gerektiği halde duraklamış kalan tüm sesleri
  // yeniden çalmayı dener.
  retryBlocked() {
    this.entries.forEach((entry, key) => {
      if (entry.broken) return;
      if (entry.pendingOneShot) {
        // Engellenmiş tek seferlik ses (ör. açılış kurt uluması) — "ended" olayı
        // zaten dinleniyor, burada yalnızca gerçek çalmayı tekrar deneriz;
        // onComplete callback'i asla erken değil, gerçek bitişte tetiklenir.
        entry.pendingOneShot = false;
        entry.audio.play().catch(() => { entry.pendingOneShot = true; });
        return;
      }
      const target = this.targetVolume(key, entry.baseLevel);
      if (target > 0 && entry.audio.paused) {
        entry.audio.play().catch(() => {});
      }
    });
  }

  setMasterEnabled(v: boolean) {
    this.globalEnabled = v;
    if (!v) this.entries.forEach((_, key) => this.fadeTo(key, 0, 800));
  }

  setMasterVolume(v: number) {
    this.masterVolume = v;
    this.rescaleActive();
  }

  setCategoryEnabled(cat: SoundCategory, v: boolean) {
    this.categoryEnabled[cat] = v;
    if (!v) {
      this.entries.forEach((_, key) => { if (CATEGORY_OF[key] === cat) this.fadeTo(key, 0, 800); });
    } else {
      this.rescaleActive();
    }
  }

  setCategoryVolume(cat: SoundCategory, v: number) {
    this.categoryVolume[cat] = v;
    this.rescaleActive();
  }

  private getEntry(key: SoundKey): Entry | null {
    if (typeof window === "undefined") return null;
    let entry = this.entries.get(key);
    if (!entry) {
      const override = this.overrides.get(key);
      const src = override?.active && override.url ? override.url : DEFAULT_FILES[key];
      const audio = new Audio(src);
      audio.preload = "auto";
      audio.loop = override ? override.loop : LOOP_KEYS.has(key);
      audio.volume = 0;
      const newEntry: Entry = { audio, broken: false, playingOneShot: false, pendingOneShot: false, baseLevel: 0 };
      // Dosya eksik/bozuksa sessizce yut — uygulama asla bu yüzden hata vermemeli.
      audio.addEventListener("error", () => { newEntry.broken = true; });
      entry = newEntry;
      this.entries.set(key, entry);
    }
    return entry;
  }

  private targetVolume(key: SoundKey, baseLevel: number): number {
    const cat = CATEGORY_OF[key];
    const override = this.overrides.get(key);
    const relative = override?.active ? override.volume : baseLevel;
    if (!this.globalEnabled || !this.categoryEnabled[cat]) return 0;
    return Math.max(0, Math.min(1, relative * this.categoryVolume[cat] * this.masterVolume));
  }

  // Sürekli çalan (loop) atmosfer katmanları için yumuşak geçiş — "gel/git" ses
  // seviyesi rampası, ani kesilme/başlama hissi vermez.
  fadeTo(key: SoundKey, baseLevel: number, ms = 3000) {
    const entry = this.getEntry(key);
    if (!entry || entry.broken) return;
    entry.baseLevel = baseLevel;

    const handle = this.fadeHandles.get(key);
    if (handle) cancelAnimationFrame(handle);

    const target = this.targetVolume(key, baseLevel);
    if (target > 0 && entry.audio.paused) {
      // NOT: play() reddi (ör. tarayıcının otomatik oynatma politikası
      // "NotAllowedError") burada `broken` işaretlemez — dosya bozuk değil,
      // yalnızca henüz kullanıcı etkileşimi olmadı. `broken`, yalnızca
      // gerçek bir yükleme hatasında (aşağıdaki "error" olayı) ayarlanır.
      // Kullanıcı ilk etkileşiminden sonra soundEnabled değişip bu fonksiyon
      // yeniden çağrılınca oynatma otomatik olarak tekrar denenir.
      entry.audio.play().catch(() => {});
    }

    const start = entry.audio.volume;
    const startTime = performance.now();
    const step = (now: number) => {
      const t = ms <= 0 ? 1 : Math.min(1, (now - startTime) / ms);
      entry.audio.volume = Math.max(0, Math.min(1, start + (target - start) * t));
      if (t < 1) {
        this.fadeHandles.set(key, requestAnimationFrame(step));
      } else {
        this.fadeHandles.delete(key);
        if (target === 0) entry.audio.pause();
      }
    };
    this.fadeHandles.set(key, requestAnimationFrame(step));
  }

  // Tek seferlik efekt/olay sesi (kurt uluması, gol, düdük, tıklama, menü aç/kapa,
  // başarı/hata bildirimleri...). Aynı ses zaten çalıyorsa yeniden tetiklenmez.
  // `onComplete` gerçek dosya süresi bittiğinde (veya çalınamadıysa hemen)
  // çağrılır — böylece örn. kurt ulumasının GERÇEK süresi tahmin edilmeden
  // "bitince rüzgar tek başına devam etsin" gibi bir sıralama kurulabilir.
  playOneShot(key: SoundKey, baseLevel = 1, onComplete?: () => void) {
    if (!this.globalEnabled || !this.categoryEnabled[CATEGORY_OF[key]]) {
      onComplete?.();
      return;
    }
    const entry = this.getEntry(key);
    if (!entry || entry.broken || entry.playingOneShot) {
      onComplete?.();
      return;
    }
    try {
      entry.audio.currentTime = 0;
    } catch {
      // bazı tarayıcılarda henüz metadata yüklenmediyse currentTime ataması hata verebilir — yok say.
    }
    entry.audio.volume = this.targetVolume(key, baseLevel);
    entry.playingOneShot = true;
    const onEnd = () => {
      entry.playingOneShot = false;
      entry.pendingOneShot = false;
      entry.audio.removeEventListener("ended", onEnd);
      onComplete?.();
    };
    entry.audio.addEventListener("ended", onEnd);
    // play() reddi burada `broken` işaretlemez ve onComplete'i ERKEN tetiklemez
    // (bkz. fadeTo) — yalnızca "pendingOneShot" işaretlenir ki ilk kullanıcı
    // etkileşiminde retryBlocked() gerçekten çalıştırsın; onComplete yalnızca
    // gerçek "ended" olayında çağrılır.
    entry.audio.play().catch(() => { entry.pendingOneShot = true; });
  }

  private rescaleActive() {
    this.entries.forEach((entry, key) => {
      if (entry.audio.paused) return;
      entry.audio.volume = this.targetVolume(key, entry.baseLevel);
    });
  }

  dispose() {
    this.fadeHandles.forEach((h) => cancelAnimationFrame(h));
    this.fadeHandles.clear();
    this.entries.forEach((e) => e.audio.pause());
    this.entries.clear();
  }
}

let singleton: SoundEngine | null = null;
export function getSoundEngine(): SoundEngine {
  if (!singleton) singleton = new SoundEngine();
  return singleton;
}
