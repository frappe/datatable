describe('Column', function () {
    beforeEach(function () {
        cy.visit('/');
    });

    it('header dropdown toggles on click', function () {
        cy.getColumnCell(2)
            .find('.dt-dropdown__toggle')
            .as('toggle')
            .click();
        cy.get('.dt-dropdown__list')
            .as('dropdown-list')
            .should('be.visible');

        cy.getColumnCell(2).click();

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

        cy.get('.dt-scrollable .dt-row:first div:nth-of-type(3)')
            .contains('Airi Satou');

        cy.clickDropdownItem(2, 'Reset sorting');
    });

    it('sorts on the value returned by a column sortValue hook', function () {
        // Sort the Name column by surname instead of the cell content.
        cy.window().then(win => {
            win.datatable.getColumn(2).sortValue = cell => String(cell.content).split(' ').pop();
        });

        cy.clickDropdown(2);
        cy.clickDropdownItem(2, 'Sort Ascending');

        cy.window().then(win => {
            const datamanager = win.datatable.datamanager;
            const surnames = datamanager.rowViewOrder
                .map(rowIndex => String(datamanager.getCell(2, rowIndex).content).split(' ').pop());

            expect(surnames).to.deep.equal([...surnames].sort());
        });

        cy.clickDropdownItem(2, 'Reset sorting');
        cy.window().then(win => {
            delete win.datatable.getColumn(2).sortValue;
        });
    });

    it('removes column using dropdown action', function () {
        cy.get('.dt-cell--header').should('have.length', 12);

        cy.clickDropdown(5);
        cy.clickDropdownItem(5, 'Remove column');

        cy.get('.dt-cell--header').should('have.length', 11);
    });

    it('resize column with mouse drag', function () {
        cy.get('.dt-cell--header-4 .dt-cell__resize-handle').as('resize-handle');
        cy
            .get('@resize-handle')
            .trigger('mousedown')
            .trigger('mousemove', { pageX: 700, pageY: 20, which: 1 })
            .trigger('mouseup');

        cy.getColumnCell(4).invoke('css', 'width').then((width) => {
            cy.getColumnCell(4)
                .should('have.css', 'width', width);
            cy.getCell(4, 1)
                .should('have.css', 'width', width);
        });
    });

    it('resize column using double click', function () {
        cy.get('.dt-cell--header-4 .dt-cell__resize-handle').trigger('dblclick');
        cy.getColumnCell(4).should('have.css', 'width')
            .and('match', /9\dpx/);
        cy.getCell(4, 1).should('have.css', 'width')
            .and('match', /9\dpx/);
    });

    it('pins a column from the dropdown menu', function () {
        cy.clickDropdown(2);
        cy.clickDropdownItem(2, 'Freeze');

        cy.window().then(win => win.datatable.getColumn(2))
            .its('sticky')
            .should('eq', true);

        cy.get('.dt-scrollable').then(($scrollable) => {
            const scrollable = $scrollable[0];
            const stickyBodyCell = Cypress.$('.dt-cell--2-0')[0];
            const initialStickyBodyLeft = stickyBodyCell.getBoundingClientRect().left;

            scrollable.scrollLeft = 220;
            scrollable.dispatchEvent(new Event('scroll'));

            cy.wait(50).then(() => {
                const nextStickyBodyLeft = stickyBodyCell.getBoundingClientRect().left;
                expect(nextStickyBodyLeft).to.be.closeTo(initialStickyBodyLeft, 1);
            });
        });
    });

    it('keeps sticky columns pinned while scrolling horizontally', function () {
        cy.get('.dt-scrollable').then(($scrollable) => {
            const scrollable = $scrollable[0];
            const checkboxBodyCell = Cypress.$('.dt-cell--0-0')[0];
            const checkboxHeaderCell = Cypress.$('.dt-cell--header-0')[0];
            const serialBodyCell = Cypress.$('.dt-cell--1-0')[0];
            const serialHeaderCell = Cypress.$('.dt-cell--header-1')[0];
            const officeBodyCell = Cypress.$('.dt-cell--4-0')[0];
            const officeHeaderCell = Cypress.$('.dt-cell--header-4')[0];
            const nameBodyCell = Cypress.$('.dt-cell--2-0')[0];

            const initialCheckboxLeft = checkboxBodyCell.getBoundingClientRect().left;
            const initialSerialLeft = serialBodyCell.getBoundingClientRect().left;
            const initialNameLeft = nameBodyCell.getBoundingClientRect().left;

            scrollable.scrollLeft = 220;
            scrollable.dispatchEvent(new Event('scroll'));

            cy.wait(50).then(() => {
                const nextCheckboxBodyLeft = checkboxBodyCell.getBoundingClientRect().left;
                const nextCheckboxHeaderLeft = checkboxHeaderCell.getBoundingClientRect().left;
                const nextSerialBodyLeft = serialBodyCell.getBoundingClientRect().left;
                const nextSerialHeaderLeft = serialHeaderCell.getBoundingClientRect().left;
                const nextOfficeBodyLeft = officeBodyCell.getBoundingClientRect().left;
                const nextOfficeHeaderLeft = officeHeaderCell.getBoundingClientRect().left;
                const nextNameLeft = nameBodyCell.getBoundingClientRect().left;

                expect(nextCheckboxBodyLeft).to.be.closeTo(initialCheckboxLeft, 1);
                expect(nextSerialBodyLeft).to.be.closeTo(initialSerialLeft, 1);
                expect(nextCheckboxHeaderLeft).to.be.closeTo(nextCheckboxBodyLeft, 1);
                expect(nextSerialHeaderLeft).to.be.closeTo(nextSerialBodyLeft, 1);
                expect(nextOfficeHeaderLeft).to.be.closeTo(nextOfficeBodyLeft, 1);
                expect(nextNameLeft).to.be.lessThan(initialNameLeft);
            });
        });
    });
});
