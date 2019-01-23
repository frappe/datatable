import HyperList from 'hyperlist';

export default class BodyRenderer {
    constructor(instance) {
        this.instance = instance;
        this.options = instance.options;
        this.datamanager = instance.datamanager;
        this.rowmanager = instance.rowmanager;
        this.cellmanager = instance.cellmanager;
        this.bodyScrollable = instance.bodyScrollable;
        this.footer = this.instance.footer;
        this.log = instance.log;
        this.hooks = instance.hooks;
    }

    renderRows(rows) {
        this.visibleRows = rows;
        this.visibleRowIndices = rows.map(row => row.meta.rowIndex);

        const rowViewOrder = this.datamanager.rowViewOrder.map(index => {
            if (this.visibleRowIndices.includes(index)) {
                return index;
            }
            return null;
        }).filter(index => index !== null);

        const computedStyle = getComputedStyle(this.bodyScrollable);

        let config = {
            width: computedStyle.width,
            height: computedStyle.height,
            itemHeight: this.options.cellHeight,
            total: rows.length,
            generate: (index) => {
                const el = document.createElement('div');
                const rowIndex = rowViewOrder[index];
                const row = this.datamanager.getRow(rowIndex);
                const rowHTML = this.rowmanager.getRowHTML(row, row.meta);
                el.innerHTML = rowHTML;
                return el.children[0];
            },
            afterRender: () => {
                this.restoreState();
            }
        };

        if (!this.hyperlist) {
            this.hyperlist = new HyperList(this.bodyScrollable, config);
        } else {
            this.hyperlist.refresh(this.bodyScrollable, config);
        }

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

        const totalRow = this.getTotalRow();
        let html = this.rowmanager.getRowHTML(totalRow, { isTotalRow: 1, rowIndex: 'totalRow' });

        this.footer.innerHTML = html;
    }

    getTotalRow() {
        const self = this;
        const columns = self.datamanager.getColumns();
        const totalRow = columns.map(col => {
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

        for (let column of columns) {
            if (['_rowIndex', '_checkbox'].includes(column.id)) {
                continue;
            }

            let useDefaultAccumulator = !self.hooks.totalAccumulator;
            let total = 0;

            if (!useDefaultAccumulator) {
                const values = self.visibleRows.map(row => {
                    return {rowIndex: row.meta.rowIndex, content: row[column.colIndex].content};
                });
                const result = self.hooks.totalAccumulator.call(self.instance, column, values);
                if (result === false) {
                    useDefaultAccumulator = true;
                } else {
                    total = result;
                }
            }

            if (useDefaultAccumulator) {
                for (let i = 0; i < self.visibleRows.length; ++i) {
                    const cell = self.visibleRows[i][column.colIndex];
                    if (typeof cell.content === 'number') {
                        total += cell.content;
                    }
                }
            }

            let format = null;
            for (let i = 0; i < self.visibleRows.length; ++i) {
                const cell = self.visibleRows[i][column.colIndex];
                if (cell.format) {
                    format = cell.format;
                    break;
                }
            }

            totalRow[column.colIndex].content = total;
            totalRow[column.colIndex].format = format;
        }
        return totalRow;
    }

    restoreState() {
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

    getNoDataHTML() {
        return `<div class="dt-scrollable__no-data">${this.options.noDataMessage}</div>`;
    }

    getToastMessageHTML(message) {
        return `<span class="dt-toast__message">${message}</span>`;
    }
}
