import { NextRequest, NextResponse } from "next/server";
import { readdir } from "fs/promises";
import path from "path";
import { requireModuleAccess } from "@/lib/admin-guard";

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".m4a"]);

// /public/audio klasöründe fiilen bulunan ses dosyalarını listeler — Ses
// Yönetimi panelindeki "Klasörden Seç" açılır menüsü buradan beslenir.
// Böylece kullanıcı yeni bir dosyayı doğrudan public/audio'ya (git ile)
// eklediğinde, kod değiştirmeden yönetici panelinden seçip kaydedebilir.
export async function GET(req: NextRequest) {
  const access = await requireModuleAccess(req, "sound_assets");
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const dir = path.join(process.cwd(), "public", "audio");
  let files: string[] = [];
  try {
    files = await readdir(dir);
  } catch {
    files = [];
  }

  const audioFiles = files
    .filter((f) => AUDIO_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort()
    .map((name) => ({ name, url: `/audio/${name}` }));

  return NextResponse.json({ data: audioFiles });
}
