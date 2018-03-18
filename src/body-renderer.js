import $ from './dom';
import Clusterize from 'clusterize.js';
import {
    nextTick
} from './utils';

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

        this.bodyScrollable.innerHTML = `
            <table class="data-table-body">
                ${this.getBodyHTML(rows)}
            </table>
        `;
        this.instance.setDimensions();
        this.restoreState();
    }

    renderBodyWithClusterize() {
        // first page
        const rows = this.datamanager.getRowsForView(0, 20);
        const initialData = this.getDataForClusterize(rows);

        if (!this.clusterize) {
            // empty body
            this.bodyScrollable.innerHTML = `
                <table class="data-table-body">
                    ${this.getBodyHTML([])}
                </table>
            `;

            // first 20 rows will appended
            // rest of them in nextTick
            this.clusterize = new Clusterize({
                rows: initialData,
                scrollElem: this.bodyScrollable,
                contentElem: $('tbody', this.bodyScrollable),
                callbacks: {
                    clusterChanged: () => {
                        this.restoreState();
                    }
                },
                /* eslint-disable */
                no_data_text: this.options.noDataMessage,
                no_data_class: 'empty-state'
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

    showToastMessage(message) {
        this.instance.toastMessage.innerHTML = `<span>${message}</span>`;
    }

    clearToastMessage() {
        this.instance.toastMessage.innerHTML = '';
    }

    getDataForClusterize(rows) {
        return rows.map((row) => this.rowmanager.getRowHTML(row, row.meta));
    }

    getBodyHTML(rows) {
        return `
            <tbody>
                ${rows.map(row => this.rowmanager.getRowHTML(row, row.meta)).join('')}
            </tbody>
        `;
    }
};
