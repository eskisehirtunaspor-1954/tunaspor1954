import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/admin-guard";
import { friendlyError } from "@/lib/db-errors";

const BUCKET = "media";

type Kind = "image" | "video" | "document" | "audio";

const KIND_RULES: Record<Kind, { test: (mime: string) => boolean; maxSize: number; error: string }> = {
  image: {
    test: (m) => m.startsWith("image/"),
    maxSize: 8 * 1024 * 1024, // 8MB
    error: "Yalnızca görsel dosyası yüklenebilir (en fazla 8MB).",
  },
  video: {
    test: (m) => m.startsWith("video/"),
    maxSize: 200 * 1024 * 1024, // 200MB
    error: "Yalnızca video dosyası yüklenebilir (en fazla 200MB).",
  },
  audio: {
    test: (m) => m.startsWith("audio/"),
    maxSize: 15 * 1024 * 1024, // 15MB
    error: "Yalnızca ses dosyası (mp3/wav/ogg) yüklenebilir (en fazla 15MB).",
  },
  document: {
    test: (m) =>
      m === "application/pdf" ||
      m === "application/msword" ||
      m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      m === "application/vnd.ms-excel" ||
      m === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    maxSize: 20 * 1024 * 1024, // 20MB
    error: "Yalnızca PDF, Word (.doc/.docx) veya Excel (.xls/.xlsx) belgesi yüklenebilir (en fazla 20MB).",
  },
};

function safeFileName(name: string, fallbackExt: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : fallbackExt;
  return `${randomUUID()}.${ext || fallbackExt}`;
}

// Bu proje Supabase Auth kullanmıyor (özel JWT çerezleri) — Storage RLS auth.uid()
// bazlı politikalarla admin oturumumuzu tanıyamaz. Bu yüzden yükleme her zaman
// service-role client ile, bu sunucu route'u üzerinden yapılır; tarayıcıdan
// doğrudan Supabase Storage'a erişim hiçbir zaman açılmaz.
export async function POST(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı, lütfen giriş yapın." }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  const folder = String(formData?.get("folder") ?? "misc").replace(/[^a-z0-9_-]/gi, "") || "misc";
  const kindRaw = String(formData?.get("kind") ?? "image");
  const kind: Kind = kindRaw === "video" || kindRaw === "document" || kindRaw === "audio" ? kindRaw : "image";
  const rule = KIND_RULES[kind];

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  }
  if (!rule.test(file.type)) {
    return NextResponse.json({ error: rule.error }, { status: 400 });
  }
  if (file.size > rule.maxSize) {
    return NextResponse.json({ error: rule.error }, { status: 400 });
  }

  const path = `${folder}/${safeFileName(file.name, kind === "video" ? "mp4" : kind === "document" ? "pdf" : kind === "audio" ? "mp3" : "jpg")}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: publicUrlData.publicUrl, path, fileName: file.name });
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı, lütfen giriş yapın." }, { status: 401 });
  }

  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "path gerekli." }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  return NextResponse.json({ ok: true });
}
