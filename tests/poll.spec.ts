import { test, expect } from '@playwright/test';

test.describe('Poll Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should create a poll successfully', async ({ page }) => {
    // Navigate to admin page
    await page.click('text=Admin');
    
    // Login as admin
    await page.fill('input[type="password"]', 'biggestlulli69');
    await page.click('button:has-text("Enter the Throne Room")');
    
    // Wait for admin dashboard
    await page.waitForSelector('text=Admin Dashboard');
    
    // Click create poll button
    await page.click('button:has-text("Create New Poll")');
    
    // Fill poll details
    await page.fill('input[placeholder="Enter poll title..."]', 'Test Poll');
    await page.fill('textarea[placeholder="Enter poll description..."]', 'This is a test poll description');
    // Time limit is already set to 300 by default
    
    // Submit poll
    await page.click('button:has-text("Create Poll")');
    
    // Check for success
    await expect(page.locator('text=Poll created successfully')).toBeVisible({ timeout: 10000 });
  });

  test('should display poll on participant page', async ({ page, context }) => {
    // First create a poll as admin
    const adminPage = page;
    await adminPage.goto('http://localhost:3000');
    await adminPage.click('text=Admin');
    await adminPage.fill('input[type="password"]', 'biggestlulli69');
    await adminPage.click('button:has-text("Enter the Throne Room")');
    await adminPage.waitForSelector('text=Admin Dashboard');
    
    // Create and activate poll
    await adminPage.click('button:has-text("Create New Poll")');
    await adminPage.fill('input[placeholder="Enter poll title..."]', 'Active Test Poll');
    await adminPage.fill('textarea[placeholder="Enter poll description..."]', 'This poll should be visible to participants');
    await adminPage.click('button:has-text("Create Poll")');
    
    // Activate the poll
    await adminPage.click('button:has-text("Activate")');
    
    // Open participant page in new tab
    const participantPage = await context.newPage();
    await participantPage.goto('http://localhost:3000');
    await participantPage.click('text=Participant');
    
    // Join as participant
    await participantPage.fill('input[placeholder*="name"]', 'Test User');
    await participantPage.fill('input[type="password"]', 'testpass');
    await participantPage.click('button:has-text("Enter the Kingdom")');
    
    // Check if poll is visible
    await expect(participantPage.locator('text=Active Test Poll')).toBeVisible({ timeout: 10000 });
  });

  test('should handle poll submission', async ({ page }) => {
    // Join as participant
    await page.goto('http://localhost:3000');
    await page.click('text=Participant');
    await page.fill('input[placeholder*="name"]', 'Poll Tester');
    await page.fill('input[type="password"]', 'testpass');
    await page.click('button:has-text("Enter the Kingdom")');
    
    // Wait for active poll (assuming one is active)
    await page.waitForSelector('text=Active Poll', { timeout: 10000 });
    
    // Submit rankings (this depends on the actual UI)
    // You might need to adjust these selectors based on the actual implementation
    await page.click('text=Submit Rankings');
    
    // Check for success message
    await expect(page.locator('text=Rankings submitted')).toBeVisible({ timeout: 10000 });
  });
});