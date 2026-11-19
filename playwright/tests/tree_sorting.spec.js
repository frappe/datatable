import { test, expect } from '../support';

test.describe('Tree sorting', () => {
    const data = [
        { value: 7, indent: 0 },
        { value: 1, indent: 1 },
        { value: 8, indent: 1 },
        { value: 3, indent: 0 },
        { value: 4, indent: 1 },
        { value: 5, indent: 2 },
        { value: 6, indent: 2 },
        { value: 2, indent: 1 }
    ];

    test('sorts siblings, numbers rows and keeps collapse and expand working', async ({ page }) => {
        await createTable(page, data);
        await expectRowOrder(page, [7, 1, 8, 3, 4, 5, 6, 2]);
        await page.evaluate(() => {
            const rowmanager = window.treeTable.rowmanager;
            const refreshRows = rowmanager.refreshRows;
            window.refreshRowsCalls = 0;
            rowmanager.refreshRows = function () {
                window.refreshRowsCalls++;
                return refreshRows.apply(this, arguments);
            };
        });
        const refreshRowsCalls = () => page.evaluate(() => window.refreshRowsCalls);
        const resetRefreshRowsCalls = () => page.evaluate(() => { window.refreshRowsCalls = 0; });

        await sortTable(page, 'Sort Ascending');
        await expectRowOrder(page, [3, 2, 4, 5, 6, 7, 1, 8]);
        await expectSerialNumbers(page, 8);
        expect(await refreshRowsCalls()).toBe(1);
        await toggleRow(page, 7);
        await expectRowOrder(page, [3, 2, 4, 5, 6, 7]);
        await toggleRow(page, 7);
        await expectRowOrder(page, [3, 2, 4, 5, 6, 7, 1, 8]);

        await resetRefreshRowsCalls();
        await sortTable(page, 'Sort Descending');
        await expectRowOrder(page, [7, 8, 1, 3, 4, 6, 5, 2]);
        await expectSerialNumbers(page, 8);
        expect(await refreshRowsCalls()).toBe(1);
        await toggleRow(page, 3);
        await expectRowOrder(page, [7, 8, 1, 3]);
        await toggleRow(page, 3);
        await expectRowOrder(page, [7, 8, 1, 3, 4, 2]);
        await toggleRow(page, 4);
        await expectRowOrder(page, [7, 8, 1, 3, 4, 6, 5, 2]);

        await resetRefreshRowsCalls();
        await sortTable(page, 'Reset sorting');
        await expectRowOrder(page, [7, 1, 8, 3, 4, 5, 6, 2]);
        await expectSerialNumbers(page, 8);
        expect(await refreshRowsCalls()).toBe(1);
    });

    test('preserves the column sortValue hook', async ({ page }) => {
        await createTable(page, data, () => ({
            columns: [{ id: 'value', name: 'Value', sortValue: cell => -cell.content }]
        }));
        await sortTable(page, 'Sort Ascending');
        await expectRowOrder(page, [7, 8, 1, 3, 4, 6, 5, 2]);
        await sortTable(page, 'Sort Descending');
        await expectRowOrder(page, [3, 2, 4, 5, 6, 7, 1, 8]);
        await sortTable(page, 'Reset sorting');
        await expectRowOrder(page, [7, 1, 8, 3, 4, 5, 6, 2]);
    });

    test('sorts flat tables normally even when rows have indent metadata', async ({ page }) => {
        await createTable(page, data, () => ({ treeView: false }));
        await sortTable(page, 'Sort Ascending');
        await expectRowOrder(page, [1, 2, 3, 4, 5, 6, 7, 8]);
        await sortTable(page, 'Sort Descending');
        await expectRowOrder(page, [8, 7, 6, 5, 4, 3, 2, 1]);
        await sortTable(page, 'Reset sorting');
        await expectRowOrder(page, [7, 1, 8, 3, 4, 5, 6, 2]);
    });

    test('supports nonzero root indents and tables without serial numbers', async ({ page }) => {
        await createTable(page, data.map(row => Object.assign({}, row, { indent: row.indent + 2 })), () => ({
            serialNoColumn: false
        }));
        await sortTable(page, 'Sort Ascending');
        await expectRowOrder(page, [3, 2, 4, 5, 6, 7, 1, 8]);
        await sortTable(page, 'Sort Descending');
        await expectRowOrder(page, [7, 8, 1, 3, 4, 6, 5, 2]);
    });

    test('refreshes cached serial number formatting after sorting', async ({ page }) => {
        await createTable(page, data, () => ({
            serialNoColumn: false,
            columns: [
                { id: '_rowIndex', name: 'Sr No', format: value => `No ${value}` },
                { id: 'value', name: 'Value' }
            ]
        }));
        await expectSerialNumbers(page, 8, 'No ');
        await sortTable(page, 'Sort Ascending');
        await expectRowOrder(page, [3, 2, 4, 5, 6, 7, 1, 8]);
        await expectSerialNumbers(page, 8, 'No ');
    });

    test('keeps sorting after a data refresh', async ({ page }) => {
        await createTable(page, data);
        await sortTable(page, 'Sort Ascending');
        await expectRowOrder(page, [3, 2, 4, 5, 6, 7, 1, 8]);
        await page.evaluate(data => window.treeTable.refresh(data), data);
        await sortTable(page, 'Sort Descending');
        await expectRowOrder(page, [7, 8, 1, 3, 4, 6, 5, 2]);
        await expectSerialNumbers(page, 8);
    });

    test('sorts an empty tree without errors', async ({ page }) => {
        await createTable(page, []);
        await page.evaluate(() => window.treeTable.datamanager.sortRows(1, 'asc'));
        expect(await page.evaluate(() => window.treeTable.datamanager.rowViewOrder)).toEqual([]);
    });
});

async function createTable(page, data, getOptions = () => ({})) {
    await page.evaluate(({ data, getOptions }) => {
        // eslint-disable-next-line no-new-func
        const options = new Function(`return (${getOptions})()`)();
        window.treeTable = new window.DataTable('#datatable2', Object.assign({
            columns: [{ id: 'value', name: 'Value', width: 180 }],
            data,
            treeView: true
        }, options));
    }, { data, getOptions: getOptions.toString() });
    await expect(page.locator('#datatable2 .datatable')).toHaveCount(1);
}

async function sortTable(page, label) {
    await page.locator('#datatable2 .dt-cell--header', { hasText: 'Value' })
        .locator('.dt-dropdown__toggle').click();
    await page.locator('#datatable2 .dt-dropdown__list-item', { hasText: label }).dispatchEvent('click');
}

async function toggleRow(page, value) {
    await page.locator('#datatable2 .dt-scrollable .dt-tree-node')
        .filter({ has: page.locator('span', { hasText: new RegExp(`^${value}$`) }) })
        .locator('.dt-tree-node__toggle').click();
}

async function expectRowOrder(page, expected) {
    await expect(page.locator('#datatable2 .dt-scrollable .dt-row .dt-cell:last-child .dt-cell__content'))
        .toHaveText(expected.map(String));
}

async function expectSerialNumbers(page, count, prefix = '') {
    const expected = Array.from({ length: count }, (_, index) => prefix + (index + 1));
    await expect(page.locator('#datatable2 .dt-scrollable .dt-row .dt-cell:first-child .dt-cell__content'))
        .toHaveText(expected);
}
