import { describe, it, expect } from "vitest";
import { canAccess, hashPassword, verifyPassword } from "@/lib/auth";

describe("canAccess (rol bazlı yetkilendirme)", () => {
  it("super_admin her modüle erişebilir", () => {
    expect(canAccess("super_admin", "news")).toBe(true);
    expect(canAccess("super_admin", "herhangi_bir_modul")).toBe(true);
  });

  it("editor yalnızca tanımlı modüllere erişebilir", () => {
    expect(canAccess("editor", "news")).toBe(true);
    expect(canAccess("editor", "admin_users_create")).toBe(false);
  });

  it("coach yalnızca antrenman ile ilgili modüllere erişebilir", () => {
    expect(canAccess("coach", "training_sessions")).toBe(true);
    expect(canAccess("coach", "sponsors")).toBe(false);
  });
});

describe("şifre hash/doğrulama", () => {
  it("doğru şifreyi doğrular, yanlışı reddeder", async () => {
    const hash = await hashPassword("GucluBirSifre123!");
    expect(await verifyPassword("GucluBirSifre123!", hash)).toBe(true);
    expect(await verifyPassword("yanlisSifre", hash)).toBe(false);
  });
});
