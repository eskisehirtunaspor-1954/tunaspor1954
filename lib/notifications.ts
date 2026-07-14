import { createServiceClient } from "@/lib/supabase/server";
import { webpush } from "@/lib/push";

export type NotificationType = "antrenman_devamsizlik" | "aidat_hatirlatma" | "aidat_tesekkur" | "manuel";
export type NotificationChannel = "push" | "email" | "whatsapp" | "sms";

// WhatsApp/SMS için gerçek bir sağlayıcı hesabı yok — mimari kanal-eklenebilir
// (pluggable) kuruldu ama bu ikisi "yapılandırılmadı" durumunda pasif kalır.
// İleride bir sağlayıcı eklendiğinde yalnızca bu iki fonksiyon doldurulacak.
export function getChannelAvailability() {
  return {
    push: true,
    email: Boolean(process.env.RESEND_API_KEY),
    whatsapp: false,
    sms: false,
  };
}

const DEFAULT_TEMPLATES: Record<NotificationType, { subject: string; body: string }> = {
  antrenman_devamsizlik: {
    subject: "Antrenman Devamsızlığı — Tunaspor 1954",
    body:
      "Sayın {{parent_name}}, {{player_name}} adlı sporcumuz {{date}} tarihinde saat {{time}}'de yapılan {{team_name}} antrenmanına katılmamıştır.",
  },
  aidat_hatirlatma: {
    subject: "Aidat Hatırlatması — Tunaspor 1954",
    body:
      "Sayın {{parent_name}}, {{player_name}} adlı sporcumuzun {{period_label}} dönemine ait {{amount}} ₺ tutarındaki aidatının son ödeme tarihi ({{due_date}}) geçmiştir. Bilginize sunarız.",
  },
  aidat_tesekkur: {
    subject: "Ödemeniz İçin Teşekkürler — Tunaspor 1954",
    body: "Sayın {{parent_name}}, {{player_name}} adlı sporcumuzun aidat ödemesi tarafımıza ulaşmıştır. Teşekkür ederiz.",
  },
  manuel: { subject: "Tunaspor 1954", body: "" },
};

export function renderTemplate(body: string, vars: Record<string, string | number>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ""));
}

async function sendEmail(to: string, subject: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "E-posta kanalı yapılandırılmadı." };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Tunaspor 1954 <bildirim@tunaspor1954.org>",
        to: [to],
        subject,
        text,
      }),
    });
    if (!res.ok) return { ok: false, error: `Resend hatası (${res.status})` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "E-posta gönderilemedi." };
  }
}

async function sendPushToParent(parentId: string, title: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { data: subs } = await supabase.from("push_subscriptions").select("*").eq("parent_id", parentId);
  if (!subs?.length) return { ok: false, error: "Veliye ait push aboneliği yok." };

  const payload = JSON.stringify({ title, body, url: "/veli/panel" });
  let anySent = false;
  for (const sub of subs) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
      anySent = true;
    } catch {
      await supabase.from("push_subscriptions").delete().eq("id", sub.id);
    }
  }
  return anySent ? { ok: true } : { ok: false, error: "Push gönderimi başarısız (abonelik geçersiz)." };
}

async function getTemplate(type: NotificationType, channel: NotificationChannel) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("notification_templates")
    .select("subject, body")
    .eq("type", type)
    .eq("channel", channel)
    .maybeSingle();
  return data ?? DEFAULT_TEMPLATES[type];
}

async function logNotification(row: {
  parent_id: string | null;
  player_id: string | null;
  type: NotificationType;
  channel: NotificationChannel;
  subject: string | null;
  body: string;
  status: "gonderildi" | "basarisiz" | "atlandi";
  error?: string | null;
}) {
  const supabase = createServiceClient();
  await supabase.from("parent_notifications").insert(row);
}

// Bir oyuncuya bağlı tüm velilere (parent_player_links üzerinden) bildirim
// gönderir — hangi otomatik bildirim türünün açık olduğu site_settings'ten
// kontrol edilir, kullanılabilir kanallar (push her zaman, email varsa Resend
// ile) üzerinden dener, her deneme parent_notifications'a loglanır.
export async function notifyParentsOfPlayer(
  playerId: string,
  type: NotificationType,
  vars: Record<string, string | number>
): Promise<void> {
  const supabase = createServiceClient();

  if (type === "antrenman_devamsizlik" || type === "aidat_hatirlatma" || type === "aidat_tesekkur") {
    const settingsColumn = type === "antrenman_devamsizlik" ? "notify_attendance_enabled" : "notify_fees_enabled";
    const { data: settings } = await supabase.from("site_settings").select(settingsColumn).eq("id", 1).single();
    if (settings && (settings as any)[settingsColumn] === false) return;
  }

  const { data: links } = await supabase.from("parent_player_links").select("parent_id").eq("player_id", playerId);
  if (!links?.length) return;

  const { data: parents } = await supabase
    .from("parent_accounts")
    .select("id, full_name, email")
    .in("id", links.map((l: any) => l.parent_id));

  const availability = getChannelAvailability();

  for (const parent of parents ?? []) {
    const templateVars = { ...vars, parent_name: parent.full_name };

    if (availability.push) {
      const tpl = await getTemplate(type, "push");
      const body = renderTemplate(tpl.body, templateVars);
      const result = await sendPushToParent(parent.id, tpl.subject ?? "Tunaspor 1954", body);
      await logNotification({
        parent_id: parent.id, player_id: playerId, type, channel: "push",
        subject: tpl.subject ?? null, body,
        status: result.ok ? "gonderildi" : "atlandi", error: result.error,
      });
    }

    if (availability.email && parent.email) {
      const tpl = await getTemplate(type, "email");
      const subject = renderTemplate(tpl.subject ?? "Tunaspor 1954", templateVars);
      const body = renderTemplate(tpl.body, templateVars);
      const result = await sendEmail(parent.email, subject, body);
      await logNotification({
        parent_id: parent.id, player_id: playerId, type, channel: "email",
        subject, body, status: result.ok ? "gonderildi" : "basarisiz", error: result.error,
      });
    }
    // WhatsApp/SMS: sağlayıcı yok — hiç loglanmıyor (gürültü olmasın diye);
    // kanal durumu admin panelinde getChannelAvailability() ile ayrıca gösterilir.
    // İleride bir sağlayıcı eklendiğinde burada gerçek gönderim + loglama eklenecek.
  }
}

// Admin panelinden manuel gönderim — otomatik toggle/şablon kontrolü yok,
// admin'in yazdığı başlık/mesaj doğrudan gönderilir. Tek veli, bir takımın
// tüm velileri veya sistemdeki tüm veliler hedeflenebilir (bkz. çağıran route).
export async function notifyParentsDirect(parentIds: string[], subject: string, body: string): Promise<{ sent: number; failed: number }> {
  const supabase = createServiceClient();
  const { data: parents } = await supabase.from("parent_accounts").select("id, full_name, email").in("id", parentIds);
  const availability = getChannelAvailability();

  let sent = 0;
  let failed = 0;

  for (const parent of parents ?? []) {
    if (availability.push) {
      const result = await sendPushToParent(parent.id, subject, body);
      await logNotification({
        parent_id: parent.id, player_id: null, type: "manuel", channel: "push",
        subject, body, status: result.ok ? "gonderildi" : "atlandi", error: result.error,
      });
      if (result.ok) sent += 1; else failed += 1;
    }
    if (availability.email && parent.email) {
      const result = await sendEmail(parent.email, subject, body);
      await logNotification({
        parent_id: parent.id, player_id: null, type: "manuel", channel: "email",
        subject, body, status: result.ok ? "gonderildi" : "basarisiz", error: result.error,
      });
      if (result.ok) sent += 1; else failed += 1;
    }
  }

  return { sent, failed };
}
