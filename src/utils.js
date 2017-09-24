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

function getColumnHTML(column) {
  const { rowIndex, colIndex, isHeader } = column;
  const dataAttr = makeDataAttributeString({
    rowIndex,
    colIndex,
    isHeader
  });

  return `
    <td class="data-table-col noselect" ${dataAttr}>
      <div class="content ellipsis">
        ${column.format ? column.format(column.content) : column.content}
      </div>
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

  return _columns.map(col => Object.assign(col, props));
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

export default {
  getHeaderHTML,
  getBodyHTML,
  getRowHTML,
  getColumnHTML,
  prepareRowHeader,
  prepareRows,
  makeDataAttributeString
};
