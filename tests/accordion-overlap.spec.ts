import { test, expect } from '@playwright/test';

// This test assumes the dev server is running at http://localhost:5173

test('Transaction list accordions do not overlap when opened', async ({ page }) => {
  await page.goto('http://localhost:5173/');

  // Wait for the transaction list to load
  await page.getByText('Amount:').first().waitFor({ state: 'visible' });

  // Open the first two accordions
  const triggers = await page.locator('button:has-text("Amount:")').all();
  await triggers[0].click();
  await triggers[1].click();

  // Wait for animations to complete
  await page.waitForTimeout(600);

  // Take a screenshot for manual inspection
  await page.screenshot({ path: 'tests/accordion-overlap.png', fullPage: true });

  // Optionally, add a visual regression check here if you have baseline images
}); 