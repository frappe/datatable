import { test, expect, clearInput } from '../support';

const data = [
    ['Jordan Moreau', 'Sales Manager', 'JM-100', 52000],
    ['Riley Dubois', 'HR Partner', 'RD-200', 61000],
    ['Morgan Petrov', 'Solutions Architect', 'MP-300', 78000],
    ['Casey Zhou', 'Accountant', 'CZ-400', 45000]
];

async function createTable(page, options = {}, columnOptions = {}) {
    await page.evaluate(({ data, options, columnOptions }) => {
        window.fuzzyTable = new window.DataTable('#datatable2', Object.assign({
            columns: [
                Object.assign({ id: 'name', name: 'Name' }, columnOptions.name),
                { id: 'role', name: 'Role', format: value => `<b>${value} Team</b>` },
                Object.assign({ id: 'code', name: 'Code' }, columnOptions.code),
                { id: 'salary', name: 'Salary' }
            ],
            data,
            inlineFilters: true
        }, options));
    }, { data, options, columnOptions });
    await page.locator('#datatable2 .dt-cell--1-0').click();
    await page.keyboard.press('Control+f');
}

async function filterBy(page, colIndex, text) {
    const input = page.locator(`#datatable2 .dt-filter[data-col-index="${colIndex}"]`);
    await clearInput(input);
    if (text) await input.pressSequentially(text);
}

async function expectNames(page, names) {
    await expect(page.locator('#datatable2 .dt-scrollable .dt-row .dt-cell--col-1 .dt-cell__content'))
        .toHaveText(names);
}

test.describe('Fuzzy filter', () => {
    test('keeps contains matching by default', async ({ page }) => {
        await createTable(page);
        await filterBy(page, 1, 'mor');
        await expectNames(page, ['Jordan Moreau', 'Morgan Petrov']);
        await filterBy(page, 1, 'jdmr');
        await expectNames(page, []);
    });

    test('matches letters in order with gaps', async ({ page }) => {
        await createTable(page, { filterMode: 'fuzzy' });
        await filterBy(page, 1, 'jdmr');
        await expectNames(page, ['Jordan Moreau']);
        await filterBy(page, 1, 'JDMR');
        await expectNames(page, ['Jordan Moreau']);
        await filterBy(page, 1, 'rmdj');
        await expectNames(page, []);
    });

    test('matches each word on its own and in any order', async ({ page }) => {
        await createTable(page, { filterMode: 'fuzzy' });
        await filterBy(page, 1, 'mrau jrd');
        await expectNames(page, ['Jordan Moreau']);
        await filterBy(page, 1, 'mor zhou');
        await expectNames(page, []);
    });

    test('matches the formatted value', async ({ page }) => {
        await createTable(page, { filterMode: 'fuzzy' });
        await filterBy(page, 2, 'mgrtm');
        await expectNames(page, ['Jordan Moreau']);
    });

    test('lets a column override the table mode', async ({ page }) => {
        await createTable(page, { filterMode: 'fuzzy' }, { name: { filterMode: 'contains' } });
        await filterBy(page, 1, 'jdmr');
        await expectNames(page, []);
        await filterBy(page, 1, '');
        await filterBy(page, 3, 'jm1');
        await expectNames(page, ['Jordan Moreau']);
    });

    test('turns on fuzzy for a single column', async ({ page }) => {
        await createTable(page, {}, { code: { filterMode: 'fuzzy' } });
        await filterBy(page, 3, 'mp3');
        await expectNames(page, ['Morgan Petrov']);
        await filterBy(page, 3, '');
        await filterBy(page, 1, 'jdmr');
        await expectNames(page, []);
    });

    test('keeps number filters unchanged', async ({ page }) => {
        await createTable(page, { filterMode: 'fuzzy' });
        await filterBy(page, 4, '>60000');
        await expectNames(page, ['Riley Dubois', 'Morgan Petrov']);
        await filterBy(page, 4, '50000:55000');
        await expectNames(page, ['Jordan Moreau']);
        await filterBy(page, 4, '=45000');
        await expectNames(page, ['Casey Zhou']);
    });
});
