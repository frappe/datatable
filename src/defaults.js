import filterRows from './filterRows';

export default {
    columns: [],
    data: [],
    dropdownButton: '▼',
    headerDropdown: [
        {
            label: 'Sort Ascending',
            action: function (column) {
                this.sortColumn(column.colIndex, 'asc');
            }
        },
        {
            label: 'Sort Descending',
            action: function (column) {
                this.sortColumn(column.colIndex, 'desc');
            }
        },
        {
            label: 'Reset sorting',
            action: function (column) {
                this.sortColumn(column.colIndex, 'none');
            }
        },
        {
            label: 'Remove column',
            action: function (column) {
                this.removeColumn(column.colIndex);
            }
        }
    ],
    events: {
        onRemoveColumn(column) {},
        onSwitchColumn(column1, column2) {},
        onSortColumn(column) {},
        onCheckRow(row) {},
        onDestroy() {}
    },
    sortIndicator: {
        asc: '↑',
        desc: '↓',
        none: ''
    },
    filterRows: filterRows,
    freezeMessage: '',
    getEditor: null,
    serialNoColumn: true,
    checkboxColumn: false,
    clusterize: true,
    logs: false,
    layout: 'fixed', // fixed, fluid, ratio
    noDataMessage: 'No Data',
    cellHeight: null,
    inlineFilters: false,
    treeView: false,
    checkedRowStatus: true,
    dynamicRowHeight: false,
    pasteFromClipboard: false
};
