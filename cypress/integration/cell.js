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
        cy.getCell(4, 1).dblclick({ force: true });
        cy.getCell(4, 1).find('input').click();
        cy.focused().type('{selectall}{del}Test{enter}');
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
        // TODO:
        // cy.getCell(2, 1)
        //     .trigger('mousedown', { which: 1, pageX: 331, pageY: 207, force: true })
        //     .trigger('mousemove', { which: 1, pageX: 489, pageY: 312 })
        //     .trigger('mouseup');
    });
});