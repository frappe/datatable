import { getHeader, getBody, getCell } from './utils.js';
import $ from 'jQuery';

export default class ReGrid {
  constructor({ wrapper, events }) {
    this.wrapper = wrapper;
    this.events = events || {};
    this.makeDom();
    this.bindEvents();
  }

  makeDom() {
    this.wrapper.html(`
      <div class="data-table">
        <table class="data-table-header table table-bordered">
        </table>
        <div class="body-scrollable">
          <table class="data-table-body table table-bordered">
          </table>
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
    this.body = this.wrapper.find('.data-table-body');
    this.footer = this.wrapper.find('.data-table-footer');
  }

  render({ columns, rows }) {
    if (this.wrapper.find('.data-table').length === 0) {
      this.makeDom();
      this.bindEvents();
    }

    this.columns = this.prepareColumns(columns);
    this.rows = this.prepareRows(rows);

    this.header.html(getHeader(this.columns));
    this.body.html(getBody(this.rows));

    this.setDimensions();
  }

  updateCell(rowIndex, colIndex, value) {
    const row = this.getRow(rowIndex);
    const cell = row.find(cell => cell.col_index === colIndex);

    cell.data = value;
    this.refreshCell(cell);
  }

  refreshRows(rows) {
    if (rows) {
      this.rows = this.prepareRows(rows);
    }
    this.body.html(getBody(this.rows));
    this.setDimensions();
  }

  refreshCell(cell) {
    const selector = `.data-table-col[data-row-index="${cell.row_index}"][data-col-index="${cell.col_index}"]`;
    const $cell = this.body.find(selector);
    const $newCell = $(getCell(cell));

    $cell.replaceWith($newCell);
  }

  prepareColumns(columns) {
    return columns.map((col, i) => {
      col.colIndex = i;
      col.isHeader = 1;
      col.format = val => `<span>${val}</span>`;
      return col;
    });
  }

  prepareRows(rows) {
    return rows.map((cells, i) => {
      return cells.map((cell, j) => {
        cell.colIndex = j;
        cell.rowIndex = i;
        return cell;
      });
    });
  }

  bindEvents() {
    const me = this;

    this.bodyScrollable.on('click', '.data-table-col', function () {
      const $col = $(this);

      me.bodyScrollable.find('.data-table-col').removeClass('selected');
      $col.addClass('selected');
    });

    this.bindCellDoubleClick();
    this.bindResizeColumn();
    this.bindSortColumn();
  }

  setDimensions() {
    const me = this;

    // set the width for each cell
    this.header.find('.data-table-col').each(function () {
      const col = $(this);
      const height = col.find('.content').height();
      const width = col.find('.content').width();
      const colIndex = col.attr('data-col-index');
      const selector = `.data-table-col[data-col-index="${colIndex}"] .content`;
      const $cell = me.bodyScrollable.find(selector);

      $cell.width(width);
      $cell.height(height);
    });

    // setting width as 0 will ensure that the
    // header doesn't take the available space
    this.header.css({
      width: 0,
      margin: 0
    });

    this.bodyScrollable.css({
      width: this.header.css('width'),
      marginTop: this.header.height() + 1
    });

    this.bodyScrollable.find('.table').css('margin', 0);
  }

  bindCellDoubleClick() {
    const { events } = this;

    const $editPopup = this.wrapper.find('.edit-popup');

    $editPopup.hide();

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
    const me = this;
    let isDragging = false;
    let $currCell, startWidth, startX;

    this.header.on('mousedown', '.data-table-col', function (e) {
      $currCell = $(this);
      const col = me.getColumn($currCell.attr('data-col-index'));

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

        me.setColumnWidth(colIndex, width);
        me.bodyScrollable.css('width', me.header.css('width'));
        $currCell = null;
      }
    });

    this.header.on('mousemove', '.data-table-col', function (e) {
      if (!isDragging) return;
      const fwidth = startWidth + (e.pageX - startX);

      $currCell.find('.content').width(fwidth);
    });
  }

  bindSortColumn() {
    const me = this;

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

      if (me.events.on_sort) {
        me.events.on_sort.apply(null, [colIndex, sortByAction]);
      } else {
        me.sortRows(colIndex, sortByAction);
        me.refreshRows();
      }
    });
  }

  sortRows(colIndex, sortBy = 'none') {
    this.rows.sort((a, b) => {
      const _aIndex = a[0].row_index;
      const _bIndex = b[0].row_index;
      const _a = a[colIndex].data;
      const _b = b[colIndex].data;

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

  getColumn(colIndex) {
    return this.columns.find(col => col.col_index === colIndex);
  }

  getRow(rowIndex) {
    return this.rows.find(row => row[0].row_index === rowIndex);
  }
}

