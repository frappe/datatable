import $ from './dom';
import {
  camelCaseToDash,
  linkProperties,
  throttle
} from './utils';

export default class Style {
  constructor(instance) {
    this.instance = instance;

    linkProperties(this, this.instance, [
      'options', 'datamanager', 'columnmanager',
      'header', 'bodyScrollable', 'getColumn'
    ]);

    this.scopeClass = 'datatable-instance-' + instance.constructor.instances;
    instance.datatableWrapper.classList.add(this.scopeClass);

    const styleEl = document.createElement('style');
    instance.wrapper.insertBefore(styleEl, instance.datatableWrapper);
    this.styleEl = styleEl;
    this.styleSheet = styleEl.sheet;

    this.bindResizeWindow();
  }

  bindResizeWindow() {
    if (this.options.layout === 'fluid') {
      $.on(window, 'resize', throttle(() => {
        this.distributeRemainingWidth();
        this.refreshColumnWidth();
        this.setBodyStyle();
      }, 300));
    }
  }

  destroy() {
    this.styleEl.remove();
  }

  setStyle(rule, styleMap, index = -1) {
    const styles = Object.keys(styleMap)
      .map(prop => {
        if (!prop.includes('-')) {
          prop = camelCaseToDash(prop);
        }
        return `${prop}:${styleMap[prop]};`;
      })
      .join('');
    let ruleString = `.${this.scopeClass} ${rule} { ${styles} }`;

    let _index = this.styleSheet.cssRules.length;
    if (index !== -1) {
      this.styleSheet.deleteRule(index);
      _index = index;
    }

    this.styleSheet.insertRule(ruleString, _index);
    return _index;
  }

  setDimensions() {
    this.setHeaderStyle();

    this.setupMinWidth();
    this.setupNaturalColumnWidth();
    this.setupColumnWidth();

    this.distributeRemainingWidth();
    this.setColumnStyle();
    this.setDefaultCellHeight();
    this.setBodyStyle();
  }

  setHeaderStyle() {
    if (this.options.layout === 'fluid') {
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
      .filter(col => col.resizable === false)
      .map(col => col.colIndex)
      .map(i => `.data-table-header [data-col-index="${i}"]`)
      .join();

    this.setStyle(nonResizableColumnsSelector, {
      cursor: 'pointer'
    });
  }

  setupMinWidth() {
    $.each('.data-table-col', this.header).map(col => {
      const width = $.style($('.content', col), 'width');
      const {
        colIndex
      } = $.data(col);
      const column = this.getColumn(colIndex);

      if (!column.minWidth) {
        // only set this once
        column.minWidth = width;
      }
    });
  }

  setupNaturalColumnWidth() {
    if (!$('.data-table-row')) return;

    // set initial width as naturally calculated by table's first row
    $.each('.data-table-row[data-row-index="0"] .data-table-col', this.bodyScrollable).map($cell => {
      const {
        colIndex
      } = $.data($cell);
      const column = this.datamanager.getColumn(colIndex);

      let naturalWidth = $.style($('.content', $cell), 'width');
      column.naturalWidth = naturalWidth;
    });
  }

  setupColumnWidth() {
    this.datamanager.getColumns()
      .map(column => {
        if (column.width === null) {
          column.width = column.naturalWidth;
        }
        if (column.width < column.minWidth) {
          column.width = column.minWidth;
        }
      });
  }

  distributeRemainingWidth() {
    if (this.options.layout !== 'fluid') return;

    const wrapperWidth = $.style(this.instance.datatableWrapper, 'width');
    const headerWidth = $.style(this.header, 'width');

    // if (headerWidth >= wrapperWidth) {
    //   // don't resize, horizontal scroll takes place
    //   return;
    // }

    const resizableColumns = this.datamanager.getColumns().filter(col => col.resizable);

    const deltaWidth = (wrapperWidth - headerWidth) / resizableColumns.length;

    resizableColumns.map(col => {
      const width = $.style(this.getColumnHeaderElement(col.colIndex), 'width');
      let finalWidth = Math.floor(width + deltaWidth) - 2;

      this.datamanager.updateColumn(col.colIndex, {
        width: finalWidth
      });
    });
  }

  setDefaultCellHeight() {
    if (this.__cellHeightSet) return;
    const height = $.style($('.data-table-col', this.instance.datatableWrapper), 'height');
    if (height) {
      this.setCellHeight(height);
      this.__cellHeightSet = true;
    }
  }

  setCellHeight(height) {
    this.setStyle('.data-table-col .content', {
      height: height + 'px'
    });
    this.setStyle('.data-table-col .edit-cell', {
      height: height + 'px'
    });
  }

  setColumnStyle() {
    // align columns
    this.datamanager.getColumns()
      .map(column => {
        // alignment
        if (['left', 'center', 'right'].includes(column.align)) {
          this.setStyle(`[data-col-index="${column.colIndex}"]`, {
            'text-align': column.align
          });
        }
        // width
        this.columnmanager.setColumnHeaderWidth(column.colIndex);
        this.columnmanager.setColumnWidth(column.colIndex);
      });
    this.setBodyStyle();
  }

  refreshColumnWidth() {
    this.datamanager.getColumns()
      .map(column => {
        this.columnmanager.setColumnHeaderWidth(column.colIndex);
        this.columnmanager.setColumnWidth(column.colIndex);
      });
  }

  setBodyStyle() {
    const width = $.style(this.header, 'width');

    $.style(this.bodyScrollable, {
      width: width + 'px'
    });

    $.style(this.bodyScrollable, {
      marginTop: $.style(this.header, 'height') + 'px'
    });

    $.style($('table', this.bodyScrollable), {
      margin: 0
    });
  }

  getColumnHeaderElement(colIndex) {
    colIndex = +colIndex;
    if (colIndex < 0) return null;
    return $(`.data-table-col[data-col-index="${colIndex}"]`, this.header);
  }
}
