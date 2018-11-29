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
        this.bodyDiv = $('.dt-body', this.bodyScrollable);
        this.footer = this.instance.footer;
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

        if (!this.hyperlist) {
            this.hyperlist = new HyperList(this.bodyDiv, config);
        } else {
            this.hyperlist.refresh(this.bodyDiv, config);
        }

        this.visibleRows = rows;
        this.visibleRowIndices = rows.map(row => row.meta.rowIndex);
        this.renderFooter();
    }

    render() {
        const rows = this.datamanager.getRowsForView();
        this.renderRows(rows);
        // setDimensions requires atleast 1 row to exist in dom
        this.instance.setDimensions();
    }

    renderFooter() {
        if (!this.options.showTotalRow) return;

        const columns = this.datamanager.getColumns();
        const totalRowTemplate = columns.map(col => {
            let content = 0;
            if (['_rowIndex', '_checkbox'].includes(col.id)) {
                content = '';
            }
            return {
                content,
                isTotalRow: 1,
                colIndex: col.colIndex,
                column: col
            };
        });

        const totalRow = this.visibleRows.reduce((acc, prevRow) => {
            return acc.map((cell, i) => {
                const prevCell = prevRow[i];
                if (typeof prevCell.content === 'number') {
                    cell.content += prevRow[i].content;
                }
                if (!cell.format && prevCell.format) {
                    cell.format = prevCell.format;
                }
                return Object.assign({}, cell);
            });
        }, totalRowTemplate);

        let html = this.rowmanager.getRowHTML(totalRow, { isTotalRow: 1, rowIndex: 'totalRow' });

        this.footer.innerHTML = html;
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
