import $ from './dom';
import Clusterize from 'clusterize.js';
import { getRowHTML } from './rowmanager';
import { promisify } from './utils';

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
      promises.push(this.appendNextPage(this.start, this.end));
      dataAppended += this.pageLength;
    }

    if (rowCount % this.pageLength > 0) {
      // last page
      this.start = this.end;
      this.end = this.start + this.pageLength;
      promises.push(this.appendNextPage(this.start, this.end));
    }

    return promises.reduce(
      (prev, cur) => prev.then(cur), Promise.resolve()
    );
  }

  appendNextPage(start, end) {
    const rows = this.datamanager.getRows(start, end);
    const data = this.getDataForClusterize(rows);

    this.clusterize.append(data);
    this.log('dataAppended', rows.length);
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
