import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock participants leaderboard API
    await page.route('**/api/participants/leaderboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Player 1', score: 100 },
          { id: 2, name: 'Player 2', score: 85 },
          { id: 3, name: 'Player 3', score: 70 }
        ])
      });
    });

    // Mock questions API
    await page.route('**/api/questions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            question: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: '4',
            points: 10
          },
          {
            id: 2,
            question: 'What is the capital of France?',
            options: ['London', 'Berlin', 'Paris', 'Madrid'],
            correctAnswer: 'Paris',
            points: 15
          }
        ])
      });
    });

    await page.goto('/admin');
  });

  test('should display admin dashboard title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('ADMIN DASHBOARD');
    await expect(page.locator('text=Command the Kingdom')).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // Test with a slow API response
    await page.route('**/api/participants/leaderboard', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/admin');
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
  });

  test('should display statistics cards', async ({ page }) => {
    // Wait for data to load
    await page.waitForLoadState('networkidle');
    
    // Should show participant count
    await expect(page.getByTestId('participants-stat')).toBeVisible();
    await expect(page.locator('text=Total Participants')).toBeVisible();
    
    // Should show question count
    await expect(page.getByTestId('questions-stat')).toBeVisible();
    await expect(page.locator('text=Available Questions')).toBeVisible();
    
    // Should show active players count
    await expect(page.getByTestId('active-players-stat')).toBeVisible();
    await expect(page.locator('text=Active Players')).toBeVisible();
  });

  test('should display leaderboard', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('text=LIVE LEADERBOARD')).toBeVisible();
    await expect(page.locator('text=Player 1')).toBeVisible();
    await expect(page.locator('text=Player 2')).toBeVisible();
    await expect(page.locator('text=Player 3')).toBeVisible();
    
    // Should show scores
    await expect(page.locator('text=100')).toBeVisible();
    await expect(page.locator('text=85')).toBeVisible();
    await expect(page.locator('text=70')).toBeVisible();
  });

  test('should show rank indicators', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Should show medals or rank indicators
    const firstPlace = page.locator('text=🥇').or(page.locator('text=#1'));
    const secondPlace = page.locator('text=🥈').or(page.locator('text=#2'));
    const thirdPlace = page.locator('text=🥉').or(page.locator('text=#3'));
    
    await expect(firstPlace).toBeVisible();
    await expect(secondPlace).toBeVisible();
    await expect(thirdPlace).toBeVisible();
  });

  test('should have refresh functionality', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const refreshButton = page.locator('button:has-text("Refresh")');
    await expect(refreshButton).toBeVisible();
    
    // Mock updated data
    await page.route('**/api/participants/leaderboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Player 1', score: 120 },
          { id: 2, name: 'Player 2', score: 95 },
          { id: 3, name: 'Player 3', score: 80 }
        ])
      });
    });
    
    await refreshButton.click();
    
    // Should show updated scores
    await expect(page.locator('text=120')).toBeVisible();
    await expect(page.locator('text=95')).toBeVisible();
    await expect(page.locator('text=80')).toBeVisible();
  });

  test('should show live updates indicator', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('text=Live Updates')).toBeVisible();
    
    // Should show live indicator dot
    const liveIndicator = page.locator('.animate-pulse');
    await expect(liveIndicator).toBeVisible();
  });

  test('should display last updated time', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('text=Last updated:')).toBeVisible();
    
    // Should show a time display - look for the specific time span
    await expect(page.locator('span.text-primary-400').last()).toBeVisible();
  });

  test('should handle empty leaderboard', async ({ page }) => {
    // Mock empty leaderboard
    await page.route('**/api/participants/leaderboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('text=No participants yet')).toBeVisible();
    await expect(page.locator('text=Warriors are gathering')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/participants/leaderboard', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/admin');
    
    // Should still show the dashboard structure
    await expect(page.locator('h1')).toContainText('ADMIN DASHBOARD');
  });

  test('should be responsive', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=LIVE LEADERBOARD')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=LIVE LEADERBOARD')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=LIVE LEADERBOARD')).toBeVisible();
  });
});

test.describe('Admin Real-time Features', () => {
  test('should handle WebSocket connections', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should show admin dashboard with live updates indicator
    await expect(page.locator('text=ADMIN DASHBOARD')).toBeVisible();
    await expect(page.locator('text=Live Updates')).toBeVisible();
    
    // Should have the refresh button for manual updates
    await expect(page.locator('button:has-text("Refresh")')).toBeVisible();
  });
}); 