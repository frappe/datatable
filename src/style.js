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
            'header', 'bodyScrollable', 'datatableWrapper',
            'getColumn'
        ]);

        this.scopeClass = 'dt-instance-' + instance.constructor.instances;
        instance.datatableWrapper.classList.add(this.scopeClass);

        const styleEl = document.createElement('style');
        instance.wrapper.insertBefore(styleEl, instance.datatableWrapper);
        this.styleEl = styleEl;

        this.bindResizeWindow();
    }

    get stylesheet() {
        return this.styleEl.sheet;
    }

    bindResizeWindow() {
        this.onWindowResize = this.onWindowResize.bind(this);
        this.onWindowResize = throttle(this.onWindowResize, 300);

        if (this.options.layout === 'fluid') {
            $.on(window, 'resize', this.onWindowResize);
        }
    }

    onWindowResize() {
        this.distributeRemainingWidth();
        this.refreshColumnWidth();
        this.compensateScrollbarWidth();
        this.setBodyStyle();
    }

    destroy() {
        this.styleEl.remove();
        $.off(window, 'resize', this.onWindowResize);
    }

    setStyle(selector, styleObject) {
        if (selector.includes(',')) {
            selector.split(',')
                .map(s => s.trim())
                .forEach(selector => {
                    this.setStyle(selector, styleObject);
                });
            return;
        }

        this._styleRulesMap = this._styleRulesMap || {};
        const prefixedSelector = this._getPrefixedSelector(selector);

        if (this._styleRulesMap[prefixedSelector]) {
            // find and remove
            const index = Array.from(this.stylesheet.cssRules)
                .findIndex(rule => rule.selectorText === prefixedSelector);
            this.stylesheet.deleteRule(index);

            // merge with old styleobject
            styleObject = Object.assign({}, this._styleRulesMap[prefixedSelector], styleObject);
        }

        const styleString = this._getRuleString(styleObject);
        const ruleString = `${prefixedSelector} { ${styleString} }`;

        this._styleRulesMap[prefixedSelector] = styleObject;
        this.stylesheet.insertRule(ruleString);
    }

    _getPrefixedSelector(selector) {
        return `.${this.scopeClass} ${selector}`;
    }

    _getRuleString(styleObject) {
        return Object.keys(styleObject)
            .map(prop => {
                let dashed = prop;
                if (!prop.includes('-')) {
                    dashed = camelCaseToDash(prop);
                }
                return `${dashed}:${styleObject[prop]};`;
            })
            .join('');
    }

    setDimensions() {
        this.setHeaderStyle();

        this.setupMinWidth();
        this.setupNaturalColumnWidth();
        this.setupColumnWidth();
        this.distributeRemainingWidth();
        this.setColumnStyle();
        this.compensateScrollbarWidth();

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
    }

    setupMinWidth() {
        $.each('.dt-cell[data-is-header]', this.header).map(col => {
            const { colIndex } = $.data(col);
            const column = this.getColumn(colIndex);

            if (!column.minWidth) {
                const width = $.style($('.dt-cell__content', col), 'width');
                // only set this once
                column.minWidth = width;
            }
        });
    }

    setupNaturalColumnWidth() {
        if (!$('.dt-row')) return;

        // set initial width as naturally calculated by table's first row
        $.each('.dt-row[data-row-index="0"] .dt-cell', this.bodyScrollable).map($cell => {
            const {
                colIndex
            } = $.data($cell);
            const column = this.datamanager.getColumn(colIndex);

            let naturalWidth = $.style($('.dt-cell__content', $cell), 'width');

            if (column.id === '_rowIndex') {
                naturalWidth = this.getRowIndexColumnWidth(naturalWidth);
                column.width = naturalWidth;
            }

            column.naturalWidth = naturalWidth;
        });
    }

    setupColumnWidth() {
        if (this.options.layout === 'ratio') {
            let totalWidth = $.style(this.datatableWrapper, 'width');

            if (this.options.serialNoColumn) {
                const rowIndexColumn = this.datamanager.getColumnById('_rowIndex');
                totalWidth = totalWidth - rowIndexColumn.width - 1;
            }

            if (this.options.checkboxColumn) {
                const rowIndexColumn = this.datamanager.getColumnById('_checkbox');
                totalWidth = totalWidth - rowIndexColumn.width - 1;
            }

            const totalParts = this.datamanager.getColumns()
                .map(column => {
                    if (column.id === '_rowIndex' || column.id === '_checkbox') {
                        return 0;
                    }
                    if (!column.width) {
                        column.width = 1;
                    }
                    column.ratioWidth = parseInt(column.width, 10);
                    return column.ratioWidth;
                })
                .reduce((a, c) => a + c);

            const onePart = totalWidth / totalParts;

            this.datamanager.getColumns()
                .map(column => {
                    if (column.id === '_rowIndex' || column.id === '_checkbox') return;
                    column.width = Math.floor(onePart * column.ratioWidth) - 1;
                });
        } else {
            this.datamanager.getColumns()
                .map(column => {
                    if (!column.width) {
                        column.width = column.naturalWidth;
                    }
                    if (column.width < column.minWidth) {
                        column.width = column.minWidth;
                    }
                });
        }
    }

    compensateScrollbarWidth() {
        requestAnimationFrame(() => {
            const scrollbarWidth = $.scrollbarWidth();
            const lastCol = this.datamanager.getColumn(-1);
            const width = lastCol.width - scrollbarWidth;
            this.columnmanager.setColumnWidth(lastCol.colIndex, width);
        });
    }

    distributeRemainingWidth() {
        if (this.options.layout !== 'fluid') return;

        const wrapperWidth = $.style(this.instance.datatableWrapper, 'width');
        const headerWidth = $.style(this.header, 'width');
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
        if (this.options.dynamicRowHeight) return;
        if (this.__cellHeightSet) return;
        const $firstCell = $('.dt-cell[data-is-header]', this.instance.header);
        if (!$firstCell) return;

        const height = this.options.cellHeight || $.style($firstCell, 'height');
        if (height) {
            this.setCellHeight(height);
            this.__cellHeightSet = true;
        }
    }

    setCellHeight(height) {
        this.setStyle('.dt-cell__content, .dt-cell__edit', {
            height: height + 'px'
        });
    }

    setColumnStyle() {
        // align columns
        this.datamanager.getColumns()
            .map(column => {
                // alignment
                if (!column.align) {
                    column.align = 'left';
                }
                if (!['left', 'center', 'right'].includes(column.align)) {
                    column.align = 'left';
                }
                this.setStyle(`.dt-cell--col-${column.colIndex}`, {
                    'text-align': column.align
                });

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
        requestAnimationFrame(() => {
            const width = $.style(this.header, 'width');

            $.style(this.bodyScrollable, {
                width: width + 'px'
            });

            const $body = $('.dt-body', this.bodyScrollable);

            if ($body) {
                $.style($body, {
                    height: '0px'
                });
            }

            $.style(this.bodyScrollable, {
                marginTop: $.style(this.header, 'height') + 'px'
            });

            $.style($('table', this.bodyScrollable), {
                margin: 0,
                width: '100%'
            });
        });
    }

    getColumnHeaderElement(colIndex) {
        colIndex = +colIndex;
        if (colIndex < 0) return null;
        return $(`.dt-cell[data-col-index="${colIndex}"]`, this.header);
    }

    getRowIndexColumnWidth(baseWidth) {
        this._rowIndexColumnWidthMap = this._rowIndexColumnWidthMap || {};
        const rowCount = this.datamanager.getRowCount();
        const digits = (rowCount + '').length;

        if (!this._rowIndexColumnWidthMap[digits]) {
            // add 8px for each unit
            this._rowIndexColumnWidthMap[digits] = baseWidth + ((digits - 1) * 8);
        }

        return this._rowIndexColumnWidthMap[digits];
    }
}
