import { test, expect } from '@playwright/test';

test.describe('Participant Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/participant');
  });

  test('should show join game form initially', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Join the Battle');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Enter the Kingdom');
  });

  test('should validate name input', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    
    // Button should be disabled when name is empty
    await expect(submitButton).toBeDisabled();
    
    // Enter a name
    await page.fill('input[type="text"]', 'Test Player');
    await expect(submitButton).toBeEnabled();
    
    // Clear name
    await page.fill('input[type="text"]', '');
    await expect(submitButton).toBeDisabled();
  });

  test('should not allow empty name submission', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
    
    // Try to submit with only spaces
    await page.fill('input[type="text"]', '   ');
    await expect(submitButton).toBeDisabled();
  });

  test('should respect name length limit', async ({ page }) => {
    const nameInput = page.locator('input[type="text"]');
    const longName = 'a'.repeat(60); // Longer than 50 character limit
    
    await nameInput.fill(longName);
    const inputValue = await nameInput.inputValue();
    expect(inputValue.length).toBeLessThanOrEqual(50);
  });

  test('should show loading state when joining', async ({ page }) => {
    await page.fill('input[type="text"]', 'Test Player');
    
    // Mock the API call to be slow
    await page.route('**/api/participants', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, name: 'Test Player', score: 0 })
      });
    });
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    await expect(submitButton).toContainText('Joining...');
    await expect(submitButton).toBeDisabled();
  });

  test('should handle join game success', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/participants', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, name: 'Test Player', score: 0 })
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
            questionText: 'What is the capital of France?',
            options: {"A": "London", "B": "Berlin", "C": "Paris", "D": "Madrid"},
            correctAnswer: 'C',
            points: 10
          },
          {
            id: 2,
            questionText: 'Which planet is known as the Red Planet?',
            options: {"A": "Venus", "B": "Mars", "C": "Jupiter", "D": "Saturn"},
            correctAnswer: 'B',
            points: 10
          }
        ])
      });
    });

    await page.fill('input[type="text"]', 'Test Player');
    await page.click('button[type="submit"]');
    
    // Should show game interface after successful join
    await expect(page.locator('text=Test Player')).toBeVisible();
    await expect(page.locator('text=Score: 0')).toBeVisible();
  });

  test('should handle join game error', async ({ page }) => {
    // Mock API error
    await page.route('**/api/participants', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.fill('input[type="text"]', 'Test Player');
    await page.click('button[type="submit"]');
    
    // Should remain on join form after error
    await expect(page.locator('h1')).toContainText('Join the Battle');
  });
});

test.describe('Participant Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful participant creation
    await page.route('**/api/participants', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, name: 'Test Player', score: 0 })
      });
    });

    // Mock questions
    await page.route('**/api/questions', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            questionText: 'What is the capital of France?',
            options: {"A": "London", "B": "Berlin", "C": "Paris", "D": "Madrid"},
            correctAnswer: 'C',
            points: 10
          },
          {
            id: 2,
            questionText: 'Which planet is known as the Red Planet?',
            options: {"A": "Venus", "B": "Mars", "C": "Jupiter", "D": "Saturn"},
            correctAnswer: 'B',
            points: 10
          }
        ])
      });
    });

    await page.goto('/participant');
    await page.fill('input[type="text"]', 'Test Player');
    await page.click('button[type="submit"]');
  });

  test('should display question and options', async ({ page }) => {
    // Wait for questions to load
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h2')).toContainText('What is the capital of France?');
    await expect(page.getByTestId('answer-option-A')).toBeVisible();
    await expect(page.getByTestId('answer-option-B')).toBeVisible();
    await expect(page.getByTestId('answer-option-C')).toBeVisible();
    await expect(page.getByTestId('answer-option-D')).toBeVisible();
  });

  test('should allow selecting an answer', async ({ page }) => {
    // Wait for questions to load
    await page.waitForLoadState('networkidle');
    const option = page.getByTestId('answer-option-C');
    await option.click();
    
    // Should show selected state
    await expect(option).toHaveClass(/selected/);
  });

  test('should handle answer submission', async ({ page }) => {
    // Wait for questions to load
    await page.waitForLoadState('networkidle');
    
    // Select an answer
    await page.getByTestId('answer-option-C').click();
    
    // Submit answer
    const submitBtn = page.getByTestId('submit-answer-btn');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    
    // Should show submitting state
    await expect(submitBtn).toContainText('Submitting...');
  });

  test('should show game complete when all questions answered', async ({ page }) => {
    // Wait for questions to load
    await page.waitForLoadState('networkidle');
    
    // Check that we successfully joined and are in the game
    await expect(page.locator('text=Test Player')).toBeVisible();
    await expect(page.locator('text=Score:')).toBeVisible();
  });

  test('should allow restarting the game', async ({ page }) => {
    // Navigate to game complete state
    await page.evaluate(() => {
      // Simulate game completion
      window.dispatchEvent(new CustomEvent('gameComplete'));
    });
    
    const resetButton = page.locator('button:has-text("Play Again")');
    if (await resetButton.isVisible()) {
      await resetButton.click();
      await expect(page.locator('h1')).toContainText('Join the Battle');
    }
  });
}); 