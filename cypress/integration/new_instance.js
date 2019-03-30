describe('DataTable init', function () {
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
});
