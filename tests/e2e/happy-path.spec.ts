import { test, expect } from "@playwright/test"

test.describe("QAFlow AI MVP Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Cấu hình timeout và đi tới trang chủ (Dashboard)
    await page.goto("http://localhost:3000/")
  })

  test("should show correct app shell and title", async ({ page }) => {
    // 1. Kiểm tra tiêu đề trang
    await expect(page).toHaveTitle(/QAFlow AI/)

    // 2. Kiểm tra Sidebar và Logo brand
    const sidebarBrand = page.locator("aside span").first()
    await expect(sidebarBrand).toContainText("QAFlow AI")
  })

  test("should open create project form", async ({ page }) => {
    // 1. Click "Create Project" button
    const createBtn = page.locator("button:has-text('Create Project')").first()
    await expect(createBtn).toBeVisible()
  })
})
