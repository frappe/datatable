import $ from './dom';
import DataManager from './datamanager';
import CellManager from './cellmanager';
import ColumnManager from './columnmanager';
import RowManager from './rowmanager';
import BodyRenderer from './body-renderer';
import Style from './style';
import DEFAULT_OPTIONS from './defaults';
import './style.scss';

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
    this.bodyRenderer = new BodyRenderer(this);

    if (this.options.data) {
      this.refresh(this.options.data);
    }
  }

  prepare() {
    this.prepareDom();
    this.unfreeze();
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

  refreshRow(row, rowIndex) {
    this.rowmanager.refreshRow(row, rowIndex);
  }

  render() {
    this.renderHeader();
    this.renderBody();
  }

  renderHeader() {
    this.columnmanager.renderHeader();
  }

  renderBody() {
    this.bodyRenderer.render();
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
