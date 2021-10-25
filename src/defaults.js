import filterRows from './filterRows';
import icons from './icons';

export default {
    columns: [],
    data: [],
    dropdownButton: icons.chevronDown,
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
    hooks: {
        columnTotal: null
    },
    sortIndicator: {
        asc: '↑',
        desc: '↓',
        none: ''
    },
    overrideComponents: {
        // ColumnManager: CustomColumnManager
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
    cellHeight: 40,
    minimumColumnWidth: 30,
    inlineFilters: false,
    treeView: false,
    checkedRowStatus: true,
    dynamicRowHeight: false,
    pasteFromClipboard: false,
    showTotalRow: false,
    direction: 'ltr',
    disableReorderColumn: false
};
