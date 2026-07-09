/**
 * İlk kurulum script'i — veritabanında hiç yönetici hesabı yokken çalıştırılır.
 * Kullanım: npm run create-first-admin -- --email=admin@tunaspor1954.org --password=Gecici123! --name="Sistem Yöneticisi"
 */
import { createClient } from "@supabase/supabase-js";
import { authenticator } from "otplib";
import bcrypt from "bcryptjs";
import qrcode from "qrcode-terminal";
import "dotenv/config";

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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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
