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

test.describe('AI Project Creator', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('AI Creator page loads with prompt section', async ({ page }) => {
    await authenticateAndGoto(page, '/create');
    await expect(page.getByTestId('project-creator-main')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('prompt-section')).toBeVisible();
  });

  test('AI Creator has prompt input and generate button', async ({ page }) => {
    await authenticateAndGoto(page, '/create');
    await expect(page.getByTestId('project-prompt-input')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('generate-button')).toBeVisible();
  });

  test('AI Creator shows example prompts', async ({ page }) => {
    await authenticateAndGoto(page, '/create');
    await expect(page.getByTestId('example-prompt-0')).toBeVisible({ timeout: 30000 });
  });

  test('AI Creator has toggles for milestones, tasks, stories', async ({ page }) => {
    await authenticateAndGoto(page, '/create');
    await expect(page.getByTestId('toggle-milestones')).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('toggle-tasks')).toBeVisible();
    await expect(page.getByTestId('toggle-stories')).toBeVisible();
  });
});

test.describe('Sprint Planner', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Sprint Planner page loads', async ({ page }) => {
    await authenticateAndGoto(page, '/sprint');
    await expect(page.getByTestId('sprint-planner-main')).toBeVisible({ timeout: 30000 });
  });

  test('Sprint Planner has project selector', async ({ page }) => {
    await authenticateAndGoto(page, '/sprint');
    await expect(page.getByTestId('project-selector')).toBeVisible({ timeout: 30000 });
  });

  test('Sprint Planner shows kanban board', async ({ page }) => {
    await authenticateAndGoto(page, '/sprint');
    await expect(page.getByTestId('kanban-board')).toBeVisible({ timeout: 30000 });
  });
});
