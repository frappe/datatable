function camelCaseToDash(str) {
  return str.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
}

function makeDataAttributeString(props) {
  const keys = Object.keys(props);

  return keys
    .map((key) => {
      const _key = camelCaseToDash(key);
      const val = props[key];

      if (val === undefined) return '';
      return `data-${_key}="${val}" `;
    })
    .join('')
    .trim();
}

function getEditCellHTML() {
  return `
    <div class="edit-cell"></div>
  `;
}

function getColumnHTML(column) {
  const { rowIndex, colIndex, isHeader } = column;
  const dataAttr = makeDataAttributeString({
    rowIndex,
    colIndex,
    isHeader
  });

  const editCellHTML = isHeader ? '' : getEditCellHTML();

  return `
    <td class="data-table-col noselect" ${dataAttr}>
      <div class="content ellipsis">
        ${column.format ? column.format(column.content) : column.content}
        <span class="sort-indicator"></span>
      </div>
      ${editCellHTML}
    </td>
  `;
}

function getRowHTML(columns, props) {
  const dataAttr = makeDataAttributeString(props);

  return `
    <tr class="data-table-row" ${dataAttr}>
      ${columns.map(getColumnHTML).join('')}
    </tr>
  `;
}

function getHeaderHTML(columns) {
  const $header = `
    <thead>
      ${getRowHTML(columns, { isHeader: 1, rowIndex: -1 })}
    </thead>
  `;

  // columns.map(col => {
  //   if (!col.width) return;
  //   const $cellContent = $header.find(
  //     `.data-table-col[data-col-index="${col.colIndex}"] .content`
  //   );

  //   $cellContent.width(col.width);
  // });

  return $header;
}

function getBodyHTML(rows) {
  return `
    <tbody>
      ${rows.map(row => getRowHTML(row, { rowIndex: row[0].rowIndex })).join('')}
    </tbody>
  `;
}

function prepareColumn(col, i) {
  if (typeof col === 'string') {
    col = {
      content: col
    };
  }
  return Object.assign(col, {
    colIndex: i
  });
}

function prepareColumns(columns, props = {}) {
  const _columns = columns.map(prepareColumn);

  return _columns.map(col => Object.assign({}, col, props));
}

function prepareRowHeader(columns) {
  return prepareColumns(columns, {
    rowIndex: -1,
    isHeader: 1,
    format: (content) => `<span>${content}</span>`
  });
}

function prepareRow(row, i) {
  return prepareColumns(row, {
    rowIndex: i
  });
}

function prepareRows(rows) {
  return rows.map(prepareRow);
}

function getDefault(a, b) {
  return a !== undefined ? a : b;
}

function escapeRegExp(str) {
  // https://stackoverflow.com/a/6969486
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

function getCSSString(styleMap) {
  let style = '';

  for (const prop in styleMap) {
    if (styleMap.hasOwnProperty(prop)) {
      style += `${prop}: ${styleMap[prop]}; `;
    }
  }

  return style.trim();
}

function getCSSRuleBlock(rule, styleMap) {
  return `${rule} { ${getCSSString(styleMap)} }`;
}

function namespaceSelector(selector) {
  return '.data-table ' + selector;
}

function buildCSSRule(rule, styleMap, cssRulesString = '') {
  // build css rules efficiently,
  // append new rule if doesnt exist,
  // update existing ones

  const rulePatternStr = `${escapeRegExp(rule)} {([^}]*)}`;
  const rulePattern = new RegExp(rulePatternStr, 'g');

  if (cssRulesString && cssRulesString.match(rulePattern)) {
    for (const property in styleMap) {
      const value = styleMap[property];
      const propPattern = new RegExp(`${escapeRegExp(property)}:([^;]*);`);

      cssRulesString = cssRulesString.replace(rulePattern, function (match, propertyStr) {
        if (propertyStr.match(propPattern)) {
          // property exists, replace value with new value
          propertyStr = propertyStr.replace(propPattern, (match, valueStr) => {
            return `${property}: ${value};`;
          });
        }
        propertyStr = propertyStr.trim();

        const replacer =
          `${rule} { ${propertyStr} }`;

        return replacer;
      });
    }

    return cssRulesString;
  }
  // no match, append new rule block
  return `${cssRulesString}${getCSSRuleBlock(rule, styleMap)}`;
}

function removeCSSRule(rule, cssRulesString = '') {
  const rulePatternStr = `${escapeRegExp(rule)} {([^}]*)}`;
  const rulePattern = new RegExp(rulePatternStr, 'g');
  let output = cssRulesString;

  if (cssRulesString && cssRulesString.match(rulePattern)) {
    output = cssRulesString.replace(rulePattern, '');
  }

  return output.trim();
}

export default {
  getHeaderHTML,
  getBodyHTML,
  getRowHTML,
  getColumnHTML,
  getEditCellHTML,
  prepareRowHeader,
  prepareRows,
  namespaceSelector,
  getCSSString,
  buildCSSRule,
  removeCSSRule,
  makeDataAttributeString,
  getDefault,
  escapeRegExp
};
