import $ from './dom';
import Sortable from 'sortablejs';
import {
    getDefault,
    linkProperties,
    debounce
} from './utils';

export default class ColumnManager {
    constructor(instance) {
        this.instance = instance;

        linkProperties(this, this.instance, [
            'options',
            'fireEvent',
            'header',
            'datamanager',
            'style',
            'wrapper',
            'rowmanager',
            'bodyScrollable'
        ]);

        this.bindEvents();
        getDropdownHTML = getDropdownHTML.bind(this, this.options.dropdownButton);
    }

    renderHeader() {
        this.header.innerHTML = '<thead></thead>';
        this.refreshHeader();
    }

    refreshHeader() {
        const columns = this.datamanager.getColumns();
        const $cols = $.each('.data-table-cell[data-is-header]', this.header);

        const refreshHTML =
            // first init
            !$('.data-table-cell', this.header) ||
            // deleted column
            columns.length < $cols.length;

        if (refreshHTML) {
            // refresh html
            $('thead', this.header).innerHTML = this.getHeaderHTML(columns);

            this.$filterRow = $('.data-table-row[data-is-filter]', this.header);
            if (this.$filterRow) {
                $.style(this.$filterRow, { display: 'none' });
            }
        } else {
            // update data-attributes
            $cols.map(($col, i) => {
                const column = columns[i];
                // column sorted or order changed
                // update colIndex of each header cell
                $.data($col, {
                    colIndex: column.colIndex
                });

                // refresh sort indicator
                const sortIndicator = $('.sort-indicator', $col);
                if (sortIndicator) {
                    sortIndicator.innerHTML = this.options.sortIndicator[column.sortOrder];
                }
            });
        }
        // reset columnMap
        this.$columnMap = [];
    }

    getHeaderHTML(columns) {
        let html = this.rowmanager.getRowHTML(columns, {
            isHeader: 1
        });
        if (this.options.enableInlineFilters) {
            html += this.rowmanager.getRowHTML(columns, {
                isFilter: 1
            });
        }
        return html;
    }

    bindEvents() {
        this.bindDropdown();
        this.bindResizeColumn();
        this.bindMoveColumn();
        this.bindFilter();
    }

    bindDropdown() {
        let $activeDropdown;
        $.on(this.header, 'click', '.data-table-dropdown-toggle', (e, $button) => {
            const $dropdown = $.closest('.data-table-dropdown', $button);

            if (!$dropdown.classList.contains('is-active')) {
                deactivateDropdown();
                $dropdown.classList.add('is-active');
                $activeDropdown = $dropdown;
            } else {
                deactivateDropdown();
            }
        });

        $.on(document.body, 'click', (e) => {
            if (e.target.matches('.data-table-dropdown-toggle')) return;
            deactivateDropdown();
        });

        const dropdownItems = this.options.headerDropdown;

        $.on(this.header, 'click', '.data-table-dropdown-list > div', (e, $item) => {
            const $col = $.closest('.data-table-cell', $item);
            const {
                index
            } = $.data($item);
            const {
                colIndex
            } = $.data($col);
            let callback = dropdownItems[index].action;

            callback && callback.call(this.instance, this.getColumn(colIndex));
        });

        function deactivateDropdown(e) {
            $activeDropdown && $activeDropdown.classList.remove('is-active');
            $activeDropdown = null;
        }
    }

    bindResizeColumn() {
        let isDragging = false;
        let $resizingCell, startWidth, startX;

        $.on(this.header, 'mousedown', '.data-table-cell .column-resizer', (e, $handle) => {
            document.body.classList.add('data-table-resize');
            const $cell = $handle.parentNode.parentNode;
            $resizingCell = $cell;
            const {
                colIndex
            } = $.data($resizingCell);
            const col = this.getColumn(colIndex);

            if (col && col.resizable === false) {
                return;
            }

            isDragging = true;
            startWidth = $.style($('.content', $resizingCell), 'width');
            startX = e.pageX;
        });

        $.on(document.body, 'mouseup', (e) => {
            document.body.classList.remove('data-table-resize');
            if (!$resizingCell) return;
            isDragging = false;

            const {
                colIndex
            } = $.data($resizingCell);
            this.setColumnWidth(colIndex);
            this.style.setBodyStyle();
            $resizingCell = null;
        });

        $.on(document.body, 'mousemove', (e) => {
            if (!isDragging) return;
            const finalWidth = startWidth + (e.pageX - startX);
            const {
                colIndex
            } = $.data($resizingCell);

            if (this.getColumnMinWidth(colIndex) > finalWidth) {
                // don't resize past minWidth
                return;
            }
            this.datamanager.updateColumn(colIndex, {
                width: finalWidth
            });
            this.setColumnHeaderWidth(colIndex);
        });
    }

    bindMoveColumn() {
        let initialized;

        const initialize = () => {
            if (initialized) {
                $.off(document.body, 'mousemove', initialize);
                return;
            }
            const ready = $('.data-table-cell', this.header);
            if (!ready) return;

            const $parent = $('.data-table-row', this.header);

            this.sortable = Sortable.create($parent, {
                onEnd: (e) => {
                    const {
                        oldIndex,
                        newIndex
                    } = e;
                    const $draggedCell = e.item;
                    const {
                        colIndex
                    } = $.data($draggedCell);
                    if (+colIndex === newIndex) return;

                    this.switchColumn(oldIndex, newIndex);
                },
                preventOnFilter: false,
                filter: '.column-resizer, .data-table-dropdown',
                animation: 150
            });
        };

        $.on(document.body, 'mousemove', initialize);
    }

    bindSortColumn() {

        $.on(this.header, 'click', '.data-table-cell .column-title', (e, span) => {
            const $cell = span.closest('.data-table-cell');
            let {
                colIndex,
                sortOrder
            } = $.data($cell);
            sortOrder = getDefault(sortOrder, 'none');
            const col = this.getColumn(colIndex);

            if (col && col.sortable === false) {
                return;
            }

            // reset sort indicator
            $('.sort-indicator', this.header).textContent = '';
            $.each('.data-table-cell', this.header).map($cell => {
                $.data($cell, {
                    sortOrder: 'none'
                });
            });

            let nextSortOrder, textContent;
            if (sortOrder === 'none') {
                nextSortOrder = 'asc';
                textContent = '▲';
            } else if (sortOrder === 'asc') {
                nextSortOrder = 'desc';
                textContent = '▼';
            } else if (sortOrder === 'desc') {
                nextSortOrder = 'none';
                textContent = '';
            }

            $.data($cell, {
                sortOrder: nextSortOrder
            });
            $('.sort-indicator', $cell).textContent = textContent;

            this.sortColumn(colIndex, nextSortOrder);
        });
    }

    sortColumn(colIndex, nextSortOrder) {
        this.instance.freeze();
        this.sortRows(colIndex, nextSortOrder)
            .then(() => {
                this.refreshHeader();
                return this.rowmanager.refreshRows();
            })
            .then(() => this.instance.unfreeze())
            .then(() => {
                this.fireEvent('onSortColumn', this.getColumn(colIndex));
            });
    }

    removeColumn(colIndex) {
        const removedCol = this.getColumn(colIndex);
        this.instance.freeze();
        this.datamanager.removeColumn(colIndex)
            .then(() => {
                this.refreshHeader();
                return this.rowmanager.refreshRows();
            })
            .then(() => this.instance.unfreeze())
            .then(() => {
                this.fireEvent('onRemoveColumn', removedCol);
            });
    }

    switchColumn(oldIndex, newIndex) {
        this.instance.freeze();
        this.datamanager.switchColumn(oldIndex, newIndex)
            .then(() => {
                this.refreshHeader();
                return this.rowmanager.refreshRows();
            })
            .then(() => {
                this.setColumnWidth(oldIndex);
                this.setColumnWidth(newIndex);
                this.instance.unfreeze();
            })
            .then(() => {
                this.fireEvent('onSwitchColumn',
                    this.getColumn(oldIndex), this.getColumn(newIndex)
                );
            });
    }

    toggleFilter(flag) {
        let showFilter;
        if (flag === undefined) {
            showFilter = !this.isFilterShown;
        } else {
            showFilter = flag;
        }

        if (showFilter) {
            $.style(this.$filterRow, { display: '' });
        } else {
            $.style(this.$filterRow, { display: 'none' });
        }

        this.isFilterShown = showFilter;
        this.style.setBodyStyle();
    }

    focusFilter(colIndex) {
        if (!this.isFilterShown) return;

        const $filterInput = $(`[data-col-index="${colIndex}"] .data-table-filter`, this.$filterRow);
        $filterInput.focus();
    }

    bindFilter() {
        if (!this.options.enableInlineFilters) return;
        const handler = e => {
            const $filterCell = $.closest('.data-table-cell', e.target);
            const {
                colIndex
            } = $.data($filterCell);
            const keyword = e.target.value;

            this.datamanager.filterRows(keyword, colIndex)
                .then(({
                    rowsToHide,
                    rowsToShow
                }) => {
                    this.rowmanager.hideRows(rowsToHide);
                    this.rowmanager.showRows(rowsToShow);
                });
        };
        $.on(this.header, 'keydown', '.data-table-filter', debounce(handler, 300));
    }

    sortRows(colIndex, sortOrder) {
        return this.datamanager.sortRows(colIndex, sortOrder);
    }

    getColumn(colIndex) {
        return this.datamanager.getColumn(colIndex);
    }

    getColumns() {
        return this.datamanager.getColumns();
    }

    setColumnWidth(colIndex) {
        colIndex = +colIndex;
        this._columnWidthMap = this._columnWidthMap || [];

        const {
            width
        } = this.getColumn(colIndex);

        let index = this._columnWidthMap[colIndex];
        const selector = `[data-col-index="${colIndex}"] .content, [data-col-index="${colIndex}"] .edit-cell`;
        const styles = {
            width: width + 'px'
        };

        index = this.style.setStyle(selector, styles, index);
        this._columnWidthMap[colIndex] = index;
    }

    setColumnHeaderWidth(colIndex) {
        colIndex = +colIndex;
        this.$columnMap = this.$columnMap || [];
        const selector = `.data-table-header [data-col-index="${colIndex}"] .content`;
        const {
            width
        } = this.getColumn(colIndex);

        let $column = this.$columnMap[colIndex];
        if (!$column) {
            $column = this.header.querySelector(selector);
            this.$columnMap[colIndex] = $column;
        }

        $column.style.width = width + 'px';
    }

    getColumnMinWidth(colIndex) {
        colIndex = +colIndex;
        return this.getColumn(colIndex).minWidth || 24;
    }

    getFirstColumnIndex() {
        if (this.options.addCheckboxColumn && this.options.addSerialNoColumn) {
            return 2;
        }

        if (this.options.addCheckboxColumn || this.options.addSerialNoColumn) {
            return 1;
        }

        return 0;
    }

    getHeaderCell$(colIndex) {
        return $(`.data-table-cell[data-col-index="${colIndex}"]`, this.header);
    }

    getLastColumnIndex() {
        return this.datamanager.getColumnCount() - 1;
    }

    getSerialColumnIndex() {
        const columns = this.datamanager.getColumns();

        return columns.findIndex(column => column.content.includes('Sr. No'));
    }
}

// eslint-disable-next-line
var getDropdownHTML = function getDropdownHTML(dropdownButton = 'v') {
    // add dropdown buttons
    const dropdownItems = this.options.headerDropdown;

    return `<div class="data-table-dropdown-toggle">${dropdownButton}</div>
    <div class="data-table-dropdown-list">
      ${dropdownItems.map((d, i) => `<div data-index="${i}">${d.label}</div>`).join('')}
    </div>
  `;
};

export {
    getDropdownHTML
};
