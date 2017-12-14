import $ from './dom';
import Sortable from 'sortablejs';
import { getRowHTML } from './rowmanager';
import { getDefault, throttle } from './utils';

export default class ColumnManager {
  constructor(instance) {
    this.instance = instance;
    this.options = this.instance.options;
    this.fireEvent = this.instance.fireEvent;
    this.header = this.instance.header;
    this.datamanager = this.instance.datamanager;
    this.style = this.instance.style;
    this.wrapper = this.instance.wrapper;
    this.rowmanager = this.instance.rowmanager;

    this.bindEvents();
    getDropdownHTML = getDropdownHTML.bind(this, this.options.dropdownButton);
  }

  renderHeader() {
    this.header.innerHTML = '<thead></thead>';
    this.refreshHeader();
  }

  refreshHeader() {
    const columns = this.datamanager.getColumns();

    if (!$('.data-table-col', this.header)) {
      // insert html
      $('thead', this.header).innerHTML = getRowHTML(columns, { isHeader: 1 });
    } else {
      // refresh dom state
      const $cols = $.each('.data-table-col', this.header);
      if (columns.length < $cols.length) {
        // deleted column
        $('thead', this.header).innerHTML = getRowHTML(columns, { isHeader: 1 });
        return;
      }

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

  bindEvents() {
    this.bindDropdown();
    this.bindResizeColumn();
    this.bindMoveColumn();
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
      const $col = $.closest('.data-table-col', $item);
      const { index } = $.data($item);
      const { colIndex } = $.data($col);
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

    $.on(this.header, 'mousedown', '.data-table-col .column-resizer', (e, $handle) => {
      document.body.classList.add('data-table-resize');
      const $cell = $handle.parentNode.parentNode;
      $resizingCell = $cell;
      const { colIndex } = $.data($resizingCell);
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

      const { colIndex } = $.data($resizingCell);
      const width = $.style($('.content', $resizingCell), 'width');

      this.setColumnWidth(colIndex, width);
      this.instance.setBodyWidth();
      $resizingCell = null;
    });

    $.on(document.body, 'mousemove', (e) => {
      if (!isDragging) return;
      const finalWidth = startWidth + (e.pageX - startX);
      const { colIndex } = $.data($resizingCell);

      if (this.getColumnMinWidth(colIndex) > finalWidth) {
        // don't resize past minWidth
        return;
      }

      this.setColumnHeaderWidth(colIndex, finalWidth);
    });
  }

  bindMoveColumn() {
    let initialized;

    const initialize = () => {
      if (initialized) {
        $.off(document.body, 'mousemove', initialize);
        return;
      }
      const ready = $('.data-table-col', this.header);
      if (!ready) return;

      const $parent = $('.data-table-row', this.header);

      $.on(document, 'drag', '.data-table-col', throttle((e, $target) => {
        if (e.offsetY > 200) {
          $target.classList.add('remove-column');
        } else {
          setTimeout(() => {
            $target.classList.remove('remove-column');
          }, 10);
        }
      }));

      this.sortable = Sortable.create($parent, {
        onEnd: (e) => {
          const { oldIndex, newIndex } = e;
          const $draggedCell = e.item;
          const { colIndex } = $.data($draggedCell);
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

    $.on(this.header, 'click', '.data-table-col .column-title', (e, span) => {
      const $cell = span.closest('.data-table-col');
      let { colIndex, sortOrder } = $.data($cell);
      sortOrder = getDefault(sortOrder, 'none');
      const col = this.getColumn(colIndex);

      if (col && col.sortable === false) {
        return;
      }

      // reset sort indicator
      $('.sort-indicator', this.header).textContent = '';
      $.each('.data-table-col', this.header).map($cell => {
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

  setDimensions() {
    this.setHeaderStyle();
    this.setupMinWidth();
    this.setNaturalColumnWidth();
    this.distributeRemainingWidth();
    this.setColumnAlignments();
  }

  setHeaderStyle() {
    if (!this.options.takeAvailableSpace) {
      // setting width as 0 will ensure that the
      // header doesn't take the available space
      $.style(this.header, {
        width: 0
      });
    }

    $.style(this.header, {
      margin: 0
    });

    // don't show resize cursor on nonResizable columns
    const nonResizableColumnsSelector = this.datamanager.getColumns()
      .filter(col => col.resizable !== undefined && !col.resizable)
      .map(col => col.colIndex)
      .map(i => `.data-table-header [data-col-index="${i}"]`)
      .join();

    this.style.setStyle(nonResizableColumnsSelector, {
      cursor: 'pointer'
    });
  }

  setupMinWidth() {
    // cache minWidth for each column
    this.minWidthMap = getDefault(this.minWidthMap, []);

    $.each('.data-table-col', this.header).map(col => {
      const width = $.style($('.content', col), 'width');
      const { colIndex } = $.data(col);

      if (!this.minWidthMap[colIndex]) {
        // only set this once
        this.minWidthMap[colIndex] = width;
      }
    });
  }

  setNaturalColumnWidth() {
    // set initial width as naturally calculated by table's first row
    $.each('.data-table-row[data-row-index="0"] .data-table-col', this.bodyScrollable).map($cell => {

      let width = $.style($('.content', $cell), 'width');
      const height = $.style($('.content', $cell), 'height');
      const { colIndex } = $.data($cell);
      const minWidth = this.getColumnMinWidth(colIndex);

      if (width < minWidth) {
        width = minWidth;
      }
      this.setColumnWidth(colIndex, width);
      this.setDefaultCellHeight(height);
    });
  }

  distributeRemainingWidth() {
    if (!this.options.takeAvailableSpace) return;

    const wrapperWidth = $.style(this.instance.datatableWrapper, 'width');
    const headerWidth = $.style(this.header, 'width');

    if (headerWidth >= wrapperWidth) {
      // don't resize, horizontal scroll takes place
      return;
    }

    const resizableColumns = this.datamanager.getColumns().filter(
      col => col.resizable === undefined || col.resizable
    );

    const deltaWidth = (wrapperWidth - headerWidth) / resizableColumns.length;

    resizableColumns.map(col => {
      const width = $.style(this.getColumnHeaderElement(col.colIndex), 'width');
      let finalWidth = Math.min(width + deltaWidth) - 2;

      this.setColumnHeaderWidth(col.colIndex, finalWidth);
      this.setColumnWidth(col.colIndex, finalWidth);
    });
    this.instance.setBodyWidth();
  }

  setDefaultCellHeight(height) {
    this.style.setStyle('.data-table-col .content', {
      height: height + 'px'
    });
  }

  setColumnAlignments() {
    // align columns
    this.getColumns()
      .map(column => {
        if (['left', 'center', 'right'].includes(column.align)) {
          this.style.setStyle(`[data-col-index="${column.colIndex}"]`, {
            'text-align': column.align
          });
        }
      });
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

  setColumnWidth(colIndex, width) {
    this._columnWidthMap = this._columnWidthMap || [];

    if (!width) {
      const $headerContent = $(`.data-table-col[data-col-index="${colIndex}"] .content`, this.header);
      width = $.style($headerContent, 'width');
    }

    let index = this._columnWidthMap[colIndex];
    const selector = `[data-col-index="${colIndex}"] .content, [data-col-index="${colIndex}"] .edit-cell`;
    const styles = {
      width: width + 'px'
    };

    index = this.style.setStyle(selector, styles, index);
    this._columnWidthMap[colIndex] = index;
  }

  setColumnHeaderWidth(colIndex, width) {
    this.$columnMap = this.$columnMap || [];
    const selector = `[data-col-index="${colIndex}"][data-is-header] .content`;

    let $column = this.$columnMap[colIndex];
    if (!$column) {
      $column = this.header.querySelector(selector);
      this.$columnMap[colIndex] = $column;
    }

    $column.style.width = width + 'px';
  }

  getColumnMinWidth(colIndex) {
    colIndex = +colIndex;
    return this.minWidthMap && this.minWidthMap[colIndex];
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
    return $(`.data-table-col[data-col-index="${colIndex}"]`, this.header);
  }

  getLastColumnIndex() {
    return this.datamanager.getColumnCount() - 1;
  }

  getColumnHeaderElement(colIndex) {
    colIndex = +colIndex;
    if (colIndex < 0) return null;
    return $(`.data-table-col[data-is-header][data-col-index="${colIndex}"]`, this.wrapper);
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
