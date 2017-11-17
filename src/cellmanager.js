import {
  copyTextToClipboard,
  makeDataAttributeString
} from './utils';
import keyboard from './keyboard';
import $ from './dom';

export default class CellManager {
  constructor(instance) {
    this.instance = instance;
    this.wrapper = this.instance.wrapper;
    this.options = this.instance.options;
    this.style = this.instance.style;
    this.bodyScrollable = this.instance.bodyScrollable;
    this.columnmanager = this.instance.columnmanager;
    this.rowmanager = this.instance.rowmanager;

    this.bindEvents();
  }

  bindEvents() {
    this.bindFocusCell();
    this.bindEditCell();
    this.bindKeyboardSelection();
    this.bindCopyCellContents();
    this.bindMouseEvents();
  }

  bindFocusCell() {
    this.bindKeyboardNav();
  }

  bindEditCell() {
    this.$editingCell = null;

    $.on(this.bodyScrollable, 'dblclick', '.data-table-col', (e, cell) => {
      this.activateEditing(cell);
    });

    keyboard.on('enter', (e) => {
      if (this.$focusedCell && !this.$editingCell) {
        // enter keypress on focused cell
        this.activateEditing(this.$focusedCell);
      } else if (this.$editingCell) {
        // enter keypress on editing cell
        this.submitEditing(this.$editingCell);
        this.deactivateEditing();
      }
    });

    $.on(document.body, 'click', e => {
      if (e.target.matches('.edit-cell, .edit-cell *')) return;
      this.deactivateEditing();
    });
  }

  bindKeyboardNav() {
    const focusCell = (direction) => {
      if (!this.$focusedCell || this.$editingCell) {
        return false;
      }

      let $cell = this.$focusedCell;

      if (direction === 'left') {
        $cell = this.getLeftCell$($cell);
      } else if (direction === 'right') {
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
      const { rowIndex, colIndex } = $.data($cell);

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

    const scrollToCell = (direction) => {
      if (!this.$focusedCell) return false;

      if (!this.inViewport(this.$focusedCell)) {
        const { rowIndex } = $.data(this.$focusedCell);

        this.scrollToRow(rowIndex - this.getRowCountPerPage() + 2);
        return true;
      }

      return false;
    };

    ['left', 'right', 'up', 'down'].map(
      direction => keyboard.on(direction, () => focusCell(direction))
    );

    ['left', 'right', 'up', 'down'].map(
      direction => keyboard.on('ctrl+' + direction, () => focusLastCell(direction))
    );

    ['left', 'right', 'up', 'down'].map(
      direction => keyboard.on(direction, () => scrollToCell(direction))
    );

    keyboard.on('esc', () => {
      this.deactivateEditing();
    });
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

    ['left', 'right', 'up', 'down'].map(
      direction => keyboard.on('shift+' + direction,
        () => this.selectArea(getNextSelectionCursor(direction)))
    );
  }

  bindCopyCellContents() {
    keyboard.on('ctrl+c', () => {
      this.copyCellContents(this.$focusedCell, this.$selectionCursor);
    });
  }

  bindMouseEvents() {
    let mouseDown = null;

    $.on(this.bodyScrollable, 'mousedown', '.data-table-col', (e) => {
      mouseDown = true;
      this.focusCell($(e.delegatedTarget));
    });

    $.on(this.bodyScrollable, 'mouseup', () => {
      mouseDown = false;
    });

    $.on(this.bodyScrollable, 'mousemove', '.data-table-col', (e) => {
      if (!mouseDown) return;
      this.selectArea($(e.delegatedTarget));
    });
  }

  focusCell($cell, { skipClearSelection = 0 } = {}) {
    if (!$cell) return;

    // don't focus if already editing cell
    if ($cell === this.$editingCell) return;

    // don't focus checkbox cell
    if (this.options.addCheckboxColumn && colIndex === 0) {
      return;
    }

    const { colIndex, isHeader } = $.data($cell);

    if (this.isStandardCell(colIndex) || isHeader) {
      return;
    }

    this.deactivateEditing();
    if (!skipClearSelection) {
      this.clearSelection();
    }

    if (this.$focusedCell) {
      this.$focusedCell.classList.remove('selected');
    }

    this.$focusedCell = $cell;
    $cell.classList.add('selected');

    this.highlightRowColumnHeader($cell);
  }

  highlightRowColumnHeader($cell) {
    const { colIndex, rowIndex } = $.data($cell);
    const _colIndex = this.columnmanager.getSerialColumnIndex();
    const colHeaderSelector = `.data-table-header .data-table-col[data-col-index="${colIndex}"]`;
    const rowHeaderSelector = `.data-table-col[data-row-index="${rowIndex}"][data-col-index="${_colIndex}"]`;

    if (this.lastHeaders) {
      $.removeStyle(this.lastHeaders, 'backgroundColor');
    }

    const colHeader = $(colHeaderSelector, this.wrapper);
    const rowHeader = $(rowHeaderSelector, this.wrapper);

    $.style([colHeader, rowHeader], {
      backgroundColor: 'var(--light-bg)'
    });

    this.lastHeaders = [colHeader, rowHeader];
  }

  selectAreaOnClusterChanged() {
    if (!(this.$focusedCell && this.$selectionCursor)) return;
    const { colIndex, rowIndex } = $.data(this.$selectionCursor);
    const $cell = this.getCell$(colIndex, rowIndex);

    if (!$cell || $cell === this.$selectionCursor) return;

    // selectArea needs $focusedCell
    const fCell = $.data(this.$focusedCell);
    this.$focusedCell = this.getCell$(fCell.colIndex, fCell.rowIndex);

    this.selectArea($cell);
  }

  focusCellOnClusterChanged() {
    if (!this.$focusedCell) return;

    const { colIndex, rowIndex } = $.data(this.$focusedCell);
    const $cell = this.getCell$(colIndex, rowIndex);

    if (!$cell) return;
    // this function is called after selectAreaOnClusterChanged,
    // focusCell calls clearSelection which resets the area selection
    // so a flag to skip it
    this.focusCell($cell, { skipClearSelection: 1 });
  }

  selectArea($selectionCursor) {
    if (!this.$focusedCell) return;

    if (this._selectArea(this.$focusedCell, $selectionCursor)) {
      // valid selection
      this.$selectionCursor = $selectionCursor;
    }
  };

  _selectArea($cell1, $cell2) {
    if ($cell1 === $cell2) return false;

    const cells = this.getCellsInRange($cell1, $cell2);
    if (!cells) return false;

    this.clearSelection();
    cells.map(index => this.getCell$(...index)).map($cell => $cell.classList.add('highlight'));
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

    let cells = [];
    let colIndex = colIndex1;
    let rowIndex = rowIndex1;
    let rowIndices = [];

    while (rowIndex <= rowIndex2) {
      rowIndices.push(rowIndex);
      rowIndex++;
    }

    rowIndices.map(rowIndex => {
      while (colIndex <= colIndex2) {
        cells.push([colIndex, rowIndex]);
        colIndex++;
      }
      colIndex = colIndex1;
    });

    return cells;
  }

  clearSelection() {
    $.each('.data-table-col.highlight', this.bodyScrollable)
      .map(cell => cell.classList.remove('highlight'));

    this.$selectionCursor = null;
  }

  getSelectionCursor() {
    return this.$selectionCursor || this.$focusedCell;
  }

  activateEditing($cell) {
    const { rowIndex, colIndex } = $.data($cell);
    const col = this.instance.columnmanager.getColumn(colIndex);

    if (col && col.editable === false) {
      return;
    }

    if (this.$editingCell) {
      const { _rowIndex, _colIndex } = $.data(this.$editingCell);

      if (rowIndex === _rowIndex && colIndex === _colIndex) {
        // editing the same cell
        return;
      }
    }

    this.$editingCell = $cell;
    $cell.classList.add('editing');

    const $editCell = $('.edit-cell', $cell);
    $editCell.innerHTML = '';

    const cell = this.getCell(colIndex, rowIndex);
    const editing = this.getEditingObject(colIndex, rowIndex, cell.content, $editCell);

    if (editing) {
      this.currentCellEditing = editing;
      // initialize editing input with cell value
      editing.initValue(cell.content);
    }
  }

  deactivateEditing() {
    if (!this.$editingCell) return;
    this.$editingCell.classList.remove('editing');
    this.$editingCell = null;
  }

  getEditingObject(colIndex, rowIndex, value, parent) {
    if (this.options.editing) {
      return this.options.editing(colIndex, rowIndex, value, parent);
    }

    // editing fallback
    const $input = $.create('input', {
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

  submitEditing($cell) {
    const { rowIndex, colIndex } = $.data($cell);

    if ($cell) {
      const editing = this.currentCellEditing;

      if (editing) {
        const value = editing.getValue();
        const done = editing.setValue(value);

        if (done && done.then) {
          // wait for promise then update internal state
          done.then(
            () => this.updateCell(rowIndex, colIndex, value)
          );
        } else {
          this.updateCell(rowIndex, colIndex, value);
        }
      }
    }

    this.currentCellEditing = null;
  }

  copyCellContents($cell1, $cell2) {
    const cells = this.getCellsInRange($cell1, $cell2);

    if (!cells) return;

    const values = cells
      // get cell objects
      .map(index => this.getCell(...index))
      // convert to array of rows
      .reduce((acc, curr) => {
        const rowIndex = curr.rowIndex;

        acc[rowIndex] = acc[rowIndex] || [];
        acc[rowIndex].push(curr.content);

        return acc;
      }, [])
      // join values by tab
      .map(row => row.join('\t'))
      // join rows by newline
      .join('\n');

    copyTextToClipboard(values);
  }

  updateCell(rowIndex, colIndex, value) {
    const cell = this.getCell(colIndex, rowIndex);

    cell.content = value;
    this.refreshCell(cell);
  }

  refreshCell(cell) {
    const selector = `.data-table-col[data-row-index="${cell.rowIndex}"][data-col-index="${cell.colIndex}"]`;
    const $cell = $(selector, this.bodyScrollable);

    $cell.innerHTML = getCellContent(cell);
  }

  isStandardCell(colIndex) {
    // Standard cells are in Sr. No and Checkbox column
    return colIndex < this.columnmanager.getFirstColumnIndex();
  }

  getCell$(colIndex, rowIndex) {
    return $(cellSelector(colIndex, rowIndex), this.bodyScrollable);
  }

  getAboveCell$($cell) {
    const { colIndex } = $.data($cell);
    const $aboveRow = $cell.parentElement.previousElementSibling;

    return $(`[data-col-index="${colIndex}"]`, $aboveRow);
  }

  getBelowCell$($cell) {
    const { colIndex } = $.data($cell);
    const $belowRow = $cell.parentElement.nextElementSibling;

    return $(`[data-col-index="${colIndex}"]`, $belowRow);
  }

  getLeftCell$($cell) {
    return $cell.previousElementSibling;
  }

  getRightCell$($cell) {
    return $cell.nextElementSibling;
  }

  getLeftMostCell$(rowIndex) {
    return this.getCell$(rowIndex, this.columnmanager.getFirstColumnIndex());
  }

  getRightMostCell$(rowIndex) {
    return this.getCell$(rowIndex, this.columnmanager.getLastColumnIndex());
  }

  getTopMostCell$(colIndex) {
    return this.getCell$(this.rowmanager.getFirstRowIndex(), colIndex);
  }

  getBottomMostCell$(colIndex) {
    return this.getCell$(this.rowmanager.getLastRowIndex(), colIndex);
  }

  getCell(colIndex, rowIndex) {
    return this.instance.datamanager.getCell(colIndex, rowIndex);
  }

  getCellAttr($cell) {
    return this.instance.getCellAttr($cell);
  }

  getRowHeight() {
    return $.style($('.data-table-row', this.bodyScrollable), 'height');
  }

  inViewport($cell) {
    let colIndex, rowIndex; // eslint-disable-line

    if (typeof $cell === 'number') {
      [colIndex, rowIndex] = arguments;
    } else {
      let cell = $.data($cell);

      colIndex = cell.colIndex;
      rowIndex = cell.rowIndex;
    }

    const viewportHeight = this.instance.getViewportHeight();
    const rowHeight = this.getRowHeight();
    const rowOffset = rowIndex * rowHeight;

    const scrollTopOffset = this.bodyScrollable.scrollTop;

    if (rowOffset - scrollTopOffset + rowHeight < viewportHeight) {
      return true;
    }

    return false;
  }

  scrollToCell($cell) {
    const { rowIndex } = $.data($cell);

    this.scrollToRow(rowIndex);
  }

  getRowCountPerPage() {
    return Math.ceil(this.instance.getViewportHeight() / this.getRowHeight());
  }

  scrollToRow(rowIndex) {
    const offset = rowIndex * this.getRowHeight();

    this.bodyScrollable.scrollTop = offset;
  }
}

export function getCellHTML(column) {
  const { rowIndex, colIndex, isHeader } = column;
  const dataAttr = makeDataAttributeString({
    rowIndex,
    colIndex,
    isHeader
  });

  return `
    <td class="data-table-col noselect" ${dataAttr}>
      ${getCellContent(column)}
    </td>
  `;
}

export function getCellContent(column) {
  const { isHeader } = column;
  const editCellHTML = isHeader ? '' : getEditCellHTML();
  const sortIndicator = isHeader ? '<span class="sort-indicator"></span>' : '';

  return `
    <div class="content ellipsis">
      ${column.format ? column.format(column.content) : column.content}
      ${sortIndicator}
    </div>
    ${editCellHTML}
  `;
}

export function getEditCellHTML() {
  return `
    <div class="edit-cell"></div>
  `;
}

function cellSelector(colIndex, rowIndex) {
  return `.data-table-col[data-col-index="${colIndex}"][data-row-index="${rowIndex}"]`;
}
