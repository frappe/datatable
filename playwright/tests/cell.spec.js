import { test, expect, useSharedPage, getCell, clickCell } from '../support';

test.describe('Cell', () => {
    const shared = useSharedPage();

    test('focuses cell on click', async () => {
        const cell = await clickCell(shared.page, 2, 0);
        await expect(cell).toHaveClass(/dt-cell--focus/);
    });

    test('not focuses cell which are not focusable', async () => {
        const cell = await clickCell(shared.page, 1, 0);
        await expect(cell).not.toHaveClass(/dt-cell--focus/);
    });

    test('edit cell on enter press', async () => {
        const { page } = shared;
        const cell = await clickCell(page, 4, 0);
        await page.keyboard.press('Enter');
        await expect(cell).toHaveClass(/dt-cell--editing/);
        await page.keyboard.press('Enter');
        await expect(cell).not.toHaveClass(/dt-cell--editing/);
    });

    test('edit cell on double click', async () => {
        const { page } = shared;
        const target = getCell(page, 4, 0);
        await target.dblclick({ force: true });
        await expect(target).toHaveClass(/dt-cell--editing/);

        await clickCell(page, 3, 0);

        await expect(target).not.toHaveClass(/dt-cell--editing/);
    });

    test('edit cell', async () => {
        const { page } = shared;
        const cell = getCell(page, 4, 1);
        await cell.dblclick({ force: true });
        await cell.locator('input').click();
        await page.keyboard.press('ControlOrMeta+a');
        await page.keyboard.press('Delete');
        await page.keyboard.type('Test');
        await page.keyboard.press('Enter');
        await expect(cell).toContainText('Test');
    });

    test('if editing is false: editing should not activate', async () => {
        const cell = getCell(shared.page, 3, 0);
        await cell.dblclick({ force: true });
        await expect(cell).not.toHaveClass(/dt-cell--editing/);
    });

    test('navigation using arrow keys', async () => {
        const { page } = shared;
        await clickCell(page, 2, 0);
        await page.keyboard.press('ArrowRight');

        const focused = page.locator('.dt-cell--focus');
        await expect(focused).toHaveClass(/dt-cell--3-0/);
        await focused.click({ force: true });
        await page.keyboard.press('ArrowDown');

        await expect(page.locator('.dt-cell--focus')).toHaveClass(/dt-cell--3-1/);
    });

    test('navigation using ctrl + arrow keys', async () => {
        const { page } = shared;
        await clickCell(page, 2, 0);
        await page.keyboard.press('Control+ArrowRight');
        await expect(page.locator('.dt-cell--focus')).toHaveClass(/dt-cell--11-0/);
    });

    test('cell selection using shift + arrow keys', async () => {
        const { page } = shared;
        await clickCell(page, 2, 1);
        await page.keyboard.down('Shift');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.up('Shift');

        await expect(page.locator('.dt-cell--highlight')).toHaveCount(6 + 2);

        await clickCell(page, 2, 0);
    });

    test.fixme('mouse selection', async () => {});
});

test.describe('Cell focus in a sorted table', () => {
    test('keeps the sorted row in place when clicking a partly hidden cell', async ({ page }) => {
        await page.evaluate(() => window.datatable.sortColumn(7, 'desc'));
        const firstRow = page.locator('.dt-scrollable .dt-row').first();
        await expect(firstRow).toHaveClass(/dt-row-24/);

        await page.evaluate(() => {
            const scrollable = document.querySelector('.dt-scrollable');
            const cell = document.querySelector('.dt-cell--9-24');
            scrollable.scrollLeft = cell.offsetLeft + cell.offsetWidth - scrollable.clientWidth - 20;
            scrollable.dispatchEvent(new Event('scroll'));
        });
        const box = await getCell(page, 9, 24).boundingBox();
        await page.mouse.click(box.x + 10, box.y + box.height / 2);

        await expect(getCell(page, 9, 24)).toHaveClass(/dt-cell--focus/);
        await expect(firstRow).toHaveClass(/dt-row-24/);
        expect(await page.locator('.dt-scrollable').evaluate(el => el.scrollTop)).toBe(0);
    });
});

test.describe('Cell mouse selection', () => {
    test('stops selecting when the mouse is released outside the table', async ({ page }) => {
        const center = async (col, row) => {
            const box = await getCell(page, col, row).boundingBox();
            return [box.x + box.width / 2, box.y + box.height / 2];
        };
        const highlighted = page.locator('.dt-cell--highlight');

        await page.mouse.move(...await center(2, 1));
        await page.mouse.down();
        await page.mouse.move(...await center(3, 2), { steps: 5 });
        await expect(highlighted).toHaveCount(4 + 2);

        const table = await page.locator('.datatable').first().boundingBox();
        const [, y] = await center(3, 2);
        await page.mouse.move(table.x + table.width + 40, y, { steps: 5 });
        await page.mouse.up();
        const selected = await highlighted.count();

        await page.mouse.move(...await center(5, 4), { steps: 5 });
        await page.waitForTimeout(200);
        await page.mouse.move(...await center(6, 5), { steps: 5 });
        await page.waitForTimeout(200);
        await expect(highlighted).toHaveCount(selected);
    });
});
