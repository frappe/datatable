import { isNumeric, promisify } from './utils';

export default class DataManager {
  constructor(options) {
    this.options = options;
    this.sortRows = promisify(this.sortRows, this);
    this.switchColumn = promisify(this.switchColumn, this);
    this.removeColumn = promisify(this.removeColumn, this);
  }

  init(data) {
    if (!data) {
      data = this.options.data;
    }

    this.data = data;

    this.rowCount = 0;
    this.columns = [];
    this.rows = [];

    this.prepareColumns();
    this.prepareRows();

    this.prepareNumericColumns();
  }

  // computed property
  get currentSort() {
    const col = this.columns.find(col => col.sortOrder !== 'none');
    return col || {
      colIndex: -1,
      sortOrder: 'none'
    };
  }

  prepareColumns() {
    this.columns = [];
    this.validateColumns();
    this.prepareDefaultColumns();
    this.prepareHeader();
    console.log(this.columns);
  }

  prepareDefaultColumns() {
    if (this.options.addSerialNoColumn && !this.hasColumnById('_rowIndex')) {
      let cell = {
        id: '_rowIndex',
        content: '',
        align: 'center',
        editable: false,
        resizable: false,
        focusable: false,
        dropdown: false,
        width: 30
      };

      this.columns.push(cell);
    }

    if (this.options.addCheckboxColumn && !this.hasColumnById('_checkbox')) {
      const cell = {
        id: '_checkbox',
        content: this.getCheckboxHTML(),
        editable: false,
        resizable: false,
        sortable: false,
        focusable: false,
        dropdown: false
      };
      this.columns.push(cell);
    }
  }

  prepareRow(row, i) {
    const baseRowCell = {
      rowIndex: i
    };

    return row
      .map((cell, i) => this.prepareCell(cell, i))
      .map(cell => Object.assign({}, baseRowCell, cell));
  }

  prepareHeader() {
    let columns = this.columns.concat(this.options.columns);
    const baseCell = {
      isHeader: 1,
      editable: true,
      sortable: true,
      resizable: true,
      focusable: true,
      dropdown: true,
      format: value => value + ''
    };

    this.columns = columns
      .map((cell, i) => this.prepareCell(cell, i))
      .map(col => Object.assign({}, baseCell, col))
      .map(col => {
        col.id = col.id || col.content;
        return col;
      });
  }

  prepareCell(content, i) {
    const cell = {
      content: '',
      align: 'left',
      sortOrder: 'none',
      colIndex: i,
      column: this.columns[i],
      width: 0
    };

    if (content !== null && typeof content === 'object') {
      // passed as column/header
      Object.assign(cell, content);
    } else {
      cell.content = content;
    }

    return cell;
  }

  prepareNumericColumns() {
    const row0 = this.getRow(0);
    if (!row0) return;
    this.columns = this.columns.map((column, i) => {

      const cellValue = row0[i].content;
      if (!column.align && cellValue && isNumeric(cellValue)) {
        column.align = 'right';
      }

      return column;
    });
  }

  prepareRows() {
    this.validateData(this.data);

    this.rows = this.data.map((d, i) => {
      const index = this._getNextRowCount();

      let row = [];

      if (Array.isArray(d)) {
        // row is an array
        if (this.options.addCheckboxColumn) {
          row.push(this.getCheckboxHTML());
        }
        if (this.options.addSerialNoColumn) {
          row.push((index + 1) + '');
        }
        row = row.concat(d);

      } else {
        // row is a dict
        for (let col of this.columns) {
          if (col.id === '_checkbox') {
            row.push(this.getCheckboxHTML());
          } else if (col.id === '_rowIndex') {
            row.push((index + 1) + '');
          } else {
            row.push(col.format(d[col.id]));
          }
        }
      }

      return this.prepareRow(row, index);
    });
  }

  validateColumns() {
    const columns = this.options.columns;
    if (!Array.isArray(columns)) {
      throw new DataError('`columns` must be an array');
    }

    columns.forEach((column, i) => {
      if (typeof column !== 'string' && typeof column !== 'object') {
        throw new DataError(`column "${i}" must be a string or an object`);
      }
    });
  }

  validateData(data) {
    if (Array.isArray(data) &&
      (data.length === 0 || Array.isArray(data[0]) || typeof data[0] === 'object')) {
      return true;
    }
    throw new DataError('`data` must be an array of arrays or objects');
  }

  appendRows(rows) {
    this.validateData(rows);

    this.rows = this.rows.concat(this.prepareRows(rows));
  }

  sortRows(colIndex, sortOrder = 'none') {
    colIndex = +colIndex;

    // reset sortOrder and update for colIndex
    this.getColumns()
      .map(col => {
        if (col.colIndex === colIndex) {
          col.sortOrder = sortOrder;
        } else {
          col.sortOrder = 'none';
        }
      });

    this._sortRows(colIndex, sortOrder);
  }

  _sortRows(colIndex, sortOrder) {

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

    if (this.hasColumnById('_rowIndex')) {
      // update row index
      const srNoColIndex = this.getColumnIndexById('_rowIndex');
      this.rows = this.rows.map((row, index) => {
        return row.map(cell => {
          if (cell.colIndex === srNoColIndex) {
            cell.content = (index + 1) + '';
          }
          return cell;
        });
      });
    }
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

  updateRow(row, rowIndex) {
    if (row.length < this.columns.length) {
      if (this.hasColumnById('_rowIndex')) {
        const val = (rowIndex + 1) + '';

        row = [val].concat(row);
      }

      if (this.hasColumnById('_checkbox')) {
        const val = '<input type="checkbox" />';

        row = [val].concat(row);
      }
    }

    const _row = this.prepareRow(row, rowIndex);
    const index = this.rows.findIndex(row => row[0].rowIndex === rowIndex);
    this.rows[index] = _row;

    return _row;
  }

  updateCell(colIndex, rowIndex, options) {
    let cell;
    if (typeof colIndex === 'object') {
      // cell object was passed,
      // must have colIndex, rowIndex
      cell = colIndex;
      colIndex = cell.colIndex;
      rowIndex = cell.rowIndex;
      // the object passed must be merged with original cell
      options = cell;
    }
    cell = this.getCell(colIndex, rowIndex);

    // mutate object directly
    for (let key in options) {
      const newVal = options[key];
      if (newVal !== undefined) {
        cell[key] = newVal;
      }
    }

    // update model
    if (!Array.isArray(this.data[rowIndex])) {
      const col = this.getColumn(colIndex);
      this.data[rowIndex][col.id] = options.content;
    }

    return cell;
  }

  updateColumn(colIndex, keyValPairs) {
    const column = this.getColumn(colIndex);
    for (let key in keyValPairs) {
      const newVal = keyValPairs[key];
      if (newVal !== undefined) {
        column[key] = newVal;
      }
    }
    return column;
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

  hasColumn(name) {
    return Boolean(this.columns.find(col => col.content === name));
  }

  hasColumnById(id) {
    return Boolean(this.columns.find(col => col.id === id));
  }

  getColumnIndex(name) {
    return this.columns.findIndex(col => col.content === name);
  }

  getColumnIndexById(id) {
    return this.columns.findIndex(col => col.id === id);
  }

  getCheckboxHTML() {
    return '<input type="checkbox" />';
  }
}

// Custom Errors
export class DataError extends TypeError {};
