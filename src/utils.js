import $ from 'jQuery';

function getCell(cell) {
  const customAttr = [
    !isNaN(cell.colIndex) ? `data-col-index="${cell.colIndex}"` : '',
    !isNaN(cell.rowIndex) ? `data-row-index="${cell.rowIndex}"` : '',
    cell.isHeader ? 'data-sort-by="none"' : ''
  ].join(' ');

  return `
      <td class="data-table-col noselect" ${customAttr}>
        <div class="content ellipsis">
          ${cell.format ? cell.format(cell.data) : cell.data}
        </div>
      </td>
    `;
}

function getRow(row) {
  const header = row.isHeader ? 'data-header' : '';
  const cells = row.cells;
  const dataRowIndex = !isNaN(cells[0].rowIndex) ?
    `data-row-index="${cells[0].rowIndex}"` : '';

  return `
      <tr class="data-table-row" ${dataRowIndex} ${header}>
        ${cells.map(getCell).join('')}
      </tr>
    `;
}

function getHeader(columns) {
  const $header = $(`<thead>
      ${getRow({ cells: columns, isHeader: 1 })}
    </thead>
    `);

  columns.map(col => {
    if (!col.width) return;
    const $cellContent = $header.find(
      `.data-table-col[data-col-index="${col.colIndex}"] .content`
    );

    $cellContent.width(col.width);
    // $cell_content.css('max-width', col.width + 'px');
  });

  return $header;
}

function getBody(rows) {
  return `<tbody>
      ${rows.map(row => getRow({ cells: row })).join('')}
    </tbody>
    `;
}

export default {
  getHeader,
  getBody,
  getRow,
  getCell
};
