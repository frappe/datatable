import $ from './dom';
import Clusterize from 'clusterize.js';
import DataManager from './datamanager';
import CellManager from './cellmanager';
import ColumnManager from './columnmanager';
import RowManager from './rowmanager';
import Style from './style';

import { getRowHTML } from './rowmanager';

import './style.scss';

const DEFAULT_OPTIONS = {
  data: {
    columns: [],
    rows: []
  },
  dropdownButton: '▼',
  headerDropdown: [
    {
      label: 'Sort Ascending',
      action: function (column) {
        this.sortColumn(column.colIndex, 'asc');
      }
    },
    {
      label: 'Sort Descending',
      action: function (column) {
        this.sortColumn(column.colIndex, 'desc');
      }
    },
    {
      label: 'Reset sorting',
      action: function (column) {
        this.sortColumn(column.colIndex, 'none');
      }
    },
    {
      label: 'Remove column',
      action: function (column) {
        this.removeColumn(column.colIndex);
      }
    }
  ],
  events: {
    onRemoveColumn(column) {},
    onSwitchColumn(column1, column2) {},
    onSortColumn(column) {}
  },
  sortIndicator: {
    asc: '↑',
    desc: '↓',
    none: ''
  },
  freezeMessage: 'Loading...',
  editing: null,
  addSerialNoColumn: true,
  addCheckboxColumn: true,
  enableClusterize: true,
  enableLogs: false,
  takeAvailableSpace: false
};

class DataTable {
  constructor(wrapper, options) {
    DataTable.instances++;

    if (typeof wrapper === 'string') {
      // css selector
      wrapper = document.querySelector(wrapper);
    }
    this.wrapper = wrapper;
    if (!this.wrapper) {
      throw new Error('Invalid argument given for `wrapper`');
    }

    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
    this.options.headerDropdown =
      DEFAULT_OPTIONS.headerDropdown
        .concat(options.headerDropdown || []);
    // custom user events
    this.events = Object.assign(
      {}, DEFAULT_OPTIONS.events, options.events || {}
    );
    this.fireEvent = this.fireEvent.bind(this);

    this.prepare();

    this.style = new Style(this);
    this.datamanager = new DataManager(this.options);
    this.rowmanager = new RowManager(this);
    this.columnmanager = new ColumnManager(this);
    this.cellmanager = new CellManager(this);

    if (this.options.data) {
      this.refresh(this.options.data);
    }
  }

  prepare() {
    this.prepareDom();
  }

  prepareDom() {
    this.wrapper.innerHTML = `
      <div class="data-table">
        <table class="data-table-header">
        </table>
        <div class="body-scrollable">
        </div>
        <div class="freeze-container">
          <span>${this.options.freezeMessage}</span>
        </div>
        <div class="data-table-footer">
        </div>
      </div>
    `;

    this.datatableWrapper = $('.data-table', this.wrapper);
    this.header = $('.data-table-header', this.wrapper);
    this.bodyScrollable = $('.body-scrollable', this.wrapper);
    this.freezeContainer = $('.freeze-container', this.wrapper);
    this.unfreeze();
  }

  refresh(data) {
    this.datamanager.init(data);
    this.render();
  }

  destroy() {
    this.wrapper.innerHTML = '';
    this.style.destroy();
  }

  appendRows(rows) {
    this.datamanager.appendRows(rows);
    this.rowmanager.refreshRows();
  }

  render() {
    this.renderHeader();
    this.renderBody();
    this.setDimensions();
  }

  renderHeader() {
    this.columnmanager.renderHeader();
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
        clusterChanged: () => {
          this.rowmanager.highlightCheckedRows();
          this.cellmanager.selectAreaOnClusterChanged();
          this.cellmanager.focusCellOnClusterChanged();
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

  setDimensions() {
    this.columnmanager.setDimensions();

    this.setBodyWidth();

    $.style(this.bodyScrollable, {
      marginTop: $.style(this.header, 'height') + 'px'
    });

    $.style($('table', this.bodyScrollable), {
      margin: 0
    });
  }

  setBodyWidth() {
    const width = $.style(this.header, 'width');

    $.style(this.bodyScrollable, { width: width + 'px' });
  }

  getColumn(colIndex) {
    return this.datamanager.getColumn(colIndex);
  }

  getCell(colIndex, rowIndex) {
    return this.datamanager.getCell(colIndex, rowIndex);
  }

  getColumnHeaderElement(colIndex) {
    return this.columnmanager.getColumnHeaderElement(colIndex);
  }

  getViewportHeight() {
    if (!this.viewportHeight) {
      this.viewportHeight = $.style(this.bodyScrollable, 'height');
    }

    return this.viewportHeight;
  }

  sortColumn(colIndex, sortOrder) {
    this.columnmanager.sortColumn(colIndex, sortOrder);
  }

  removeColumn(colIndex) {
    this.columnmanager.removeColumn(colIndex);
  }

  scrollToLastColumn() {
    this.datatableWrapper.scrollLeft = 9999;
  }

  freeze() {
    $.style(this.freezeContainer, {
      display: ''
    });
  }

  unfreeze() {
    $.style(this.freezeContainer, {
      display: 'none'
    });
  }

  fireEvent(eventName, ...args) {
    this.events[eventName].apply(this, args);
  }

  log() {
    if (this.options.enableLogs) {
      console.log.apply(console, arguments);
    }
  }
}

DataTable.instances = 0;

export default DataTable;

export function getBodyHTML(rows) {
  return `
    <tbody>
      ${rows.map(row => getRowHTML(row, { rowIndex: row[0].rowIndex })).join('')}
    </tbody>
  `;
}
