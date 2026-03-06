import { test, expect } from '@playwright/test';
import { loginWithCookie, dismissToasts } from '../fixtures/helpers';

const APP_DOMAIN = 'project-copilot-ai-1.preview.emergentagent.com';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('landing page loads with CompassX branding', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText('CompassX').first()).toBeVisible();
  });

  test('landing page has Sign In button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId('login-button')).toBeVisible();
  });

  test('landing page has hero login button (Get Started)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId('hero-login-button')).toBeVisible();
  });

  test('landing page shows feature cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId('feature-card-0')).toBeVisible();
    await expect(page.getByTestId('feature-card-1')).toBeVisible();
    await expect(page.getByTestId('feature-card-2')).toBeVisible();
  });

  test('landing page has CTA login button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId('cta-login-button')).toBeVisible();
  });

  test('theme toggle works on landing page (light to dark)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Default is light mode
    const html = page.locator('html');
    await expect(html).toHaveClass(/light/);

    // Click theme toggle
    await page.getByTestId('theme-toggle').click();
    await expect(html).toHaveClass(/dark/);

    // Toggle back
    await page.getByTestId('theme-toggle').click();
    await expect(html).toHaveClass(/light/);
  });

  test('unauthenticated user stays on landing page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    // Should redirect to landing page
    await expect(page).toHaveURL('/');
  });
});
