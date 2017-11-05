import {
  getHeaderHTML,
  getBodyHTML,
  getRowHTML,
  getDefault
} from './utils';

import $ from './dom';

import DataManager from './datamanager';
import CellManager from './cellmanager';
import Style from './style';

import './style.scss';

const DEFAULT_OPTIONS = {
  events: null,
  data: {
    columns: [],
    rows: []
  },
  editing: null,
  addSerialNoColumn: true,
  addCheckboxColumn: true,
  enableClusterize: true,
  enableLogs: false,
  takeAvailableSpace: false
};

export default class DataTable {
  constructor(wrapper, options) {

    this.wrapper = wrapper;
    if (!this.wrapper) {
      throw new Error('Invalid argument given for `wrapper`');
    }

    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
    // custom user events
    this.events = this.options.events;
    // map of checked rows
    this.checkMap = [];

    // make dom, make style, bind events
    this.make();

    this.datamanager = new DataManager(this.options);
    this.cellmanager = new CellManager(this);

    if (this.options.data) {
      this.refresh(this.options.data);
    }
  }

  make() {
    this.makeDom();
    this.makeStyle();
    this.bindEvents();
  }

  makeDom() {
    this.wrapper.innerHTML = `
      <div class="data-table">
        <table class="data-table-header">
        </table>
        <div class="body-scrollable">
        </div>
        <div class="data-table-footer">
        </div>
        <div class="data-table-borders">
          <div class="border-outline"></div>
          <div class="border-background"></div>
        </div>
      </div>
    `;

    this.header = $('.data-table-header', this.wrapper);
    this.bodyScrollable = $('.body-scrollable', this.wrapper);
  }

  refresh(data) {
    this.datamanager.init(data);
    this.render();
  }

  appendRows(rows) {
    this.datamanager.appendRows(rows);
    this.render();
  }

  render() {
    this.renderHeader();
    this.renderBody();
    this.setDimensions();
  }

  renderHeader() {
    const columns = this.datamanager.getColumns();

    this.header.innerHTML = getHeaderHTML(columns);
  }

  renderBody() {
    if (this.options.enableClusterize) {
      this.renderBodyWithClusterize();
    } else {
      this.renderBodyHTML();
    }
  }

  renderBodyHTML() {
    const rows = this.datamanager.getRows();

    this.bodyScrollable.innerHTML = `
      <table class="data-table-body">
        ${getBodyHTML(rows)}
      </table>
    `;
  }

  renderBodyWithClusterize() {
    const self = this;

    // empty body
    this.bodyScrollable.innerHTML = `
      <table class="data-table-body">
        ${getBodyHTML([])}
      </table>
    `;

    this.start = 0;
    this.pageLength = 1000;
    this.end = this.start + this.pageLength;

    // only append ${this.pageLength} rows in the beginning,
    // defer remaining
    const rows = this.datamanager.getRows(this.start, this.end);
    const initialData = this.getDataForClusterize(rows);

    this.clusterize = new Clusterize({
      rows: initialData,
      scrollElem: this.bodyScrollable,
      contentElem: $('tbody', this.bodyScrollable),
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
    const rowCount = this.datamanager.getRowCount();

    while (dataAppended + this.pageLength < rowCount) {
      this.start = this.end;
      this.end = this.start + this.pageLength;
      promises.push(this.appendNextPagePromise(this.start, this.end));
      dataAppended += this.pageLength;
    }

    if (rowCount % this.pageLength > 0) {
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
        const rows = this.datamanager.getRows(start, end);
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

  refreshRows() {
    this.renderBody();
    this.setDimensions();
  }

  bindEvents() {
    this.bindResizeColumn();
    this.bindSortColumn();
    this.bindCheckbox();
  }

  setDimensions() {
    const self = this;

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

    // cache minWidth for each column
    this.minWidthMap = getDefault(this.minWidthMap, []);

    $.each('.data-table-col', this.header).map(col => {
      const width = $.style($('.content', col), 'width');
      const { colIndex } = $.data(col);

      if (!self.minWidthMap[colIndex]) {
        // only set this once
        self.minWidthMap[colIndex] = width;
      }
    });

    // set initial width as naturally calculated by table's first row
    $.each('.data-table-row[data-row-index="0"] .data-table-col', this.bodyScrollable).map($cell => {

      let width = $.style($('.content', $cell), 'width');
      const height = $.style($('.content', $cell), 'height');
      const { colIndex } = self.getCellAttr($cell);
      const minWidth = self.getColumnMinWidth(colIndex);

      if (width < minWidth) {
        width = minWidth;
      }
      self.setColumnWidth(colIndex, width);
      self.setDefaultCellHeight(height);
    });

    this.setBodyWidth();

    $.style(this.bodyScrollable, {
      marginTop: $.style(this.header, 'height') + 'px'
    });

    // center align Sr. No column
    if (this.options.addSerialNoColumn) {
      const index = this.getSerialColumnIndex();

      this.style.setStyle(`.data-table [data-col-index="${index}"]`, {
        'text-align': 'center'
      });
    }

    $.style($('table', this.bodyScrollable), {
      margin: 0
    });
  }

  bindResizeColumn() {
    const self = this;
    let isDragging = false;
    let $currCell, startWidth, startX;

    $.on(this.header, 'mousedown', '.data-table-col', (e, cell) => {
      $currCell = cell;
      const { colIndex } = this.getCellAttr($currCell);
      const col = self.getColumn(colIndex);

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

      const { colIndex } = this.getCellAttr($currCell);
      const width = $.style($('.content', $currCell), 'width');

      self.setColumnWidth(colIndex, width);
      self.setBodyWidth();
      $currCell = null;
    });

    $.on(document.body, 'mousemove', (e) => {
      if (!isDragging) return;
      const finalWidth = startWidth + (e.pageX - startX);
      const { colIndex } = this.getCellAttr($currCell);

      if (self.getColumnMinWidth(colIndex) > finalWidth) {
        // don't resize past minWidth
        return;
      }

      self.setColumnHeaderWidth(colIndex, finalWidth);
    });
  }

  bindSortColumn() {
    const self = this;

    $.on(this.header, 'click', '.data-table-col .content span', (e, span) => {
      const $cell = span.closest('.data-table-col');
      let { colIndex, sortOrder } = this.getCellAttr($cell);
      sortOrder = getDefault(sortOrder, 'none');
      const col = self.getColumn(colIndex);

      if (col && col.sortable === false) {
        return;
      }

      // reset sort indicator
      $('.sort-indicator', this.header).textContent = '';
      $.each('.data-table-col', this.header).map($cell => {
        $cell.setAttribute('data-sort-order', 'none');
      });

      if (sortOrder === 'none') {
        $cell.setAttribute('data-sort-order', 'asc');
        $('.sort-indicator', $cell).textContent = '▲';
      } else if (sortOrder === 'asc') {
        $cell.setAttribute('data-sort-order', 'desc');
        $('.sort-indicator', $cell).textContent = '▼';
      } else if (sortOrder === 'desc') {
        $cell.setAttribute('data-sort-order', 'none');
        $('.sort-indicator', $cell).textContent = '';
      }

      // sortWith this action
      sortOrder = $cell.getAttribute('data-sort-order');

      if (self.events && self.events.onSort) {
        self.events.onSort(colIndex, sortOrder);
      } else {
        self.sortRows(colIndex, sortOrder);
        self.refreshRows();
      }
    });
  }

  sortRows(colIndex, sortOrder) {
    this.datamanager.sortRows(colIndex, sortOrder);
  }

  bindCheckbox() {
    if (!this.options.addCheckboxColumn) return;

    $.on(this.wrapper, 'click', '.data-table-col[data-col-index="0"] [type="checkbox"]', (e, $checkbox) => {
      const $cell = $checkbox.closest('.data-table-col');
      const { rowIndex, isHeader } = this.getCellAttr($cell);
      const checked = $checkbox.checked;

      if (isHeader) {
        this.checkAll(checked);
      } else {
        this.checkRow(rowIndex, checked);
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
    $.each(`.data-table-col[data-row-index="${rowIndex}"][data-col-index="0"] [type="checkbox"]`, this.bodyScrollable)
      .map(input => {
        input.checked = toggle;
      });
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
    $.each('.data-table-col[data-col-index="0"] [type="checkbox"]', this.bodyScrollable)
      .map(input => {
        input.checked = toggle;
      });
    // highlight all
    this.highlightAll(toggle);
  }

  highlightRow(rowIndex, toggle = true) {
    const $row = $(`.data-table-row[data-row-index="${rowIndex}"]`, this.bodyScrollable);

    if (toggle) {
      $row.classList.add('row-highlight');
    } else {
      $row.classList.remove('row-highlight');
    }
  }

  highlightAll(toggle = true) {
    if (toggle) {
      this.bodyScrollable.classList.add('row-highlight-all');
    } else {
      this.bodyScrollable.classList.remove('row-highlight-all');
    }
  }

  setColumnWidth(colIndex, width) {
    // set width for content
    this.style.setStyle(`[data-col-index="${colIndex}"] .content`, {
      width: width + 'px'
    });
    // set width for edit cell
    this.style.setStyle(`[data-col-index="${colIndex}"] .edit-cell`, {
      width: width + 'px'
    });
  }

  setColumnHeaderWidth(colIndex, width) {
    this.style.setStyle(`[data-col-index="${colIndex}"][data-is-header] .content`, {
      width: width + 'px'
    });
  }

  setDefaultCellHeight(height) {
    this.style.setStyle('.data-table-col .content', {
      height: height + 'px'
    });
  }

  setRowHeight(rowIndex, height) {
    this.style.setStyle(`[data-row-index="${rowIndex}"] .content`, {
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

    const columns = this.datamanager.getColumns();
    const deltaWidth = (availableWidth - headerWidth) / this.datamanager.getColumnCount();

    columns.map(col => {
      const width = $.style(this.getColumnHeaderElement(col.colIndex), 'width');
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
    const width = $.style(this.header, 'width');

    $.style(this.bodyScrollable, { width });
  }

  makeStyle() {
    this.style = new Style(this.wrapper);
  }

  getColumn(colIndex) {
    return this.datamanager.getColumn(colIndex);
  }

  getRow(rowIndex) {
    return this.datamanager.getRow(rowIndex);
  }

  getCell(colIndex, rowIndex) {
    return this.datamanager.getCell(colIndex, rowIndex);
  }

  getColumnHeaderElement(colIndex) {
    colIndex = +colIndex;
    if (colIndex < 0) return null;
    return $(`.data-table-col[data-is-header][data-col-index="${colIndex}"]`, this.wrapper);
  }

  getColumnMinWidth(colIndex) {
    colIndex = +colIndex;
    return this.minWidthMap && this.minWidthMap[colIndex];
  }

  getCellAttr($cell) {
    return $.data($cell);
  }

  getTotalRows() {
    return this.datamanager.getRowCount();
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

  getLastRowIndex() {
    return this.datamanager.getRowCount() - 1;
  }

  getSerialColumnIndex() {
    const columns = this.datamanager.getColumns();

    return columns.findIndex(column => column.content.includes('Sr. No'));
  }

  getViewportHeight() {
    if (!this.viewportHeight) {
      this.viewportHeight = $.style(this.bodyScrollable, 'height');
    }

    return this.viewportHeight;
  }

  log() {
    if (this.options.enableLogs) {
      console.log.apply(console, arguments);
    }
  }
}

