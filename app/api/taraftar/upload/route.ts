import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { getTaraftarSession } from "@/lib/taraftar-guard";
import { friendlyError } from "@/lib/db-errors";

const BUCKET = "media";
const MAX_SIZE = 4 * 1024 * 1024; // 4MB — profil fotoğrafı için yeterli, admin görsellerinden daha kısıtlı

// admin/upload'ın aksine burada admin oturumu değil taraftar oturumu aranır —
// taraftar kendi panelinden profil fotoğrafını yükleyebilsin diye (bu projede
// admin-dışı bir panelden gelen ilk yükleme endpoint'i).
export async function POST(req: NextRequest) {
  const session = await getTaraftarSession(req);
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı, lütfen giriş yapın." }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Yalnızca görsel dosyası yüklenebilir (en fazla 4MB)." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Görsel 4MB'tan büyük olamaz." }, { status: 400 });
  }

  const dot = file.name.lastIndexOf(".");
  const ext = (dot >= 0 ? file.name.slice(dot + 1) : "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `taraftar-profil/${session.taraftarId}-${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: friendlyError(error) }, { status: 500 });

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: publicUrlData.publicUrl });
}
