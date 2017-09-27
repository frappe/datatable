import {
  getHeaderHTML,
  getBodyHTML,
  getColumnHTML,
  prepareRowHeader,
  prepareRows,
  getDefault
} from './utils.js';
import $ from 'jQuery';

import './style.scss';

export default class ReGrid {
  constructor({ wrapper, events, data, addSerialNoColumn }) {
    this.wrapper = $(wrapper);
    if (this.wrapper.length === 0) {
      throw new Error('Invalid argument given for `wrapper`');
    }

    this.events = getDefault(events, {});
    this.addSerialNoColumn = getDefault(addSerialNoColumn, 0);

    this.makeDom();
    this.bindEvents();
    if (data) {
      this.data = this.prepareData(data);
      this.render();
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

  render() {
    if (this.wrapper.find('.data-table').length === 0) {
      this.makeDom();
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
    // scrollable body
    this.bodyScrollable.html(`
      <table class="data-table-body table table-bordered">
        ${getBodyHTML(this.data.rows)}
      </table>
    `);
  }

  updateCell(rowIndex, colIndex, value) {
    const row = this.getRow(rowIndex);
    const cell = row.find(cell => cell.col_index === colIndex);

    cell.data = value;
    this.refreshCell(cell);
  }

  refreshRows() {
    this.renderBody();
    this.setDimensions();
  }

  refreshCell(cell) {
    const selector = `.data-table-col[data-row-index="${cell.row_index}"][data-col-index="${cell.col_index}"]`;
    const $cell = this.body.find(selector);
    const $newCell = $(getColumnHTML(cell));

    $cell.replaceWith($newCell);
  }

  prepareData(data) {
    let { columns, rows } = data;

    if (this.addSerialNoColumn) {
      const serialNoColumn = 'Sr. No';

      columns = [serialNoColumn].concat(columns);

      rows = rows.map((row, i) => {
        const val = (i + 1) + "";

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

  prepareColumns(columns) {
    return columns.map((col, i) => {
      col.colIndex = i;
      col.isHeader = 1;
      col.format = val => `<span>${val}</span>`;
      return col;
    });
  }

  bindEvents() {
    const self = this;

    this.bodyScrollable.on('click', '.data-table-col', function () {
      const $col = $(this);

      self.bodyScrollable.find('.data-table-col').removeClass('selected');
      $col.addClass('selected');
    });

    this.bindCellDoubleClick();
    this.bindResizeColumn();
    this.bindSortColumn();
  }

  setDimensions() {
    const self = this;

    // setting width as 0 will ensure that the
    // header doesn't take the available space
    this.header.css({
      width: 0,
      margin: 0
    });

    // set the width for each cell
    this.header.find('.data-table-col').each(function () {
      const col = $(this);
      const height = col.find('.content').height();
      const width = col.find('.content').width();
      const colIndex = col.attr('data-col-index');
      const selector = `.data-table-col[data-col-index="${colIndex}"] .content`;
      const $cell = self.bodyScrollable.find(selector);

      $cell.width(width);
      $cell.height(height);
    });

    this.setBodyWidth();
    this.setColumnWidths();

    this.bodyScrollable.css({
      marginTop: this.header.height() + 1
    });

    this.bodyScrollable.find('.table').css('margin', 0);
  }

  bindCellDoubleClick() {
    const { events } = this;
    const $editPopup = this.wrapper.find('.edit-popup');

    $editPopup.hide();
    if (!events.on_cell_doubleclick) return;

    this.bodyScrollable.on('dblclick', '.data-table-col', function () {
      const $cell = $(this);
      const rowIndex = $cell.attr('data-row-index');
      const colIndex = $cell.attr('data-col-index');

      $editPopup.empty();
      const { top, left } = $cell.position();

      $editPopup.css({
        top: top - 12,
        left: left - 12
      });

      // showing the popup is the responsibility of event handler
      events.on_cell_doubleclick(
        $cell.get(0),
        $editPopup,
        rowIndex,
        colIndex
      );
    });

    $(document.body).on('click', e => {
      if ($(e.target).is('.edit-popup, .edit-popup *')) return;
      $editPopup.hide();
    });
  }

  bindResizeColumn() {
    const self = this;
    let isDragging = false;
    let $currCell, startWidth, startX;

    this.header.on('mousedown', '.data-table-col', function (e) {
      $currCell = $(this);
      const col = self.getColumn($currCell.attr('data-col-index'));

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
        const width = $currCell.find('.content').css('width');

        self.setColumnWidth(colIndex, width);
        self.setBodyWidth();
        $currCell = null;
      }
    });

    $('body').on('mousemove', function (e) {
      if (!isDragging) return;
      const finalWidth = startWidth + (e.pageX - startX);

      self.setColumnHeaderWidth($currCell, finalWidth);
    });
  }

  bindSortColumn() {
    const self = this;

    this.header.on('click', '.data-table-col .content span', function () {
      const $cell = $(this).closest('.data-table-col');
      const sortBy = $cell.attr('data-sort-by');
      const colIndex = $cell.attr('data-col-index');

      if (sortBy === 'none') {
        $cell.attr('data-sort-by', 'asc');
        $cell
          .find('.content')
          .append('<span class="octicon octicon-chevron-up">');
      } else if (sortBy === 'asc') {
        $cell.attr('data-sort-by', 'desc');
        $cell
          .find('.content .octicon')
          .removeClass('octicon-chevron-up')
          .addClass('octicon-chevron-down');
      } else if (sortBy === 'desc') {
        $cell.attr('data-sort-by', 'none');
        $cell.find('.content .octicon').remove();
      }

      const sortByAction = $cell.attr('data-sort-by');

      if (self.events.on_sort) {
        self.events.on_sort.apply(null, [colIndex, sortByAction]);
      } else {
        self.sortRows(colIndex, sortByAction);
        self.refreshRows();
      }
    });
  }

  sortRows(colIndex, sortBy = 'none') {
    this.data.rows.sort((a, b) => {
      const _aIndex = a[0].rowIndex;
      const _bIndex = b[0].rowIndex;
      const _a = a[colIndex].content;
      const _b = b[colIndex].content;

      if (sortBy === 'none') {
        return _aIndex - _bIndex;
      } else if (sortBy === 'asc') {
        if (_a < _b) return -1;
        if (_a > _b) return 1;
        if (_a === _b) return 0;
      } else if (sortBy === 'desc') {
        if (_a < _b) return 1;
        if (_a > _b) return -1;
        if (_a === _b) return 0;
      }
      return 0;
    });
  }

  setColumnWidth(colIndex, width, header = false) {
    const selector = `.data-table-col[data-col-index="${colIndex}"] .content`;
    let $el;

    if (header) {
      $el = this.header.find(selector);
    } else {
      $el = this.bodyScrollable.find(selector);
    }
    $el.css('width', width);
  }

  setColumnHeaderWidth(colIndex, width) {
    let $cell;

    if (typeof colIndex === 'number') {
      $cell = this.getColumnHeaderElement(colIndex);
    } else {
      // directly element is passed
      $cell = colIndex;
    }

    $cell.find('.content').width(width);
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

      if (this.addSerialNoColumn && col.colIndex === 0) {
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

  getColumn(colIndex) {
    return this.data.columns.find(col => col.colIndex === colIndex);
  }

  getRow(rowIndex) {
    return this.data.rows.find(row => row[0].rowIndex === rowIndex);
  }

  getColumnHeaderElement(colIndex) {
    if (colIndex < 0) return null;
    return this.wrapper.find(
      `.data-table-col[data-is-header][data-col-index="${colIndex}"]`
    );
  }
}

