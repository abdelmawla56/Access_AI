// tests/test_frontend.js
/* eslint-disable */
const { test, expect } = require('@playwright/test');

test('frontend loads home page', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveURL('http://localhost:3000/');
});
