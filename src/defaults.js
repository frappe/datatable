export default {
  data: {
    columns: [],
    rows: []
  },
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
    onSortColumn(column) {}
  },
  sortIndicator: {
    asc: '↑',
    desc: '↓',
    none: ''
  },
  freezeMessage: 'Loading...',
  editing: () => {},
  addSerialNoColumn: true,
  addCheckboxColumn: true,
  enableClusterize: true,
  enableLogs: false,
  takeAvailableSpace: false,
  loadingText: 'Loading...'
};
