import { expect, test } from '@playwright/test';

test('landing page shows session entry controls', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByAltText('Planning Poker Logo')).toBeVisible();
	await expect(page.getByLabel('Your Name')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Create New Session' })).toBeDisabled();
	await expect(page.getByLabel('Session Code')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Join Session' })).toBeDisabled();
});
