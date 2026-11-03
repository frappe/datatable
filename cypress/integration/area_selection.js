describe('Area selection', function () {
    beforeEach(function () {
        cy.visit('/');
    });

    it('keeps cells clickable after selecting across a collapsed tree node', function () {
        cy.window().then(win => {
            win.selectionTable = new win.DataTable('#datatable2', {
                columns: [{ id: 'name', name: 'Name' }, { id: 'qty', name: 'Qty' }],
                data: [
                    { name: 'Group A', qty: 3, indent: 0 },
                    { name: 'a1', qty: 1, indent: 1 },
                    { name: 'a2', qty: 2, indent: 1 },
                    { name: 'Group B', qty: 5, indent: 0 },
                    { name: 'b1', qty: 5, indent: 1 }
                ],
                treeView: true
            });
        });

        cy.get('#datatable2 .dt-cell--1-0 .dt-tree-node__toggle').click();
        cy.get('#datatable2 .dt-cell--1-1').should('not.exist');

        cy.get('#datatable2 .dt-cell--1-0').trigger('mousedown', { which: 1 });
        cy.get('#datatable2 .dt-cell--2-3').trigger('mousemove', { which: 1 });
        cy.get('#datatable2 .dt-cell--2-3').trigger('mouseup', { which: 1 });

        const selected = '#datatable2 .dt-cell--1-0, #datatable2 .dt-cell--2-0, ' +
            '#datatable2 .dt-cell--1-3, #datatable2 .dt-cell--2-3';
        cy.get(selected).filter('.dt-cell--highlight').should('have.length', 4);
        cy.window().its('selectionTable.cellmanager._selectedCells').should('have.length', 4);

        cy.get('#datatable2 .dt-cell--2-4').click();
        cy.get('#datatable2 .dt-cell--2-4').should('have.class', 'dt-cell--focus');
        cy.get(selected).filter('.dt-cell--highlight').should('have.length', 0);
    });
});
