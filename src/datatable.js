import {
  getBodyHTML,
  getRowHTML
} from './utils';

import $ from './dom';

import DataManager from './datamanager';
import CellManager from './cellmanager';
import ColumnManager from './columnmanager';
import RowManager from './rowmanager';
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
  takeAvailableSpace: true
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

    this.prepare();

    this.style = new Style(this.wrapper);
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
        <div class="data-table-footer">
        </div>
        <div class="data-table-borders">
          <div class="border-outline"></div>
          <div class="border-background"></div>
        </div>
      </div>
    `;

    this.datatableWrapper = $('.data-table', this.wrapper);
    this.header = $('.data-table-header', this.wrapper);
    this.bodyScrollable = $('.body-scrollable', this.wrapper);
  }

  refresh(data) {
    this.datamanager.init(data);
    this.render();
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

  getColumnHeaderElement(colIndex) {
    return this.columnmanager.getColumnHeaderElement(colIndex);
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

