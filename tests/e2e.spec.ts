import { test, expect } from '@playwright/test';

test('homepage loads and has no console errors', async ({ page }) => {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  await page.goto('/');

  await expect(page).toHaveTitle(/AI 工具聚合站/);

  await expect(page.locator('nav')).toBeVisible();
  await expect(page.locator('main')).toBeVisible();

  const toolsLink = page.getByRole('link', { name: /Tools/ });
  if (await toolsLink.count() > 0) {
    await toolsLink.first().click();
    await page.waitForLoadState('networkidle');
  }

  expect(errors).toHaveLength(0);
});
