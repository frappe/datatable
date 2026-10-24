describe('Column auto width', function () {
    const longValue = 'A much longer value that only appears far down the list';
    const narrowValue = 'i'.repeat(30);
    const wideValue = 'W'.repeat(20);
    const formattedValue = 'A formatter makes this short value much wider';

    before(function () {
        cy.visit('/');

        cy.window()
            .its('DataTable')
            .then(DataTable => {
                const data = Array.from({ length: 100 }, (_, i) => [
                    i === 99 ? longValue : 'a',
                    // a unique value per row, so the canvas picks the widest values;
                    // row 98 has more characters, but is narrower than row 99
                    i === 98 ? narrowValue : (i === 99 ? wideValue : 'C' + i),
                    // raw "x" is the shortest value, but it shows the widest text
                    i === 99 ? 'x' : 'yyyyyy'
                ]);

                // eslint-disable-next-line
                new DataTable('#datatable2', {
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
            });

        // The last rows are not rendered at first, because of virtual scroll
        cy.get('#datatable2 .dt-cell--0-99').should('not.exist');
        cy.get('#datatable2 .dt-scrollable').scrollTo('bottom');
    });

    function shouldShowFullText(colIndex, rowIndex, text) {
        cy.get(`#datatable2 .dt-cell--${colIndex}-${rowIndex} .dt-cell__content`).should(($content) => {
            const content = $content[0];
            expect(content.textContent.trim()).to.equal(text);
            expect(content.scrollWidth).to.be.at.most(content.clientWidth);
        });
    }

    it('sizes a column from all rows, not only the first row', function () {
        shouldShowFullText(0, 99, longValue);
    });

    it('sizes a column from the widest text, not the most characters', function () {
        shouldShowFullText(1, 99, wideValue);
        shouldShowFullText(1, 98, narrowValue);
    });

    it('sizes a column from the formatted value', function () {
        shouldShowFullText(2, 99, formattedValue);
    });
});
