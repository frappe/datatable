
export default class DataManager {
  constructor(options) {
    this.options = options;
    this._data = {};
    this.rowCount = 0;
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
        resizable: false
      };

      columns = [val].concat(columns);
      this._serialNoColumnAdded = true;
    }

    if (this.options.addCheckboxColumn && !this._checkboxColumnAdded) {
      const val = {
        content: '<input type="checkbox" />',
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

  sortRows(colIndex, sortAction) {

    this.rows.sort((a, b) => {
      const _aIndex = a[0].rowIndex;
      const _bIndex = b[0].rowIndex;
      const _a = a[colIndex].content;
      const _b = b[colIndex].content;

      if (sortAction === 'none') {
        return _aIndex - _bIndex;
      } else if (sortAction === 'asc') {
        if (_a < _b) return -1;
        if (_a > _b) return 1;
        if (_a === _b) return 0;
      } else if (sortAction === 'desc') {
        if (_a < _b) return 1;
        if (_a > _b) return -1;
        if (_a === _b) return 0;
      }
      return 0;
    });
  }

  reverseArray(array) {
    let left = null;
    let right = null;

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
