import Clusterize from 'clusterize.js';
import $ from './dom';
import { nextTick } from './utils';

export default class BodyRenderer {
    constructor(instance) {
        this.instance = instance;
        this.options = instance.options;
        this.datamanager = instance.datamanager;
        this.rowmanager = instance.rowmanager;
        this.cellmanager = instance.cellmanager;
        this.bodyScrollable = instance.bodyScrollable;
        this.log = instance.log;
        this.appendRemainingData = nextTick(this.appendRemainingData, this);
    }

    render() {
        if (this.options.clusterize) {
            this.renderBodyWithClusterize();
        } else {
            this.renderBodyHTML();
        }
    }

    renderBodyHTML() {
        const rows = this.datamanager.getRowsForView();

        this.bodyScrollable.innerHTML = this.getBodyHTML(rows);
        this.instance.setDimensions();
        this.restoreState();
    }

    renderBodyWithClusterize() {
        // first page
        const rows = this.datamanager.getRowsForView(0, 20);
        let initialData = this.getDataForClusterize(rows);

        if (initialData.length === 0) {
            initialData = [this.getNoDataHTML()];
        }

        if (!this.clusterize) {
            // empty body
            this.bodyScrollable.innerHTML = this.getBodyHTML([]);

            // first 20 rows will appended
            // rest of them in nextTick
            this.clusterize = new Clusterize({
                rows: initialData,
                scrollElem: this.bodyScrollable,
                contentElem: $('tbody', this.bodyScrollable),
                callbacks: {
                    clusterChanged: () => this.restoreState()
                },
                /* eslint-disable */
                show_no_data_row: false,
                /* eslint-enable */
            });

            // setDimensions requires atleast 1 row to exist in dom
            this.instance.setDimensions();
        } else {
            this.clusterize.update(initialData);
        }

        this.appendRemainingData();
    }

    restoreState() {
        this.rowmanager.highlightCheckedRows();
        this.cellmanager.selectAreaOnClusterChanged();
        this.cellmanager.focusCellOnClusterChanged();
    }

    appendRemainingData() {
        const rows = this.datamanager.getRowsForView(20);
        const data = this.getDataForClusterize(rows);
        this.clusterize.append(data);
    }

    showToastMessage(message, hideAfter) {
        this.instance.toastMessage.innerHTML = this.getToastMessageHTML(message);

        if (hideAfter) {
            setTimeout(() => {
                this.clearToastMessage();
            }, hideAfter * 1000);
        }
    }

    clearToastMessage() {
        this.instance.toastMessage.innerHTML = '';
    }

    getDataForClusterize(rows) {
        return rows.map(row => this.rowmanager.getRowHTML(row, row.meta));
    }

    getBodyHTML(rows) {
        return `
            <table class="dt-body">
                <tbody>
                    ${rows.map(row => this.rowmanager.getRowHTML(row, row.meta)).join('')}
                </tbody>
            </table>
        `;
    }

    getNoDataHTML() {
        return `<div class="dt-scrollable__no-data">${this.options.noDataMessage}</div>`;
    }

    getToastMessageHTML(message) {
        return `<span class="dt-toast__message">${message}</span>`;
    }
}
