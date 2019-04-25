import $ from './dom';
import {
    makeDataAttributeString,
    nextTick,
    ensureArray,
    linkProperties,
    uniq,
    numberSortAsc
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
            'style'
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
    }

    bindCheckbox() {
        if (!this.options.checkboxColumn) return;

        // map of checked rows
        this.checkMap = [];

        $.on(this.wrapper, 'click', '.dt-cell--col-0 [type="checkbox"]', (e, $checkbox) => {
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
        const selector = rowIndex => `.dt-cell--0-${rowIndex} [type="checkbox"]`;
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
        $.each('.dt-cell--col-0 [type="checkbox"]', this.bodyScrollable)
            .map(input => {
                input.checked = toggle;
            });
        // highlight all
        this.highlightAll(toggle);
        this.showCheckStatus();
        this.fireEvent('onCheckRow');
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

    showRows(rowIndices) {
        rowIndices = ensureArray(rowIndices);
        const rows = rowIndices.map(rowIndex => this.datamanager.getRow(rowIndex));
        this.bodyRenderer.renderRows(rows);
    }

    showAllRows() {
        const rowIndices = this.datamanager.getAllRowIndices();
        this.showRows(rowIndices);
    }

    getChildrenToShowForNode(rowIndex) {
        const row = this.datamanager.getRow(rowIndex);
        row.meta.isTreeNodeClose = false;

        return this.datamanager.getImmediateChildren(rowIndex);
    }

    openSingleNode(rowIndex) {
        const childrenToShow = this.getChildrenToShowForNode(rowIndex);
        const visibleRowIndices = this.bodyRenderer.visibleRowIndices;
        const rowsToShow = uniq([...childrenToShow, ...visibleRowIndices]).sort(numberSortAsc);

        this.showRows(rowsToShow);
    }

    getChildrenToHideForNode(rowIndex) {
        const row = this.datamanager.getRow(rowIndex);
        row.meta.isTreeNodeClose = true;

        const rowsToHide = this.datamanager.getChildren(rowIndex);
        rowsToHide.forEach(rowIndex => {
            const row = this.datamanager.getRow(rowIndex);
            if (!row.meta.isLeaf) {
                row.meta.isTreeNodeClose = true;
            }
        });

        return rowsToHide;
    }

    closeSingleNode(rowIndex) {
        const rowsToHide = this.getChildrenToHideForNode(rowIndex);
        const visibleRows = this.bodyRenderer.visibleRowIndices;
        const rowsToShow = visibleRows
            .filter(rowIndex => !rowsToHide.includes(rowIndex))
            .sort(numberSortAsc);

        this.showRows(rowsToShow);
    }

    expandAllNodes() {
        let rows = this.datamanager.getRows();
        let rootNodes = rows.filter(row => !row.meta.isLeaf);

        const childrenToShow = rootNodes.map(row => this.getChildrenToShowForNode(row.meta.rowIndex)).flat();
        const visibleRowIndices = this.bodyRenderer.visibleRowIndices;
        const rowsToShow = uniq([...childrenToShow, ...visibleRowIndices]).sort(numberSortAsc);

        this.showRows(rowsToShow);
    }

    collapseAllNodes() {
        let rows = this.datamanager.getRows();
        let rootNodes = rows.filter(row => row.meta.indent === 0);

        const rowsToHide = rootNodes.map(row => this.getChildrenToHideForNode(row.meta.rowIndex)).flat();
        const visibleRows = this.bodyRenderer.visibleRowIndices;
        const rowsToShow = visibleRows
            .filter(rowIndex => !rowsToHide.includes(rowIndex))
            .sort(numberSortAsc);

        this.showRows(rowsToShow);
    }

    setTreeDepth(depth) {
        let rows = this.datamanager.getRows();

        const rowsToOpen = rows.filter(row => row.meta.indent < depth);
        const rowsToClose = rows.filter(row => row.meta.indent >= depth);
        const rowsToHide = rowsToClose.filter(row => row.meta.indent > depth);

        rowsToClose.forEach(row => {
            if (!row.meta.isLeaf) {
                row.meta.isTreeNodeClose = true;
            }
        });
        rowsToOpen.forEach(row => {
            if (!row.meta.isLeaf) {
                row.meta.isTreeNodeClose = false;
            }
        });

        const rowsToShow = rows
            .filter(row => !rowsToHide.includes(row))
            .map(row => row.meta.rowIndex)
            .sort(numberSortAsc);
        this.showRows(rowsToShow);
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
        let rowIdentifier = props.rowIndex;

        if (props.isFilter) {
            row = row.map(cell => (Object.assign({}, cell, {
                content: this.getFilterInput({
                    colIndex: cell.colIndex
                }),
                isFilter: 1,
                isHeader: undefined,
                editable: false
            })));

            rowIdentifier = 'filter';
        }

        if (props.isHeader) {
            rowIdentifier = 'header';
        }

        return `
            <div class="dt-row dt-row-${rowIdentifier}" ${dataAttr}>
                ${row.map(cell => this.cellmanager.getCellHTML(cell)).join('')}
            </div>
        `;
    }

    getFilterInput(props) {
        const dataAttr = makeDataAttributeString(props);
        return `<input class="dt-filter dt-input" type="text" ${dataAttr} tabindex="1" />`;
    }

    selector(rowIndex) {
        return `.dt-row-${rowIndex}`;
    }
}
