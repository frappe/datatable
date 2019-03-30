describe('Column', function () {
    before(function () {
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

        cy.get('.dt-scrollable .dt-row:first')
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
