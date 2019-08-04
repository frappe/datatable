import {
    isNumeric,
    nextTick,
    isNumber,
    notSet
} from './utils';

export default class DataManager {
    constructor(options) {
        this.options = options;
        this.sortRows = nextTick(this.sortRows, this);
        this.switchColumn = nextTick(this.switchColumn, this);
        this.removeColumn = nextTick(this.removeColumn, this);
        this.options.filterRows = nextTick(this.options.filterRows, this);
    }

    init(data, columns) {
        if (!data) {
            data = this.options.data;
        }
        if (columns) {
            this.options.columns = columns;
        }

        this.data = data;

        this.rowCount = 0;
        this.columns = [];
        this.rows = [];

        this.prepareColumns();
        this.prepareRows();
        this.prepareTreeRows();
        this.prepareRowView();
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
    }

    prepareDefaultColumns() {
        if (this.options.checkboxColumn && !this.hasColumnById('_checkbox')) {
            const cell = {
                id: '_checkbox',
                content: this.getCheckboxHTML(),
                editable: false,
                resizable: false,
                sortable: false,
                focusable: false,
                dropdown: false,
                width: 32
            };
            this.columns.push(cell);
        }

        if (this.options.serialNoColumn && !this.hasColumnById('_rowIndex')) {
            let cell = {
                id: '_rowIndex',
                content: '',
                align: 'center',
                editable: false,
                resizable: false,
                focusable: false,
                dropdown: false
            };

            this.columns.push(cell);
        }
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
            width: null,
            format: (value) => {
                if (value === null || value === undefined) {
                    return '';
                }
                return value + '';
            }
        };

        this.columns = columns
            .map((cell, i) => this.prepareCell(cell, i))
            .map(col => Object.assign({}, baseCell, col))
            .map(col => {
                col.content = col.content || col.name || '';
                col.id = col.id || col.content;
                return col;
            });
    }

    prepareCell(content, i) {
        const cell = {
            content: '',
            sortOrder: 'none',
            colIndex: i,
            column: this.columns[i]
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
            if (!column.align && isNumeric(cellValue)) {
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
            let meta = {
                rowIndex: index
            };

            if (Array.isArray(d)) {
                // row is an array
                if (this.options.checkboxColumn) {
                    row.push(this.getCheckboxHTML());
                }
                if (this.options.serialNoColumn) {
                    row.push((index + 1) + '');
                }
                row = row.concat(d);

                while (row.length < this.columns.length) {
                    row.push('');
                }

            } else {
                // row is an object
                for (let col of this.columns) {
                    if (col.id === '_checkbox') {
                        row.push(this.getCheckboxHTML());
                    } else if (col.id === '_rowIndex') {
                        row.push((index + 1) + '');
                    } else {
                        row.push(d[col.id]);
                    }
                }

                meta.indent = d.indent || 0;
            }

            return this.prepareRow(row, meta);
        });
    }

    prepareTreeRows() {
        this.rows.forEach((row, i) => {
            if (isNumber(row.meta.indent)) {
                // if (i === 36) debugger;
                const nextRow = this.getRow(i + 1);
                row.meta.isLeaf = !nextRow ||
                    notSet(nextRow.meta.indent) ||
                    nextRow.meta.indent <= row.meta.indent;
                row.meta.isTreeNodeClose = false;
            }
        });
    }

    prepareRowView() {
        // This is order in which rows will be rendered in the table.
        // When sorting happens, only this.rowViewOrder will change
        // and not the original this.rows
        this.rowViewOrder = this.rows.map(row => row.meta.rowIndex);
    }

    prepareRow(row, meta) {
        const baseRowCell = {
            rowIndex: meta.rowIndex,
            indent: meta.indent
        };

        row = row
            .map((cell, i) => this.prepareCell(cell, i))
            .map(cell => Object.assign({}, baseRowCell, cell));

        // monkey patched in array object
        row.meta = meta;
        return row;
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

        this.rows.push(...this.prepareRows(rows));
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
                this.reverseArray(this.rowViewOrder);
                this.currentSort.sortOrder = sortOrder;
                return;
            }
        }

        this.rowViewOrder.sort((a, b) => {
            const aIndex = a;
            const bIndex = b;

            let aContent = this.getCell(colIndex, a).content;
            let bContent = this.getCell(colIndex, b).content;
            aContent = aContent == null ? '' : aContent;
            bContent = bContent == null ? '' : bContent;

            if (sortOrder === 'none') {
                return aIndex - bIndex;
            } else if (sortOrder === 'asc') {
                if (aContent < bContent) return -1;
                if (aContent > bContent) return 1;
                if (aContent === bContent) return 0;
            } else if (sortOrder === 'desc') {
                if (aContent < bContent) return 1;
                if (aContent > bContent) return -1;
                if (aContent === bContent) return 0;
            }
            return 0;
        });

        if (this.hasColumnById('_rowIndex')) {
            // update row index
            const srNoColIndex = this.getColumnIndexById('_rowIndex');
            this.rows.forEach((row, index) => {
                const viewIndex = this.rowViewOrder.indexOf(index);
                const cell = row[srNoColIndex];
                cell.content = (viewIndex + 1) + '';
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
        this.rows.forEach(row => {
            const newCell1 = Object.assign({}, row[index1], {
                colIndex: index2
            });
            const newCell2 = Object.assign({}, row[index2], {
                colIndex: index1
            });

            row[index2] = newCell1;
            row[index1] = newCell2;
        });
    }

    removeColumn(index) {
        index = +index;
        const filter = cell => cell.colIndex !== index;
        const map = (cell, i) => Object.assign({}, cell, {
            colIndex: i
        });
        // update columns
        this.columns = this.columns
            .filter(filter)
            .map(map);

        // update rows
        this.rows.forEach(row => {
            // remove cell
            row.splice(index, 1);
            // update colIndex
            row.forEach((cell, i) => {
                cell.colIndex = i;
            });
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

        const _row = this.prepareRow(row, {rowIndex});
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

    filterRows(filters) {
        return this.options.filterRows(this.rows, filters)
            .then(result => {
                if (!result) {
                    result = this.getAllRowIndices();
                }

                if (!result.then) {
                    result = Promise.resolve(result);
                }

                return result.then(rowsToShow => {
                    this._filteredRows = rowsToShow;

                    const rowsToHide = this.getAllRowIndices()
                        .filter(index => !rowsToShow.includes(index));

                    return {
                        rowsToHide,
                        rowsToShow
                    };
                });
            });
    }

    getFilteredRowIndices() {
        return this._filteredRows || this.getAllRowIndices();
    }

    getAllRowIndices() {
        return this.rows.map(row => row.meta.rowIndex);
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

    getRowsForView(start, end) {
        const rows = this.rowViewOrder.map(i => this.rows[i]);
        return rows.slice(start, end);
    }

    getColumns(skipStandardColumns) {
        let columns = this.columns;

        if (skipStandardColumns) {
            columns = columns.slice(this.getStandardColumnCount());
        }

        return columns;
    }

    getStandardColumnCount() {
        if (this.options.checkboxColumn && this.options.serialNoColumn) {
            return 2;
        }

        if (this.options.checkboxColumn || this.options.serialNoColumn) {
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

        if (colIndex < 0) {
            // negative indexes
            colIndex = this.columns.length + colIndex;
        }

        return this.columns.find(col => col.colIndex === colIndex);
    }

    getColumnById(id) {
        return this.columns.find(col => col.id === id);
    }

    getRow(rowIndex) {
        rowIndex = +rowIndex;
        return this.rows[rowIndex];
    }

    getCell(colIndex, rowIndex) {
        rowIndex = +rowIndex;
        colIndex = +colIndex;
        return this.getRow(rowIndex)[colIndex];
    }

    getChildren(parentRowIndex) {
        parentRowIndex = +parentRowIndex;
        const parentIndent = this.getRow(parentRowIndex).meta.indent;
        const out = [];

        for (let i = parentRowIndex + 1; i < this.rowCount; i++) {
            const row = this.getRow(i);
            if (isNaN(row.meta.indent)) continue;

            if (row.meta.indent > parentIndent) {
                out.push(i);
            }

            if (row.meta.indent === parentIndent) {
                break;
            }
        }

        return out;
    }

    getImmediateChildren(parentRowIndex) {
        parentRowIndex = +parentRowIndex;
        const parentIndent = this.getRow(parentRowIndex).meta.indent;
        const out = [];
        const childIndent = parentIndent + 1;

        for (let i = parentRowIndex + 1; i < this.rowCount; i++) {
            const row = this.getRow(i);
            if (isNaN(row.meta.indent) || row.meta.indent > childIndent) continue;

            if (row.meta.indent === childIndent) {
                out.push(i);
            }

            if (row.meta.indent === parentIndent) {
                break;
            }
        }

        return out;
    }

    get() {
        return {
            columns: this.columns,
            rows: this.rows
        };
    }

    /**
     * Returns the original data which was passed
     * based on rowIndex
     * @param {Number} rowIndex
     * @returns Array|Object
     * @memberof DataManager
     */
    getData(rowIndex) {
        return this.data[rowIndex];
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
