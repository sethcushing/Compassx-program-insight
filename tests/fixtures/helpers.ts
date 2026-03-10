import { Page, expect, BrowserContext } from '@playwright/test';

export const BASE_URL = 'https://weekly-updates-hub.preview.emergentagent.com';
export const APP_DOMAIN = 'weekly-updates-hub.preview.emergentagent.com';

export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
}

export async function dismissToasts(page: Page) {
  await page.addLocatorHandler(
    page.locator('[data-sonner-toast], .Toastify__toast, [role="status"].toast, .MuiSnackbar-root'),
    async () => {
      const close = page.locator('[data-sonner-toast] [data-close], [data-sonner-toast] button[aria-label="Close"], .Toastify__close-button, .MuiSnackbar-root button');
      await close.first().click({ timeout: 2000 }).catch(() => {});
    },
    { times: 10, noWaitAfter: true }
  );
}

export async function checkForErrors(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const errorElements = Array.from(
      document.querySelectorAll('.error, [class*="error"], [id*="error"]')
    );
    return errorElements.map(el => el.textContent || '').filter(Boolean);
  });
}

// Navigate to dashboard
export async function gotoDashboard(page: Page) {
  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByTestId('dashboard-main')).toBeVisible({ timeout: 30000 });
}

// Navigate to sprint board
export async function gotoSprintBoard(page: Page) {
  await page.goto('/sprint');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByTestId('sprint-planner-main')).toBeVisible({ timeout: 30000 });
}

// Navigate to project detail
export async function gotoProject(page: Page, projectId: string) {
  await page.goto(`/project/${projectId}`);
  await page.waitForLoadState('domcontentloaded');
}
