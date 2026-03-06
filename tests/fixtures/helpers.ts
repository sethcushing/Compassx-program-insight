import { Page, expect, BrowserContext } from '@playwright/test';

export const SESSION_TOKEN = 'test_session_1772823453557';
export const BASE_URL = 'https://project-planner-ai-1.preview.emergentagent.com';
export const APP_DOMAIN = 'project-planner-ai-1.preview.emergentagent.com';

export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
}

export async function setAuthCookie(context: BrowserContext) {
  await context.addCookies([{
    name: 'session_token',
    value: SESSION_TOKEN,
    domain: APP_DOMAIN,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  }]);
}

export async function loginWithCookie(page: Page) {
  await page.context().addCookies([{
    name: 'session_token',
    value: SESSION_TOKEN,
    domain: APP_DOMAIN,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  }]);
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
