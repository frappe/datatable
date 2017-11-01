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
    keyboard.on('left', () => {
      if (!this.$focusedCell) return;

      this.focusCell(this.$focusedCell.prev());
    });

    keyboard.on('right', () => {
      if (!this.$focusedCell) return;

      this.focusCell(this.$focusedCell.next());
    });

    keyboard.on('up', () => {
      if (!this.$focusedCell) return;

      const { colIndex } = this.getCellAttr(this.$focusedCell);
      const $upRow = this.$focusedCell.parent().prev();
      const $upCell = $upRow.find(`[data-col-index="${colIndex}"]`);

      this.focusCell($upCell);
    });

    keyboard.on('down', () => {
      if (!this.$focusedCell) return;

      const { colIndex } = this.getCellAttr(this.$focusedCell);
      const $downRow = this.$focusedCell.parent().next();
      const $downCell = $downRow.find(`[data-col-index="${colIndex}"]`);

      this.focusCell($downCell);
    });

    keyboard.on('shift+left', () => {
      if (!this.$focusedCell) return;

      // this.focusCell($downCell);
    });

    keyboard.on('esc', () => {
      this.deactivateEditing();
    });
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

  getCell(rowIndex, colIndex) {
    return this.instance.datamanager.getCell(rowIndex, colIndex);
  }

  getCellAttr($cell) {
    return $cell.data();
  }
}

