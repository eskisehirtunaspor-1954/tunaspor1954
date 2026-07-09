/**
 * İlk kurulum script'i — veritabanında hiç yönetici hesabı yokken çalıştırılır.
 * Kullanım: npm run create-first-admin -- --email=admin@tunaspor1954.org --password=Gecici123! --name="Sistem Yöneticisi"
 */
import { createClient } from "@supabase/supabase-js";
import { authenticator } from "otplib";
import bcrypt from "bcryptjs";
import qrcode from "qrcode-terminal";
import { config } from "dotenv";
import path from "path";

// "dotenv/config" varsayılan olarak yalnızca .env dosyasını yükler. Bu projede
// (Next.js standardına uygun olarak) ortam değişkenleri .env.local içinde —
// bu yüzden burada açıkça .env.local'i hedefliyoruz, aksi halde Supabase URL/key
// boş kalır ve createClient "Invalid URL" hatasıyla çöker.
config({ path: path.resolve(process.cwd(), ".env.local") });

function arg(name: string): string | undefined {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found?.split("=").slice(1).join("=");
}

async function main() {
  const email = arg("email");
  const password = arg("password");
  const name = arg("name") ?? "Sistem Yöneticisi";

  if (!email || !password) {
    console.error("Kullanım: npm run create-first-admin -- --email=... --password=... --name=\"...\"");
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "\n❌ .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve/veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil.\n" +
      "Bu dosyanın proje kök dizininde (tunaspor1954/.env.local) bulunduğundan ve Supabase Dashboard → " +
      "Project Settings → API sayfasındaki gerçek değerlerle dolu olduğundan emin ol.\n"
    );
    process.exit(1);
  }

  // GÜVENLİK/TEŞHİS: SUPABASE_SERVICE_ROLE_KEY alanına yanlışlıkla anon/public key
  // yapıştırılırsa RLS her şeyi reddeder ve "permission denied" hatası çıkar — bu,
  // kullanıcı için kriptik ve yanıltıcıdır. Supabase iki farklı key formatı kullanabilir:
  // - Eski format: JWT (eyJ... ile başlar, 3 parçalı, payload'da role alanı var)
  // - Yeni format: sb_secret_... / sb_publishable_... (isimden anlaşılır, decode gerekmez)
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (key.startsWith("sb_publishable_")) {
    console.error(
      "\n❌ SUPABASE_SERVICE_ROLE_KEY yanlış — bu bir \"publishable\" (anon) key, \"secret\" key olması gerekiyordu.\n" +
      "Supabase Dashboard → Project Settings → API Keys sayfasında \"secret\" olarak işaretli key'i kopyala.\n"
    );
    process.exit(1);
  } else if (key.startsWith("sb_secret_")) {
    // Yeni format zaten doğru rolü ismiyle belirtiyor, ek kontrol gerekmez.
  } else if (key.startsWith("eyJ")) {
    try {
      const payloadB64 = key.split(".")[1];
      const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf8"));
      if (payload.role !== "service_role") {
        console.error(
          `\n❌ SUPABASE_SERVICE_ROLE_KEY yanlış — bu key'in içindeki rol "${payload.role}", "service_role" olması gerekiyordu.\n` +
          "Muhtemelen anon/public key'i yapıştırdın. Supabase Dashboard → Project Settings → API sayfasında " +
          "\"service_role / secret\" olarak işaretli key'i kopyalayıp .env.local'e onu yaz.\n"
        );
        process.exit(1);
      }
    } catch {
      console.error("\n⚠️ SUPABASE_SERVICE_ROLE_KEY bozuk görünüyor — Supabase Dashboard'dan tekrar kopyala.\n");
      process.exit(1);
    }
  } else {
    console.error(
      "\n⚠️ SUPABASE_SERVICE_ROLE_KEY tanınan bir formatta değil (ne eyJ... JWT ne de sb_secret_... ile başlıyor).\n" +
      "Başında/sonunda fazladan boşluk, tırnak işareti veya satır sonu karakteri olmadığından emin ol.\n"
    );
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { count } = await supabase
    .from("admin_users")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) > 0) {
    console.error(
      "Veritabanında zaten yönetici hesabı mevcut. Bu script yalnızca ilk kurulum içindir. " +
      "Yeni hesap eklemek için admin panelindeki 'Yönetici Hesapları' modülünü kullanın."
    );
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 12);
  const totp_secret = authenticator.generateSecret();

  const { data, error } = await supabase
    .from("admin_users")
    .insert({
      email, password_hash, full_name: name, role: "super_admin",
      totp_secret, totp_enabled: true, is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Hesap oluşturulamadı:", error.message);
    process.exit(1);
  }

  const uri = authenticator.keyuri(email, "Tunaspor 1954 Yönetim", totp_secret);

  console.log("\n✅ İlk süper yönetici hesabı oluşturuldu:", data.email);
  console.log("\nAşağıdaki QR kodu Google Authenticator ile taratın:\n");
  qrcode.generate(uri, { small: true });
  console.log("\nQR okutamıyorsanız bu secret'ı manuel girin:", totp_secret);
  console.log("\nGiriş: /admin/login → e-posta + şifre → ardından 6 haneli TOTP kodu.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
