import $ from './dom';
import Clusterize from 'clusterize.js';
import { getRowHTML } from './rowmanager';
import { promisify, chainPromises } from './utils';

export default class BodyRenderer {
  constructor(instance) {
    this.instance = instance;
    this.options = instance.options;
    this.datamanager = instance.datamanager;
    this.rowmanager = instance.rowmanager;
    this.cellmanager = instance.cellmanager;
    this.bodyScrollable = instance.bodyScrollable;
    this.log = instance.log;
    this.appendNextPage = promisify(this.appendNextPage, this);
  }

  render() {
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

    // Rows will be appended as promises, so we don't block
    // even for the first page render
    this.clusterize = new Clusterize({
      rows: [],
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
    this.appendRemainingData();
    // setDimensions will work only if there is atleast one row appended
    // so we call it as soon as the first Page is appended
    this.firstPagePromise.then(() => this.instance.setDimensions());
  }

  appendRemainingData() {
    const chunkSize = 1000;
    let start = 0, end = chunkSize;
    let dataAppended = 0;
    this.firstPagePromise = null;

    const promises = [];
    const rowCount = this.datamanager.getRowCount();

    while (dataAppended + chunkSize < rowCount) {
      const promise = this.appendNextPage(start, end);
      if (!this.firstPagePromise) this.firstPagePromise = promise;
      promises.push(promise);
      dataAppended += chunkSize;
      start = end;
      end += chunkSize;
    }

    if (rowCount % chunkSize > 0) {
      // last page
      const promise = this.appendNextPage(start, end);
      if (!this.firstPagePromise) this.firstPagePromise = promise;
      promises.push(promise);
      dataAppended += rowCount % chunkSize;
    }

    return chainPromises(promises);
  }

  // promisified
  appendNextPage(start, end) {
    const rows = this.datamanager.getRows(start, end);
    const data = this.getDataForClusterize(rows);

    this.clusterize.append(data);
  }

  getDataForClusterize(rows) {
    return rows.map((row) => getRowHTML(row, { rowIndex: row[0].rowIndex }));
  }
};

export function getBodyHTML(rows) {
  return `
    <tbody>
      ${rows.map(row => getRowHTML(row, { rowIndex: row[0].rowIndex })).join('')}
    </tbody>
  `;
}
