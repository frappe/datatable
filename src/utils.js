import _throttle from 'lodash/throttle';
import _debounce from 'lodash/debounce';
import _uniq from 'lodash/uniq';

export function camelCaseToDash(str) {
    return str.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
}

export function makeDataAttributeString(props) {
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

export function copyTextToClipboard(text) {
    // https://stackoverflow.com/a/30810322/5353542
    var textArea = document.createElement('textarea');

    //
    // *** This styling is an extra step which is likely not required. ***
    //
    // Why is it here? To ensure:
    // 1. the element is able to have focus and selection.
    // 2. if element was to flash render it has minimal visual impact.
    // 3. less flakyness with selection and copying which **might** occur if
    //    the textarea element is not visible.
    //
    // The likelihood is the element won't even render, not even a flash,
    // so some of these are just precautions. However in IE the element
    // is visible whilst the popup box asking the user for permission for
    // the web page to copy to the clipboard.
    //

    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';

    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;

    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';

    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';

    textArea.value = text;

    document.body.appendChild(textArea);

    textArea.select();

    try {
        document.execCommand('copy');
    } catch (err) {
        console.log('Oops, unable to copy');
    }

    document.body.removeChild(textArea);
}

export function isNumeric(val) {
    return !isNaN(val);
}

export let throttle = _throttle;

export let debounce = _debounce;

export function nextTick(fn, context = null) {
    return (...args) => {
        return new Promise(resolve => {
            const execute = () => {
                const out = fn.apply(context, args);
                resolve(out);
            };
            setTimeout(execute);
        });
    };
};

export function linkProperties(target, source, properties) {
    const props = properties.reduce((acc, prop) => {
        acc[prop] = {
            get() {
                return source[prop];
            }
        };
        return acc;
    }, {});
    Object.defineProperties(target, props);
};

export function isSet(val) {
    return val !== undefined || val !== null;
}

export function notSet(val) {
    return !isSet(val);
}

export function isNumber(val) {
    return !isNaN(val);
}

export function ensureArray(val) {
    if (!Array.isArray(val)) {
        return [val];
    }
    return val;
}

export function uniq(arr) {
    return _uniq(arr);
}

export function numberSortAsc(a, b) {
    return a - b;
};

export function stripHTML(html) {
    return html.replace(/<[^>]*>/g, '');
};
