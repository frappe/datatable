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
        this.updateStickyTopPositions(0);

        $.on(this.bodyScrollable, 'scroll', (e) => {
            if (this._settingHeaderPosition) return;

            this._settingHeaderPosition = true;

            requestAnimationFrame(() => {
                const scrollLeft = e.target.scrollLeft;
                const left = -scrollLeft;

                $.style(this.header, {
                    transform: `translateX(${left}px)`
                });
                $.style(this.footer, {
                    transform: `translateX(${left}px)`
                });
                this.updateStickyTopPositions(scrollLeft);
                this._settingHeaderPosition = false;
                if (this.instance.noData) {
                    $.style($('.no-data-message'), {
                        left: `${this.instance.wrapper.clientWidth / 2 - (left)}px`
                    });
                }
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
        this.refreshStickyColumns();
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

        // The first row is in the DOM, so its width also includes extras
        // like tree toggles and indentation
        $.each('.dt-row-0 .dt-cell', this.bodyScrollable).map($cell => {
            const {
                colIndex
            } = $.data($cell);
            const column = this.datamanager.getColumn(colIndex);

            let naturalWidth = $.style($('.dt-cell__content', $cell), 'width');

            if (typeof naturalWidth === 'number' && naturalWidth >= column.naturalWidth) {
                column.naturalWidth = naturalWidth;
            }
        });

        // Only the visible rows are in the DOM (virtual scroll),
        // so measure the longest value of each column from the data
        this.datamanager.getColumns().forEach(column => {
            if (column.width || ['_rowIndex', '_checkbox'].includes(column.id)) return;

            const contentWidth = this.getColumnContentWidth(column.colIndex);
            if (contentWidth > column.naturalWidth) {
                column.naturalWidth = contentWidth;
            }
        });
    }

    getColumnContentWidth(colIndex) {
        const $cellContent = this.bodyScrollable.querySelector('.dt-cell__content');
        if (!$cellContent) return 0;

        const htmls = this.getWidestCellHTMLs(colIndex, $cellContent);
        if (!htmls.length) return 0;

        const contentWidth = Math.max(...$.measureHTMLWidths(htmls, this.bodyScrollable));

        const {
            borderLeftWidth,
            borderRightWidth,
            paddingLeft,
            paddingRight
        } = $.getStyle($cellContent);

        const padding = [borderLeftWidth, borderRightWidth, paddingLeft, paddingRight]
            .map(parseFloat)
            .reduce((sum, val) => sum + val);

        return contentWidth + padding;
    }

    // Measuring every value in the DOM is slow for large data, so a canvas
    // picks the widest few texts and only those are measured in the DOM
    getWidestCellHTMLs(colIndex, $cellContent, count = 10) {
        const values = this.getColumnValues(colIndex);
        if (values.length <= count) return values.map(value => value.html);

        const context = this.getTextMeasureContext($cellContent);
        return values
            .map(value => ({ html: value.html, width: context.measureText(value.text).width }))
            .sort((a, b) => b.width - a.width)
            .slice(0, count)
            .map(value => value.html);
    }

    getTextMeasureContext($cellContent) {
        if (!this.textMeasureContext) {
            this.textMeasureContext = document.createElement('canvas').getContext('2d');
        }

        const { fontStyle, fontWeight, fontSize, fontFamily } = $.getStyle($cellContent);
        this.textMeasureContext.font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;
        return this.textMeasureContext;
    }

    // The unique values of a column, as the HTML and the text that the cells show
    getColumnValues(colIndex) {
        const rows = this.bodyRenderer.visibleRows || [];
        const values = new Map();

        rows.forEach(row => {
            const cell = row[colIndex];
            if (!cell) return;

            const html = this.getCellContentHTML(cell);
            if (html && !values.has(html)) {
                values.set(html, { html, text: this.getTextFromHTML(html) });
            }
        });

        return Array.from(values.values());
    }

    // The cell content with the column formatter applied
    getCellContentHTML(cell) {
        const formatter = cell.format || (cell.column && cell.column.format);
        let html = cell.content;

        if (formatter) {
            html = cell.html;
            if (html == null) {
                const row = this.datamanager.getRow(cell.rowIndex);
                const data = this.datamanager.getData(cell.rowIndex);
                html = formatter(cell.content, row, cell.column, data);
            }
        }

        return html == null ? '' : String(html).trim();
    }

    getTextFromHTML(html) {
        if (!/[<&]/.test(html)) return html.replace(/\s+/g, ' ');

        // A template element is inert, so images and scripts in the HTML do not load or run
        if (!this.textParser) {
            this.textParser = document.createElement('template');
        }
        this.textParser.innerHTML = html;
        return this.textParser.content.textContent.replace(/\s+/g, ' ').trim();
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
        this.refreshStickyColumns();
    }

    refreshStickyColumns() {
        this.setStickyColumnStyle();
        this.updateStickyTopPositions(this.bodyScrollable.scrollLeft || 0);
    }

    setBodyStyle() {
        const bodyWidth = $.style(this.datatableWrapper, 'width');
        const firstRow = $('.dt-row', this.bodyScrollable);
        if (!firstRow) return;
        const rowWidth = $.style(firstRow, 'width');

        let width = bodyWidth > rowWidth ? rowWidth + 10 : bodyWidth;
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

    setStickyColumnStyle() {
        if (!this.datamanager || !this.datamanager.getColumns) return;

        const columns = this.datamanager.getColumns();
        if (!columns.some(column => column.sticky) && !(this._stickySelectors || []).length) return;

        const stickySelectors = [];
        let stickyOffset = 0;
        let normalOffset = 0;

        columns.forEach((column) => {
            const $headerCell = this.getColumnHeaderElement(column.colIndex);
            const renderedWidth = $headerCell ? $headerCell.offsetWidth : column.width;

            if (column.sticky) {
                const selector = `.dt-cell--col-${column.colIndex}.dt-cell--sticky`;
                const style = {
                    left: `${stickyOffset}px`
                };

                column.stickyLeft = stickyOffset;
                column.stickyScrollTrigger = normalOffset - stickyOffset;
                column.renderedWidth = renderedWidth;
                this.setStyle(selector, style);
                stickySelectors.push(selector);
                stickyOffset += renderedWidth;
            }
            normalOffset += renderedWidth;
        });

        const staleSelectors = (this._stickySelectors || [])
            .filter(selector => !stickySelectors.includes(selector));

        staleSelectors.forEach(selector => this.removeStyle(selector));
        this._stickySelectors = stickySelectors;
    }

    updateStickyTopPositions(scrollLeft) {
        if (!this.datamanager || !this.datamanager.getColumns) return;

        const stickyColumns = this.datamanager.getColumns().filter(column => column.sticky);

        stickyColumns.forEach((column) => {
            const trigger = Math.max(0, column.stickyScrollTrigger || 0);
            const compensation = Math.max(0, scrollLeft - trigger);
            const cells = $.each(`.dt-cell--col-${column.colIndex}.dt-cell--sticky-top`, this.wrapper) || [];

            $.style(cells, {
                transform: compensation ? `translateX(${compensation}px)` : ''
            });
        });
    }

    getRowIndexColumnWidth() {
        const rowCount = this.datamanager.getRowCount();
        const padding = 22;
        return $.measureTextWidth(rowCount + '') + padding;
    }
}
