/* globals DataTable */

describe('Datatable Initialization', function () {
    it('Initializes datatable correctly', () => {
        cy.visit('/');

        cy.window()
            .its('DataTable')
            .then(DataTable => {
                const datatable2 = new DataTable('#datatable2', {
                    columns: ['Name', 'Position'],
                    data: [
                        // ['Faris', 'Developer']
                    ]
                });
            });

        cy.get('#datatable2 .datatable')
            .contains('No Data');

    });
});
