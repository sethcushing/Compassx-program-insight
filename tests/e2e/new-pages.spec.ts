import { test, expect, Page } from '@playwright/test';

const SESSION_TOKEN = 'test_session_1772823453557';
const APP_DOMAIN = 'project-planner-ai-1.preview.emergentagent.com';

async function dismissToasts(page: Page) {
  await page.addLocatorHandler(
    page.locator('[data-sonner-toast], .Toastify__toast'),
    async () => {
      const close = page.locator('[data-sonner-toast] [data-close], .Toastify__close-button');
      await close.first().click({ timeout: 2000 }).catch(() => {});
    },
    { times: 10, noWaitAfter: true }
  );
}

async function authenticateAndGoto(page: Page, path: string) {
  await page.context().addCookies([{
    name: 'session_token',
    value: SESSION_TOKEN,
    domain: APP_DOMAIN,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  }]);
  await page.goto(path);
  await page.waitForResponse(
    (resp) => resp.url().includes('/api/auth/me') && resp.status() === 200,
    { timeout: 30000 }
  ).catch(() => {});
  await page.waitForLoadState('domcontentloaded');
}

test.describe('All Projects Page', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('All Projects page loads with all UI elements', async ({ page }) => {
    await authenticateAndGoto(page, '/projects');
    await expect(page.getByTestId('all-projects-main')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('add-project-button')).toBeVisible();
    await expect(page.getByTestId('search-projects')).toBeVisible();
    await expect(page.getByTestId('status-filter')).toBeVisible();
    await expect(page.getByTestId('priority-filter')).toBeVisible();
  });
});

test.describe('Program View Page', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Program View page loads with drilldown section', async ({ page }) => {
    await authenticateAndGoto(page, '/program');
    await expect(page.getByTestId('program-view-main')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('projects-drilldown')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Program View' })).toBeVisible();
  });
});
