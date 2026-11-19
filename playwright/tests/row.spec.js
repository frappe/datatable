import { test, expect } from '../support';

test.describe('Row', () => {
    test('check / uncheck row', async ({ page }) => {
        await page.locator('.dt-scrollable .dt-row').first().locator('input[type="checkbox"]').click();

        await expect(page.locator('.dt-row[data-row-index="0"]')).toHaveClass(/dt-row--highlight/);

        await expect(page.locator('.dt-toast')).toContainText('1 row selected');
    });
});
