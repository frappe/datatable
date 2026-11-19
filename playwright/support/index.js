import { test as base, expect } from '@playwright/test';

export { expect };

export const test = base.extend({
    page: async ({ page }, use) => {
        await page.goto('/');
        await page.waitForFunction(() => window.datatable);
        await use(page);
    }
});

export function useSharedPage() {
    const shared = {};

    test.describe.configure({ mode: 'serial' });

    test.beforeAll(async ({ browser }) => {
        shared.page = await browser.newPage();
        await shared.page.goto('/');
        await shared.page.waitForFunction(() => window.datatable);
    });

    test.afterAll(async () => {
        await shared.page.close();
    });

    return shared;
}

export const getCell = (page, col, row) => page.locator(`.dt-cell--${col}-${row}`);

export const getColumnCell = (page, col) => page.locator(`.dt-cell--header-${col}`);

export const clickCell = async (page, col, row) => {
    const cell = getCell(page, col, row);
    await cell.click({ force: true });
    return cell;
};

export const nextFrame = page =>
    page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

export async function clickDropdown(page, col) {
    const toggle = getColumnCell(page, col).locator('.dt-dropdown__toggle');
    await toggle.scrollIntoViewIfNeeded();
    await nextFrame(page);
    await toggle.click();
}

export const clickDropdownItem = (page, item, scope = '') =>
    page.locator(`${scope} .dt-dropdown__list-item`.trim())
        .filter({ hasText: new RegExp(`^\\s*${item}\\s*$`) })
        .dispatchEvent('click');

export async function dragResizeHandle(page, col, { release = true } = {}) {
    const box = await page.locator(`.dt-cell--header-${col} .dt-cell__resize-handle`).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(700, 20);
    if (release) await page.mouse.up();
}

export async function clearInput(locator) {
    await locator.press('ControlOrMeta+a');
    await locator.press('Backspace');
}
