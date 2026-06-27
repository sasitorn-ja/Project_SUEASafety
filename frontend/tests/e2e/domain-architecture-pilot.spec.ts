import { expect, test, type Page } from "@playwright/test";

async function expectProtectedRoute(page: Page, expectedContent: string) {
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
  const bodyText = await page.locator("body").innerText();

  expect(
    bodyText.includes(expectedContent) || bodyText.includes("เข้าสู่ระบบเพื่อใช้งานบริการ Safety Caring"),
  ).toBeTruthy();
}

test.describe("domain architecture pilot routes", () => {
  test("admin points page still renders after domain extraction", async ({ page }) => {
    await page.goto("/safety-culture/admin-points", { waitUntil: "domcontentloaded" });
    await expectProtectedRoute(page, "ตั้งค่าคะแนนในระบบ");
  });

  test("admin users page still renders after domain extraction", async ({ page }) => {
    await page.goto("/safety-culture/admin-users", { waitUntil: "domcontentloaded" });
    await expectProtectedRoute(page, "จัดการผู้ใช้และสิทธิ์ Admin");
  });
});
