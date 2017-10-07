/* globals $, Clusterize */
import {
  getHeaderHTML,
  getBodyHTML,
  getRowHTML,
  getColumnHTML,
  prepareRowHeader,
  buildCSSRule,
  prepareRows,
  getDefault
} from './utils.js';

import './style.scss';

const DEFAULT_OPTIONS = {
  events: null,
  data: {
    columns: [],
    rows: []
  },
  editing: null,
  addSerialNoColumn: true,
  enableClusterize: true,
  enableLogs: false,
  addCheckbox: true
};

export default class DataTable {
  constructor(wrapper, options) {

    this.wrapper = $(wrapper);
    if (this.wrapper.length === 0) {
      throw new Error('Invalid argument given for `wrapper`');
    }

    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
    this.events = this.options.events;

    if (this.options.data) {
      this.refresh(this.options.data);
    }
  }

  makeDom() {
    this.wrapper.html(`
      <div class="data-table">
        <table class="data-table-header table table-bordered">
        </table>
        <div class="body-scrollable">
        </div>
        <div class="data-table-footer">
        </div>
        <div class="data-table-popup">
          <div class="edit-popup"></div>
        </div>
      </div>
    `);

    this.header = this.wrapper.find('.data-table-header');
    this.bodyScrollable = this.wrapper.find('.body-scrollable');
    // this.body = this.wrapper.find('.data-table-body');
    this.footer = this.wrapper.find('.data-table-footer');
  }

  refresh(data) {
    this.data = this.prepareData(data);
    this.render();
  }

  render() {
    if (this.wrapper.find('.data-table').length === 0) {
      this.makeDom();
      this.makeStyle();
      this.bindEvents();
    }

    this.renderHeader();
    this.renderBody();
    this.setDimensions();
  }

  renderHeader() {
    // fixed header
    this.header.html(getHeaderHTML(this.data.columns));
  }

  renderBody() {
    if (this.options.enableClusterize) {
      this.renderBodyWithClusterize();
    } else {
      this.renderBodyHTML();
    }
  }

  renderBodyHTML() {
    // scrollable body
    this.bodyScrollable.html(`
      <table class="data-table-body table table-bordered">
        ${getBodyHTML(this.data.rows)}
      </table>
    `);
  }

  renderBodyWithClusterize() {
    // empty body
    this.bodyScrollable.html(`
      <table class="data-table-body table table-bordered">
        ${getBodyHTML([])}
      </table>
    `);

    this.start = 0;
    this.pageLength = 1000;
    this.end = this.start + this.pageLength;

    const initialData = this.getDataForClusterize(
      // only append ${this.pageLength} rows in the beginning
      // defer remaining rows
      this.data.rows.slice(this.start, this.end)
    );

    const self = this;

    this.clusterize = new Clusterize({
      rows: initialData,
      scrollElem: this.bodyScrollable.get(0),
      contentElem: this.bodyScrollable.find('tbody').get(0),
      callbacks: {
        clusterChanged() {
          self.highlightCheckedRows();
        }
      }
    });
    this.log('dataAppended', this.pageLength);
    this.appendRemainingData();
  }

  appendRemainingData() {
    let dataAppended = this.pageLength;
    const promises = [];

    while (dataAppended + this.pageLength < this.data.rows.length) {
      this.start = this.end;
      this.end = this.start + this.pageLength;
      promises.push(this.appendNextPagePromise(this.start, this.end));
      dataAppended += this.pageLength;
    }

    if (this.data.rows.length % this.pageLength > 0) {
      // last page
      this.start = this.end;
      this.end = this.start + this.pageLength;
      promises.push(this.appendNextPagePromise(this.start, this.end));
    }

    return promises.reduce(
      (prev, cur) => prev.then(cur), Promise.resolve()
    );
  }

  appendNextPagePromise(start, end) {
    return new Promise(resolve => {
      setTimeout(() => {
        const rows = this.data.rows.slice(start, end);
        const data = this.getDataForClusterize(rows);

        this.clusterize.append(data);
        this.log('dataAppended', rows.length);
        resolve();
      }, 0);
    });
  }

  getDataForClusterize(rows) {
    return rows.map((row) => getRowHTML(row, { rowIndex: row[0].rowIndex }));
  }

  updateCell(rowIndex, colIndex, value) {
    const cell = this.getCell(rowIndex, colIndex);

    cell.content = value;
    this.refreshCell(cell);
  }

  refreshRows() {
    this.renderBody();
    this.setDimensions();
  }

  refreshCell(cell) {
    const selector = `.data-table-col[data-row-index="${cell.rowIndex}"][data-col-index="${cell.colIndex}"]`;
    const $cell = this.bodyScrollable.find(selector);
    const $newCell = $(getColumnHTML(cell));

    $cell.replaceWith($newCell);
  }

  prepareData(data) {
    // cache original data passed
    this._data = data;
    let { columns, rows } = data;

    if (this.options.addSerialNoColumn) {
      const serialNoColumn = {
        content: 'Sr. No',
        resizable: false
      };

      columns.unshift(serialNoColumn);

      rows = rows.map((row, i) => {
        const val = (i + 1) + '';

        return [val].concat(row);
      });
    }

    if (this.options.addCheckbox) {
      const addCheckboxColumn = {
        content: '<input type="checkbox" />',
        resizable: false,
        sortable: false,
        editable: false
      };

      columns.unshift(addCheckboxColumn);

      rows = rows.map((row, i) => {
        // make copy of object, else it will be mutated
        const val = Object.assign({}, addCheckboxColumn);

        return [val].concat(row);
      });
    }

    const _columns = prepareRowHeader(columns);
    const _rows = prepareRows(rows);

    return {
      columns: _columns,
      rows: _rows
    };
  }

  bindEvents() {
    this.bindFocusCell();
    this.bindEditCell();
    this.bindResizeColumn();
    this.bindSortColumn();
    this.bindCheckbox();
  }

  setDimensions() {
    const self = this;

    // setting width as 0 will ensure that the
    // header doesn't take the available space
    this.header.css({
      width: 0,
      margin: 0
    });

    // cache minWidth for each column
    this.minWidthMap = getDefault(this.minWidthMap, []);
    this.header.find('.data-table-col').each(function () {
      const col = $(this);
      const width = parseInt(col.find('.content').css('width'), 10);
      const colIndex = col.attr('data-col-index');

      if (!self.minWidthMap[colIndex]) {
        // only set this once
        self.minWidthMap[colIndex] = width;
      }
    });

    // set initial width as naturally calculated by table's first row
    this.bodyScrollable.find('.data-table-row[data-row-index="0"] .data-table-col').each(function () {
      const $cell = $(this);
      const width = parseInt($cell.find('.content').css('width'), 10);
      const height = parseInt($cell.find('.content').css('height'), 10);
      const { colIndex } = self.getCellAttr($cell);

      self.setColumnWidth(colIndex, width);
      self.setDefaultCellHeight(height);
    });

    this.setBodyWidth();

    this.setStyle('.data-table .body-scrollable', {
      'margin-top': (this.header.height() + 1) + 'px'
    });

    // hide edit cells by default
    this.setStyle('.data-table .body-scrollable .edit-cell', {
      display: 'none'
    });

    this.bodyScrollable.find('.table').css('margin', 0);
  }

  bindFocusCell() {
    const self = this;

    this.$focusedCell = null;
    this.bodyScrollable.on('click', '.data-table-col', function () {
      const $cell = $(this);
      const { colIndex } = self.getCellAttr($cell);

      if (self.options.addCheckbox && colIndex === 0) {
        return;
      }

      self.$focusedCell = $cell;
      self.bodyScrollable.find('.data-table-col').removeClass('selected');
      $cell.addClass('selected');
    });
  }

  bindEditCell() {
    const self = this;

    this.$editingCell = null;
    this.bodyScrollable.on('dblclick', '.data-table-col', function () {
      self.activateEditing($(this));
    });

    $(document.body).on('keypress', (e) => {
      // enter keypress on focused cell
      if (e.which === 13 && this.$focusedCell && !this.$editingCell) {
        this.log('editingCell');
        this.activateEditing(this.$focusedCell);
        e.stopImmediatePropagation();
      }
    });

    $(document.body).on('keypress', (e) => {
      // enter keypress on editing cell
      if (e.which === 13 && this.$editingCell) {
        this.log('submitCell');
        this.submitEditing(this.$editingCell);
        e.stopImmediatePropagation();
      }
    });

    $(document.body).on('click', e => {
      if ($(e.target).is('.edit-cell, .edit-cell *')) return;
      self.bodyScrollable.find('.edit-cell').hide();
      this.$editingCell = null;
    });
  }

  activateEditing($cell) {
    const { rowIndex, colIndex } = this.getCellAttr($cell);
    const col = this.getColumn(colIndex);

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
    const $editCell = $cell.find('.edit-cell').empty();
    const cell = this.getCell(rowIndex, colIndex);
    const editing = this.getEditingObject(colIndex, rowIndex, cell.content, $editCell);

    if (editing) {
      this.currentCellEditing = editing;
      // initialize editing input with cell value
      editing.initValue(cell.content);
      $editCell.show();
    }
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

  bindResizeColumn() {
    const self = this;
    let isDragging = false;
    let $currCell, startWidth, startX;

    this.header.on('mousedown', '.data-table-col', function (e) {
      $currCell = $(this);
      const colIndex = $currCell.attr('data-col-index');
      const col = self.getColumn(colIndex);

      if (col && col.resizable === false) {
        return;
      }

      isDragging = true;
      startWidth = $currCell.find('.content').width();
      startX = e.pageX;
    });

    $('body').on('mouseup', function (e) {
      if (!$currCell) return;
      isDragging = false;
      const colIndex = $currCell.attr('data-col-index');

      if ($currCell) {
        const width = parseInt($currCell.find('.content').css('width'), 10);

        self.setColumnWidth(colIndex, width);
        self.setBodyWidth();
        $currCell = null;
      }
    });

    $('body').on('mousemove', function (e) {
      if (!isDragging) return;
      const finalWidth = startWidth + (e.pageX - startX);
      const colIndex = $currCell.attr('data-col-index');

      if (self.getColumnMinWidth(colIndex) > finalWidth) {
        // don't resize past minWidth
        return;
      }

      self.setColumnHeaderWidth(colIndex, finalWidth);
    });
  }

  bindSortColumn() {
    const self = this;

    this.header.on('click', '.data-table-col .content span', function () {
      const $cell = $(this).closest('.data-table-col');
      const sortAction = getDefault($cell.attr('data-sort-action'), 'none');
      const colIndex = $cell.attr('data-col-index');
      const col = self.getColumn(colIndex);

      if (col && col.sortable === false) {
        return;
      }

      // reset sort indicator
      self.header.find('.sort-indicator').text('');
      self.header.find('.data-table-col').attr('data-sort-action', 'none');

      if (sortAction === 'none') {
        $cell.attr('data-sort-action', 'asc');
        $cell.find('.sort-indicator').text('▲');
      } else if (sortAction === 'asc') {
        $cell.attr('data-sort-action', 'desc');
        $cell.find('.sort-indicator').text('▼');
      } else if (sortAction === 'desc') {
        $cell.attr('data-sort-action', 'none');
        $cell.find('.sort-indicator').text('');
      }

      // sortWith this action
      const sortWith = $cell.attr('data-sort-action');

      if (self.events && self.events.onSort) {
        self.events.onSort(colIndex, sortWith);
      } else {
        self.sortRows(colIndex, sortWith);
        self.refreshRows();
      }
    });
  }

  sortRows(colIndex, sortAction = 'none') {
    colIndex = +colIndex;

    this.data.rows.sort((a, b) => {
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

  bindCheckbox() {
    if (!this.options.addCheckbox) return;
    const self = this;

    // map of checked rows
    this.checkMap = [];

    this.wrapper.on('click', '.data-table-col[data-col-index="0"] [type="checkbox"]', function () {
      const $checkbox = $(this);
      const $cell = $checkbox.closest('.data-table-col');
      const { rowIndex, isHeader } = self.getCellAttr($cell);
      const checked = $checkbox.is(':checked');

      if (isHeader) {
        self.checkAll(checked);
      } else {
        self.checkRow(rowIndex, checked);
      }
    });
  }

  getCheckedRows() {
    return this.checkMap
      .map((c, rowIndex) => {
        if (c) {
          return rowIndex;
        }
        return null;
      })
      .filter(c => {
        return c !== null || c !== undefined;
      });
  }

  highlightCheckedRows() {
    this.getCheckedRows()
      .map(rowIndex => this.checkRow(rowIndex, true));
  }

  checkRow(rowIndex, toggle) {
    const value = toggle ? 1 : 0;

    // update internal map
    this.checkMap[rowIndex] = value;
    // set checkbox value explicitly
    this.bodyScrollable
      .find(`.data-table-col[data-row-index="${rowIndex}"][data-col-index="0"] [type="checkbox"]`)
      .prop('checked', toggle);
    // highlight row
    this.highlightRow(rowIndex, toggle);
  }

  checkAll(toggle) {
    const value = toggle ? 1 : 0;

    // update internal map
    if (toggle) {
      this.checkMap = Array.from(Array(this.getTotalRows())).map(c => value);
    } else {
      this.checkMap = [];
    }
    // set checkbox value
    this.bodyScrollable
      .find('.data-table-col[data-col-index="0"] [type="checkbox"]')
      .prop('checked', toggle);
    // highlight all
    this.highlightAll(toggle);
  }

  highlightRow(rowIndex, toggle = true) {
    const $row = this.bodyScrollable
      .find(`.data-table-row[data-row-index="${rowIndex}"]:not(.row-highlight)`);

    if (toggle) {
      $row.addClass('row-highlight');
    } else {
      $row.removeClass('row-highlight');
    }
  }

  highlightAll(toggle = true) {
    this.bodyScrollable
      .find('.data-table-row')
      .toggleClass('row-highlight', toggle);
  }

  setColumnWidth(colIndex, width) {
    // set width for content
    this.setStyle(`[data-col-index="${colIndex}"] .content`, {
      width: width + 'px'
    });
    // set width for edit cell
    this.setStyle(`[data-col-index="${colIndex}"] .edit-cell`, {
      width: width + 'px'
    });
  }

  setColumnHeaderWidth(colIndex, width) {
    this.setStyle(`[data-col-index="${colIndex}"][data-is-header] .content`, {
      width: width + 'px'
    });
  }

  setDefaultCellHeight(height) {
    this.setStyle('.data-table-col .content', {
      height: height + 'px'
    });
  }

  setRowHeight(rowIndex, height) {
    this.setStyle(`[data-row-index="${rowIndex}"] .content`, {
      height: height + 'px'
    });
  }

  setColumnWidths() {
    const availableWidth = this.wrapper.width();
    const headerWidth = this.header.width();

    if (headerWidth > availableWidth) {
      // don't resize, horizontal scroll takes place
      return;
    }

    const deltaWidth = (availableWidth - headerWidth) / this.data.columns.length;

    this.data.columns.map(col => {
      const width = this.getColumnHeaderElement(col.colIndex).width();
      let finalWidth = width + deltaWidth - 16;

      if (this.options.addSerialNoColumn && col.colIndex === 0) {
        return;
      }

      this.setColumnHeaderWidth(col.colIndex, finalWidth);
      this.setColumnWidth(col.colIndex, finalWidth);
    });
    this.setBodyWidth();
  }

  setBodyWidth() {
    this.bodyScrollable.css(
      'width',
      parseInt(this.header.css('width'), 10) + 1
    );
  }

  setStyle(rule, styleMap) {
    let styles = this.$style.text();

    styles = buildCSSRule(rule, styleMap, styles);
    this.$style.html(styles);
  }

  makeStyle() {
    this.$style = $('<style data-id="datatable"></style>')
      .prependTo(this.wrapper);
  }

  getColumn(colIndex) {
    colIndex = +colIndex;
    return this.data.columns.find(col => col.colIndex === colIndex);
  }

  getRow(rowIndex) {
    rowIndex = +rowIndex;
    return this.data.rows.find(row => row[0].rowIndex === rowIndex);
  }

  getCell(rowIndex, colIndex) {
    rowIndex = +rowIndex;
    colIndex = +colIndex;
    return this.data.rows.find(row => row[0].rowIndex === rowIndex)[colIndex];
  }

  getColumnHeaderElement(colIndex) {
    colIndex = +colIndex;
    if (colIndex < 0) return null;
    return this.wrapper.find(
      `.data-table-col[data-is-header][data-col-index="${colIndex}"]`
    );
  }

  getColumnMinWidth(colIndex) {
    colIndex = +colIndex;
    return this.minWidthMap && this.minWidthMap[colIndex];
  }

  getCellAttr($cell) {
    return $cell.data();
  }

  getTotalRows() {
    return this.data.rows.length;
  }

  log() {
    if (this.options.enableLogs) {
      console.log.apply(console, arguments);
    }
  }
}

