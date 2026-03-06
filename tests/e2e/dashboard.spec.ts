import { test, expect } from '@playwright/test';
import { dismissToasts } from '../fixtures/helpers';

const SESSION_TOKEN = 'test_session_1772823453557';
const APP_DOMAIN = 'project-copilot-ai-1.preview.emergentagent.com';

async function authenticateAndGoto(page: any, path: string) {
  // Set cookie before navigation
  await page.context().addCookies([{
    name: 'session_token',
    value: SESSION_TOKEN,
    domain: APP_DOMAIN,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'None' as const
  }]);
  await page.goto(path);
  // Wait for auth/me to respond so dashboard loads
  await page.waitForResponse(
    (resp: any) => resp.url().includes('/api/auth/me') && resp.status() === 200,
    { timeout: 30000 }
  ).catch(() => {}); // ok if already loaded
  await page.waitForLoadState('domcontentloaded');
}

test.describe('Dashboard - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('dashboard loads with sidebar navigation', async ({ page }) => {
    await authenticateAndGoto(page, '/dashboard');
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('dashboard-main')).toBeVisible({ timeout: 15000 });
  });

  test('sidebar navigation links are visible', async ({ page }) => {
    await authenticateAndGoto(page, '/dashboard');
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await expect(page.getByTestId('nav-create')).toBeVisible();
    await expect(page.getByTestId('nav-sprint')).toBeVisible();
    await expect(page.getByTestId('nav-resources')).toBeVisible();
    await expect(page.getByTestId('nav-portfolio')).toBeVisible();
    await expect(page.getByTestId('nav-copilot')).toBeVisible();
  });

  test('create project button is visible on dashboard', async ({ page }) => {
    await authenticateAndGoto(page, '/dashboard');
    await expect(page.getByTestId('create-project-button')).toBeVisible({ timeout: 30000 });
  });

  test('create project button opens dialog', async ({ page }) => {
    await authenticateAndGoto(page, '/dashboard');
    await expect(page.getByTestId('create-project-button')).toBeVisible({ timeout: 30000 });
    await page.getByTestId('create-project-button').click({ force: true });
    // Dialog should open with project name input
    await expect(page.getByTestId('new-project-name')).toBeVisible({ timeout: 10000 });
  });

  test('dashboard shows velocity chart', async ({ page }) => {
    await authenticateAndGoto(page, '/dashboard');
    await expect(page.getByTestId('velocity-chart')).toBeVisible({ timeout: 30000 });
  });

  test('dashboard theme toggle works', async ({ page }) => {
    await authenticateAndGoto(page, '/dashboard');
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 30000 });
    const html = page.locator('html');

    // Toggle to dark
    await page.getByTestId('sidebar-theme-toggle').click();
    await expect(html).toHaveClass(/dark/);

    // Toggle back to light
    await page.getByTestId('sidebar-theme-toggle').click();
    await expect(html).toHaveClass(/light/);
  });

  test('logout button is visible', async ({ page }) => {
    await authenticateAndGoto(page, '/dashboard');
    await expect(page.getByTestId('logout-button')).toBeVisible({ timeout: 30000 });
  });
});
