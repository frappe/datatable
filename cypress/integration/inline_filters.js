describe('Inline Filters', function () {
    before(function () {
        cy.visit('/');
    });

    beforeEach(function () {
        cy.get('.dt-filter[data-col-index=4]').as('filterInput4');
        cy.get('.dt-filter[data-col-index=5]').as('filterInput5');
        cy.get('.dt-filter[data-col-index=6]').as('filterInput6');
        cy.get('.dt-row[data-row-index=0]').should('be.visible');
    });

    it('simple text filter', function () {
        cy.getCell(4, 0).click().type('{ctrl}f');

        cy.get('@filterInput4').type('edin');
        cy.get('.dt-row[data-row-index=0]').should('be.visible');
        cy.get('.dt-row[data-row-index=1]').should('not.be.visible');
        cy.get('@filterInput4').clear();
    });

    it('simple number filter', function () {
        cy.get('@filterInput5').type('15');
        cy.get('.dt-row[data-row-index=2]').should('be.visible');
        cy.get('.dt-row[data-row-index=15]').should('be.visible');
        cy.get('.dt-row[data-row-index=22]').should('not.be.visible');
        cy.get('@filterInput5').clear();
    });

    it('greater than', function () {
        cy.get('@filterInput5').type('> 6000');
        cy.get('.dt-row[data-row-index=0]').should('not.be.visible');
        cy.get('.dt-row[data-row-index=3]').should('be.visible');
        cy.get('@filterInput5').clear();
    });

    it('less than', function () {
        cy.get('@filterInput5').type('< 2000');
        cy.get('.dt-row[data-row-index=0]').should('not.be.visible');
        cy.get('.dt-row[data-row-index=51]').should('be.visible');
        cy.get('@filterInput5').clear();
    });

    it('range', function () {
        cy.get('@filterInput5').type(' 2000: 5000');
        cy.get('.dt-row[data-row-index=4]').should('not.be.visible');
        cy.get('.dt-row[data-row-index=5]').should('be.visible');
        cy.get('@filterInput5').clear();
    });

    it('equals', function () {
        cy.get('@filterInput5').type('=9608');
        cy.get('.dt-row-6').should('be.visible');
        cy.get('@filterInput5').clear();
    });

    it('multiple filters', function () {
        cy.get('@filterInput4').type('to');
        cy.get('@filterInput5').type('54');

        cy.get('.dt-row[data-row-index=0]').should('be.visible');
        cy.get('.dt-row[data-row-index=4]').should('be.visible');
        cy.get('.dt-row[data-row-index=1]').should('not.be.visible');
        cy.get('@filterInput4').clear();
        cy.get('@filterInput5').clear();
    });

    it('greater than for string type filters', function () {
        cy.get('@filterInput6').type('> 01/07/2011');
        cy.get('.dt-row[data-row-index=0]').should('not.be.visible');
        cy.get('.dt-row[data-row-index=1]').should('be.visible');
        cy.get('.dt-row[data-row-index=3]').should('be.visible');
        cy.get('.dt-row[data-row-index=5]').should('be.visible');
        cy.get('@filterInput6').clear();
    });

    it('filters with sorting', function () {
        cy.visit('/');
        cy.clickDropdown(7);
        cy.clickDropdownItem(7, 'Sort Descending');
        cy.get('.dt-filter[data-col-index=5]').as('filterInput5');
        cy.getCell(5, 24).click().type('{ctrl}f');
        cy.get('@filterInput5').type('>3000', {delay: 100});

        cy.get('.dt-scrollable .dt-row:first')
            .should('contain', 'Angelica')
            .should('have.class', 'dt-row-24');
        cy.get('@filterInput5').clear();
    });
});
