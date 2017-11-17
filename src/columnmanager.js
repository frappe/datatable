import $ from './dom';
import { getRowHTML } from './rowmanager';
import { getDefault } from './utils';

export default class ColumnManager {
  constructor(instance) {
    this.instance = instance;
    this.options = this.instance.options;
    this.header = this.instance.header;
    this.datamanager = this.instance.datamanager;
    this.style = this.instance.style;
    this.wrapper = this.instance.wrapper;
    this.rowmanager = this.instance.rowmanager;

    this.bindEvents();
  }

  renderHeader() {
    const columns = this.datamanager.getColumns();

    this.header.innerHTML = `
      <thead>
        ${getRowHTML(columns, { isHeader: 1 })}
      </thead>
    `;
  }

  bindEvents() {
    this.bindResizeColumn();
    this.bindSortColumn();
  }

  bindResizeColumn() {
    let isDragging = false;
    let $currCell, startWidth, startX;

    $.on(this.header, 'mousedown', '.data-table-col', (e, $cell) => {
      $currCell = $cell;
      const { colIndex } = $.data($currCell);
      const col = this.getColumn(colIndex);

      if (col && col.resizable === false) {
        return;
      }

      isDragging = true;
      startWidth = $.style($('.content', $currCell), 'width');
      startX = e.pageX;
    });

    $.on(document.body, 'mouseup', (e) => {
      if (!$currCell) return;
      isDragging = false;

      const { colIndex } = $.data($currCell);
      const width = $.style($('.content', $currCell), 'width');

      this.setColumnWidth(colIndex, width);
      this.instance.setBodyWidth();
      $currCell = null;
    });

    $.on(document.body, 'mousemove', (e) => {
      if (!isDragging) return;
      const finalWidth = startWidth + (e.pageX - startX);
      const { colIndex } = $.data($currCell);

      if (this.getColumnMinWidth(colIndex) > finalWidth) {
        // don't resize past minWidth
        return;
      }

      this.setColumnHeaderWidth(colIndex, finalWidth);
    });
  }

  bindSortColumn() {

    $.on(this.header, 'click', '.data-table-col .content span', (e, span) => {
      const $cell = span.closest('.data-table-col');
      let { colIndex, sortOrder } = $.data($cell);
      sortOrder = getDefault(sortOrder, 'none');
      const col = this.getColumn(colIndex);

      if (col && col.sortable === false) {
        return;
      }

      // reset sort indicator
      $('.sort-indicator', this.header).textContent = '';
      $.each('.data-table-col', this.header).map($cell => {
        $.data($cell, {
          sortOrder: 'none'
        });
      });

      let nextSortOrder, textContent;
      if (sortOrder === 'none') {
        nextSortOrder = 'asc';
        textContent = '▲';
      } else if (sortOrder === 'asc') {
        nextSortOrder = 'desc';
        textContent = '▼';
      } else if (sortOrder === 'desc') {
        nextSortOrder = 'none';
        textContent = '';
      }

      $.data($cell, {
        sortOrder: nextSortOrder
      });
      $('.sort-indicator', $cell).textContent = textContent;

      if (this.events && this.events.onSort) {
        this.events.onSort(colIndex, nextSortOrder);
      } else {
        this.sortRows(colIndex, nextSortOrder);
        this.rowmanager.refreshRows();
      }
    });
  }

  setDimensions() {
    this.setHeaderStyle();
    this.setupMinWidth();
    this.setNaturalColumnWidth();
    this.distributeRemainingWidth();
    this.setColumnAlignments();
  }

  setHeaderStyle() {
    if (!this.options.takeAvailableSpace) {
      // setting width as 0 will ensure that the
      // header doesn't take the available space
      $.style(this.header, {
        width: 0
      });
    }

    $.style(this.header, {
      margin: 0
    });
  }

  setupMinWidth() {
    // cache minWidth for each column
    this.minWidthMap = getDefault(this.minWidthMap, []);

    $.each('.data-table-col', this.header).map(col => {
      const width = $.style($('.content', col), 'width');
      const { colIndex } = $.data(col);

      if (!this.minWidthMap[colIndex]) {
        // only set this once
        this.minWidthMap[colIndex] = width;
      }
    });
  }

  setNaturalColumnWidth() {
    // set initial width as naturally calculated by table's first row
    $.each('.data-table-row[data-row-index="0"] .data-table-col', this.bodyScrollable).map($cell => {

      let width = $.style($('.content', $cell), 'width');
      const height = $.style($('.content', $cell), 'height');
      const { colIndex } = $.data($cell);
      const minWidth = this.getColumnMinWidth(colIndex);

      if (width < minWidth) {
        width = minWidth;
      }
      this.setColumnWidth(colIndex, width);
      this.setDefaultCellHeight(height);
    });
  }

  distributeRemainingWidth() {
    if (!this.options.takeAvailableSpace) return;

    const wrapperWidth = $.style(this.instance.datatableWrapper, 'width');
    const headerWidth = $.style(this.header, 'width');

    if (headerWidth >= wrapperWidth) {
      // don't resize, horizontal scroll takes place
      return;
    }

    const deltaWidth = (wrapperWidth - headerWidth) / this.datamanager.getColumnCount(true);

    this.datamanager.getColumns(true).map(col => {
      const width = $.style(this.getColumnHeaderElement(col.colIndex), 'width');
      let finalWidth = Math.min(width + deltaWidth) - 2;

      this.setColumnHeaderWidth(col.colIndex, finalWidth);
      this.setColumnWidth(col.colIndex, finalWidth);
    });
    this.instance.setBodyWidth();
  }

  setDefaultCellHeight(height) {
    this.style.setStyle('.data-table-col .content', {
      height: height + 'px'
    });
  }

  setColumnAlignments() {
    // align columns
    this.getColumns()
      .map(column => {
        if (['left', 'center', 'right'].includes(column.align)) {
          this.style.setStyle(`.data-table [data-col-index="${column.colIndex}"]`, {
            'text-align': column.align
          });
        }
      });
  }

  sortRows(colIndex, sortOrder) {
    this.datamanager.sortRows(colIndex, sortOrder);
  }

  getColumn(colIndex) {
    return this.datamanager.getColumn(colIndex);
  }

  getColumns() {
    return this.datamanager.getColumns();
  }

  setColumnWidth(colIndex, width) {
    this._columnWidthMap = this._columnWidthMap || [];

    let index = this._columnWidthMap[colIndex];
    const selector = `[data-col-index="${colIndex}"] .content, [data-col-index="${colIndex}"] .edit-cell`;
    const styles = {
      width: width + 'px'
    };

    index = this.style.setStyle(selector, styles, index);
    this._columnWidthMap[colIndex] = index;
  }

  setColumnHeaderWidth(colIndex, width) {
    this.$columnMap = this.$columnMap || [];
    const selector = `[data-col-index="${colIndex}"][data-is-header] .content`;

    let $column = this.$columnMap[colIndex];
    if (!$column) {
      $column = this.header.querySelector(selector);
      this.$columnMap[colIndex] = $column;
    }

    $column.style.width = width + 'px';
  }

  getColumnMinWidth(colIndex) {
    colIndex = +colIndex;
    return this.minWidthMap && this.minWidthMap[colIndex];
  }

  getFirstColumnIndex() {
    if (this.options.addCheckboxColumn && this.options.addSerialNoColumn) {
      return 2;
    }

    if (this.options.addCheckboxColumn || this.options.addSerialNoColumn) {
      return 1;
    }

    return 0;
  }

  getLastColumnIndex() {
    return this.datamanager.getColumnCount() - 1;
  }

  getColumnHeaderElement(colIndex) {
    colIndex = +colIndex;
    if (colIndex < 0) return null;
    return $(`.data-table-col[data-is-header][data-col-index="${colIndex}"]`, this.wrapper);
  }

  getSerialColumnIndex() {
    const columns = this.datamanager.getColumns();

    return columns.findIndex(column => column.content.includes('Sr. No'));
  }
}
