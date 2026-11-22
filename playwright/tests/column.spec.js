import {
    test,
    expect,
    getCell,
    getColumnCell,
    clickDropdown,
    clickDropdownItem,
    dragResizeHandle
} from '../support';

const cssWidth = locator => locator.evaluate(el => getComputedStyle(el).width);

const scrollTable = (page, scrollLeft) => page.evaluate(async (scrollLeft) => {
    const scrollable = document.querySelector('.dt-scrollable');
    scrollable.scrollLeft = scrollLeft;
    scrollable.dispatchEvent(new Event('scroll'));
    await new Promise(resolve => setTimeout(resolve, 50));
}, scrollLeft);

const left = (page, selector) =>
    page.evaluate(selector => document.querySelector(selector).getBoundingClientRect().left, selector);

test.describe('Column', () => {
    test('header dropdown toggles on click', async ({ page }) => {
        await getColumnCell(page, 2).locator('.dt-dropdown__toggle').click();
        const dropdownList = page.locator('.dt-dropdown__list');
        await expect(dropdownList).toBeVisible();

        await getColumnCell(page, 2).click();

        await expect(dropdownList).not.toBeVisible();
    });

    test('sort ascending button should work', async ({ page }) => {
        await clickDropdown(page, 2);
        await clickDropdownItem(page, 'Sort Ascending');

        await expect.poll(() => page.evaluate(() => window.datatable.getColumn(2).sortOrder)).toBe('asc');

        await expect.poll(() => page.evaluate(() => window.datatable.datamanager.currentSort.colIndex)).toBe(2);

        await expect(page.locator('.dt-scrollable .dt-row').first().locator(':scope > div:nth-of-type(3)'))
            .toContainText('Airi Satou');

        await clickDropdownItem(page, 'Reset sorting');
    });

    test('sorts on the value returned by a column sortValue hook', async ({ page }) => {
        await page.evaluate(() => {
            window.datatable.getColumn(2).sortValue = cell => String(cell.content).split(' ').pop();
        });

        await clickDropdown(page, 2);
        await clickDropdownItem(page, 'Sort Ascending');

        await expect(async () => {
            const surnames = await page.evaluate(() => {
                const datamanager = window.datatable.datamanager;
                return datamanager.rowViewOrder
                    .map(rowIndex => String(datamanager.getCell(2, rowIndex).content).split(' ').pop());
            });
            expect(surnames).toEqual([...surnames].sort());
        }).toPass();

        await clickDropdownItem(page, 'Reset sorting');
        await page.evaluate(() => {
            delete window.datatable.getColumn(2).sortValue;
        });
    });

    test('hides sort items in the dropdown of a non sortable column', async ({ page }) => {
        await page.evaluate(() => {
            window.datatable2 = new window.DataTable('#datatable2', {
                columns: [{ name: 'Name', id: 'name' }, { name: 'Status', id: 'status', sortable: false }],
                data: [['x', 'c'], ['y', 'a'], ['z', 'b']]
            });
        });
        const sortItems = page.locator('#datatable2 .dt-dropdown__list-item')
            .filter({ hasText: /^\s*(Sort Ascending|Sort Descending|Reset sorting)\s*$/ });

        await page.locator('#datatable2 .dt-cell--header-2 .dt-dropdown__toggle').click();
        await expect(page.locator('#datatable2 .dt-dropdown__list')).toBeVisible();
        await expect(sortItems.filter({ visible: true })).toHaveCount(0);

        await page.locator('#datatable2 .dt-cell--header-1').click();
        await page.locator('#datatable2 .dt-cell--header-1 .dt-dropdown__toggle').click();
        await expect(sortItems.filter({ visible: true })).toHaveCount(3);
    });

    test('removes column using dropdown action', async ({ page }) => {
        await expect(page.locator('.dt-cell--header')).toHaveCount(12);

        await clickDropdown(page, 5);
        await clickDropdownItem(page, 'Remove column');

        await expect(page.locator('.dt-cell--header')).toHaveCount(11);
    });

    test('resize column with mouse drag', async ({ page }) => {
        await dragResizeHandle(page, 4);

        const width = await cssWidth(getColumnCell(page, 4));
        await expect(getColumnCell(page, 4)).toHaveCSS('width', width);
        await expect(getCell(page, 4, 1)).toHaveCSS('width', width);
    });

    test('preserves user-resized widths when refreshed', async ({ page }) => {
        expect(await page.evaluate(() => window.datatable.getResizedColumnWidths().size)).toBe(0);

        await dragResizeHandle(page, 4);

        const result = await page.evaluate(() => {
            const table = window.datatable;
            const column = table.getColumn(4);
            const width = column.width;
            const resizedWidth = table.getResizedColumnWidths().get(column.id);

            table.refresh(table.datamanager.data, table.options.columns);
            return {
                width,
                resizedWidth,
                refreshedWidth: table.getColumn(4).width,
                resizedCount: table.getResizedColumnWidths().size
            };
        });
        expect(result.resizedWidth).toBe(result.width);
        expect(result.refreshedWidth).toBe(result.width);
        expect(result.resizedCount).toBe(1);
    });

    test('preserves user-resized widths in ratio layout', async ({ page }) => {
        await page.evaluate(() => {
            const table = window.datatable;
            table.options.layout = 'ratio';
            table.refresh(table.datamanager.data, table.options.columns);
        });

        await dragResizeHandle(page, 4);

        const result = await page.evaluate(() => {
            const table = window.datatable;
            const width = table.getColumn(4).width;
            table.refresh(table.datamanager.data, table.options.columns);
            return { width, refreshedWidth: table.getColumn(4).width };
        });
        expect(result.refreshedWidth).toBe(result.width);
    });

    test('resizes body cells while the column is being dragged', async ({ page }) => {
        await dragResizeHandle(page, 4, { release: false });

        const width = await cssWidth(getColumnCell(page, 4));
        await expect(getCell(page, 4, 1)).toHaveCSS('width', width);

        await page.mouse.up();
    });

    test('resize column using double click', async ({ page }) => {
        await page.locator('.dt-cell--header-4 .dt-cell__resize-handle').dispatchEvent('dblclick');
        const width = await cssWidth(getColumnCell(page, 4));
        await expect(getCell(page, 4, 1)).toHaveCSS('width', width);
        const truncated = await page.locator('.dt-scrollable .dt-cell--col-4 .dt-cell__content')
            .evaluateAll(cells => cells.filter(cell => cell.scrollWidth > cell.clientWidth).length);
        expect(truncated).toBe(0);

        const result = await page.evaluate(() => {
            const table = window.datatable;
            const column = table.getColumn(4);
            const width = column.width;
            const resizedWidth = table.getResizedColumnWidths().get(column.id);
            table.refresh(table.datamanager.data, table.options.columns);
            return { width, resizedWidth, refreshedWidth: table.getColumn(4).width };
        });
        expect(result.resizedWidth).toBe(result.width);
        expect(result.refreshedWidth).toBe(result.width);
    });

    test('pins a column from the dropdown menu', async ({ page }) => {
        await clickDropdown(page, 2);
        await clickDropdownItem(page, 'Freeze');

        await expect.poll(() => page.evaluate(() => window.datatable.getColumn(2).sticky)).toBe(true);

        const initialStickyBodyLeft = await left(page, '.dt-cell--2-0');
        await scrollTable(page, 220);
        expect(Math.abs(await left(page, '.dt-cell--2-0') - initialStickyBodyLeft)).toBeLessThanOrEqual(1);
    });

    test('keeps sticky columns pinned while scrolling horizontally', async ({ page }) => {
        const initialCheckboxLeft = await left(page, '.dt-cell--0-0');
        const initialSerialLeft = await left(page, '.dt-cell--1-0');
        const initialNameLeft = await left(page, '.dt-cell--2-0');

        await scrollTable(page, 220);

        const nextCheckboxBodyLeft = await left(page, '.dt-cell--0-0');
        const nextCheckboxHeaderLeft = await left(page, '.dt-cell--header-0');
        const nextSerialBodyLeft = await left(page, '.dt-cell--1-0');
        const nextSerialHeaderLeft = await left(page, '.dt-cell--header-1');
        const nextOfficeBodyLeft = await left(page, '.dt-cell--4-0');
        const nextOfficeHeaderLeft = await left(page, '.dt-cell--header-4');
        const nextNameLeft = await left(page, '.dt-cell--2-0');

        expect(Math.abs(nextCheckboxBodyLeft - initialCheckboxLeft)).toBeLessThanOrEqual(1);
        expect(Math.abs(nextSerialBodyLeft - initialSerialLeft)).toBeLessThanOrEqual(1);
        expect(Math.abs(nextCheckboxHeaderLeft - nextCheckboxBodyLeft)).toBeLessThanOrEqual(1);
        expect(Math.abs(nextSerialHeaderLeft - nextSerialBodyLeft)).toBeLessThanOrEqual(1);
        expect(Math.abs(nextOfficeHeaderLeft - nextOfficeBodyLeft)).toBeLessThanOrEqual(1);
        expect(nextNameLeft).toBeLessThan(initialNameLeft);
    });

    test('keeps other pinned columns aligned after resizing a pinned column', async ({ page }) => {
        await clickDropdown(page, 2);
        await clickDropdownItem(page, 'Freeze');
        await clickDropdown(page, 3);
        await clickDropdownItem(page, 'Freeze');

        await dragResizeHandle(page, 2);

        await scrollTable(page, 220);

        const rects = await page.evaluate(() => {
            const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
            return {
                resizedBodyCell: rect('.dt-cell--2-0'),
                nextStickyBodyCell: rect('.dt-cell--3-0'),
                nextStickyHeaderCell: rect('.dt-cell--header-3')
            };
        });

        expect(Math.abs(rects.nextStickyBodyCell.left - rects.resizedBodyCell.right)).toBeLessThanOrEqual(1);
        expect(Math.abs(rects.nextStickyHeaderCell.left - rects.nextStickyBodyCell.left)).toBeLessThanOrEqual(1);
    });
});
