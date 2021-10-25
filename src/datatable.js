import $ from './dom';
import DataManager from './datamanager';
import CellManager from './cellmanager';
import ColumnManager from './columnmanager';
import RowManager from './rowmanager';
import BodyRenderer from './body-renderer';
import Style from './style';
import Keyboard from './keyboard';
import DEFAULT_OPTIONS from './defaults';

let defaultComponents = {
    DataManager,
    CellManager,
    ColumnManager,
    RowManager,
    BodyRenderer,
    Style,
    Keyboard
};

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
        this.initializeComponents();

        if (this.options.data) {
            this.refresh();
            this.columnmanager.applyDefaultSortOrder();
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

    initializeComponents() {
        let components = Object.assign({}, defaultComponents, this.options.overrideComponents);
        let {
            Style,
            Keyboard,
            DataManager,
            RowManager,
            ColumnManager,
            CellManager,
            BodyRenderer
        } = components;

        this.style = new Style(this);
        this.keyboard = new Keyboard(this.wrapper);
        this.datamanager = new DataManager(this.options);
        this.rowmanager = new RowManager(this);
        this.columnmanager = new ColumnManager(this);
        this.cellmanager = new CellManager(this);
        this.bodyRenderer = new BodyRenderer(this);
    }

    prepareDom() {
        this.wrapper.innerHTML = `
            <div class="datatable" dir="${this.options.direction}">
                <div class="dt-header"></div>
                <div class="dt-scrollable"></div>
                <div class="dt-footer"></div>
                <div class="dt-freeze">
                    <span class="dt-freeze__message">
                        ${this.options.freezeMessage}
                    </span>
                </div>
                <div class="dt-toast"></div>
                <div class="dt-dropdown-container"></div>
                <textarea class="dt-paste-target"></textarea>
            </div>
        `;

        this.datatableWrapper = $('.datatable', this.wrapper);
        this.header = $('.dt-header', this.wrapper);
        this.footer = $('.dt-footer', this.wrapper);
        this.bodyScrollable = $('.dt-scrollable', this.wrapper);
        this.freezeContainer = $('.dt-freeze', this.wrapper);
        this.toastMessage = $('.dt-toast', this.wrapper);
        this.pasteTarget = $('.dt-paste-target', this.wrapper);
        this.dropdownContainer = $('.dt-dropdown-container', this.wrapper);
    }

    refresh(data, columns) {
        this.datamanager.init(data, columns);
        this.render();
        this.setDimensions();
    }

    destroy() {
        this.wrapper.innerHTML = '';
        this.style.destroy();
        this.fireEvent('onDestroy');
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
        // fire internalEventHandlers if any
        // and then user events
        const handlers = [
            ...(this._internalEventHandlers[eventName] || []),
            this.events[eventName]
        ].filter(Boolean);

        for (let handler of handlers) {
            handler.apply(this, args);
        }
    }

    on(event, handler) {
        this._internalEventHandlers = this._internalEventHandlers || {};
        this._internalEventHandlers[event] = this._internalEventHandlers[event] || [];
        this._internalEventHandlers[event].push(handler);
    }

    log() {
        if (this.options.logs) {
            console.log.apply(console, arguments);
        }
    }
}

DataTable.instances = 0;

export default DataTable;
