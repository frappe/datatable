import { getColumnHTML } from './utils';
import keyboard from 'keyboard';

export default class CellManager {
  constructor(instance) {
    this.instance = instance;
    this.options = this.instance.options;
    this.bodyScrollable = this.instance.bodyScrollable;

    this.prepare();
    this.bindEvents();
  }

  prepare() {
    this.$borderOutline = this.instance.$borders.find('.border-outline');
    this.$borderBg = this.instance.$borders.find('.border-background');
  }

  bindEvents() {
    this.bindFocusCell();
    this.bindEditCell();
    this.bindKeyboardNav();
    this.bindKeyboardSelection();
  }

  bindFocusCell() {
    const bodyScrollable = this.instance.bodyScrollable;

    this.$focusedCell = null;
    bodyScrollable.on('click', '.data-table-col', (e) => {
      this.focusCell($(e.currentTarget));
    });
  }

  focusCell($cell) {
    if (!$cell.length) return;
    this.deactivateEditing();
    this.clearSelection();

    const { colIndex } = this.getCellAttr($cell);

    if (this.options.addCheckboxColumn && colIndex === 0) {
      return;
    }

    this.$focusedCell = $cell;
    this.bodyScrollable.find('.data-table-col').removeClass('selected');
    $cell.addClass('selected');

    this.highlightRowColumnHeader($cell);
  }

  highlightRowColumnHeader($cell) {
    const { colIndex, rowIndex } = this.getCellAttr($cell);
    const _colIndex = this.instance.getSerialColumnIndex();
    const colHeaderSelector = `.data-table-header .data-table-col[data-col-index="${colIndex}"]`;
    const rowHeaderSelector = `.data-table-col[data-row-index="${rowIndex}"][data-col-index="${_colIndex}"]`;

    if (this.lastSelectors) {
      this.instance.removeStyle(this.lastSelectors.colHeaderSelector);
      this.instance.removeStyle(this.lastSelectors.rowHeaderSelector);
    }

    this.instance.setStyle(colHeaderSelector, {
      'background-color': 'var(--light-bg)'
    });

    this.instance.setStyle(rowHeaderSelector, {
      'background-color': 'var(--light-bg)'
    });

    this.lastSelectors = {
      colHeaderSelector,
      rowHeaderSelector
    };
  }

  bindEditCell() {
    const self = this;

    this.$editingCell = null;
    this.bodyScrollable.on('dblclick', '.data-table-col', function () {
      self.activateEditing($(this));
    });

    keyboard.on('enter', (e) => {
      if (this.$focusedCell && !this.$editingCell) {
        // enter keypress on focused cell
        this.activateEditing(this.$focusedCell);
      } else if (this.$editingCell) {
        // enter keypress on editing cell
        this.submitEditing(this.$editingCell);
      }
    });

    $(document.body).on('click', e => {
      if ($(e.target).is('.edit-cell, .edit-cell *')) return;
      this.deactivateEditing();
    });
  }

  bindKeyboardNav() {
    const focusCell = (direction) => {
      if (!this.$focusedCell) return;
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
    };

    ['left', 'right', 'up', 'down'].map(
      direction => keyboard.on(direction, () => focusCell(direction))
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

    const selectArea = ($selectionCursor) => {
      if (!this.$focusedCell) return;

      if (this.selectArea(this.$focusedCell, $selectionCursor)) {
        // valid selection
        this.$selectionCursor = $selectionCursor;
      }
    };

    ['left', 'right', 'up', 'down'].map(
      direction => keyboard.on('shift+' + direction,
        () => selectArea(getNextSelectionCursor(direction)))
    );
  }

  selectArea(colIndex1, rowIndex1, colIndex2, rowIndex2) {

    if (typeof colIndex1 === 'object') {
      if (!(colIndex1.length && rowIndex1.length)) return false;

      const cell1 = this.getCellAttr(colIndex1);
      const cell2 = this.getCellAttr(rowIndex1);

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

    this.clearSelection();

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

    const $cells = cells.map(([c, r]) => this.getCell$(r, c)[0]);

    $($cells).addClass('highlight');

    return true;
  }

  clearSelection() {
    this.bodyScrollable.find('.data-table-col').removeClass('highlight');
    this.$selectionCursor = null;
  }

  getSelectionCursor() {
    return this.$selectionCursor || this.$focusedCell;
  }

  activateEditing($cell) {
    const { rowIndex, colIndex } = this.getCellAttr($cell);
    const col = this.instance.getColumn(colIndex);

    if (col && col.editable === false) {
      return;
    }

    if (this.$editingCell) {
      const { _rowIndex, _colIndex } = this.getCellAttr(this.$editingCell);

      if (rowIndex === _rowIndex && colIndex === _colIndex) {
        // editing the same cell
        return;
      }
    }

    this.$editingCell = $cell;
    $cell.addClass('editing');

    const $editCell = $cell.find('.edit-cell').empty();
    const cell = this.instance.getCell(rowIndex, colIndex);
    const editing = this.getEditingObject(colIndex, rowIndex, cell.content, $editCell);

    if (editing) {
      this.currentCellEditing = editing;
      // initialize editing input with cell value
      editing.initValue(cell.content);
    }
  }

  deactivateEditing() {
    if (!this.$editingCell) return;
    this.$editingCell.removeClass('editing');
    this.$editingCell = null;
  }

  getEditingObject(colIndex, rowIndex, value, parent) {
    if (this.options.editing) {
      return this.options.editing(colIndex, rowIndex, value, parent);
    }

    // editing fallback
    const $input = $('<input type="text" />');

    parent.append($input);

    return {
      initValue(value) {
        $input.focus();
        return $input.val(value);
      },
      getValue() {
        return $input.val();
      },
      setValue(value) {
        return $input.val(value);
      }
    };
  }

  submitEditing($cell) {
    const { rowIndex, colIndex } = this.getCellAttr($cell);

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

  updateCell(rowIndex, colIndex, value) {
    const cell = this.getCell(rowIndex, colIndex);

    cell.content = value;
    this.refreshCell(cell);
  }

  refreshCell(cell) {
    const selector = `.data-table-col[data-row-index="${cell.rowIndex}"][data-col-index="${cell.colIndex}"]`;
    const bodyScrollable = this.instance.bodyScrollable;
    const $cell = bodyScrollable.find(selector);
    const $newCell = $(getColumnHTML(cell));

    $cell.replaceWith($newCell);
  }

  getCell$(rowIndex, colIndex) {
    return this.bodyScrollable.find(`.data-table-col[data-row-index="${rowIndex}"][data-col-index="${colIndex}"]`);
  }

  getAboveCell$($cell) {
    const { colIndex } = this.getCellAttr($cell);
    const $aboveRow = $cell.parent().prev();

    return $aboveRow.find(`[data-col-index="${colIndex}"]`);
  }

  getBelowCell$($cell) {
    const { colIndex } = this.getCellAttr($cell);
    const $belowRow = $cell.parent().next();

    return $belowRow.find(`[data-col-index="${colIndex}"]`);
  }

  getLeftCell$($cell) {
    return $cell.prev();
  }

  getRightCell$($cell) {
    return $cell.next();
  }

  getCell(rowIndex, colIndex) {
    return this.instance.datamanager.getCell(rowIndex, colIndex);
  }

  getCellAttr($cell) {
    return $cell.data();
  }
}

