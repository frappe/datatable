
export default class DataManager {
  constructor(options) {
    this.options = options;
    this.rowCount = 0;
    this.currentSort = {
      sortBy: -1, // colIndex
      sortOrder: 'none' // asc, desc, none
    };
  }

  init(data) {
    let { columns, rows } = data;

    this.columns = this.prepareColumns(columns);
    this.rows = this.prepareRows(rows);
  }

  prepareColumns(columns) {
    if (!Array.isArray(columns)) {
      throw new TypeError('`columns` must be an array');
    }

    if (this.options.addSerialNoColumn && !this._serialNoColumnAdded) {
      const val = {
        content: 'Sr. No',
        editable: false,
        resizable: false
      };

      columns = [val].concat(columns);
      this._serialNoColumnAdded = true;
    }

    if (this.options.addCheckboxColumn && !this._checkboxColumnAdded) {
      const val = {
        content: '<input type="checkbox" />',
        editable: false,
        resizable: false
      };

      columns = [val].concat(columns);
      this._checkboxColumnAdded = true;
    }

    // wrap the title in span
    columns = columns.map(column => {
      if (typeof column === 'string') {
        column = `<span>${column}</span>`;
      } else if (typeof column === 'object') {
        column.content = `<span>${column.content}</span>`;
      }

      return column;
    });

    return prepareColumns(columns, {
      isHeader: 1
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

  getColumns() {
    return this.columns;
  }

  getColumnCount() {
    return this.columns.length;
  }

  getColumn(colIndex) {
    colIndex = +colIndex;
    return this.columns.find(col => col.colIndex === colIndex);
  }

  getRow(rowIndex) {
    rowIndex = +rowIndex;
    return this.rows.find(row => row[0].rowIndex === rowIndex);
  }

  getCell(rowIndex, colIndex) {
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
