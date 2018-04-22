import {
    copyTextToClipboard,
    makeDataAttributeString,
    throttle,
    linkProperties
} from './utils';
import $ from './dom';

export default class CellManager {
    constructor(instance) {
        this.instance = instance;
        linkProperties(this, this.instance, [
            'wrapper',
            'options',
            'style',
            'bodyScrollable',
            'columnmanager',
            'rowmanager',
            'datamanager',
            'keyboard'
        ]);

        this.bindEvents();
    }

    bindEvents() {
        this.bindFocusCell();
        this.bindEditCell();
        this.bindKeyboardSelection();
        this.bindCopyCellContents();
        this.bindMouseEvents();
        this.bindTreeEvents();
    }

    bindFocusCell() {
        this.bindKeyboardNav();
    }

    bindEditCell() {
        this.$editingCell = null;

        $.on(this.bodyScrollable, 'dblclick', '.dt-cell', (e, cell) => {
            this.activateEditing(cell);
        });

        this.keyboard.on('enter', () => {
            if (this.$focusedCell && !this.$editingCell) {
                // enter keypress on focused cell
                this.activateEditing(this.$focusedCell);
            } else if (this.$editingCell) {
                // enter keypress on editing cell
                this.submitEditing();
                this.deactivateEditing();
            }
        });
    }

    bindKeyboardNav() {
        const focusCell = (direction) => {
            if (!this.$focusedCell || this.$editingCell) {
                return false;
            }

            let $cell = this.$focusedCell;

            if (direction === 'left' || direction === 'shift+tab') {
                $cell = this.getLeftCell$($cell);
            } else if (direction === 'right' || direction === 'tab') {
                $cell = this.getRightCell$($cell);
            } else if (direction === 'up') {
                $cell = this.getAboveCell$($cell);
            } else if (direction === 'down') {
                $cell = this.getBelowCell$($cell);
            }

            this.focusCell($cell);
            return true;
        };

        const focusLastCell = (direction) => {
            if (!this.$focusedCell || this.$editingCell) {
                return false;
            }

            let $cell = this.$focusedCell;
            const {
                rowIndex,
                colIndex
            } = $.data($cell);

            if (direction === 'left') {
                $cell = this.getLeftMostCell$(rowIndex);
            } else if (direction === 'right') {
                $cell = this.getRightMostCell$(rowIndex);
            } else if (direction === 'up') {
                $cell = this.getTopMostCell$(colIndex);
            } else if (direction === 'down') {
                $cell = this.getBottomMostCell$(colIndex);
            }

            this.focusCell($cell);
            return true;
        };

        ['left', 'right', 'up', 'down', 'tab', 'shift+tab']
            .map(direction => this.keyboard.on(direction, () => focusCell(direction)));

        ['left', 'right', 'up', 'down']
            .map(direction => this.keyboard.on(`ctrl+${direction}`, () => focusLastCell(direction)));

        this.keyboard.on('esc', () => {
            this.deactivateEditing();
        });

        if (this.options.inlineFilters) {
            this.keyboard.on('ctrl+f', (e) => {
                const $cell = $.closest('.dt-cell', e.target);
                const { colIndex } = $.data($cell);

                this.activateFilter(colIndex);
                return true;
            });
        }
    }

    bindKeyboardSelection() {
        const getNextSelectionCursor = (direction) => {
            let $selectionCursor = this.getSelectionCursor();

            if (direction === 'left') {
                $selectionCursor = this.getLeftCell$($selectionCursor);
            } else if (direction === 'right') {
                $selectionCursor = this.getRightCell$($selectionCursor);
            } else if (direction === 'up') {
                $selectionCursor = this.getAboveCell$($selectionCursor);
            } else if (direction === 'down') {
                $selectionCursor = this.getBelowCell$($selectionCursor);
            }

            return $selectionCursor;
        };

        ['left', 'right', 'up', 'down']
            .map(direction =>
                this.keyboard.on(`shift+${direction}`, () => this.selectArea(getNextSelectionCursor(direction))));
    }

    bindCopyCellContents() {
        this.keyboard.on('ctrl+c', () => {
            const noOfCellsCopied = this.copyCellContents(this.$focusedCell, this.$selectionCursor);
            const message = `${noOfCellsCopied} cell${noOfCellsCopied > 1 ? 's' : ''} copied`;
            if (noOfCellsCopied) {
                this.instance.showToastMessage(message, 2);
            }
        });
    }

    bindMouseEvents() {
        let mouseDown = null;

        $.on(this.bodyScrollable, 'mousedown', '.dt-cell', (e) => {
            mouseDown = true;
            this.focusCell($(e.delegatedTarget));
        });

        $.on(this.bodyScrollable, 'mouseup', () => {
            mouseDown = false;
        });

        const selectArea = (e) => {
            if (!mouseDown) return;
            this.selectArea($(e.delegatedTarget));
        };

        $.on(this.bodyScrollable, 'mousemove', '.dt-cell', throttle(selectArea, 50));
    }

    bindTreeEvents() {
        $.on(this.bodyScrollable, 'click', '.dt-tree-node__toggle', (e, $toggle) => {
            const $cell = $.closest('.dt-cell', $toggle);
            const { rowIndex } = $.data($cell);

            if ($cell.classList.contains('dt-cell--tree-close')) {
                this.rowmanager.openSingleNode(rowIndex);
            } else {
                this.rowmanager.closeSingleNode(rowIndex);
            }
        });
    }

    focusCell($cell, {
        skipClearSelection = 0
    } = {}) {
        if (!$cell) return;

        // don't focus if already editing cell
        if ($cell === this.$editingCell) return;

        const {
            colIndex,
            isHeader
        } = $.data($cell);
        if (isHeader) {
            return;
        }

        const column = this.columnmanager.getColumn(colIndex);
        if (column.focusable === false) {
            return;
        }

        this.scrollToCell($cell);

        this.deactivateEditing();
        if (!skipClearSelection) {
            this.clearSelection();
        }

        if (this.$focusedCell) {
            this.$focusedCell.classList.remove('dt-cell--focus');
        }

        this.$focusedCell = $cell;
        $cell.classList.add('dt-cell--focus');

        // so that keyboard nav works
        $cell.focus();

        this.highlightRowColumnHeader($cell);
    }

    highlightRowColumnHeader($cell) {
        const {
            colIndex,
            rowIndex
        } = $.data($cell);

        const srNoColIndex = this.datamanager.getColumnIndexById('_rowIndex');
        const colHeaderSelector = `.dt-cell--header-${colIndex}`;
        const rowHeaderSelector = `.dt-cell--${srNoColIndex}-${rowIndex}`;

        if (this.lastHeaders) {
            this.lastHeaders.forEach(header => header.classList.remove('dt-cell--highlight'));
        }

        const colHeader = $(colHeaderSelector, this.wrapper);
        const rowHeader = $(rowHeaderSelector, this.wrapper);

        this.lastHeaders = [colHeader, rowHeader];
        this.lastHeaders.forEach(header => header.classList.add('dt-cell--highlight'));
    }

    selectAreaOnClusterChanged() {
        if (!(this.$focusedCell && this.$selectionCursor)) return;
        const {
            colIndex,
            rowIndex
        } = $.data(this.$selectionCursor);
        const $cell = this.getCell$(colIndex, rowIndex);

        if (!$cell || $cell === this.$selectionCursor) return;

        // selectArea needs $focusedCell
        const fCell = $.data(this.$focusedCell);
        this.$focusedCell = this.getCell$(fCell.colIndex, fCell.rowIndex);

        this.selectArea($cell);
    }

    focusCellOnClusterChanged() {
        if (!this.$focusedCell) return;

        const {
            colIndex,
            rowIndex
        } = $.data(this.$focusedCell);
        const $cell = this.getCell$(colIndex, rowIndex);

        if (!$cell) return;
        // this function is called after selectAreaOnClusterChanged,
        // focusCell calls clearSelection which resets the area selection
        // so a flag to skip it
        this.focusCell($cell, {
            skipClearSelection: 1
        });
    }

    selectArea($selectionCursor) {
        if (!this.$focusedCell) return;

        if (this._selectArea(this.$focusedCell, $selectionCursor)) {
            // valid selection
            this.$selectionCursor = $selectionCursor;
        }
    }

    _selectArea($cell1, $cell2) {
        if ($cell1 === $cell2) return false;

        const cells = this.getCellsInRange($cell1, $cell2);
        if (!cells) return false;

        this.clearSelection();
        cells.map(index => this.getCell$(...index)).map($cell => $cell.classList.add('dt-cell--highlight'));
        return true;
    }

    getCellsInRange($cell1, $cell2) {
        let colIndex1, rowIndex1, colIndex2, rowIndex2;

        if (typeof $cell1 === 'number') {
            [colIndex1, rowIndex1, colIndex2, rowIndex2] = arguments;
        } else
        if (typeof $cell1 === 'object') {
            if (!($cell1 && $cell2)) {
                return false;
            }

            const cell1 = $.data($cell1);
            const cell2 = $.data($cell2);

            colIndex1 = cell1.colIndex;
            rowIndex1 = cell1.rowIndex;
            colIndex2 = cell2.colIndex;
            rowIndex2 = cell2.rowIndex;
        }

        if (rowIndex1 > rowIndex2) {
            [rowIndex1, rowIndex2] = [rowIndex2, rowIndex1];
        }

        if (colIndex1 > colIndex2) {
            [colIndex1, colIndex2] = [colIndex2, colIndex1];
        }

        if (this.isStandardCell(colIndex1) || this.isStandardCell(colIndex2)) {
            return false;
        }

        const cells = [];
        let colIndex = colIndex1;
        let rowIndex = rowIndex1;
        const rowIndices = [];

        while (rowIndex <= rowIndex2) {
            rowIndices.push(rowIndex);
            rowIndex += 1;
        }

        rowIndices.map((rowIndex) => {
            while (colIndex <= colIndex2) {
                cells.push([colIndex, rowIndex]);
                colIndex++;
            }
            colIndex = colIndex1;
        });

        return cells;
    }

    clearSelection() {
        $.each('.dt-cell--highlight', this.bodyScrollable)
            .map(cell => cell.classList.remove('dt-cell--highlight'));

        this.$selectionCursor = null;
    }

    getSelectionCursor() {
        return this.$selectionCursor || this.$focusedCell;
    }

    activateEditing($cell) {
        this.focusCell($cell);
        const {
            rowIndex,
            colIndex
        } = $.data($cell);

        const col = this.columnmanager.getColumn(colIndex);
        if (col && (col.editable === false || col.focusable === false)) {
            return;
        }

        const cell = this.getCell(colIndex, rowIndex);
        if (cell && cell.editable === false) {
            return;
        }

        if (this.$editingCell) {
            const {
                _rowIndex,
                _colIndex
            } = $.data(this.$editingCell);

            if (rowIndex === _rowIndex && colIndex === _colIndex) {
                // editing the same cell
                return;
            }
        }

        this.$editingCell = $cell;
        $cell.classList.add('dt-cell--editing');

        const $editCell = $('.dt-cell__edit', $cell);
        $editCell.innerHTML = '';

        const editor = this.getEditor(colIndex, rowIndex, cell.content, $editCell);

        if (editor) {
            this.currentCellEditor = editor;
            // initialize editing input with cell value
            editor.initValue(cell.content, rowIndex, col);
        }
    }

    deactivateEditing() {
        // keep focus on the cell so that keyboard navigation works
        if (this.$focusedCell) this.$focusedCell.focus();

        if (!this.$editingCell) return;
        this.$editingCell.classList.remove('dt-cell--editing');
        this.$editingCell = null;
    }

    getEditor(colIndex, rowIndex, value, parent) {
        const column = this.datamanager.getColumn(colIndex);
        const row = this.datamanager.getRow(rowIndex);
        const data = this.datamanager.getData(rowIndex);
        let editor = this.options.getEditor ?
            this.options.getEditor(colIndex, rowIndex, value, parent, column, row, data) :
            this.getDefaultEditor(parent);

        if (editor === false) {
            // explicitly returned false
            return false;
        }
        if (editor === undefined) {
            // didn't return editor, fallback to default
            editor = this.getDefaultEditor(parent);
        }

        return editor;
    }

    getDefaultEditor(parent) {
        const $input = $.create('input', {
            class: 'dt-input',
            type: 'text',
            inside: parent
        });

        return {
            initValue(value) {
                $input.focus();
                $input.value = value;
            },
            getValue() {
                return $input.value;
            },
            setValue(value) {
                $input.value = value;
            }
        };
    }

    submitEditing() {
        if (!this.$editingCell) return;
        const $cell = this.$editingCell;
        const {
            rowIndex,
            colIndex
        } = $.data($cell);
        const col = this.datamanager.getColumn(colIndex);

        if ($cell) {
            const editor = this.currentCellEditor;

            if (editor) {
                const value = editor.getValue();
                const done = editor.setValue(value, rowIndex, col);
                const oldValue = this.getCell(colIndex, rowIndex).content;

                // update cell immediately
                this.updateCell(colIndex, rowIndex, value);
                $cell.focus();

                if (done && done.then) {
                    // revert to oldValue if promise fails
                    done.catch((e) => {
                        console.log(e);
                        this.updateCell(colIndex, rowIndex, oldValue);
                    });
                }
            }
        }

        this.currentCellEditor = null;
    }

    copyCellContents($cell1, $cell2) {
        if (!$cell2 && $cell1) {
            // copy only focusedCell
            const {
                colIndex,
                rowIndex
            } = $.data($cell1);
            const cell = this.getCell(colIndex, rowIndex);
            copyTextToClipboard(cell.content);
            return 1;
        }
        const cells = this.getCellsInRange($cell1, $cell2);

        if (!cells) return 0;

        const rows = cells
            // get cell objects
            .map(index => this.getCell(...index))
            // convert to array of rows
            .reduce((acc, curr) => {
                const rowIndex = curr.rowIndex;

                acc[rowIndex] = acc[rowIndex] || [];
                acc[rowIndex].push(curr.content);

                return acc;
            }, []);

        const values = rows
            // join values by tab
            .map(row => row.join('\t'))
            // join rows by newline
            .join('\n');

        copyTextToClipboard(values);

        // return no of cells copied
        return rows.reduce((total, row) => total + row.length, 0);
    }

    activateFilter(colIndex) {
        this.columnmanager.toggleFilter();
        this.columnmanager.focusFilter(colIndex);

        if (!this.columnmanager.isFilterShown) {
            // put focus back on cell
            this.$focusedCell.focus();
        }
    }

    updateCell(colIndex, rowIndex, value) {
        const cell = this.datamanager.updateCell(colIndex, rowIndex, {
            content: value
        });
        this.refreshCell(cell);
    }

    refreshCell(cell) {
        const $cell = $(this.selector(cell.colIndex, cell.rowIndex), this.bodyScrollable);
        $cell.innerHTML = this.getCellContent(cell);
    }

    toggleTreeButton(rowIndex, flag) {
        const colIndex = this.columnmanager.getFirstColumnIndex();
        const $cell = this.getCell$(colIndex, rowIndex);
        if ($cell) {
            $cell.classList[flag ? 'remove' : 'add']('dt-cell--tree-close');
        }
    }

    isStandardCell(colIndex) {
        // Standard cells are in Sr. No and Checkbox column
        return colIndex < this.columnmanager.getFirstColumnIndex();
    }

    getCell$(colIndex, rowIndex) {
        return $(this.selector(colIndex, rowIndex), this.bodyScrollable);
    }

    getAboveCell$($cell) {
        const {
            colIndex
        } = $.data($cell);

        let $aboveRow = $cell.parentElement.previousElementSibling;
        while ($aboveRow && $aboveRow.classList.contains('dt-row--hide')) {
            $aboveRow = $aboveRow.previousElementSibling;
        }

        if (!$aboveRow) return $cell;
        return $(`.dt-cell--col-${colIndex}`, $aboveRow);
    }

    getBelowCell$($cell) {
        const {
            colIndex
        } = $.data($cell);

        let $belowRow = $cell.parentElement.nextElementSibling;
        while ($belowRow && $belowRow.classList.contains('dt-row--hide')) {
            $belowRow = $belowRow.nextElementSibling;
        }

        if (!$belowRow) return $cell;
        return $(`.dt-cell--col-${colIndex}`, $belowRow);
    }

    getLeftCell$($cell) {
        return $cell.previousElementSibling;
    }

    getRightCell$($cell) {
        return $cell.nextElementSibling;
    }

    getLeftMostCell$(rowIndex) {
        return this.getCell$(this.columnmanager.getFirstColumnIndex(), rowIndex);
    }

    getRightMostCell$(rowIndex) {
        return this.getCell$(this.columnmanager.getLastColumnIndex(), rowIndex);
    }

    getTopMostCell$(colIndex) {
        return this.getCell$(colIndex, this.rowmanager.getFirstRowIndex());
    }

    getBottomMostCell$(colIndex) {
        return this.getCell$(colIndex, this.rowmanager.getLastRowIndex());
    }

    getCell(colIndex, rowIndex) {
        return this.instance.datamanager.getCell(colIndex, rowIndex);
    }

    getRowHeight() {
        return $.style($('.dt-row', this.bodyScrollable), 'height');
    }

    scrollToCell($cell) {
        if ($.inViewport($cell, this.bodyScrollable)) return false;

        const {
            rowIndex
        } = $.data($cell);
        this.rowmanager.scrollToRow(rowIndex);
        return false;
    }

    getRowCountPerPage() {
        return Math.ceil(this.instance.getViewportHeight() / this.getRowHeight());
    }

    getCellHTML(cell) {
        const {
            rowIndex,
            colIndex,
            isHeader,
            isFilter
        } = cell;
        const dataAttr = makeDataAttributeString({
            rowIndex,
            colIndex,
            isHeader,
            isFilter
        });

        const isBodyCell = !(isHeader || isFilter);

        const className = [
            'dt-cell',
            'dt-cell--col-' + colIndex,
            isBodyCell ? `dt-cell--${colIndex}-${rowIndex}` : '',
            isBodyCell ? 'dt-cell--row-' + rowIndex : '',
            isHeader ? 'dt-cell--header' : '',
            isHeader ? `dt-cell--header-${colIndex}` : '',
            isFilter ? 'dt-cell--filter' : ''
        ].join(' ');

        return `
            <td class="${className}" ${dataAttr} tabindex="0">
                ${this.getCellContent(cell)}
            </td>
        `;
    }

    getCellContent(cell) {
        const {
            isHeader,
            isFilter,
            colIndex
        } = cell;

        const editable = !isHeader && cell.editable !== false;
        const editCellHTML = editable ? this.getEditCellHTML(colIndex) : '';

        const sortable = isHeader && cell.sortable !== false;
        const sortIndicator = sortable ? '<span class="sort-indicator"></span>' : '';

        const resizable = isHeader && cell.resizable !== false;
        const resizeColumn = resizable ? '<span class="dt-cell__resize-handle"></span>' : '';

        const hasDropdown = isHeader && cell.dropdown !== false;
        const dropdown = hasDropdown ? this.columnmanager.getDropdownHTML() : '';

        const customFormatter = cell.format || (cell.column && cell.column.format) || null;

        let contentHTML;
        if (isHeader || isFilter || !customFormatter) {
            contentHTML = cell.content;
        } else {
            const row = this.datamanager.getRow(cell.rowIndex);
            const data = this.datamanager.getData(cell.rowIndex);
            contentHTML = customFormatter(cell.content, row, cell.column, data);
        }

        if (this.options.treeView && !(isHeader || isFilter) && cell.indent !== undefined) {
            const nextRow = this.datamanager.getRow(cell.rowIndex + 1);
            const addToggle = nextRow && nextRow.meta.indent > cell.indent;

            // Add toggle and indent in the first column
            const firstColumnIndex = this.datamanager.getColumnIndexById('_rowIndex') + 1;
            if (firstColumnIndex === cell.colIndex) {
                const padding = ((cell.indent || 0) + 1) * 1.5;
                const toggleHTML = addToggle ?
                    `<span class="dt-tree-node__toggle" style="left: ${padding - 1.5}rem"></span>` : '';
                contentHTML = `<span class="dt-tree-node" style="padding-left: ${padding}rem">
                    ${toggleHTML}${contentHTML}</span>`;
            }
        }

        const className = [
            'dt-cell__content',
            isHeader ? `dt-cell__content--header-${colIndex}` : `dt-cell__content--col-${colIndex}`
        ].join(' ');

        return `
            <div class="${className}">
                ${contentHTML}
                ${sortIndicator}
                ${resizeColumn}
                ${dropdown}
            </div>
            ${editCellHTML}
        `;
    }

    getEditCellHTML(colIndex) {
        return `<div class="dt-cell__edit dt-cell__edit--col-${colIndex}"></div>`;
    }

    selector(colIndex, rowIndex) {
        return `.dt-cell--${colIndex}-${rowIndex}`;
    }
}
