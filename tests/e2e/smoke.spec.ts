import { test, expect } from "@playwright/test";

test("anasayfa yükleniyor ve temel bölümleri gösteriyor", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("TUNASPOR")).toBeVisible();
  await expect(page.getByRole("link", { name: /Takımları İncele|View Teams/ })).toBeVisible();
});

test("giriş yapılmadan /admin/dashboard erişimi login sayfasına yönlendirir", async ({ page }) => {
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("haberler sayfası açılıyor", async ({ page }) => {
  await page.goto("/haberler");
  await expect(page.locator("h1")).toContainText("Haberler");
});

test("iletişim formu görünür ve zorunlu alanlara sahip", async ({ page }) => {
  await page.goto("/iletisim");
  await expect(page.locator("form input[name='full_name']")).toBeVisible();
  await expect(page.locator("form textarea[name='message']")).toBeVisible();
});
