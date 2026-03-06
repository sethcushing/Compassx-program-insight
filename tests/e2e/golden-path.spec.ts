import { test, expect } from '@playwright/test';
import { dismissToasts } from '../fixtures/helpers';

const SESSION_TOKEN = 'test_session_1772823453557';
const APP_DOMAIN = 'project-copilot-ai-1.preview.emergentagent.com';
const BASE_API = 'https://project-copilot-ai-1.preview.emergentagent.com/api';

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

test.describe('Golden Path - Full User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('unauthenticated user sees landing page → attempts to access dashboard → redirected to /', async ({ page }) => {
    // Visit dashboard without auth
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    // Should redirect to landing page
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('login-button')).toBeVisible();
  });

  test('authenticated user navigates dashboard → AI Creator → back to dashboard', async ({ page }) => {
    await authenticateAndGoto(page, '/dashboard');
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 30000 });

    // Click AI Creator nav
    await page.getByTestId('nav-create').click();
    await expect(page).toHaveURL('/create');
    await expect(page.getByTestId('project-creator-main')).toBeVisible({ timeout: 30000 });

    // Navigate back to dashboard
    await page.getByTestId('nav-dashboard').click();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByTestId('dashboard-main')).toBeVisible({ timeout: 30000 });
  });

  test('authenticated user navigates to Sprint Planner', async ({ page }) => {
    await authenticateAndGoto(page, '/dashboard');
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 30000 });

    await page.getByTestId('nav-sprint').click();
    await expect(page).toHaveURL('/sprint');
    await expect(page.getByTestId('sprint-planner-main')).toBeVisible({ timeout: 30000 });
  });

  test('authenticated user navigates to Resources Manager', async ({ page }) => {
    await authenticateAndGoto(page, '/dashboard');
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 30000 });

    await page.getByTestId('nav-resources').click();
    await expect(page).toHaveURL('/resources');
    await expect(page.getByTestId('resource-manager-main')).toBeVisible({ timeout: 30000 });
  });

  test('authenticated user navigates to Portfolio', async ({ page }) => {
    await authenticateAndGoto(page, '/dashboard');
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 30000 });

    await page.getByTestId('nav-portfolio').click();
    await expect(page).toHaveURL('/portfolio');
    await expect(page.getByTestId('portfolio-dashboard-main')).toBeVisible({ timeout: 30000 });
  });

  test('authenticated user accesses AI Copilot and can type message', async ({ page }) => {
    await authenticateAndGoto(page, '/copilot');
    await expect(page.getByTestId('ai-copilot-main')).toBeVisible({ timeout: 30000 });
    
    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible();
    await chatInput.fill('What is the status of my projects?');
    await expect(chatInput).toHaveValue('What is the status of my projects?');
  });
});
