describe('Row', function () {
    before(function () {
        cy.visit('/');
    });

    it('check / uncheck row', function () {
        cy.get('.dt-body .dt-row:first')
            .find('input[type="checkbox"]')
            .click();

        cy.get('[data-row-index="0"]').should('have.class', 'dt-row--highlight');

        cy.get('.dt-toast').contains('1 row selected');
    });
});
