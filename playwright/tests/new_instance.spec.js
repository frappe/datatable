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

    test('a new instance in the same wrapper does not break window resize', async ({ page }) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));

        await page.evaluate(() => {
            const options = { columns: ['Name'], data: [['Faris']] };
            // eslint-disable-next-line no-new
            new window.DataTable('#datatable2', options);
            // eslint-disable-next-line no-new
            new window.DataTable('#datatable2', options);
        });
        await page.setViewportSize({ width: 800, height: 600 });
        await page.waitForTimeout(400);
        await page.setViewportSize({ width: 1000, height: 660 });
        await page.waitForTimeout(400);

        expect(errors).toEqual([]);
    });

    test('the line under the header ends at the last column', async ({ page }) => {
        await page.evaluate(() => {
            // eslint-disable-next-line no-new
            new window.DataTable('#datatable2', {
                layout: 'fixed',
                columns: [{ name: 'Name', width: 120 }, { name: 'Position', width: 120 }],
                data: [['Faris', 'Developer']]
            });
        });

        const edges = await page.evaluate(() => {
            const row = document.querySelector('#datatable2 .dt-header .dt-row:last-child');
            const lastCell = row.lastElementChild;
            return [row.getBoundingClientRect().right, lastCell.getBoundingClientRect().right];
        });
        expect(edges[0]).toBe(edges[1]);
    });
});
