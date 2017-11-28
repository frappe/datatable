import { isNumeric, promisify } from './utils';

export default class DataManager {
  constructor(options) {
    this.options = options;
    this.currentSort = {
      colIndex: -1,
      sortOrder: 'none' // asc, desc, none
    };
    this.sortRows = promisify(this.sortRows, this);
    this.switchColumn = promisify(this.switchColumn, this);
    this.removeColumn = promisify(this.removeColumn, this);
  }

  init(data) {
    let { columns, rows } = data;

    this.rowCount = 0;
    this.columns = [];
    this.rows = [];

    this.columns = this.prepareColumns(columns);
    this.rows = this.prepareRows(rows);

    this.prepareNumericColumns();
  }

  prepareColumns(columns) {
    if (!Array.isArray(columns)) {
      throw new TypeError('`columns` must be an array');
    }

    if (this.options.addSerialNoColumn && !this._serialNoColumnAdded) {
      const val = {
        content: 'Sr. No',
        editable: false,
        resizable: false,
        align: 'center',
        focusable: false,
        dropdown: false
      };

      columns = [val].concat(columns);
      this._serialNoColumnAdded = true;
    }

    if (this.options.addCheckboxColumn && !this._checkboxColumnAdded) {
      const val = {
        content: '<input type="checkbox" />',
        editable: false,
        resizable: false,
        sortable: false,
        focusable: false,
        dropdown: false
      };

      columns = [val].concat(columns);
      this._checkboxColumnAdded = true;
    }

    return prepareColumns(columns, {
      isHeader: 1,
      format: value => `<span class="column-title">${value}</span>`
    });
  }

  prepareNumericColumns() {
    const row0 = this.getRow(0);
    this.columns = this.columns.map((column, i) => {

      const cellValue = row0[i].content;
      if (!column.align && cellValue && isNumeric(cellValue)) {
        column.align = 'right';
      }

      return column;
    });
  }

  prepareRows(rows) {
    if (!Array.isArray(rows) || !Array.isArray(rows[0])) {
      throw new TypeError('`rows` must be an array of arrays');
    }

    rows = rows.map((row, i) => {
      const index = this._getNextRowCount();

      if (row.length < this.columns.length) {
        if (this._serialNoColumnAdded) {
          const val = (index + 1) + '';

          row = [val].concat(row);
        }

        if (this._checkboxColumnAdded) {
          const val = '<input type="checkbox" />';

          row = [val].concat(row);
        }
      }

      return prepareRow(row, index);
    });

    return rows;
  }

  appendRows(rows) {
    if (Array.isArray(rows) && !Array.isArray(rows[0])) {
      rows = [rows];
    }
    const _rows = this.prepareRows(rows);

    this.rows = this.rows.concat(_rows);
  }

  sortRows(colIndex, sortOrder = 'none') {
    colIndex = +colIndex;

    if (this.currentSort.colIndex === colIndex) {
      // reverse the array if only sortOrder changed
      if (
        (this.currentSort.sortOrder === 'asc' && sortOrder === 'desc') ||
        (this.currentSort.sortOrder === 'desc' && sortOrder === 'asc')
      ) {
        this.reverseArray(this.rows);
        this.currentSort.sortOrder = sortOrder;
        return;
      }
    }

    this.rows.sort((a, b) => {
      const _aIndex = a[0].rowIndex;
      const _bIndex = b[0].rowIndex;
      const _a = a[colIndex].content;
      const _b = b[colIndex].content;

      if (sortOrder === 'none') {
        return _aIndex - _bIndex;
      } else if (sortOrder === 'asc') {
        if (_a < _b) return -1;
        if (_a > _b) return 1;
        if (_a === _b) return 0;
      } else if (sortOrder === 'desc') {
        if (_a < _b) return 1;
        if (_a > _b) return -1;
        if (_a === _b) return 0;
      }
      return 0;
    });

    this.currentSort.colIndex = colIndex;
    this.currentSort.sortOrder = sortOrder;
  }

  reverseArray(array) {
    let left = null;
    let right = null;
    let length = array.length;

    for (left = 0, right = length - 1; left < right; left += 1, right -= 1) {
      const temporary = array[left];

      array[left] = array[right];
      array[right] = temporary;
    }
  }

  switchColumn(index1, index2) {
    // update columns
    const temp = this.columns[index1];
    this.columns[index1] = this.columns[index2];
    this.columns[index2] = temp;

    this.columns[index1].colIndex = index1;
    this.columns[index2].colIndex = index2;

    // update rows
    this.rows = this.rows.map(row => {
      const newCell1 = Object.assign({}, row[index1], { colIndex: index2 });
      const newCell2 = Object.assign({}, row[index2], { colIndex: index1 });

      let newRow = row.map(cell => {
        // make object copy
        return Object.assign({}, cell);
      });

      newRow[index2] = newCell1;
      newRow[index1] = newCell2;

      return newRow;
    });
  }

  removeColumn(index) {
    index = +index;
    const filter = cell => cell.colIndex !== index;
    const map = (cell, i) => Object.assign({}, cell, { colIndex: i });
    // update columns
    this.columns = this.columns
      .filter(filter)
      .map(map);

    // update rows
    this.rows = this.rows.map(row => {
      const newRow = row
        .filter(filter)
        .map(map);

      return newRow;
    });
  }

  getRowCount() {
    return this.rowCount;
  }

  _getNextRowCount() {
    const val = this.rowCount;

    this.rowCount++;
    return val;
  }

  getRows(start, end) {
    return this.rows.slice(start, end);
  }

  getColumns(skipStandardColumns) {
    let columns = this.columns;

    if (skipStandardColumns) {
      columns = columns.slice(this.getStandardColumnCount());
    }

    return columns;
  }

  getStandardColumnCount() {
    if (this.options.addCheckboxColumn && this.options.addSerialNoColumn) {
      return 2;
    }

    if (this.options.addCheckboxColumn || this.options.addSerialNoColumn) {
      return 1;
    }

    return 0;
  }

  getColumnCount(skipStandardColumns) {
    let val = this.columns.length;

    if (skipStandardColumns) {
      val = val - this.getStandardColumnCount();
    }

    return val;
  }

  getColumn(colIndex) {
    colIndex = +colIndex;
    return this.columns.find(col => col.colIndex === colIndex);
  }

  getRow(rowIndex) {
    rowIndex = +rowIndex;
    return this.rows.find(row => row[0].rowIndex === rowIndex);
  }

  getCell(colIndex, rowIndex) {
    rowIndex = +rowIndex;
    colIndex = +colIndex;
    return this.rows.find(row => row[0].rowIndex === rowIndex)[colIndex];
  }

  get() {
    return {
      columns: this.columns,
      rows: this.rows
    };
  }
}

function prepareColumns(columns, props = {}) {
  const _columns = columns.map(prepareCell);

  return _columns.map(col => Object.assign({}, col, props));
}

function prepareRow(row, i) {
  return prepareColumns(row, {
    rowIndex: i
  });
}

function prepareCell(col, i) {
  if (typeof col === 'string') {
    col = {
      content: col
    };
  }
  return Object.assign(col, {
    colIndex: i
  });
}
