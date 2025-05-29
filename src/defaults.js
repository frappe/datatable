import filterRows from './filterRows';
import icons from './icons';

export default function getDefaultOptions(instance) {
    return {
        columns: [],
        data: [],
        dropdownButton: icons.chevronDown,
        headerDropdown: [
            {
                label: instance.translate('Sort Ascending'),
                action: function (column) {
                    this.sortColumn(column.colIndex, 'asc');
                }
            },
            {
                label: instance.translate('Sort Descending'),
                action: function (column) {
                    this.sortColumn(column.colIndex, 'desc');
                }
            },
            {
                label: instance.translate('Reset sorting'),
                action: function (column) {
                    this.sortColumn(column.colIndex, 'none');
                }
            },
            {
                label: instance.translate('Remove column'),
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
        noDataMessage: instance.translate('No Data'),
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
};
