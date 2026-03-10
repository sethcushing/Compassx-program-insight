import { test, expect } from '@playwright/test';
import { dismissToasts, gotoDashboard, gotoSprintBoard, gotoProject } from '../fixtures/helpers';

// Test the new Dashboard Quick Access section
test.describe('Dashboard Quick Access Section', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Quick Access section loads with tabs (Milestones, Risks, Issues, Decisions, Action Items)', async ({ page }) => {
    await gotoDashboard(page);
    
    // Check Quick Access section is visible
    await expect(page.getByTestId('quick-access-section')).toBeVisible({ timeout: 15000 });
    
    // Check all tabs are visible
    await expect(page.getByTestId('quick-tab-milestones')).toBeVisible();
    await expect(page.getByTestId('quick-tab-risk')).toBeVisible();
    await expect(page.getByTestId('quick-tab-issue')).toBeVisible();
    await expect(page.getByTestId('quick-tab-decision')).toBeVisible();
    await expect(page.getByTestId('quick-tab-action_item')).toBeVisible();
  });

  test('Quick Access tabs switch and show correct content for Milestones', async ({ page }) => {
    await gotoDashboard(page);
    
    // Wait for Quick Access section
    await expect(page.getByTestId('quick-access-section')).toBeVisible({ timeout: 15000 });
    
    // Click Milestones tab (should be default)
    await page.getByTestId('quick-tab-milestones').click();
    
    // Check list shows milestones with project name column
    const list = page.getByTestId('quick-access-list');
    await expect(list).toBeVisible();
    await expect(list.locator('th:has-text("Milestone")')).toBeVisible();
    await expect(list.locator('th:has-text("Project")')).toBeVisible();
    await expect(list.locator('th:has-text("Target Date")')).toBeVisible();
    await expect(list.locator('th:has-text("Health")')).toBeVisible();
  });

  test('Quick Access tabs switch to Risks and show correct content', async ({ page }) => {
    await gotoDashboard(page);
    
    await expect(page.getByTestId('quick-access-section')).toBeVisible({ timeout: 15000 });
    
    // Click Risks tab
    await page.getByTestId('quick-tab-risk').click();
    
    // Check list shows risks columns
    const list = page.getByTestId('quick-access-list');
    await expect(list).toBeVisible();
    await expect(list.locator('th:has-text("Title")')).toBeVisible();
    await expect(list.locator('th:has-text("Project")')).toBeVisible();
    await expect(list.locator('th:has-text("Priority")')).toBeVisible();
    await expect(list.locator('th:has-text("Status")')).toBeVisible();
  });

  test('Quick Access tabs switch to Issues and show correct content', async ({ page }) => {
    await gotoDashboard(page);
    
    await expect(page.getByTestId('quick-access-section')).toBeVisible({ timeout: 15000 });
    
    // Click Issues tab
    await page.getByTestId('quick-tab-issue').click();
    
    // Check list shows issues columns
    const list = page.getByTestId('quick-access-list');
    await expect(list).toBeVisible();
    await expect(list.locator('th:has-text("Title")')).toBeVisible();
    await expect(list.locator('th:has-text("Project")')).toBeVisible();
  });

  test('Quick Access tabs switch to Decisions and show correct content', async ({ page }) => {
    await gotoDashboard(page);
    
    await expect(page.getByTestId('quick-access-section')).toBeVisible({ timeout: 15000 });
    
    // Click Decisions tab
    await page.getByTestId('quick-tab-decision').click();
    
    // Check list shows decisions
    const list = page.getByTestId('quick-access-list');
    await expect(list).toBeVisible();
    await expect(list.locator('th:has-text("Title")')).toBeVisible();
    await expect(list.locator('th:has-text("Project")')).toBeVisible();
  });

  test('Quick Access tabs switch to Action Items and show correct content', async ({ page }) => {
    await gotoDashboard(page);
    
    await expect(page.getByTestId('quick-access-section')).toBeVisible({ timeout: 15000 });
    
    // Click Action Items tab
    await page.getByTestId('quick-tab-action_item').click();
    
    // Check list shows action items
    const list = page.getByTestId('quick-access-list');
    await expect(list).toBeVisible();
    await expect(list.locator('th:has-text("Title")')).toBeVisible();
    await expect(list.locator('th:has-text("Project")')).toBeVisible();
  });

  test('Quick Access table rows are clickable and navigate to project', async ({ page }) => {
    await gotoDashboard(page);
    
    await expect(page.getByTestId('quick-access-section')).toBeVisible({ timeout: 15000 });
    
    // Click on a milestone row
    const list = page.getByTestId('quick-access-list');
    const firstRow = list.locator('tbody tr').first();
    await expect(firstRow).toBeVisible();
    
    // Get the project name from the row to verify navigation
    const projectName = await firstRow.locator('td').nth(1).textContent();
    
    // Click the row
    await firstRow.click();
    
    // Should navigate to project detail page
    await expect(page).toHaveURL(/\/project\//, { timeout: 10000 });
  });
});
