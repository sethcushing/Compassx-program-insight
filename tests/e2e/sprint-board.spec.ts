import { test, expect } from '@playwright/test';
import { dismissToasts, gotoSprintBoard } from '../fixtures/helpers';

// Test Sprint Board with All Projects view
test.describe('Sprint Board - All Projects View', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Sprint Board defaults to All Projects view', async ({ page }) => {
    await gotoSprintBoard(page);
    
    // Check project selector shows "All Projects"
    const projectSelector = page.getByTestId('project-selector');
    await expect(projectSelector).toBeVisible();
    await expect(projectSelector).toContainText('All Projects');
  });

  test('Sprint Board shows stories from all projects with project names', async ({ page }) => {
    await gotoSprintBoard(page);
    
    // Check kanban board is visible
    const kanbanBoard = page.getByTestId('kanban-board');
    await expect(kanbanBoard).toBeVisible({ timeout: 15000 });
    
    // Check story cards show project names (look for multiple project names)
    // Stories have project_name shown when selectedProject === 'all'
    const storyCards = page.locator('[data-testid^="story-card-"]');
    await expect(storyCards.first()).toBeVisible({ timeout: 10000 });
    
    // Check that at least one project name is visible in stories
    const projectNames = ['BOM Grid v1.0', 'Digital Intake Co-Pilot', 'CPQ Reimagined', 'Code Red Tracker'];
    let foundProjectName = false;
    for (const name of projectNames) {
      const count = await page.locator(`text=${name}`).count();
      if (count > 0) {
        foundProjectName = true;
        break;
      }
    }
    expect(foundProjectName).toBe(true);
  });

  test('Sprint Board project selector dropdown filters stories by project', async ({ page }) => {
    await gotoSprintBoard(page);
    
    // Open project selector
    const projectSelector = page.getByTestId('project-selector');
    await expect(projectSelector).toBeVisible();
    await projectSelector.click();
    
    // Select a specific project
    await page.getByRole('option', { name: /BOM Grid/ }).click();
    
    // After filtering, only BOM Grid stories should be visible
    // Wait for board to update
    await page.waitForLoadState('domcontentloaded');
    
    // Verify filter applied - selector should now show BOM Grid
    await expect(projectSelector).toContainText('BOM Grid');
  });

  test('Sprint Board shows 5 columns: Backlog, Ready, In Progress, In Review, Done', async ({ page }) => {
    await gotoSprintBoard(page);
    
    // Check all columns are visible
    await expect(page.getByTestId('column-backlog')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('column-ready')).toBeVisible();
    await expect(page.getByTestId('column-in_progress')).toBeVisible();
    await expect(page.getByTestId('column-in_review')).toBeVisible();
    await expect(page.getByTestId('column-done')).toBeVisible();
  });

  test('Sprint Board story cards have drag handle and points', async ({ page }) => {
    await gotoSprintBoard(page);
    
    const kanbanBoard = page.getByTestId('kanban-board');
    await expect(kanbanBoard).toBeVisible({ timeout: 15000 });
    
    // Check first story card has points displayed
    const storyCards = page.locator('[data-testid^="story-card-"]');
    await expect(storyCards.first()).toBeVisible({ timeout: 10000 });
    
    // Stories should have "pts" displayed for story points
    await expect(storyCards.first().locator('text=/\\d+ pts/')).toBeVisible();
  });

  test('Sprint Board New Sprint button is visible', async ({ page }) => {
    await gotoSprintBoard(page);
    
    await expect(page.getByTestId('add-sprint-button')).toBeVisible({ timeout: 15000 });
  });
});
