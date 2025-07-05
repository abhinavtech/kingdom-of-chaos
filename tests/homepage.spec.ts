import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main title and subtitle', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('KINGDOM');
    await expect(page.locator('h2')).toContainText('OF CHAOS');
  });

  test('should display the game description', async ({ page }) => {
    await expect(page.locator('p').first()).toContainText('Enter the realm where knowledge reigns supreme');
  });

  test('should have participant and admin navigation buttons', async ({ page }) => {
    await expect(page.locator('text=🎮 PARTICIPANT')).toBeVisible();
    await expect(page.locator('text=👑 ADMIN')).toBeVisible();
  });

  test('should navigate to participant page', async ({ page }) => {
    await page.click('text=🎮 PARTICIPANT');
    await expect(page).toHaveURL('/participant');
  });

  test('should navigate to admin page', async ({ page }) => {
    await page.click('text=👑 ADMIN');
    await expect(page).toHaveURL('/admin');
  });

  test('should have proper styling and animations', async ({ page }) => {
    // Check for main container with gradient background
    const container = page.locator('.min-h-screen').first();
    await expect(container).toHaveClass(/bg-gradient-to-br/);
    
    // Check for game features description
    await expect(page.locator('text=Real-time multiplayer quiz game')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a[href="/participant"]')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a[href="/participant"]')).toBeVisible();
  });
}); 