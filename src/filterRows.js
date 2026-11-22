import { isNumber, stripHTML } from './utils';
import CellManager from './cellmanager';

export default function filterRows(rows, filters, data) {
    let filteredRowIndices = [];

    if (Object.keys(filters).length === 0) {
        return rows.map(row => row.meta.rowIndex);
    }

    for (let colIndex in filters) {
        const keyword = filters[colIndex];

        const filteredRows = filteredRowIndices.length ?
            filteredRowIndices.map(i => rows[i]) :
            rows;

        const cells = filteredRows.map(row => row[colIndex]);

        let filter = guessFilter(keyword);
        if (filter.type === 'contains' && getFilterMode(data, cells[0]) === 'fuzzy') {
            filter.type = 'fuzzy';
        }
        let filterMethod = getFilterMethod(rows, data, filter);

        if (filterMethod) {
            filteredRowIndices = filterMethod(filter.text, cells);
        } else {
            filteredRowIndices = cells.map(cell => cell.rowIndex);
        }
    }

    return filteredRowIndices;
};

function getFilterMode(data, cell) {
    const columnMode = cell && cell.column && cell.column.filterMode;
    return columnMode || (data && data.options && data.options.filterMode);
}

function isFuzzyMatch(word, text) {
    let position = 0;
    for (const char of word) {
        position = text.indexOf(char, position);
        if (position === -1) return isTypoMatch(word, text);
        position += 1;
    }
    return true;
}

function isTypoMatch(word, text) {
    if (word.length < 4) return false;
    return text.split(/[\s.,;:!?()[\]{}<>"'`/\\|@#&*+=_-]+/).some(token =>
        [word.length - 1, word.length, word.length + 1]
            .some(length => length <= token.length && isOneEditAway(word, token.slice(0, length)))
    );
}

function isOneEditAway(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    if (a.length === b.length) {
        return a.slice(i + 1) === b.slice(i + 1) ||
            (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
    }
    const [longer, shorter] = a.length > b.length ? [a, b] : [b, a];
    return longer.slice(i + 1) === shorter.slice(i);
}

function getFilterMethod(rows, allData, filter) {
    const getFormattedValue = cell => {
        let formatter = CellManager.getCustomCellFormatter(cell);
        let rowData = rows[cell.rowIndex];
        if (allData && allData.data && allData.data.length) {
            rowData = allData.data[cell.rowIndex];
        }
        if (formatter && cell.content) {
            cell.html = formatter(cell.content, rows[cell.rowIndex], cell.column, rowData, filter);
            return stripHTML(cell.html);
        }
        return cell.content || '';
    };

    const stringCompareValue = cell =>
        String(stripHTML(cell.html || '') || getFormattedValue(cell)).toLowerCase();

    const numberCompareValue = cell => parseFloat(cell.content);

    const getCompareValues = (cell, keyword) => {
        if (cell.column.compareValue) {
            const compareValues = cell.column.compareValue(cell, keyword);
            if (compareValues && Array.isArray(compareValues)) return compareValues;
        }

        // check if it can be converted to number
        const float = numberCompareValue(cell);
        if (!isNaN(float)) {
            return [float, keyword];
        }

        return [stringCompareValue(cell), keyword];
    };

    let filterMethodMap = {
        contains(keyword, cells) {
            return cells
                .filter(cell => {
                    const needle = (keyword || '').toLowerCase();
                    return !needle ||
                        (cell.content || '').toLowerCase().includes(needle) ||
                        stringCompareValue(cell).includes(needle);
                })
                .map(cell => cell.rowIndex);
        },

        fuzzy(keyword, cells) {
            const words = keyword.split(/\s+/).filter(Boolean);
            return cells
                .filter(cell => {
                    const texts = [String(cell.content || '').toLowerCase(), stringCompareValue(cell)];
                    return words.every(word => texts.some(text => isFuzzyMatch(word, text)));
                })
                .map(cell => cell.rowIndex);
        },

        greaterThan(keyword, cells) {
            return cells
                .filter(cell => {
                    const [compareValue, keywordValue] = getCompareValues(cell, keyword);
                    return compareValue > keywordValue;
                })
                .map(cell => cell.rowIndex);
        },

        lessThan(keyword, cells) {
            return cells
                .filter(cell => {
                    const [compareValue, keywordValue] = getCompareValues(cell, keyword);
                    return compareValue < keywordValue;
                })
                .map(cell => cell.rowIndex);
        },

        equals(keyword, cells) {
            return cells
                .filter(cell => {
                    const value = parseFloat(cell.content);
                    return value === keyword;
                })
                .map(cell => cell.rowIndex);
        },

        notEquals(keyword, cells) {
            return cells
                .filter(cell => {
                    const value = parseFloat(cell.content);
                    return value !== keyword;
                })
                .map(cell => cell.rowIndex);
        },

        range(rangeValues, cells) {
            return cells
                .filter(cell => {
                    const values1 = getCompareValues(cell, rangeValues[0]);
                    const values2 = getCompareValues(cell, rangeValues[1]);
                    const value = values1[0];
                    return value >= values1[1] && value <= values2[1];
                })
                .map(cell => cell.rowIndex);
        },

        containsNumber(keyword, cells) {
            return cells
                .filter(cell => {
                    let number = parseFloat(keyword, 10);
                    let string = keyword;
                    let hayNumber = numberCompareValue(cell);
                    let hayString = stringCompareValue(cell);

                    return number === hayNumber || hayString.includes(string);
                })
                .map(cell => cell.rowIndex);
        }
    };

    return filterMethodMap[filter.type];
}

function guessFilter(keyword = '') {
    if (keyword.length === 0) return {};

    let compareString = keyword;

    if (['>', '<', '='].includes(compareString[0])) {
        compareString = keyword.slice(1);
    } else if (compareString.startsWith('!=')) {
        compareString = keyword.slice(2);
    }

    if (keyword.startsWith('>')) {
        if (compareString) {
            return {
                type: 'greaterThan',
                text: compareString.trim()
            };
        }
    }

    if (keyword.startsWith('<')) {
        if (compareString) {
            return {
                type: 'lessThan',
                text: compareString.trim()
            };
        }
    }

    if (keyword.startsWith('=')) {
        if (isNumber(compareString)) {
            return {
                type: 'equals',
                text: Number(keyword.slice(1).trim())
            };
        }
    }

    if (keyword.startsWith('!=')) {
        if (isNumber(compareString)) {
            return {
                type: 'notEquals',
                text: Number(keyword.slice(2).trim())
            };
        }
    }

    if (isNumber(compareString)) {
        return {
            type: 'containsNumber',
            text: compareString
        };
    }

    if (keyword.split(':').length === 2 && keyword.split(':').every(v => isNumber(v.trim()))) {
        compareString = keyword.split(':');
        return {
            type: 'range',
            text: compareString.map(v => v.trim())
        };
    }

    return {
        type: 'contains',
        text: compareString.toLowerCase()
    };
}
