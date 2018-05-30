describe('DataTable', function () {
    it('instance is created without any errors', () => {
        cy.visit('/');

        cy.window()
            .its('DataTable')
            .then(DataTable => {
                // eslint-disable-next-line
                new DataTable('#datatable2', {
                    columns: ['Name', 'Position'],
                    data: [
                        ['Faris', 'Developer']
                    ]
                });
            });

        cy.get('#datatable2 .datatable')
            .contains('Faris');
    });

    describe('Cell', function () {
        before(function () {
            cy.visit('/');
        });

        it('focuses cell on click', function () {
            cy.clickCell(2, 0)
                .should('have.class', 'dt-cell--focus');
        });

        it('not focuses cell which are not focusable', function () {
            cy.clickCell(1, 0)
                .should('not.have.class', 'dt-cell--focus');
        });

        it('edit cell on enter press', function () {
            cy.getCell(4, 0).type('{enter}')
                .should('have.class', 'dt-cell--editing')
                .type('{enter}')
                .should('not.have.class', 'dt-cell--editing');

            // cy.focused()
            //     .type('{selectall}{del}')
            //     .wait(20)
            //     .type('Test{enter}');

            // cy.getCell(4, 0).contains('Test');
        });

        it('edit cell on double click', function () {
            cy.getCell(4, 0)
                .as('target')
                .dblclick({ force: true })
                .should('have.class', 'dt-cell--editing');

            cy.clickCell(3, 0);

            cy.get('@target').should('not.have.class', 'dt-cell--editing');
        });

        it('edit cell', function () {

            cy.getCell(4, 1).dblclick();

            cy.wait(100);

            cy.focused()
                .type('{selectall}')
                .wait(100)
                .type('{del}')
                .wait(100)
                .type('Test')
                .wait(100)
                .type('{enter}');

            cy.getCell(4, 1).contains('Test');
        });

        it('if editing is false: editing should not activate', function () {
            cy.getCell(3, 0).dblclick({ force: true })
                .should('not.have.class', 'dt-cell--editing');
        });

        it('navigation using arrow keys', function () {
            cy.clickCell(2, 0)
                .type('{rightarrow}');

            cy.get('.dt-cell--focus')
                .should('have.class', 'dt-cell--3-0')
                .click({ force: true })
                .type('{downarrow}');

            cy.get('.dt-cell--focus')
                .should('have.class', 'dt-cell--3-1');
            // TODO: test navigation over hidden rows
        });

        it('navigation using ctrl + arrow keys', function () {
            cy.clickCell(2, 0)
                .type('{ctrl}{rightarrow}');
            cy.get('.dt-cell--focus')
                .should('have.class', 'dt-cell--7-0');
        });

        it('cell selection using shift + arrow keys', function () {
            cy.getCell(2, 1)
                .type('{shift}{rightarrow}{rightarrow}{downarrow}');

            // 6 cells and 2 headers
            cy.get('.dt-cell--highlight').should('have.length', 6 + 2);

            cy.clickCell(2, 0);
        });

        it('mouse selection', function () {
            // TODO
            // cy.getCell(2, 1)
            //     .trigger('mousedown', { which: 1, pageX: 331, pageY: 207, force: true })
            //     .trigger('mousemove', { which: 1, pageX: 489, pageY: 312 })
            //     .trigger('mouseup');
        });
    });

    describe('Column', function () {
        before(function () {
            cy.visit('/');
        });

        it('header dropdown toggles on click', function () {
            cy.getColumnCell(2)
                .find('.dt-dropdown__toggle')
                .as('toggle')
                .click();
            cy.getColumnCell(2)
                .find('.dt-dropdown__list')
                .as('dropdown-list')
                .should('be.visible');

            cy.get('@toggle').click();

            cy.get('@dropdown-list').should('not.be.visible');
        });

        it('sort ascending button should work', function () {
            cy.clickDropdown(2);
            cy.clickDropdownItem(2, 'Sort Ascending');

            cy.window().then(win => win.datatable.getColumn(2))
                .its('sortOrder')
                .should('eq', 'asc');

            cy.window().then(win => win.datatable.datamanager)
                .its('currentSort.colIndex')
                .should('eq', 2);

            cy.get('.dt-body .dt-row:first')
                .contains('Airi Satou');

            cy.clickDropdownItem(2, 'Reset sorting');
        });

        it('removes column using dropdown action', function () {
            cy.get('.dt-cell--header').should('have.length', 8);

            cy.clickDropdown(5);
            cy.clickDropdownItem(5, 'Remove column');

            cy.get('.dt-cell--header').should('have.length', 7);
        });
    });

    describe('Row', function () {
        it('check / uncheck row', function () {
            cy.get('.dt-body .dt-row:first')
                .find('input[type="checkbox"]')
                .click();

            cy.get('[data-row-index="0"]').should('have.class', 'dt-row--highlight');

            cy.get('.dt-toast').contains('1 row selected');
        });
    });
});
