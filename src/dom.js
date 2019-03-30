export default function $(expr, con) {
    return typeof expr === 'string' ?
        (con || document).querySelector(expr) :
        expr || null;
}

$.each = (expr, con) => {
    return typeof expr === 'string' ?
        Array.from((con || document).querySelectorAll(expr)) :
        expr || null;
};

$.create = (tag, o) => {
    let element = document.createElement(tag);

    for (let i in o) {
        let val = o[i];

        if (i === 'inside') {
            $(val).appendChild(element);
        } else
        if (i === 'around') {
            let ref = $(val);
            ref.parentNode.insertBefore(element, ref);
            element.appendChild(ref);
        } else
        if (i === 'styles') {
            if (typeof val === 'object') {
                Object.keys(val).map(prop => {
                    element.style[prop] = val[prop];
                });
            }
        } else
        if (i in element) {
            element[i] = val;
        } else {
            element.setAttribute(i, val);
        }
    }

    return element;
};

$.on = (element, event, selector, callback) => {
    if (!callback) {
        callback = selector;
        $.bind(element, event, callback);
    } else {
        $.delegate(element, event, selector, callback);
    }
};

$.off = (element, event, handler) => {
    element.removeEventListener(event, handler);
};

$.bind = (element, event, callback) => {
    event.split(/\s+/).forEach(function (event) {
        element.addEventListener(event, callback);
    });
};

$.delegate = (element, event, selector, callback) => {
    element.addEventListener(event, function (e) {
        const delegatedTarget = e.target.closest(selector);
        if (delegatedTarget) {
            e.delegatedTarget = delegatedTarget;
            callback.call(this, e, delegatedTarget);
        }
    });
};

$.unbind = (element, o) => {
    if (element) {
        for (let event in o) {
            let callback = o[event];

            event.split(/\s+/).forEach(function (event) {
                element.removeEventListener(event, callback);
            });
        }
    }
};

$.fire = (target, type, properties) => {
    let evt = document.createEvent('HTMLEvents');

    evt.initEvent(type, true, true);

    for (let j in properties) {
        evt[j] = properties[j];
    }

    return target.dispatchEvent(evt);
};

$.data = (element, attrs) => { // eslint-disable-line
    if (!attrs) {
        return element.dataset;
    }

    for (const attr in attrs) {
        element.dataset[attr] = attrs[attr];
    }
};

$.style = (elements, styleMap) => { // eslint-disable-line

    if (typeof styleMap === 'string') {
        return $.getStyle(elements, styleMap);
    }

    if (!Array.isArray(elements)) {
        elements = [elements];
    }

    elements.map(element => {
        for (const prop in styleMap) {
            element.style[prop] = styleMap[prop];
        }
    });
};

$.removeStyle = (elements, styleProps) => {
    if (!Array.isArray(elements)) {
        elements = [elements];
    }

    if (!Array.isArray(styleProps)) {
        styleProps = [styleProps];
    }

    elements.map(element => {
        for (const prop of styleProps) {
            element.style[prop] = '';
        }
    });
};

$.getStyle = (element, prop) => {
    if (!prop) {
        return getComputedStyle(element);
    }

    let val = getComputedStyle(element)[prop];

    if (['width', 'height'].includes(prop)) {
        val = parseFloat(val);
    }

    return val;
};

$.closest = (selector, element) => {
    if (!element) return null;

    if (element.matches(selector)) {
        return element;
    }

    return $.closest(selector, element.parentNode);
};

$.inViewport = (el, parentEl) => {
    const {
        top,
        left,
        bottom,
        right
    } = el.getBoundingClientRect();
    const {
        top: pTop,
        left: pLeft,
        bottom: pBottom,
        right: pRight
    } = parentEl.getBoundingClientRect();

    return top >= pTop && left >= pLeft && bottom <= pBottom && right <= pRight;
};

$.scrollTop = function scrollTop(element, pixels) {
    requestAnimationFrame(() => {
        element.scrollTop = pixels;
    });
};

$.scrollbarSize = function scrollbarSize() {
    if (!$.scrollBarSizeValue) {
        $.scrollBarSizeValue = getScrollBarSize();
    }
    return $.scrollBarSizeValue;
};

function getScrollBarSize() {
    // assume scrollbar width and height would be the same

    // Create the measurement node
    const scrollDiv = document.createElement('div');
    $.style(scrollDiv, {
        width: '100px',
        height: '100px',
        overflow: 'scroll',
        position: 'absolute',
        top: '-9999px'
    });
    document.body.appendChild(scrollDiv);

    // Get the scrollbar width
    const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;

    // Delete the DIV
    document.body.removeChild(scrollDiv);

    return scrollbarWidth;
}

$.hasVerticalOverflow = function (element) {
    return element.scrollHeight > element.offsetHeight + 10;
};

$.hasHorizontalOverflow = function (element) {
    return element.scrollWidth > element.offsetWidth + 10;
};

$.measureTextWidth = function (text) {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.height = 'auto';
    div.style.width = 'auto';
    div.style.whiteSpace = 'nowrap';
    div.innerText = text;
    document.body.appendChild(div);
    return div.clientWidth + 1;
};
