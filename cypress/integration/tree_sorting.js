describe('Tree sorting', function () {
    const data = [
        { value: 7, indent: 0 },
        { value: 1, indent: 1 },
        { value: 8, indent: 1 },
        { value: 3, indent: 0 },
        { value: 4, indent: 1 },
        { value: 5, indent: 2 },
        { value: 6, indent: 2 },
        { value: 2, indent: 1 }
    ];

    beforeEach(function () {
        cy.visit('/');
    });

    it('sorts siblings, numbers rows and keeps collapse and expand working', function () {
        createTable(data);
        expectRowOrder([7, 1, 8, 3, 4, 5, 6, 2]);
        cy.window().then(win => {
            cy.spy(win.treeTable.rowmanager, 'refreshRows').as('refreshRows');
        });

        sortTable('Sort Ascending');
        expectRowOrder([3, 2, 4, 5, 6, 7, 1, 8]);
        expectSerialNumbers(8);
        cy.get('@refreshRows').should('have.been.calledOnce');
        toggleRow(7);
        expectRowOrder([3, 2, 4, 5, 6, 7]);
        toggleRow(7);
        expectRowOrder([3, 2, 4, 5, 6, 7, 1, 8]);

        cy.get('@refreshRows').then(spy => spy.resetHistory());
        sortTable('Sort Descending');
        expectRowOrder([7, 8, 1, 3, 4, 6, 5, 2]);
        expectSerialNumbers(8);
        cy.get('@refreshRows').should('have.been.calledOnce');
        toggleRow(3);
        expectRowOrder([7, 8, 1, 3]);
        toggleRow(3);
        expectRowOrder([7, 8, 1, 3, 4, 2]);
        toggleRow(4);
        expectRowOrder([7, 8, 1, 3, 4, 6, 5, 2]);

        cy.get('@refreshRows').then(spy => spy.resetHistory());
        sortTable('Reset sorting');
        expectRowOrder([7, 1, 8, 3, 4, 5, 6, 2]);
        expectSerialNumbers(8);
        cy.get('@refreshRows').should('have.been.calledOnce');
    });

    it('preserves the column sortValue hook', function () {
        createTable(data, {
            columns: [{ id: 'value', name: 'Value', sortValue: cell => -cell.content }]
        });
        sortTable('Sort Ascending');
        expectRowOrder([7, 8, 1, 3, 4, 6, 5, 2]);
        sortTable('Sort Descending');
        expectRowOrder([3, 2, 4, 5, 6, 7, 1, 8]);
        sortTable('Reset sorting');
        expectRowOrder([7, 1, 8, 3, 4, 5, 6, 2]);
    });

    it('sorts flat tables normally even when rows have indent metadata', function () {
        createTable(data, { treeView: false });
        sortTable('Sort Ascending');
        expectRowOrder([1, 2, 3, 4, 5, 6, 7, 8]);
        sortTable('Sort Descending');
        expectRowOrder([8, 7, 6, 5, 4, 3, 2, 1]);
        sortTable('Reset sorting');
        expectRowOrder([7, 1, 8, 3, 4, 5, 6, 2]);
    });

    it('supports nonzero root indents and tables without serial numbers', function () {
        createTable(data.map(row => Object.assign({}, row, { indent: row.indent + 2 })), {
            serialNoColumn: false
        });
        sortTable('Sort Ascending');
        expectRowOrder([3, 2, 4, 5, 6, 7, 1, 8]);
        sortTable('Sort Descending');
        expectRowOrder([7, 8, 1, 3, 4, 6, 5, 2]);
    });

    it('refreshes cached serial number formatting after sorting', function () {
        createTable(data, {
            serialNoColumn: false,
            columns: [
                { id: '_rowIndex', name: 'Sr No', format: value => `No ${value}` },
                { id: 'value', name: 'Value' }
            ]
        });
        expectSerialNumbers(8, 'No ');
        sortTable('Sort Ascending');
        expectRowOrder([3, 2, 4, 5, 6, 7, 1, 8]);
        expectSerialNumbers(8, 'No ');
    });

    it('keeps sorting after a data refresh', function () {
        createTable(data);
        sortTable('Sort Ascending');
        expectRowOrder([3, 2, 4, 5, 6, 7, 1, 8]);
        cy.window().then(win => win.treeTable.refresh(data));
        sortTable('Sort Descending');
        expectRowOrder([7, 8, 1, 3, 4, 6, 5, 2]);
        expectSerialNumbers(8);
    });

    it('keeps the total row and blank rows before it at the bottom', function () {
        createTable(data.concat([{ value: '' }, { value: 99, indent: 0 }]));
        sortTable('Sort Ascending');
        expectRowOrder([3, 2, 4, 5, 6, 7, 1, 8, '', 99]);
        sortTable('Sort Descending');
        expectRowOrder([7, 8, 1, 3, 4, 6, 5, 2, '', 99]);
        sortTable('Reset sorting');
        expectRowOrder([7, 1, 8, 3, 4, 5, 6, 2, '', 99]);
    });

    it('keeps the total row at the bottom when all rows are top-level', function () {
        createTable([
            { value: 2, indent: 0 },
            { value: 1, indent: 0 },
            { value: 3, indent: 0 },
            { value: '' },
            { value: 99, indent: 0 }
        ]);
        sortTable('Sort Ascending');
        expectRowOrder([1, 2, 3, '', 99]);
        sortTable('Sort Descending');
        expectRowOrder([3, 2, 1, '', 99]);
    });

    it('keeps a total directly after its tree rows at the bottom', function () {
        createTable([
            { value: 10, indent: 0 },
            { value: 1, indent: 1 },
            { value: 20, indent: 0 },
            { value: 2, indent: 1 },
            { value: 99, indent: 0 }
        ]);
        sortTable('Sort Ascending');
        expectRowOrder([10, 1, 20, 2, 99]);
        sortTable('Sort Descending');
        expectRowOrder([20, 2, 10, 1, 99]);
    });

    it('keeps each section total under its section', function () {
        // Like a Balance Sheet: sections end with their total and a blank row, then a final total.
        createTable([
            { value: 5, indent: 0 },
            { value: 6, indent: 1 },
            { value: 7, indent: 1 },
            { value: 50, indent: 0 },
            { value: '' },
            { value: 1, indent: 0 },
            { value: 3, indent: 1 },
            { value: 2, indent: 1 },
            { value: 40, indent: 0 },
            { value: '' },
            { value: 8, indent: 0 },
            { value: 4, indent: 0 },
            { value: 90, indent: 0 }
        ]);
        sortTable('Sort Ascending');
        expectRowOrder([5, 6, 7, 50, '', 1, 2, 3, 40, '', 4, 8, 90]);
        sortTable('Sort Descending');
        expectRowOrder([5, 7, 6, 50, '', 1, 3, 2, 40, '', 8, 4, 90]);
    });

    it('keeps the last total in place when a blank row follows it', function () {
        createTable([
            { value: 5, indent: 0 },
            { value: 6, indent: 1 },
            { value: 50, indent: 0 },
            { value: '' },
            { value: 1, indent: 0 },
            { value: 2, indent: 1 },
            { value: 40, indent: 0 },
            { value: '' }
        ]);
        sortTable('Sort Descending');
        expectRowOrder([5, 6, 50, '', 1, 2, 40, '']);
        sortTable('Sort Ascending');
        expectRowOrder([5, 6, 50, '', 1, 2, 40, '']);
    });

    it('sorts a flat list without a total completely', function () {
        createTable([
            { value: 2, indent: 0 },
            { value: 3, indent: 0 },
            { value: 1, indent: 0 }
        ]);
        sortTable('Sort Ascending');
        expectRowOrder([1, 2, 3]);
        sortTable('Sort Descending');
        expectRowOrder([3, 2, 1]);
    });

    it('sorts an empty tree without errors', function () {
        createTable([]);
        cy.window().then(win => win.treeTable.datamanager.sortRows(1, 'asc'));
        cy.window().then(win => {
            expect(win.treeTable.datamanager.rowViewOrder).to.deep.equal([]);
        });
    });
});

function createTable(data, options = {}) {
    cy.window().then(win => {
        win.treeTable = new win.DataTable('#datatable2', Object.assign({
            columns: [{ id: 'value', name: 'Value', width: 180 }],
            data,
            treeView: true
        }, options));
    });
    cy.get('#datatable2 .datatable').should('exist');
}

function sortTable(label) {
    cy.get('#datatable2 .dt-cell--header').contains('Value')
        .closest('.dt-cell').find('.dt-dropdown__toggle').click();
    cy.get('#datatable2 .dt-dropdown__list-item').contains(label).click({ force: true });
}

function toggleRow(value) {
    cy.get('#datatable2 .dt-scrollable .dt-tree-node').contains('span', String(value))
        .closest('.dt-tree-node').find('.dt-tree-node__toggle').click();
}

function expectRowOrder(expected) {
    cy.get('#datatable2 .dt-scrollable .dt-row .dt-cell:last-child .dt-cell__content')
        .should(cells => {
            expect(Array.from(cells, cell => cell.textContent.trim())).to.deep.equal(expected.map(String));
        });
}

function expectSerialNumbers(count, prefix = '') {
    cy.get('#datatable2 .dt-scrollable .dt-row .dt-cell:first-child .dt-cell__content')
        .should(cells => {
            const expected = Array.from({ length: count }, (_, index) => prefix + (index + 1));
            expect(Array.from(cells, cell => cell.textContent.trim())).to.deep.equal(expected);
        });
}
