import { test, expect, useSharedPage, getCell, clickDropdown, clickDropdownItem, clearInput } from '../support';

test.describe('Inline Filters', () => {
    const shared = useSharedPage();
    const filterInput = col => shared.page.locator(`.dt-filter[data-col-index="${col}"]`);
    const row = index => shared.page.locator(`.dt-row[data-row-index="${index}"]`);

    test.beforeEach(async () => {
        await expect(row(0)).toBeVisible();
    });

    test('simple text filter', async () => {
        const { page } = shared;
        await getCell(page, 4, 0).click();
        await page.keyboard.press('Control+f');

        await filterInput(4).pressSequentially('edin');
        await expect(page.locator('.dt-row-0')).toBeVisible();
        await expect(page.locator('.dt-row-1')).toHaveCount(0);
        await clearInput(filterInput(4));
    });

    test('simple number filter', async () => {
        await filterInput(5).pressSequentially('2360');
        await expect(row(8)).toBeVisible();
        await expect(row(15)).toHaveCount(0);
        await expect(row(22)).toHaveCount(0);
        await clearInput(filterInput(5));
    });

    test('greater than', async () => {
        await filterInput(5).pressSequentially('> 6000');
        await expect(row(0)).toHaveCount(0);
        await expect(row(3)).toBeVisible();
        await clearInput(filterInput(5));
    });

    test('less than', async () => {
        await filterInput(5).pressSequentially('< 2000');
        await expect(row(0)).toHaveCount(0);
        await expect(row(51)).toBeVisible();
        await clearInput(filterInput(5));
    });

    test('range', async () => {
        await filterInput(5).pressSequentially(' 2000: 5000');
        await expect(row(4)).toHaveCount(0);
        await expect(row(5)).toBeVisible();
        await clearInput(filterInput(5));
    });

    test('equals', async () => {
        await filterInput(5).pressSequentially('=9608');
        await expect(shared.page.locator('.dt-row-6')).toBeVisible();
        await clearInput(filterInput(5));
    });

    test('not equals', async () => {
        await filterInput(5).pressSequentially('!=9608');
        await expect(row(6)).toHaveCount(0);
        await expect(row(0)).toBeVisible();
        await clearInput(filterInput(5));
    });

    test('multiple filters', async () => {
        await filterInput(4).pressSequentially('to');
        await filterInput(5).pressSequentially('54');

        await expect(row(4)).toBeVisible();
        await expect(row(1)).toHaveCount(0);
        await clearInput(filterInput(4));
        await clearInput(filterInput(5));
    });

    test('greater than for string type filters', async () => {
        await filterInput(6).pressSequentially('> 01/07/2011');
        await expect(row(0)).toHaveCount(0);
        await expect(row(1)).toBeVisible();
        await expect(row(3)).toBeVisible();
        await expect(row(5)).toBeVisible();
        await clearInput(filterInput(6));
    });

    test('filters with sorting', async () => {
        const { page } = shared;
        await page.goto('/');
        await page.waitForFunction(() => window.datatable);
        await clickDropdown(page, 7);
        await clickDropdownItem(page, 'Sort Descending');
        await getCell(page, 5, 24).click();
        await page.keyboard.press('Control+f');
        await filterInput(5).pressSequentially('>3000', { delay: 100 });

        const firstRow = page.locator('.dt-scrollable .dt-row').first();
        await expect(firstRow).toContainText('Angelica');
        await expect(firstRow).toHaveClass(/dt-row-24/);
        await clearInput(filterInput(5));
    });
});
