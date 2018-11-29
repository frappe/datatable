import { isNumber, stripHTML } from './utils';

export default function filterRows(rows, filters) {
    let filteredRowIndices = [];

    for (let colIndex in filters) {
        const keyword = filters[colIndex];

        const filteredRows = filteredRowIndices.length ?
            filteredRowIndices.map(i => rows[i]) :
            rows;

        const cells = filteredRows.map(row => row[colIndex]);

        let filter = guessFilter(keyword);
        let filterMethod = getFilterMethod(filter);

        if (filterMethod) {
            filteredRowIndices = filterMethod(filter.text, cells);
        } else {
            filteredRowIndices = cells.map(cell => cell.rowIndex);
        }
    }

    return filteredRowIndices;
};

function getFilterMethod(filter) {
    let filterMethodMap = {
        contains(keyword, cells) {
            return cells
                .filter(cell => {
                    const hay = String(stripHTML(cell.html) || '').toLowerCase();
                    const needle = (keyword || '').toLowerCase();
                    return !needle || hay.includes(needle);
                })
                .map(cell => cell.rowIndex);
        },

        greaterThan(keyword, cells) {
            return cells
                .filter(cell => {
                    const value = Number(stripHTML(cell.html));
                    return value > keyword;
                })
                .map(cell => cell.rowIndex);
        },

        lessThan(keyword, cells) {
            return cells
                .filter(cell => {
                    const value = Number(stripHTML(cell.html));
                    return value < keyword;
                })
                .map(cell => cell.rowIndex);
        },

        range(rangeValues, cells) {
            return cells
                .filter(cell => {
                    const value = Number(stripHTML(cell.html));
                    return value >= rangeValues[0] && value <= rangeValues[1];
                })
                .map(cell => cell.rowIndex);
        }
    };

    return filterMethodMap[filter.type];
}

function guessFilter(keyword) {
    if (keyword.length === 1) return {};

    if (keyword.startsWith('>')) {
        if (isNumber(keyword.slice(1))) {
            return {
                type: 'greaterThan',
                text: Number(keyword.slice(1).trim())
            };
        }

        keyword = keyword.slice(1);
    }

    if (keyword.startsWith('<')) {
        if (isNumber(keyword.slice(1))) {
            return {
                type: 'lessThan',
                text: Number(keyword.slice(1).trim())
            };
        }

        keyword = keyword.slice(1);
    }

    if (keyword.split(':').length === 2 && keyword.split(':').every(isNumber)) {
        return {
            type: 'range',
            text: keyword.split(':').map(v => v.trim()).map(Number)
        };
    }

    return {
        type: 'contains',
        text: keyword.toLowerCase()
    };
}
