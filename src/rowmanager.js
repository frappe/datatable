import $ from './dom';
import {
    makeDataAttributeString,
    nextTick,
    ensureArray,
    linkProperties,
    throttle
} from './utils';

export default class RowManager {
    constructor(instance) {
        this.instance = instance;
        linkProperties(this, this.instance, [
            'options',
            'fireEvent',
            'wrapper',
            'bodyScrollable',
            'bodyRenderer',
            'datatableWrapperLeft'
        ]);

        this.bindEvents();
        this.refreshRows = nextTick(this.refreshRows, this);
    }

    get datamanager() {
        return this.instance.datamanager;
    }

    get cellmanager() {
        return this.instance.cellmanager;
    }

    bindEvents() {
        this.bindCheckbox();
        this.bindScrollSync();
    }

    bindCheckbox() {
        if (!this.options.checkboxColumn) return;

        // map of checked rows
        this.checkMap = [];

        $.on(this.wrapper, 'click', '.dt-cell[data-col-index="0"] [type="checkbox"]', (e, $checkbox) => {
            const $cell = $checkbox.closest('.dt-cell');
            const {
                rowIndex,
                isHeader
            } = $.data($cell);
            const checked = $checkbox.checked;

            if (isHeader) {
                this.checkAll(checked);
            } else {
                this.checkRow(rowIndex, checked);
            }
        });
    }

    bindScrollSync() {
        // $.on(this.wrapper, 'scroll', '.dt-scrollable', (e, $el) => {
        //     console.log(e, $el);
        // });

        if (!this._$leftBodyScrollable) {
            this._$leftBodyScrollable = $('.dt-scrollable', this.datatableWrapperLeft);
        }

        $.on(this.bodyScrollable, 'scroll', throttle((e) => {
            console.log('main scrolled');
            requestAnimationFrame(() => {
                if (this._$leftBodyScrollable.scrollTop === this.bodyScrollable.scrollTop) {
                    return;
                }
                this._$leftBodyScrollable.scrollTop = this.bodyScrollable.scrollTop;
            });
        }, 16));

        $.on(this._$leftBodyScrollable, 'scroll', throttle((e) => {
            console.log('left scrolled');
            requestAnimationFrame(() => {
                if (this._$leftBodyScrollable.scrollTop === this.bodyScrollable.scrollTop) {
                    return;
                }
                this.bodyScrollable.scrollTop = this._$leftBodyScrollable.scrollTop;
            });
        }, 16));
    }

    refreshRows() {
        this.instance.renderBody();
        this.instance.setDimensions();
    }

    refreshRow(row, rowIndex) {
        const _row = this.datamanager.updateRow(row, rowIndex);

        _row.forEach(cell => {
            this.cellmanager.refreshCell(cell);
        });
    }

    getCheckedRows() {
        if (!this.checkMap) {
            return [];
        }

        let out = [];
        for (let rowIndex in this.checkMap) {
            const checked = this.checkMap[rowIndex];
            if (checked === 1) {
                out.push(rowIndex);
            }
        }

        return out;
    }

    highlightCheckedRows() {
        this.getCheckedRows()
            .map(rowIndex => this.checkRow(rowIndex, true));
    }

    checkRow(rowIndex, toggle) {
        const value = toggle ? 1 : 0;
        const selector = rowIndex =>
            `.dt-cell[data-row-index="${rowIndex}"][data-col-index="0"] [type="checkbox"]`;
        // update internal map
        this.checkMap[rowIndex] = value;
        // set checkbox value explicitly
        $.each(selector(rowIndex), this.bodyScrollable)
            .map(input => {
                input.checked = toggle;
            });
        // highlight row
        this.highlightRow(rowIndex, toggle);
        this.showCheckStatus();
        this.fireEvent('onCheckRow', this.datamanager.getRow(rowIndex));
    }

    checkAll(toggle) {
        const value = toggle ? 1 : 0;

        // update internal map
        if (toggle) {
            this.checkMap = Array.from(Array(this.getTotalRows())).map(c => value);
        } else {
            this.checkMap = [];
        }
        // set checkbox value
        $.each('.dt-cell[data-col-index="0"] [type="checkbox"]', this.bodyScrollable)
            .map(input => {
                input.checked = toggle;
            });
        // highlight all
        this.highlightAll(toggle);
        this.showCheckStatus();
    }

    showCheckStatus() {
        if (!this.options.checkedRowStatus) return;
        const checkedRows = this.getCheckedRows();
        const count = checkedRows.length;
        if (count > 0) {
            this.bodyRenderer.showToastMessage(`${count} row${count > 1 ? 's' : ''} selected`);
        } else {
            this.bodyRenderer.clearToastMessage();
        }
    }

    highlightRow(rowIndex, toggle = true) {
        const $row = this.getRow$(rowIndex);
        if (!$row) return;

        if (!toggle && this.bodyScrollable.classList.contains('dt-scrollable--highlight-all')) {
            $row.classList.add('dt-row--unhighlight');
            return;
        }

        if (toggle && $row.classList.contains('dt-row--unhighlight')) {
            $row.classList.remove('dt-row--unhighlight');
        }

        this._highlightedRows = this._highlightedRows || {};

        if (toggle) {
            $row.classList.add('dt-row--highlight');
            this._highlightedRows[rowIndex] = $row;
        } else {
            $row.classList.remove('dt-row--highlight');
            delete this._highlightedRows[rowIndex];
        }
    }

    highlightAll(toggle = true) {
        if (toggle) {
            this.bodyScrollable.classList.add('dt-scrollable--highlight-all');
        } else {
            this.bodyScrollable.classList.remove('dt-scrollable--highlight-all');
            for (const rowIndex in this._highlightedRows) {
                const $row = this._highlightedRows[rowIndex];
                $row.classList.remove('dt-row--highlight');
            }
            this._highlightedRows = {};
        }
    }

    hideRows(rowIndices) {
        rowIndices = ensureArray(rowIndices);
        rowIndices.map(rowIndex => {
            const $tr = this.getRow$(rowIndex);
            $tr.classList.add('dt-row--hide');
        });
    }

    showRows(rowIndices) {
        rowIndices = ensureArray(rowIndices);
        rowIndices.map(rowIndex => {
            const $tr = this.getRow$(rowIndex);
            $tr.classList.remove('dt-row--hide');
        });
    }

    openSingleNode(rowIndex) {
        const rowsToShow = this.datamanager.getImmediateChildren(rowIndex);
        this.showRows(rowsToShow);
        this.cellmanager.toggleTreeButton(rowIndex, true);
    }

    closeSingleNode(rowIndex) {
        const children = this.datamanager.getImmediateChildren(rowIndex);
        children.forEach(childIndex => {
            const row = this.datamanager.getRow(childIndex);
            if (row.meta.isLeaf) {
                // close
                this.hideRows(childIndex);
                this.cellmanager.toggleTreeButton(childIndex, false);
            } else {
                this.closeSingleNode(childIndex);
                this.hideRows(childIndex);
            }
        });
        this.cellmanager.toggleTreeButton(rowIndex, false);
    }

    getRow$(rowIndex) {
        return $(this.selector(rowIndex), this.bodyScrollable);
    }

    getTotalRows() {
        return this.datamanager.getRowCount();
    }

    getFirstRowIndex() {
        return 0;
    }

    getLastRowIndex() {
        return this.datamanager.getRowCount() - 1;
    }

    scrollToRow(rowIndex) {
        rowIndex = +rowIndex;
        this._lastScrollTo = this._lastScrollTo || 0;
        const $row = this.getRow$(rowIndex);
        if ($.inViewport($row, this.bodyScrollable)) return;

        const {
            height
        } = $row.getBoundingClientRect();
        const {
            top,
            bottom
        } = this.bodyScrollable.getBoundingClientRect();
        const rowsInView = Math.floor((bottom - top) / height);

        let offset = 0;
        if (rowIndex > this._lastScrollTo) {
            offset = height * ((rowIndex + 1) - rowsInView);
        } else {
            offset = height * ((rowIndex + 1) - 1);
        }

        this._lastScrollTo = rowIndex;
        $.scrollTop(this.bodyScrollable, offset);
    }

    getRowHTML(row, props) {
        const dataAttr = makeDataAttributeString(props);

        if (props.isFilter) {
            row = row.map(cell => (Object.assign({}, cell, {
                content: this.getFilterInput({
                    colIndex: cell.colIndex
                }),
                isFilter: 1,
                isHeader: undefined,
                editable: false
            })));
        }

        return `
            <tr class="dt-row" ${dataAttr}>
                ${row.map(cell => this.cellmanager.getCellHTML(cell)).join('')}
            </tr>
        `;
    }

    getFilterInput(props) {
        const dataAttr = makeDataAttributeString(props);
        return `<input class="dt-filter dt-input" type="text" ${dataAttr} />`;
    }

    selector(rowIndex) {
        return `.dt-row[data-row-index="${rowIndex}"]`;
    }
}
