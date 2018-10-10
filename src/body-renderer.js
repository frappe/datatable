import HyperList from 'hyperlist';
import $ from './dom';

export default class BodyRenderer {
    constructor(instance) {
        this.instance = instance;
        this.options = instance.options;
        this.datamanager = instance.datamanager;
        this.rowmanager = instance.rowmanager;
        this.cellmanager = instance.cellmanager;
        this.bodyScrollable = instance.bodyScrollable;
        this.log = instance.log;
    }

    renderRows(rows) {
        let config = {
            itemHeight: this.options.cellHeight,
            total: rows.length,
            generate: (index) => {
                const el = document.createElement('div');
                const rowHTML = this.rowmanager.getRowHTML(rows[index], rows[index].meta);
                el.innerHTML = rowHTML;
                return el.children[0];
            }
        };
        this.hyperlist.refresh($('.dt-body', this.bodyScrollable), config);
    }

    render() {
        const rows = this.datamanager.getRowsForView();

        let config = {
            itemHeight: this.options.cellHeight,
            total: rows.length,
            generate: (index) => {
                const el = document.createElement('div');
                const rowHTML = this.rowmanager.getRowHTML(rows[index], rows[index].meta);
                el.innerHTML = rowHTML;
                return el.children[0];
            }
        };

        if (!this.hyperlist) {
            this.bodyScrollable.innerHTML = '<div class="dt-body"></div>';
            this.hyperlist = new HyperList($('.dt-body', this.bodyScrollable), config);
        } else {
            this.renderRows(rows);
        }

        // setDimensions requires atleast 1 row to exist in dom
        this.instance.setDimensions();
    }

    restoreState() {
        this.rowmanager.showAllRows();
        this.rowmanager.highlightCheckedRows();
        this.cellmanager.selectAreaOnClusterChanged();
        this.cellmanager.focusCellOnClusterChanged();
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
            <div class="dt-body">
                <div>
                    ${rows.map(row => this.rowmanager.getRowHTML(row, row.meta)).join('')}
                </div>
            </div>
        `;
    }

    getNoDataHTML() {
        return `<div class="dt-scrollable__no-data">${this.options.noDataMessage}</div>`;
    }

    getToastMessageHTML(message) {
        return `<span class="dt-toast__message">${message}</span>`;
    }
}
