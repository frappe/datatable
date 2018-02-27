import _throttle from 'lodash/throttle';
import _debounce from 'lodash/debounce';

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

export function getDefault(a, b) {
    return a !== undefined ? a : b;
}

export function escapeRegExp(str) {
    // https://stackoverflow.com/a/6969486
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

export function getCSSString(styleMap) {
    let style = '';

    for (const prop in styleMap) {
        if (styleMap.hasOwnProperty(prop)) {
            style += `${prop}: ${styleMap[prop]}; `;
        }
    }

    return style.trim();
}

export function getCSSRuleBlock(rule, styleMap) {
    return `${rule} { ${getCSSString(styleMap)} }`;
}

export function buildCSSRule(rule, styleMap, cssRulesString = '') {
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

export function removeCSSRule(rule, cssRulesString = '') {
    const rulePatternStr = `${escapeRegExp(rule)} {([^}]*)}`;
    const rulePattern = new RegExp(rulePatternStr, 'g');
    let output = cssRulesString;

    if (cssRulesString && cssRulesString.match(rulePattern)) {
        output = cssRulesString.replace(rulePattern, '');
    }

    return output.trim();
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

export function promisify(fn, context = null) {
    return (...args) => {
        return new Promise(resolve => {
            setTimeout(() => {
                const out = fn.apply(context, args);
                resolve(out);
            }, 0);
        });
    };
};

export function chainPromises(promises) {
    return promises.reduce(
        (prev, cur) => prev.then(cur), Promise.resolve()
    );
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
