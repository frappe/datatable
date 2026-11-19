import { test, expect, useSharedPage } from '../support';

test.describe('Column auto width', () => {
    const longValue = 'A much longer value that only appears far down the list';
    const narrowValue = 'i'.repeat(30);
    const wideValue = 'W'.repeat(20);
    const formattedValue = 'A formatter makes this short value much wider';

    const shared = useSharedPage();

    test.beforeAll(async () => {
        const { page } = shared;
        await page.evaluate(({ longValue, narrowValue, wideValue, formattedValue }) => {
            const data = Array.from({ length: 100 }, (_, i) => [
                i === 99 ? longValue : 'a',
                // a unique value per row, so the canvas picks the widest values;
                // row 98 has more characters, but is narrower than row 99
                i === 98 ? narrowValue : (i === 99 ? wideValue : 'C' + i),
                // raw "x" is the shortest value, but it shows the widest text
                i === 99 ? 'x' : 'yyyyyy'
            ]);

            // eslint-disable-next-line no-new
            new window.DataTable('#datatable2', {
                columns: [
                    'Name',
                    'Code',
                    {
                        name: 'Formatted',
                        format: value => value === 'x' ? `<b>${formattedValue}</b>` : value
                    }
                ],
                data,
                serialNoColumn: false,
                checkboxColumn: false
            });
        }, { longValue, narrowValue, wideValue, formattedValue });

        // The last rows are not rendered at first, because of virtual scroll
        await expect(page.locator('#datatable2 .dt-cell--0-99')).toHaveCount(0);
        await page.locator('#datatable2 .dt-scrollable').evaluate(el => el.scrollTo(0, el.scrollHeight));
    });

    async function shouldShowFullText(colIndex, rowIndex, text) {
        const content = shared.page.locator(`#datatable2 .dt-cell--${colIndex}-${rowIndex} .dt-cell__content`);
        await expect(content).toHaveText(text);
        await expect.poll(() => content.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    }

    test('sizes a column from all rows, not only the first row', async () => {
        await shouldShowFullText(0, 99, longValue);
    });

    test('sizes a column from the widest text, not the most characters', async () => {
        await shouldShowFullText(1, 99, wideValue);
        await shouldShowFullText(1, 98, narrowValue);
    });

    test('sizes a column from the formatted value', async () => {
        await shouldShowFullText(2, 99, formattedValue);
    });
});
