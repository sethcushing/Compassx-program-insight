import { test, expect } from '@playwright/test';
import { dismissToasts } from '../fixtures/helpers';

const SESSION_TOKEN = 'test_session_1772823453557';
const APP_DOMAIN = 'project-copilot-ai-1.preview.emergentagent.com';

async function authenticateAndGoto(page: any, path: string) {
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
  await page.waitForResponse(
    (resp: any) => resp.url().includes('/api/auth/me') && resp.status() === 200,
    { timeout: 30000 }
  ).catch(() => {});
  await page.waitForLoadState('domcontentloaded');
}

test.describe('Resource Manager', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Resource Manager page loads', async ({ page }) => {
    await authenticateAndGoto(page, '/resources');
    await expect(page.getByTestId('resource-manager-main')).toBeVisible({ timeout: 30000 });
  });

  test('Resource Manager shows resources grid', async ({ page }) => {
    await authenticateAndGoto(page, '/resources');
    await expect(page.getByTestId('resources-grid')).toBeVisible({ timeout: 30000 });
  });

  test('Resource Manager has add resource button', async ({ page }) => {
    await authenticateAndGoto(page, '/resources');
    await expect(page.getByTestId('add-resource-button')).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Portfolio Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Portfolio Dashboard page loads', async ({ page }) => {
    await authenticateAndGoto(page, '/portfolio');
    await expect(page.getByTestId('portfolio-dashboard-main')).toBeVisible({ timeout: 30000 });
  });

  test('Portfolio Dashboard shows metric cards', async ({ page }) => {
    await authenticateAndGoto(page, '/portfolio');
    await expect(page.getByTestId('metric-total-projects')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('metric-active')).toBeVisible();
  });

  test('Portfolio Dashboard shows projects table', async ({ page }) => {
    await authenticateAndGoto(page, '/portfolio');
    await expect(page.getByTestId('projects-table')).toBeVisible({ timeout: 30000 });
  });
});

test.describe('AI Copilot', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('AI Copilot page loads', async ({ page }) => {
    await authenticateAndGoto(page, '/copilot');
    await expect(page.getByTestId('ai-copilot-main')).toBeVisible({ timeout: 30000 });
  });

  test('AI Copilot has chat input', async ({ page }) => {
    await authenticateAndGoto(page, '/copilot');
    await expect(page.getByTestId('chat-input')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('send-button')).toBeVisible();
  });

  test('AI Copilot has project context selector', async ({ page }) => {
    await authenticateAndGoto(page, '/copilot');
    await expect(page.getByTestId('project-context-selector')).toBeVisible({ timeout: 30000 });
  });
});
