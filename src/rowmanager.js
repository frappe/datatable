import $ from './dom';
import { makeDataAttributeString } from './utils';
import { getCellHTML } from './cellmanager';

export default class RowManager {
  constructor(instance) {
    this.instance = instance;
    this.options = this.instance.options;
    this.wrapper = this.instance.wrapper;
    this.bodyScrollable = this.instance.bodyScrollable;

    this.bindEvents();
  }

  get datamanager() {
    return this.instance.datamanager;
  }

  bindEvents() {
    this.bindCheckbox();
  }

  bindCheckbox() {
    if (!this.options.addCheckboxColumn) return;

    // map of checked rows
    this.checkMap = [];

    $.on(this.wrapper, 'click', '.data-table-col[data-col-index="0"] [type="checkbox"]', (e, $checkbox) => {
      const $cell = $checkbox.closest('.data-table-col');
      const { rowIndex, isHeader } = $.data($cell);
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

  getCheckedRows() {
    return this.checkMap
      .map((c, rowIndex) => {
        if (c) {
          return rowIndex;
        }
        return null;
      })
      .filter(c => {
        return c !== null || c !== undefined;
      });
  }

  highlightCheckedRows() {
    this.getCheckedRows()
      .map(rowIndex => this.checkRow(rowIndex, true));
  }

  checkRow(rowIndex, toggle) {
    const value = toggle ? 1 : 0;

    // update internal map
    this.checkMap[rowIndex] = value;
    // set checkbox value explicitly
    $.each(`.data-table-col[data-row-index="${rowIndex}"][data-col-index="0"] [type="checkbox"]`, this.bodyScrollable)
      .map(input => {
        input.checked = toggle;
      });
    // highlight row
    this.highlightRow(rowIndex, toggle);
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
    $.each('.data-table-col[data-col-index="0"] [type="checkbox"]', this.bodyScrollable)
      .map(input => {
        input.checked = toggle;
      });
    // highlight all
    this.highlightAll(toggle);
  }

  highlightRow(rowIndex, toggle = true) {
    const $row = this.getRow$(rowIndex);
    if (!$row) return;

    if (toggle) {
      $row.classList.add('row-highlight');
    } else {
      $row.classList.remove('row-highlight');
    }
  }

  highlightAll(toggle = true) {
    if (toggle) {
      this.bodyScrollable.classList.add('row-highlight-all');
    } else {
      this.bodyScrollable.classList.remove('row-highlight-all');
    }
  }

  getRow$(rowIndex) {
    return $(`.data-table-row[data-row-index="${rowIndex}"]`, this.bodyScrollable);
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
}

export function getRowHTML(columns, props) {
  const dataAttr = makeDataAttributeString(props);

  return `
    <tr class="data-table-row" ${dataAttr}>
      ${columns.map(getCellHTML).join('')}
    </tr>
  `;
}
