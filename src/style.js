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
            'header', 'footer', 'bodyScrollable', 'datatableWrapper',
            'getColumn', 'bodyRenderer'
        ]);

        this.scopeClass = 'dt-instance-' + instance.constructor.instances;
        instance.datatableWrapper.classList.add(this.scopeClass);

        const styleEl = document.createElement('style');
        instance.wrapper.insertBefore(styleEl, instance.datatableWrapper);
        this.styleEl = styleEl;

        this.bindResizeWindow();
        this.bindScrollHeader();
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

    bindScrollHeader() {
        this._settingHeaderPosition = false;

        $.on(this.bodyScrollable, 'scroll', (e) => {
            if (this._settingHeaderPosition) return;

            this._settingHeaderPosition = true;

            requestAnimationFrame(() => {
                const left = -e.target.scrollLeft;

                $.style(this.header, {
                    transform: `translateX(${left}px)`
                });
                $.style(this.footer, {
                    transform: `translateX(${left}px)`
                });
                this._settingHeaderPosition = false;
            });
        });
    }

    onWindowResize() {
        this.distributeRemainingWidth();
        this.refreshColumnWidth();
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

        selector = selector.trim();
        if (!selector) return;

        this._styleRulesMap = this._styleRulesMap || {};
        const prefixedSelector = this._getPrefixedSelector(selector);

        if (this._styleRulesMap[prefixedSelector]) {
            this.removeStyle(selector);

            // merge with old styleobject
            styleObject = Object.assign({}, this._styleRulesMap[prefixedSelector], styleObject);
        }

        const styleString = this._getRuleString(styleObject);
        const ruleString = `${prefixedSelector} { ${styleString} }`;

        this._styleRulesMap[prefixedSelector] = styleObject;
        this.stylesheet.insertRule(ruleString);
    }

    removeStyle(selector) {
        if (selector.includes(',')) {
            selector.split(',')
                .map(s => s.trim())
                .forEach(selector => {
                    this.removeStyle(selector);
                });
            return;
        }

        selector = selector.trim();
        if (!selector) return;

        // find and remove
        const prefixedSelector = this._getPrefixedSelector(selector);
        const index = Array.from(this.stylesheet.cssRules)
            .findIndex(rule => rule.selectorText === prefixedSelector);

        if (index === -1) return;
        this.stylesheet.deleteRule(index);
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
        this.setCellHeight();
        this.setupMinWidth();
        this.setupNaturalColumnWidth();
        this.setupColumnWidth();
        this.distributeRemainingWidth();
        this.setColumnStyle();
        this.setBodyStyle();
    }

    setCellHeight() {
        this.setStyle('.dt-cell', {
            height: this.options.cellHeight + 'px'
        });
    }

    setupMinWidth() {
        $.each('.dt-cell--header', this.header).map(col => {
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

        $.each('.dt-row-header .dt-cell', this.header).map($headerCell => {
            const { colIndex } = $.data($headerCell);
            const column = this.datamanager.getColumn(colIndex);
            let width = $.style($('.dt-cell__content', $headerCell), 'width');
            if (typeof width === 'number' && width >= this.options.minimumColumnWidth) {
                column.naturalWidth = width;
            } else {
                column.naturalWidth = this.options.minimumColumnWidth;
            }
        });

        // set initial width as naturally calculated by table's first row
        $.each('.dt-row-0 .dt-cell', this.bodyScrollable).map($cell => {
            const {
                colIndex
            } = $.data($cell);
            const column = this.datamanager.getColumn(colIndex);

            let naturalWidth = $.style($('.dt-cell__content', $cell), 'width');

            if (typeof naturalWidth === 'number' && naturalWidth >= column.naturalWidth) {
                column.naturalWidth = naturalWidth;
            } else {
                column.naturalWidth = column.naturalWidth;
            }
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
                    if (column.id === '_rowIndex') {
                        column.width = this.getRowIndexColumnWidth();
                    }
                    if (column.width < this.options.minimumColumnWidth) {
                        column.width = this.options.minimumColumnWidth;
                    }
                });
        }
    }

    distributeRemainingWidth() {
        if (this.options.layout !== 'fluid') return;

        const wrapperWidth = $.style(this.instance.datatableWrapper, 'width');
        let firstRow = $('.dt-row', this.bodyScrollable);
        let firstRowWidth = wrapperWidth;
        if (!firstRow) {
            let headerRow = $('.dt-row', this.instance.header);
            let cellWidths = Array.from(headerRow.children)
                .map(cell => cell.offsetWidth);
            firstRowWidth = cellWidths.reduce((sum, a) => sum + a, 0);
        } else {
            firstRowWidth = $.style(firstRow, 'width');
        }
        const resizableColumns = this.datamanager.getColumns().filter(col => col.resizable);
        const deltaWidth = (wrapperWidth - firstRowWidth) / resizableColumns.length;

        resizableColumns.map(col => {
            const width = $.style(this.getColumnHeaderElement(col.colIndex), 'width');
            let finalWidth = Math.floor(width + deltaWidth) - 2;

            this.datamanager.updateColumn(col.colIndex, {
                width: finalWidth
            });
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
    }

    refreshColumnWidth() {
        this.datamanager.getColumns()
            .map(column => {
                this.columnmanager.setColumnHeaderWidth(column.colIndex);
                this.columnmanager.setColumnWidth(column.colIndex);
            });
    }

    setBodyStyle() {
        const bodyWidth = $.style(this.datatableWrapper, 'width');
        const firstRow = $('.dt-row', this.bodyScrollable);
        if (!firstRow) return;
        const rowWidth = $.style(firstRow, 'width');

        let width = bodyWidth > rowWidth ? rowWidth : bodyWidth;
        $.style(this.bodyScrollable, {
            width: width + 'px'
        });

        // remove the body height, so that it resets to it's original
        $.removeStyle(this.bodyScrollable, 'height');

        // when there are less rows than the container
        // adapt the container height
        let bodyHeight = $.getStyle(this.bodyScrollable, 'height');
        const scrollHeight = (this.bodyRenderer.hyperlist || {})._scrollHeight || Infinity;
        const hasHorizontalOverflow = $.hasHorizontalOverflow(this.bodyScrollable);

        let height;

        if (scrollHeight < bodyHeight) {
            height = scrollHeight;

            // account for scrollbar size when
            // there is horizontal overflow
            if (hasHorizontalOverflow) {
                height += $.scrollbarSize();
            }

            $.style(this.bodyScrollable, {
                height: height + 'px'
            });
        }

        const verticalOverflow = this.bodyScrollable.scrollHeight - this.bodyScrollable.offsetHeight;
        if (verticalOverflow < $.scrollbarSize()) {
            // if verticalOverflow is less than scrollbar size
            // then most likely scrollbar is causing the scroll
            // which is not needed
            $.style(this.bodyScrollable, {
                overflowY: 'hidden'
            });
        }

        if (this.options.layout === 'fluid') {
            $.style(this.bodyScrollable, {
                overflowX: 'hidden'
            });
        }
    }

    getColumnHeaderElement(colIndex) {
        colIndex = +colIndex;
        if (colIndex < 0) return null;
        return $(`.dt-cell--col-${colIndex}`, this.header);
    }

    getRowIndexColumnWidth() {
        const rowCount = this.datamanager.getRowCount();
        const padding = 22;
        return $.measureTextWidth(rowCount + '') + padding;
    }
}
