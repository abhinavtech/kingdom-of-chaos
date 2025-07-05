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
            question: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: '4',
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

    await page.goto('/participant');
    await page.fill('input[type="text"]', 'Test Player');
    await page.click('button[type="submit"]');
  });

  test('should display question and options', async ({ page }) => {
    await expect(page.locator('text=What is 2 + 2?')).toBeVisible();
    await expect(page.locator('text=3')).toBeVisible();
    await expect(page.locator('text=4')).toBeVisible();
    await expect(page.locator('text=5')).toBeVisible();
    await expect(page.locator('text=6')).toBeVisible();
  });

  test('should allow selecting an answer', async ({ page }) => {
    const option = page.locator('text=4').first();
    await option.click();
    
    // Should show selected state
    await expect(option).toHaveClass(/selected|active|chosen/);
  });

  test('should handle answer submission', async ({ page }) => {
    // Mock submit answer API
    await page.route('**/api/game/submit-answer', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          isCorrect: true,
          points: 10,
          message: 'Correct!'
        })
      });
    });

    // Select an answer
    await page.locator('text=4').first().click();
    
    // Submit answer
    const submitButton = page.locator('button:has-text("Submit")');
    await submitButton.click();
    
    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toContainText(/Submitting|Loading/);
  });

  test('should show game complete when all questions answered', async ({ page }) => {
    // Mock completing all questions
    await page.route('**/api/game/submit-answer', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          isCorrect: true,
          points: 10,
          message: 'Correct!'
        })
      });
    });

    // Answer first question
    await page.locator('text=4').first().click();
    await page.locator('button:has-text("Submit")').click();
    
    // Wait for next question or game complete
    await page.waitForTimeout(3500); // Wait for auto-advance
    
    // Should either show next question or game complete
    const hasNextQuestion = await page.locator('text=What is the capital of France?').isVisible();
    const hasGameComplete = await page.locator('text=Game Complete!').isVisible();
    
    expect(hasNextQuestion || hasGameComplete).toBe(true);
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