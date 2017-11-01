/* globals $, Clusterize */
import {
  getHeaderHTML,
  getBodyHTML,
  getRowHTML,
  buildCSSRule,
  removeCSSRule,
  getDefault
} from './utils';

import DataManager from './datamanager';
import CellManager from './cellmanager';

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

    this.wrapper = $(wrapper);
    if (this.wrapper.length === 0) {
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
    if (this.wrapper.find('.data-table').length === 0) {
      this.makeDom();
      this.makeStyle();
      this.bindEvents();
    }
  }

  makeDom() {
    this.wrapper.html(`
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
    `);

    this.header = this.wrapper.find('.data-table-header');
    this.bodyScrollable = this.wrapper.find('.body-scrollable');
    // this.body = this.wrapper.find('.data-table-body');
    this.footer = this.wrapper.find('.data-table-footer');
    this.$borders = this.wrapper.find('.data-table-borders');
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

    this.header.html(getHeaderHTML(columns));
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

    this.bodyScrollable.html(`
      <table class="data-table-body table table-bordered">
        ${getBodyHTML(rows)}
      </table>
    `);
  }

  renderBodyWithClusterize() {
    const self = this;

    // empty body
    this.bodyScrollable.html(`
      <table class="data-table-body table table-bordered">
        ${getBodyHTML([])}
      </table>
    `);

    this.start = 0;
    this.pageLength = 1000;
    this.end = this.start + this.pageLength;

    // only append ${this.pageLength} rows in the beginning,
    // defer remaining
    const rows = this.datamanager.getRows(this.start, this.end);
    const initialData = this.getDataForClusterize(rows);

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
      this.header.css({
        width: 0
      });
    }

    this.header.css({
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
      let width = parseInt($cell.find('.content').css('width'), 10);
      const height = parseInt($cell.find('.content').css('height'), 10);
      const { colIndex } = self.getCellAttr($cell);
      const minWidth = self.getColumnMinWidth(colIndex);

      if (width < minWidth) {
        width = minWidth;
      }
      self.setColumnWidth(colIndex, width);
      self.setDefaultCellHeight(height);
    });

    this.setBodyWidth();

    this.setStyle('.data-table .body-scrollable', {
      'margin-top': this.header.height() + 'px'
    });

    // center align Sr. No column
    if (this.options.addSerialNoColumn) {
      const index = this.getSerialColumnIndex();

      this.setStyle(`.data-table [data-col-index="${index}"]`, {
        'text-align': 'center'
      });
    }

    this.bodyScrollable.find('.table').css('margin', 0);
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
      let sortOrder = getDefault($cell.attr('data-sort-order'), 'none');
      const colIndex = $cell.attr('data-col-index');
      const col = self.getColumn(colIndex);

      if (col && col.sortable === false) {
        return;
      }

      // reset sort indicator
      self.header.find('.sort-indicator').text('');
      self.header.find('.data-table-col').attr('data-sort-order', 'none');

      if (sortOrder === 'none') {
        $cell.attr('data-sort-order', 'asc');
        $cell.find('.sort-indicator').text('▲');
      } else if (sortOrder === 'asc') {
        $cell.attr('data-sort-order', 'desc');
        $cell.find('.sort-indicator').text('▼');
      } else if (sortOrder === 'desc') {
        $cell.attr('data-sort-order', 'none');
        $cell.find('.sort-indicator').text('');
      }

      // sortWith this action
      sortOrder = $cell.attr('data-sort-order');

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
    const self = this;

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
      .find(`.data-table-row[data-row-index="${rowIndex}"]`);

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

    const columns = this.datamanager.getColumns();
    const deltaWidth = (availableWidth - headerWidth) / this.datamanager.getColumnCount();

    columns.map(col => {
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
      parseInt(this.header.css('width'), 10)
    );
  }

  setStyle(rule, styleMap) {
    let styles = this.$style.text();

    styles = buildCSSRule(rule, styleMap, styles);
    this.$style.html(styles);
  }

  removeStyle(rule) {
    let styles = this.$style.text();

    styles = removeCSSRule(rule, styles);
    this.$style.html(styles);
  }

  makeStyle() {
    this.$style = $('<style data-id="datatable"></style>')
      .prependTo(this.wrapper);
  }

  getColumn(colIndex) {
    return this.datamanager.getColumn(colIndex);
  }

  getRow(rowIndex) {
    return this.datamanager.getRow(rowIndex);
  }

  getCell(rowIndex, colIndex) {
    return this.datamanager.getCell(rowIndex, colIndex);
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
    return this.datamanager.getRowCount();
  }

  getSerialColumnIndex() {
    const columns = this.datamanager.getColumns();

    return columns.findIndex(column => column.content.includes('Sr. No'));
  }

  log() {
    if (this.options.enableLogs) {
      console.log.apply(console, arguments);
    }
  }
}

