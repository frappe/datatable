import { test, expect } from '../support';

test.describe('DataTable init', () => {
    test('instance is created without any errors', async ({ page }) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error));

        await page.evaluate(() => {
            // eslint-disable-next-line no-new
            new window.DataTable('#datatable2', {
                columns: ['Name', 'Position'],
                data: [
                    ['Faris', 'Developer']
                ]
            });
        });

        await expect(page.locator('#datatable2 .datatable')).toContainText('Faris');
        expect(errors).toEqual([]);
    });
});
