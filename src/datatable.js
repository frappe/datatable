import $ from './dom';
import DataManager from './datamanager';
import CellManager from './cellmanager';
import ColumnManager from './columnmanager';
import RowManager from './rowmanager';
import BodyRenderer from './body-renderer';
import Style from './style';
import Keyboard from './keyboard';
import DEFAULT_OPTIONS from './defaults';

class DataTable {
    constructor(wrapper, options) {
        DataTable.instances++;

        if (typeof wrapper === 'string') {
            // css selector
            wrapper = document.querySelector(wrapper);
        }
        this.wrapper = wrapper;
        if (!(this.wrapper instanceof HTMLElement)) {
            throw new Error('Invalid argument given for `wrapper`');
        }

        this.buildOptions(options);
        this.prepare();

        this.style = new Style(this);
        this.keyboard = new Keyboard(this.wrapper);
        this.datamanager = new DataManager(this.options);
        this.rowmanager = new RowManager(this);
        this.columnmanager = new ColumnManager(this);
        this.cellmanager = new CellManager(this);
        this.bodyRenderer = new BodyRenderer(this);

        if (this.options.data) {
            this.refresh();
        }
    }

    buildOptions(options) {
        this.options = this.options || {};

        this.options = Object.assign(
            {}, DEFAULT_OPTIONS,
            this.options || {}, options
        );

        options.headerDropdown = options.headerDropdown || [];
        this.options.headerDropdown = [
            ...DEFAULT_OPTIONS.headerDropdown,
            ...options.headerDropdown
        ];

        // custom user events
        this.events = Object.assign(
            {}, DEFAULT_OPTIONS.events,
            this.options.events || {},
            options.events || {}
        );
        this.fireEvent = this.fireEvent.bind(this);
    }

    prepare() {
        this.prepareDom();
        this.unfreeze();
    }

    prepareDom() {
        this.wrapper.innerHTML = `
            <div class="datatable">
                <div class="datatable-main">
                    <table class="dt-header">
                    </table>
                    <div class="dt-scrollable">
                    </div>
                </div>
                <div class="datatable-left">
                    <table class="dt-header">
                    </table>
                    <div class="dt-scrollable">
                    </div>
                </div>
                <div class="dt-freeze">
                    <span class="dt-freeze__message">
                        ${this.options.freezeMessage}
                    </span>
                </div>
                <div class="dt-toast"></div>
                <textarea class="dt-paste-target"></textarea>
            </div>
        `;

        this.datatableWrapper = $('.datatable', this.wrapper);
        this.datatableWrapperLeft = $('.datatable-left', this.wrapper);
        this.header = $('.dt-header', this.datatableWrapper);
        this.bodyScrollable = $('.dt-scrollable', this.datatableWrapper);
        this.freezeContainer = $('.dt-freeze', this.datatableWrapper);
        this.toastMessage = $('.dt-toast', this.datatableWrapper);
        this.pasteTarget = $('.dt-paste-target', this.datatableWrapper);
    }

    refresh(data, columns) {
        this.datamanager.init(data, columns);
        this.render();
        this.setDimensions();
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
        this.style.setDimensions();
    }

    showToastMessage(message, hideAfter) {
        this.bodyRenderer.showToastMessage(message, hideAfter);
    }

    clearToastMessage() {
        this.bodyRenderer.clearToastMessage();
    }

    getColumn(colIndex) {
        return this.datamanager.getColumn(colIndex);
    }

    getColumns() {
        return this.datamanager.getColumns();
    }

    getRows() {
        return this.datamanager.getRows();
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

    updateOptions(options) {
        this.buildOptions(options);
    }

    fireEvent(eventName, ...args) {
        this.events[eventName].apply(this, args);
    }

    log() {
        if (this.options.logs) {
            console.log.apply(console, arguments);
        }
    }
}

DataTable.instances = 0;

export default DataTable;
