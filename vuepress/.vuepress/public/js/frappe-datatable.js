var DataTable = (function (Sortable,Clusterize) {
'use strict';

Sortable = Sortable && Sortable.hasOwnProperty('default') ? Sortable['default'] : Sortable;
Clusterize = Clusterize && Clusterize.hasOwnProperty('default') ? Clusterize['default'] : Clusterize;

function $(expr, con) {
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

$.scrollbarWidth = function scrollbarWidth() {
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
};

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

var isObject_1 = isObject;

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

var _freeGlobal = freeGlobal;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = _freeGlobal || freeSelf || Function('return this')();

var _root = root;

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function() {
  return _root.Date.now();
};

var now_1 = now;

/** Built-in value references. */
var Symbol = _root.Symbol;

var _Symbol = Symbol;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

var _getRawTag = getRawTag;

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$1.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString$1.call(value);
}

var _objectToString = objectToString;

/** `Object#toString` result references. */
var nullTag = '[object Null]';
var undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag$1 && symToStringTag$1 in Object(value))
    ? _getRawTag(value)
    : _objectToString(value);
}

var _baseGetTag = baseGetTag;

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

var isObjectLike_1 = isObjectLike;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike_1(value) && _baseGetTag(value) == symbolTag);
}

var isSymbol_1 = isSymbol;

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol_1(value)) {
    return NAN;
  }
  if (isObject_1(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject_1(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

var toNumber_1 = toNumber;

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;
var nativeMin = Math.min;

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber_1(wait) || 0;
  if (isObject_1(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber_1(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        timeWaiting = wait - timeSinceLastCall;

    return maxing
      ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now_1();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now_1());
  }

  function debounced() {
    var time = now_1(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

var debounce_1 = debounce;

/** Error message constants. */
var FUNC_ERROR_TEXT$1 = 'Expected a function';

/**
 * Creates a throttled function that only invokes `func` at most once per
 * every `wait` milliseconds. The throttled function comes with a `cancel`
 * method to cancel delayed `func` invocations and a `flush` method to
 * immediately invoke them. Provide `options` to indicate whether `func`
 * should be invoked on the leading and/or trailing edge of the `wait`
 * timeout. The `func` is invoked with the last arguments provided to the
 * throttled function. Subsequent calls to the throttled function return the
 * result of the last `func` invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the throttled function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.throttle` and `_.debounce`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to throttle.
 * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=true]
 *  Specify invoking on the leading edge of the timeout.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new throttled function.
 * @example
 *
 * // Avoid excessively updating the position while scrolling.
 * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
 *
 * // Invoke `renewToken` when the click event is fired, but not more than once every 5 minutes.
 * var throttled = _.throttle(renewToken, 300000, { 'trailing': false });
 * jQuery(element).on('click', throttled);
 *
 * // Cancel the trailing throttled invocation.
 * jQuery(window).on('popstate', throttled.cancel);
 */
function throttle(func, wait, options) {
  var leading = true,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT$1);
  }
  if (isObject_1(options)) {
    leading = 'leading' in options ? !!options.leading : leading;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }
  return debounce_1(func, wait, {
    'leading': leading,
    'maxWait': wait,
    'trailing': trailing
  });
}

var throttle_1 = throttle;

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

function copyTextToClipboard(text) {
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

function isNumeric(val) {
    return !isNaN(val);
}

let throttle$1 = throttle_1;

let debounce$2 = debounce_1;

function nextTick(fn, context = null) {
    return (...args) => {
        return new Promise(resolve => {
            const execute = () => {
                const out = fn.apply(context, args);
                resolve(out);
            };

            if (window.setImmediate) {
                setImmediate(execute);
            } else if (window.requestAnimationFrame) {
                requestAnimationFrame(execute);
            } else {
                setTimeout(execute);
            }
        });
    };
}

function linkProperties(target, source, properties) {
    const props = properties.reduce((acc, prop) => {
        acc[prop] = {
            get() {
                return source[prop];
            }
        };
        return acc;
    }, {});
    Object.defineProperties(target, props);
}

function isSet(val) {
    return val !== undefined || val !== null;
}

function notSet(val) {
    return !isSet(val);
}

function isNumber(val) {
    return !isNaN(val);
}

function ensureArray(val) {
    if (!Array.isArray(val)) {
        return [val];
    }
    return val;
}

class DataManager {
    constructor(options) {
        this.options = options;
        this.sortRows = nextTick(this.sortRows, this);
        this.switchColumn = nextTick(this.switchColumn, this);
        this.removeColumn = nextTick(this.removeColumn, this);
        this.filterRows = nextTick(this.filterRows, this);
    }

    init(data, columns) {
        if (!data) {
            data = this.options.data;
        }
        if (columns) {
            this.options.columns = columns;
        }

        this.data = data;

        this.rowCount = 0;
        this.columns = [];
        this.rows = [];

        this.prepareColumns();
        this.prepareRows();
        this.prepareTreeRows();
        this.prepareRowView();

        this.prepareNumericColumns();
    }

    // computed property
    get currentSort() {
        const col = this.columns.find(col => col.sortOrder !== 'none');
        return col || {
            colIndex: -1,
            sortOrder: 'none'
        };
    }

    prepareColumns() {
        this.columns = [];
        this.validateColumns();
        this.prepareDefaultColumns();
        this.prepareHeader();
    }

    prepareDefaultColumns() {
        if (this.options.checkboxColumn && !this.hasColumnById('_checkbox')) {
            const cell = {
                id: '_checkbox',
                content: this.getCheckboxHTML(),
                editable: false,
                resizable: false,
                sortable: false,
                focusable: false,
                dropdown: false,
                width: 32
            };
            this.columns.push(cell);
        }

        if (this.options.serialNoColumn && !this.hasColumnById('_rowIndex')) {
            let cell = {
                id: '_rowIndex',
                content: '',
                align: 'center',
                editable: false,
                resizable: false,
                focusable: false,
                dropdown: false
            };

            this.columns.push(cell);
        }
    }

    prepareHeader() {
        let columns = this.columns.concat(this.options.columns);
        const baseCell = {
            isHeader: 1,
            editable: true,
            sortable: true,
            resizable: true,
            focusable: true,
            dropdown: true,
            width: null,
            format: (value) => {
                if (value === null || value === undefined) {
                    return '';
                }
                return value + '';
            }
        };

        this.columns = columns
            .map((cell, i) => this.prepareCell(cell, i))
            .map(col => Object.assign({}, baseCell, col))
            .map(col => {
                col.content = col.content || col.name || '';
                col.id = col.id || col.content;
                return col;
            });
    }

    prepareCell(content, i) {
        const cell = {
            content: '',
            sortOrder: 'none',
            colIndex: i,
            column: this.columns[i]
        };

        if (content !== null && typeof content === 'object') {
            // passed as column/header
            Object.assign(cell, content);
        } else {
            cell.content = content;
        }

        return cell;
    }

    prepareNumericColumns() {
        const row0 = this.getRow(0);
        if (!row0) return;
        this.columns = this.columns.map((column, i) => {

            const cellValue = row0[i].content;
            if (!column.align && cellValue && isNumeric(cellValue)) {
                column.align = 'right';
            }

            return column;
        });
    }

    prepareRows() {
        this.validateData(this.data);

        this.rows = this.data.map((d, i) => {
            const index = this._getNextRowCount();

            let row = [];
            let meta = {
                rowIndex: index
            };

            if (Array.isArray(d)) {
                // row is an array
                if (this.options.checkboxColumn) {
                    row.push(this.getCheckboxHTML());
                }
                if (this.options.serialNoColumn) {
                    row.push((index + 1) + '');
                }
                row = row.concat(d);

                while (row.length < this.columns.length) {
                    row.push('');
                }

            } else {
                // row is an object
                for (let col of this.columns) {
                    if (col.id === '_checkbox') {
                        row.push(this.getCheckboxHTML());
                    } else if (col.id === '_rowIndex') {
                        row.push((index + 1) + '');
                    } else {
                        row.push(d[col.id]);
                    }
                }

                meta.indent = d.indent || 0;
            }

            return this.prepareRow(row, meta);
        });
    }

    prepareTreeRows() {
        this.rows.forEach((row, i) => {
            if (isNumber(row.meta.indent)) {
                // if (i === 36) debugger;
                const nextRow = this.getRow(i + 1);
                row.meta.isLeaf = !nextRow ||
                    notSet(nextRow.meta.indent) ||
                    nextRow.meta.indent <= row.meta.indent;
            }
        });
    }

    prepareRowView() {
        // This is order in which rows will be rendered in the table.
        // When sorting happens, only this.rowViewOrder will change
        // and not the original this.rows
        this.rowViewOrder = this.rows.map(row => row.meta.rowIndex);
    }

    prepareRow(row, meta) {
        const baseRowCell = {
            rowIndex: meta.rowIndex,
            indent: meta.indent
        };

        row = row
            .map((cell, i) => this.prepareCell(cell, i))
            .map(cell => Object.assign({}, baseRowCell, cell));

        // monkey patched in array object
        row.meta = meta;
        return row;
    }

    validateColumns() {
        const columns = this.options.columns;
        if (!Array.isArray(columns)) {
            throw new DataError('`columns` must be an array');
        }

        columns.forEach((column, i) => {
            if (typeof column !== 'string' && typeof column !== 'object') {
                throw new DataError(`column "${i}" must be a string or an object`);
            }
        });
    }

    validateData(data) {
        if (Array.isArray(data) &&
            (data.length === 0 || Array.isArray(data[0]) || typeof data[0] === 'object')) {
            return true;
        }
        throw new DataError('`data` must be an array of arrays or objects');
    }

    appendRows(rows) {
        this.validateData(rows);

        this.rows.push(...this.prepareRows(rows));
    }

    sortRows(colIndex, sortOrder = 'none') {
        colIndex = +colIndex;

        // reset sortOrder and update for colIndex
        this.getColumns()
            .map(col => {
                if (col.colIndex === colIndex) {
                    col.sortOrder = sortOrder;
                } else {
                    col.sortOrder = 'none';
                }
            });

        this._sortRows(colIndex, sortOrder);
    }

    _sortRows(colIndex, sortOrder) {

        if (this.currentSort.colIndex === colIndex) {
            // reverse the array if only sortOrder changed
            if (
                (this.currentSort.sortOrder === 'asc' && sortOrder === 'desc') ||
                (this.currentSort.sortOrder === 'desc' && sortOrder === 'asc')
            ) {
                this.reverseArray(this.rowViewOrder);
                this.currentSort.sortOrder = sortOrder;
                return;
            }
        }

        this.rowViewOrder.sort((a, b) => {
            const aIndex = a;
            const bIndex = b;
            const aContent = this.getCell(colIndex, a).content;
            const bContent = this.getCell(colIndex, b).content;

            if (sortOrder === 'none') {
                return aIndex - bIndex;
            } else if (sortOrder === 'asc') {
                if (aContent < bContent) return -1;
                if (aContent > bContent) return 1;
                if (aContent === bContent) return 0;
            } else if (sortOrder === 'desc') {
                if (aContent < bContent) return 1;
                if (aContent > bContent) return -1;
                if (aContent === bContent) return 0;
            }
            return 0;
        });

        if (this.hasColumnById('_rowIndex')) {
            // update row index
            const srNoColIndex = this.getColumnIndexById('_rowIndex');
            this.rows.forEach((row, index) => {
                const viewIndex = this.rowViewOrder.indexOf(index);
                const cell = row[srNoColIndex];
                cell.content = (viewIndex + 1) + '';
            });
        }
    }

    reverseArray(array) {
        let left = null;
        let right = null;
        let length = array.length;

        for (left = 0, right = length - 1; left < right; left += 1, right -= 1) {
            const temporary = array[left];

            array[left] = array[right];
            array[right] = temporary;
        }
    }

    switchColumn(index1, index2) {
        // update columns
        const temp = this.columns[index1];
        this.columns[index1] = this.columns[index2];
        this.columns[index2] = temp;

        this.columns[index1].colIndex = index1;
        this.columns[index2].colIndex = index2;

        // update rows
        this.rows.forEach(row => {
            const newCell1 = Object.assign({}, row[index1], {
                colIndex: index2
            });
            const newCell2 = Object.assign({}, row[index2], {
                colIndex: index1
            });

            row[index2] = newCell1;
            row[index1] = newCell2;
        });
    }

    removeColumn(index) {
        index = +index;
        const filter = cell => cell.colIndex !== index;
        const map = (cell, i) => Object.assign({}, cell, {
            colIndex: i
        });
        // update columns
        this.columns = this.columns
            .filter(filter)
            .map(map);

        // update rows
        this.rows.forEach(row => {
            // remove cell
            row.splice(index, 1);
            // update colIndex
            row.forEach((cell, i) => {
                cell.colIndex = i;
            });
        });
    }

    updateRow(row, rowIndex) {
        if (row.length < this.columns.length) {
            if (this.hasColumnById('_rowIndex')) {
                const val = (rowIndex + 1) + '';

                row = [val].concat(row);
            }

            if (this.hasColumnById('_checkbox')) {
                const val = '<input type="checkbox" />';

                row = [val].concat(row);
            }
        }

        const _row = this.prepareRow(row, rowIndex);
        const index = this.rows.findIndex(row => row[0].rowIndex === rowIndex);
        this.rows[index] = _row;

        return _row;
    }

    updateCell(colIndex, rowIndex, options) {
        let cell;
        if (typeof colIndex === 'object') {
            // cell object was passed,
            // must have colIndex, rowIndex
            cell = colIndex;
            colIndex = cell.colIndex;
            rowIndex = cell.rowIndex;
            // the object passed must be merged with original cell
            options = cell;
        }
        cell = this.getCell(colIndex, rowIndex);

        // mutate object directly
        for (let key in options) {
            const newVal = options[key];
            if (newVal !== undefined) {
                cell[key] = newVal;
            }
        }

        return cell;
    }

    updateColumn(colIndex, keyValPairs) {
        const column = this.getColumn(colIndex);
        for (let key in keyValPairs) {
            const newVal = keyValPairs[key];
            if (newVal !== undefined) {
                column[key] = newVal;
            }
        }
        return column;
    }

    filterRows(keyword, colIndex) {
        let rowsToHide = [];
        let rowsToShow = [];
        const cells = this.rows.map(row => row[colIndex]);

        cells.forEach(cell => {
            const hay = String(cell.content || '').toLowerCase();
            const needle = (keyword || '').toLowerCase();

            if (!needle || hay.includes(needle)) {
                rowsToShow.push(cell.rowIndex);
            } else {
                rowsToHide.push(cell.rowIndex);
            }
        });

        this._filteredRows = rowsToShow;

        return {
            rowsToHide,
            rowsToShow
        };
    }

    getFilteredRowIndices() {
        return this._filteredRows || this.rows.map(row => row.meta.rowIndex);
    }

    getRowCount() {
        return this.rowCount;
    }

    _getNextRowCount() {
        const val = this.rowCount;

        this.rowCount++;
        return val;
    }

    getRows(start, end) {
        return this.rows.slice(start, end);
    }

    getRowsForView(start, end) {
        const rows = this.rowViewOrder.map(i => this.rows[i]);
        return rows.slice(start, end);
    }

    getColumns(skipStandardColumns) {
        let columns = this.columns;

        if (skipStandardColumns) {
            columns = columns.slice(this.getStandardColumnCount());
        }

        return columns;
    }

    getStandardColumnCount() {
        if (this.options.checkboxColumn && this.options.serialNoColumn) {
            return 2;
        }

        if (this.options.checkboxColumn || this.options.serialNoColumn) {
            return 1;
        }

        return 0;
    }

    getColumnCount(skipStandardColumns) {
        let val = this.columns.length;

        if (skipStandardColumns) {
            val = val - this.getStandardColumnCount();
        }

        return val;
    }

    getColumn(colIndex) {
        colIndex = +colIndex;

        if (colIndex < 0) {
            // negative indexes
            colIndex = this.columns.length + colIndex;
        }

        return this.columns.find(col => col.colIndex === colIndex);
    }

    getColumnById(id) {
        return this.columns.find(col => col.id === id);
    }

    getRow(rowIndex) {
        rowIndex = +rowIndex;
        return this.rows[rowIndex];
    }

    getCell(colIndex, rowIndex) {
        rowIndex = +rowIndex;
        colIndex = +colIndex;
        return this.getRow(rowIndex)[colIndex];
    }

    getChildren(parentRowIndex) {
        parentRowIndex = +parentRowIndex;
        const parentIndent = this.getRow(parentRowIndex).meta.indent;
        const out = [];

        for (let i = parentRowIndex + 1; i < this.rowCount; i++) {
            const row = this.getRow(i);
            if (isNaN(row.meta.indent)) continue;

            if (row.meta.indent > parentIndent) {
                out.push(i);
            }

            if (row.meta.indent === parentIndent) {
                break;
            }
        }

        return out;
    }

    getImmediateChildren(parentRowIndex) {
        parentRowIndex = +parentRowIndex;
        const parentIndent = this.getRow(parentRowIndex).meta.indent;
        const out = [];
        const childIndent = parentIndent + 1;

        for (let i = parentRowIndex + 1; i < this.rowCount; i++) {
            const row = this.getRow(i);
            if (isNaN(row.meta.indent) || row.meta.indent > childIndent) continue;

            if (row.meta.indent === childIndent) {
                out.push(i);
            }

            if (row.meta.indent === parentIndent) {
                break;
            }
        }

        return out;
    }

    get() {
        return {
            columns: this.columns,
            rows: this.rows
        };
    }

    /**
     * Returns the original data which was passed
     * based on rowIndex
     * @param {Number} rowIndex
     * @returns Array|Object
     * @memberof DataManager
     */
    getData(rowIndex) {
        return this.data[rowIndex];
    }

    hasColumn(name) {
        return Boolean(this.columns.find(col => col.content === name));
    }

    hasColumnById(id) {
        return Boolean(this.columns.find(col => col.id === id));
    }

    getColumnIndex(name) {
        return this.columns.findIndex(col => col.content === name);
    }

    getColumnIndexById(id) {
        return this.columns.findIndex(col => col.id === id);
    }

    getCheckboxHTML() {
        return '<input type="checkbox" />';
    }
}

// Custom Errors
class DataError extends TypeError {}

class ColumnManager {
    constructor(instance) {
        this.instance = instance;

        linkProperties(this, this.instance, [
            'options',
            'fireEvent',
            'header',
            'datamanager',
            'style',
            'wrapper',
            'rowmanager',
            'bodyScrollable'
        ]);

        this.bindEvents();
        getDropdownHTML = getDropdownHTML.bind(this, this.options.dropdownButton);
    }

    renderHeader() {
        this.header.innerHTML = '<thead></thead>';
        this.refreshHeader();
    }

    refreshHeader() {
        const columns = this.datamanager.getColumns();
        const $cols = $.each('.data-table-cell[data-is-header]', this.header);

        const refreshHTML =
            // first init
            !$('.data-table-cell', this.header) ||
            // deleted column
            columns.length < $cols.length;

        if (refreshHTML) {
            // refresh html
            $('thead', this.header).innerHTML = this.getHeaderHTML(columns);

            this.$filterRow = $('.data-table-row[data-is-filter]', this.header);
            if (this.$filterRow) {
                $.style(this.$filterRow, { display: 'none' });
            }
        } else {
            // update data-attributes
            $cols.map(($col, i) => {
                const column = columns[i];
                // column sorted or order changed
                // update colIndex of each header cell
                $.data($col, {
                    colIndex: column.colIndex
                });

                // refresh sort indicator
                const sortIndicator = $('.sort-indicator', $col);
                if (sortIndicator) {
                    sortIndicator.innerHTML = this.options.sortIndicator[column.sortOrder];
                }
            });
        }
        // reset columnMap
        this.$columnMap = [];
    }

    getHeaderHTML(columns) {
        let html = this.rowmanager.getRowHTML(columns, {
            isHeader: 1
        });
        if (this.options.inlineFilters) {
            html += this.rowmanager.getRowHTML(columns, {
                isFilter: 1
            });
        }
        return html;
    }

    bindEvents() {
        this.bindDropdown();
        this.bindResizeColumn();
        this.bindMoveColumn();
        this.bindFilter();
    }

    bindDropdown() {
        let $activeDropdown;
        $.on(this.header, 'click', '.data-table-dropdown-toggle', (e, $button) => {
            const $dropdown = $.closest('.data-table-dropdown', $button);

            if (!$dropdown.classList.contains('is-active')) {
                deactivateDropdown();
                $dropdown.classList.add('is-active');
                $activeDropdown = $dropdown;
            } else {
                deactivateDropdown();
            }
        });

        $.on(document.body, 'click', (e) => {
            if (e.target.matches('.data-table-dropdown-toggle')) return;
            deactivateDropdown();
        });

        const dropdownItems = this.options.headerDropdown;

        $.on(this.header, 'click', '.data-table-dropdown-list > div', (e, $item) => {
            const $col = $.closest('.data-table-cell', $item);
            const {
                index
            } = $.data($item);
            const {
                colIndex
            } = $.data($col);
            let callback = dropdownItems[index].action;

            callback && callback.call(this.instance, this.getColumn(colIndex));
        });

        function deactivateDropdown(e) {
            $activeDropdown && $activeDropdown.classList.remove('is-active');
            $activeDropdown = null;
        }
    }

    bindResizeColumn() {
        let isDragging = false;
        let $resizingCell, startWidth, startX;

        $.on(this.header, 'mousedown', '.data-table-cell .column-resizer', (e, $handle) => {
            document.body.classList.add('data-table-resize');
            const $cell = $handle.parentNode.parentNode;
            $resizingCell = $cell;
            const {
                colIndex
            } = $.data($resizingCell);
            const col = this.getColumn(colIndex);

            if (col && col.resizable === false) {
                return;
            }

            isDragging = true;
            startWidth = $.style($('.content', $resizingCell), 'width');
            startX = e.pageX;
        });

        $.on(document.body, 'mouseup', (e) => {
            document.body.classList.remove('data-table-resize');
            if (!$resizingCell) return;
            isDragging = false;

            const {
                colIndex
            } = $.data($resizingCell);
            this.setColumnWidth(colIndex);
            this.style.setBodyStyle();
            $resizingCell = null;
        });

        $.on(document.body, 'mousemove', (e) => {
            if (!isDragging) return;
            const finalWidth = startWidth + (e.pageX - startX);
            const {
                colIndex
            } = $.data($resizingCell);

            if (this.getColumnMinWidth(colIndex) > finalWidth) {
                // don't resize past minWidth
                return;
            }
            this.datamanager.updateColumn(colIndex, {
                width: finalWidth
            });
            this.setColumnHeaderWidth(colIndex);
        });
    }

    bindMoveColumn() {
        let initialized;

        const initialize = () => {
            if (initialized) {
                $.off(document.body, 'mousemove', initialize);
                return;
            }
            const ready = $('.data-table-cell', this.header);
            if (!ready) return;

            const $parent = $('.data-table-row', this.header);

            this.sortable = Sortable.create($parent, {
                onEnd: (e) => {
                    const {
                        oldIndex,
                        newIndex
                    } = e;
                    const $draggedCell = e.item;
                    const {
                        colIndex
                    } = $.data($draggedCell);
                    if (+colIndex === newIndex) return;

                    this.switchColumn(oldIndex, newIndex);
                },
                preventOnFilter: false,
                filter: '.column-resizer, .data-table-dropdown',
                animation: 150
            });
        };

        $.on(document.body, 'mousemove', initialize);
    }

    bindSortColumn() {

        $.on(this.header, 'click', '.data-table-cell .column-title', (e, span) => {
            const $cell = span.closest('.data-table-cell');
            let {
                colIndex,
                sortOrder = 'none'
            } = $.data($cell);
            const col = this.getColumn(colIndex);

            if (col && col.sortable === false) {
                return;
            }

            // reset sort indicator
            $('.sort-indicator', this.header).textContent = '';
            $.each('.data-table-cell', this.header).map($cell => {
                $.data($cell, {
                    sortOrder: 'none'
                });
            });

            let nextSortOrder, textContent;
            if (sortOrder === 'none') {
                nextSortOrder = 'asc';
                textContent = '▲';
            } else if (sortOrder === 'asc') {
                nextSortOrder = 'desc';
                textContent = '▼';
            } else if (sortOrder === 'desc') {
                nextSortOrder = 'none';
                textContent = '';
            }

            $.data($cell, {
                sortOrder: nextSortOrder
            });
            $('.sort-indicator', $cell).textContent = textContent;

            this.sortColumn(colIndex, nextSortOrder);
        });
    }

    sortColumn(colIndex, nextSortOrder) {
        this.instance.freeze();
        this.sortRows(colIndex, nextSortOrder)
            .then(() => {
                this.refreshHeader();
                return this.rowmanager.refreshRows();
            })
            .then(() => this.instance.unfreeze())
            .then(() => {
                this.fireEvent('onSortColumn', this.getColumn(colIndex));
            });
    }

    removeColumn(colIndex) {
        const removedCol = this.getColumn(colIndex);
        this.instance.freeze();
        this.datamanager.removeColumn(colIndex)
            .then(() => {
                this.refreshHeader();
                return this.rowmanager.refreshRows();
            })
            .then(() => this.instance.unfreeze())
            .then(() => {
                this.fireEvent('onRemoveColumn', removedCol);
            });
    }

    switchColumn(oldIndex, newIndex) {
        this.instance.freeze();
        this.datamanager.switchColumn(oldIndex, newIndex)
            .then(() => {
                this.refreshHeader();
                return this.rowmanager.refreshRows();
            })
            .then(() => {
                this.setColumnWidth(oldIndex);
                this.setColumnWidth(newIndex);
                this.instance.unfreeze();
            })
            .then(() => {
                this.fireEvent('onSwitchColumn',
                    this.getColumn(oldIndex), this.getColumn(newIndex)
                );
            });
    }

    toggleFilter(flag) {
        let showFilter;
        if (flag === undefined) {
            showFilter = !this.isFilterShown;
        } else {
            showFilter = flag;
        }

        if (showFilter) {
            $.style(this.$filterRow, { display: '' });
        } else {
            $.style(this.$filterRow, { display: 'none' });
        }

        this.isFilterShown = showFilter;
        this.style.setBodyStyle();
    }

    focusFilter(colIndex) {
        if (!this.isFilterShown) return;

        const $filterInput = $(`[data-col-index="${colIndex}"] .data-table-filter`, this.$filterRow);
        $filterInput.focus();
    }

    bindFilter() {
        if (!this.options.inlineFilters) return;
        const handler = e => {
            const $filterCell = $.closest('.data-table-cell', e.target);
            const {
                colIndex
            } = $.data($filterCell);
            const keyword = e.target.value;

            this.datamanager.filterRows(keyword, colIndex)
                .then(({
                    rowsToHide,
                    rowsToShow
                }) => {
                    this.rowmanager.hideRows(rowsToHide);
                    this.rowmanager.showRows(rowsToShow);
                });
        };
        $.on(this.header, 'keydown', '.data-table-filter', debounce$2(handler, 300));
    }

    sortRows(colIndex, sortOrder) {
        return this.datamanager.sortRows(colIndex, sortOrder);
    }

    getColumn(colIndex) {
        return this.datamanager.getColumn(colIndex);
    }

    getColumns() {
        return this.datamanager.getColumns();
    }

    setColumnWidth(colIndex, width) {
        colIndex = +colIndex;
        this._columnWidthMap = this._columnWidthMap || [];

        let columnWidth = width || this.getColumn(colIndex).width;

        let index = this._columnWidthMap[colIndex];
        const selector = `[data-col-index="${colIndex}"] .content, [data-col-index="${colIndex}"] .edit-cell`;
        const styles = {
            width: columnWidth + 'px'
        };

        index = this.style.setStyle(selector, styles, index);

        if (index !== undefined) {
            this._columnWidthMap[colIndex] = index;
        }
    }

    setColumnHeaderWidth(colIndex) {
        colIndex = +colIndex;
        this.$columnMap = this.$columnMap || [];
        const selector = `.data-table-header [data-col-index="${colIndex}"] .content`;
        const {
            width
        } = this.getColumn(colIndex);

        let $column = this.$columnMap[colIndex];
        if (!$column) {
            $column = this.header.querySelector(selector);
            this.$columnMap[colIndex] = $column;
        }

        $column.style.width = width + 'px';
    }

    getColumnMinWidth(colIndex) {
        colIndex = +colIndex;
        return this.getColumn(colIndex).minWidth || 24;
    }

    getFirstColumnIndex() {
        return this.datamanager.getColumnIndexById('_rowIndex') + 1;
    }

    getHeaderCell$(colIndex) {
        return $(`.data-table-cell[data-col-index="${colIndex}"]`, this.header);
    }

    getLastColumnIndex() {
        return this.datamanager.getColumnCount() - 1;
    }

    getSerialColumnIndex() {
        const columns = this.datamanager.getColumns();

        return columns.findIndex(column => column.content.includes('Sr. No'));
    }
}

// eslint-disable-next-line
var getDropdownHTML = function getDropdownHTML(dropdownButton = 'v') {
    // add dropdown buttons
    const dropdownItems = this.options.headerDropdown;

    return `<div class="data-table-dropdown-toggle">${dropdownButton}</div>
    <div class="data-table-dropdown-list">
      ${dropdownItems.map((d, i) => `<div data-index="${i}">${d.label}</div>`).join('')}
    </div>
  `;
};

class CellManager {
    constructor(instance) {
        this.instance = instance;
        linkProperties(this, this.instance, [
            'wrapper',
            'options',
            'style',
            'bodyScrollable',
            'columnmanager',
            'rowmanager',
            'datamanager',
            'keyboard'
        ]);

        this.bindEvents();
    }

    bindEvents() {
        this.bindFocusCell();
        this.bindEditCell();
        this.bindKeyboardSelection();
        this.bindCopyCellContents();
        this.bindMouseEvents();
        this.bindTreeEvents();
    }

    bindFocusCell() {
        this.bindKeyboardNav();
    }

    bindEditCell() {
        this.$editingCell = null;

        $.on(this.bodyScrollable, 'dblclick', '.data-table-cell', (e, cell) => {
            this.activateEditing(cell);
        });

        this.keyboard.on('enter', (e) => {
            if (this.$focusedCell && !this.$editingCell) {
                // enter keypress on focused cell
                this.activateEditing(this.$focusedCell);
            } else if (this.$editingCell) {
                // enter keypress on editing cell
                this.submitEditing();
                this.deactivateEditing();
            }
        });
    }

    bindKeyboardNav() {
        const focusCell = (direction) => {
            if (!this.$focusedCell || this.$editingCell) {
                return false;
            }

            let $cell = this.$focusedCell;

            if (direction === 'left' || direction === 'shift+tab') {
                $cell = this.getLeftCell$($cell);
            } else if (direction === 'right' || direction === 'tab') {
                $cell = this.getRightCell$($cell);
            } else if (direction === 'up') {
                $cell = this.getAboveCell$($cell);
            } else if (direction === 'down') {
                $cell = this.getBelowCell$($cell);
            }

            this.focusCell($cell);
            return true;
        };

        const focusLastCell = (direction) => {
            if (!this.$focusedCell || this.$editingCell) {
                return false;
            }

            let $cell = this.$focusedCell;
            const {
                rowIndex,
                colIndex
            } = $.data($cell);

            if (direction === 'left') {
                $cell = this.getLeftMostCell$(rowIndex);
            } else if (direction === 'right') {
                $cell = this.getRightMostCell$(rowIndex);
            } else if (direction === 'up') {
                $cell = this.getTopMostCell$(colIndex);
            } else if (direction === 'down') {
                $cell = this.getBottomMostCell$(colIndex);
            }

            this.focusCell($cell);
            return true;
        };

        ['left', 'right', 'up', 'down', 'tab', 'shift+tab'].map(
            direction => this.keyboard.on(direction, () => focusCell(direction))
        );

        ['left', 'right', 'up', 'down'].map(
            direction => this.keyboard.on('ctrl+' + direction, () => focusLastCell(direction))
        );

        this.keyboard.on('esc', () => {
            this.deactivateEditing();
        });

        if (this.options.inlineFilters) {
            this.keyboard.on('ctrl+f', (e) => {
                const $cell = $.closest('.data-table-cell', e.target);
                let {
                    colIndex
                } = $.data($cell);

                this.activateFilter(colIndex);
                return true;
            });
        }
    }

    bindKeyboardSelection() {
        const getNextSelectionCursor = (direction) => {
            let $selectionCursor = this.getSelectionCursor();

            if (direction === 'left') {
                $selectionCursor = this.getLeftCell$($selectionCursor);
            } else if (direction === 'right') {
                $selectionCursor = this.getRightCell$($selectionCursor);
            } else if (direction === 'up') {
                $selectionCursor = this.getAboveCell$($selectionCursor);
            } else if (direction === 'down') {
                $selectionCursor = this.getBelowCell$($selectionCursor);
            }

            return $selectionCursor;
        };

        ['left', 'right', 'up', 'down'].map(
            direction => this.keyboard.on('shift+' + direction,
                () => this.selectArea(getNextSelectionCursor(direction)))
        );
    }

    bindCopyCellContents() {
        this.keyboard.on('ctrl+c', () => {
            this.copyCellContents(this.$focusedCell, this.$selectionCursor);
        });
    }

    bindMouseEvents() {
        let mouseDown = null;

        $.on(this.bodyScrollable, 'mousedown', '.data-table-cell', (e) => {
            mouseDown = true;
            this.focusCell($(e.delegatedTarget));
        });

        $.on(this.bodyScrollable, 'mouseup', () => {
            mouseDown = false;
        });

        const selectArea = (e) => {
            if (!mouseDown) return;
            this.selectArea($(e.delegatedTarget));
        };

        $.on(this.bodyScrollable, 'mousemove', '.data-table-cell', throttle$1(selectArea, 50));
    }

    bindTreeEvents() {
        $.on(this.bodyScrollable, 'click', '.toggle', (e, $toggle) => {
            const $cell = $.closest('.data-table-cell', $toggle);
            const { rowIndex } = $.data($cell);

            if ($cell.classList.contains('tree-close')) {
                this.rowmanager.openSingleNode(rowIndex);
            } else {
                this.rowmanager.closeSingleNode(rowIndex);
            }
        });
    }

    focusCell($cell, {
        skipClearSelection = 0
    } = {}) {
        if (!$cell) return;

        // don't focus if already editing cell
        if ($cell === this.$editingCell) return;

        const {
            colIndex,
            isHeader
        } = $.data($cell);
        if (isHeader) {
            return;
        }

        const column = this.columnmanager.getColumn(colIndex);
        if (column.focusable === false) {
            return;
        }

        this.scrollToCell($cell);

        this.deactivateEditing();
        if (!skipClearSelection) {
            this.clearSelection();
        }

        if (this.$focusedCell) {
            this.$focusedCell.classList.remove('selected');
        }

        this.$focusedCell = $cell;
        $cell.classList.add('selected');

        // so that keyboard nav works
        $cell.focus();

        this.highlightRowColumnHeader($cell);
    }

    highlightRowColumnHeader($cell) {
        const {
            colIndex,
            rowIndex
        } = $.data($cell);
        const _colIndex = this.datamanager.getColumnIndexById('_rowIndex');
        const colHeaderSelector = `.data-table-header .data-table-cell[data-col-index="${colIndex}"]`;
        const rowHeaderSelector = `.data-table-cell[data-row-index="${rowIndex}"][data-col-index="${_colIndex}"]`;

        if (this.lastHeaders) {
            $.removeStyle(this.lastHeaders, 'backgroundColor');
        }

        const colHeader = $(colHeaderSelector, this.wrapper);
        const rowHeader = $(rowHeaderSelector, this.wrapper);

        $.style([colHeader, rowHeader], {
            backgroundColor: '#f5f7fa' // light-bg
        });

        this.lastHeaders = [colHeader, rowHeader];
    }

    selectAreaOnClusterChanged() {
        if (!(this.$focusedCell && this.$selectionCursor)) return;
        const {
            colIndex,
            rowIndex
        } = $.data(this.$selectionCursor);
        const $cell = this.getCell$(colIndex, rowIndex);

        if (!$cell || $cell === this.$selectionCursor) return;

        // selectArea needs $focusedCell
        const fCell = $.data(this.$focusedCell);
        this.$focusedCell = this.getCell$(fCell.colIndex, fCell.rowIndex);

        this.selectArea($cell);
    }

    focusCellOnClusterChanged() {
        if (!this.$focusedCell) return;

        const {
            colIndex,
            rowIndex
        } = $.data(this.$focusedCell);
        const $cell = this.getCell$(colIndex, rowIndex);

        if (!$cell) return;
        // this function is called after selectAreaOnClusterChanged,
        // focusCell calls clearSelection which resets the area selection
        // so a flag to skip it
        this.focusCell($cell, {
            skipClearSelection: 1
        });
    }

    selectArea($selectionCursor) {
        if (!this.$focusedCell) return;

        if (this._selectArea(this.$focusedCell, $selectionCursor)) {
            // valid selection
            this.$selectionCursor = $selectionCursor;
        }
    };

    _selectArea($cell1, $cell2) {
        if ($cell1 === $cell2) return false;

        const cells = this.getCellsInRange($cell1, $cell2);
        if (!cells) return false;

        this.clearSelection();
        cells.map(index => this.getCell$(...index)).map($cell => $cell.classList.add('highlight'));
        return true;
    }

    getCellsInRange($cell1, $cell2) {
        let colIndex1, rowIndex1, colIndex2, rowIndex2;

        if (typeof $cell1 === 'number') {
            [colIndex1, rowIndex1, colIndex2, rowIndex2] = arguments;
        } else
        if (typeof $cell1 === 'object') {

            if (!($cell1 && $cell2)) {
                return false;
            }

            const cell1 = $.data($cell1);
            const cell2 = $.data($cell2);

            colIndex1 = cell1.colIndex;
            rowIndex1 = cell1.rowIndex;
            colIndex2 = cell2.colIndex;
            rowIndex2 = cell2.rowIndex;
        }

        if (rowIndex1 > rowIndex2) {
            [rowIndex1, rowIndex2] = [rowIndex2, rowIndex1];
        }

        if (colIndex1 > colIndex2) {
            [colIndex1, colIndex2] = [colIndex2, colIndex1];
        }

        if (this.isStandardCell(colIndex1) || this.isStandardCell(colIndex2)) {
            return false;
        }

        let cells = [];
        let colIndex = colIndex1;
        let rowIndex = rowIndex1;
        let rowIndices = [];

        while (rowIndex <= rowIndex2) {
            rowIndices.push(rowIndex);
            rowIndex++;
        }

        rowIndices.map(rowIndex => {
            while (colIndex <= colIndex2) {
                cells.push([colIndex, rowIndex]);
                colIndex++;
            }
            colIndex = colIndex1;
        });

        return cells;
    }

    clearSelection() {
        $.each('.data-table-cell.highlight', this.bodyScrollable)
            .map(cell => cell.classList.remove('highlight'));

        this.$selectionCursor = null;
    }

    getSelectionCursor() {
        return this.$selectionCursor || this.$focusedCell;
    }

    activateEditing($cell) {
        this.focusCell($cell);
        const {
            rowIndex,
            colIndex
        } = $.data($cell);

        const col = this.columnmanager.getColumn(colIndex);
        if (col && (col.editable === false || col.focusable === false)) {
            return;
        }

        const cell = this.getCell(colIndex, rowIndex);
        if (cell && cell.editable === false) {
            return;
        }

        if (this.$editingCell) {
            const {
                _rowIndex,
                _colIndex
            } = $.data(this.$editingCell);

            if (rowIndex === _rowIndex && colIndex === _colIndex) {
                // editing the same cell
                return;
            }
        }

        this.$editingCell = $cell;
        $cell.classList.add('editing');

        const $editCell = $('.edit-cell', $cell);
        $editCell.innerHTML = '';

        const editor = this.getEditor(colIndex, rowIndex, cell.content, $editCell);

        if (editor) {
            this.currentCellEditor = editor;
            // initialize editing input with cell value
            editor.initValue(cell.content, rowIndex, col);
        }
    }

    deactivateEditing() {
        // keep focus on the cell so that keyboard navigation works
        if (this.$focusedCell) this.$focusedCell.focus();

        if (!this.$editingCell) return;
        this.$editingCell.classList.remove('editing');
        this.$editingCell = null;
    }

    getEditor(colIndex, rowIndex, value, parent) {
        const column = this.datamanager.getColumn(colIndex);
        const row = this.datamanager.getRow(rowIndex);
        const data = this.datamanager.getData(rowIndex);
        let editor = this.options.getEditor ?
            this.options.getEditor(colIndex, rowIndex, value, parent, column, row, data) :
            this.getDefaultEditor(parent);

        if (editor === false) {
            // explicitly returned false
            return false;
        }
        if (editor === undefined) {
            // didn't return editor, fallback to default
            editor = this.getDefaultEditor(parent);
        }

        return editor;
    }

    getDefaultEditor(parent) {
        const $input = $.create('input', {
            class: 'input-style',
            type: 'text',
            inside: parent
        });

        return {
            initValue(value) {
                $input.focus();
                $input.value = value;
            },
            getValue() {
                return $input.value;
            },
            setValue(value) {
                $input.value = value;
            }
        };
    }

    submitEditing() {
        if (!this.$editingCell) return;
        const $cell = this.$editingCell;
        const {
            rowIndex,
            colIndex
        } = $.data($cell);
        const col = this.datamanager.getColumn(colIndex);

        if ($cell) {
            const editor = this.currentCellEditor;

            if (editor) {
                const value = editor.getValue();
                const done = editor.setValue(value, rowIndex, col);
                const oldValue = this.getCell(colIndex, rowIndex).content;

                // update cell immediately
                this.updateCell(colIndex, rowIndex, value);
                $cell.focus();

                if (done && done.then) {
                    // revert to oldValue if promise fails
                    done.catch((e) => {
                        console.log(e);
                        this.updateCell(colIndex, rowIndex, oldValue);
                    });
                }
            }
        }

        this.currentCellEditor = null;
    }

    copyCellContents($cell1, $cell2) {
        if (!$cell2 && $cell1) {
            // copy only focusedCell
            const {
                colIndex,
                rowIndex
            } = $.data($cell1);
            const cell = this.getCell(colIndex, rowIndex);
            copyTextToClipboard(cell.content);
            return;
        }
        const cells = this.getCellsInRange($cell1, $cell2);

        if (!cells) return;

        const values = cells
            // get cell objects
            .map(index => this.getCell(...index))
            // convert to array of rows
            .reduce((acc, curr) => {
                const rowIndex = curr.rowIndex;

                acc[rowIndex] = acc[rowIndex] || [];
                acc[rowIndex].push(curr.content);

                return acc;
            }, [])
            // join values by tab
            .map(row => row.join('\t'))
            // join rows by newline
            .join('\n');

        copyTextToClipboard(values);
    }

    activateFilter(colIndex) {
        this.columnmanager.toggleFilter();
        this.columnmanager.focusFilter(colIndex);

        if (!this.columnmanager.isFilterShown) {
            // put focus back on cell
            this.$focusedCell.focus();
        }
    }

    updateCell(colIndex, rowIndex, value) {
        const cell = this.datamanager.updateCell(colIndex, rowIndex, {
            content: value
        });
        this.refreshCell(cell);
    }

    refreshCell(cell) {
        const $cell = $(this.selector(cell.colIndex, cell.rowIndex), this.bodyScrollable);
        $cell.innerHTML = this.getCellContent(cell);
    }

    toggleTreeButton(rowIndex, flag) {
        const colIndex = this.columnmanager.getFirstColumnIndex();
        const $cell = this.getCell$(colIndex, rowIndex);
        if ($cell) {
            $cell.classList[flag ? 'remove' : 'add']('tree-close');
        }
    }

    isStandardCell(colIndex) {
        // Standard cells are in Sr. No and Checkbox column
        return colIndex < this.columnmanager.getFirstColumnIndex();
    }

    getCell$(colIndex, rowIndex) {
        return $(this.selector(colIndex, rowIndex), this.bodyScrollable);
    }

    getAboveCell$($cell) {
        const {
            colIndex
        } = $.data($cell);

        let $aboveRow = $cell.parentElement.previousElementSibling;
        while ($aboveRow && $aboveRow.classList.contains('hide')) {
            $aboveRow = $aboveRow.previousElementSibling;
        }

        if (!$aboveRow) return $cell;
        return $(`[data-col-index="${colIndex}"]`, $aboveRow);
    }

    getBelowCell$($cell) {
        const {
            colIndex
        } = $.data($cell);

        let $belowRow = $cell.parentElement.nextElementSibling;
        while ($belowRow && $belowRow.classList.contains('hide')) {
            $belowRow = $belowRow.nextElementSibling;
        }

        if (!$belowRow) return $cell;
        return $(`[data-col-index="${colIndex}"]`, $belowRow);
    }

    getLeftCell$($cell) {
        return $cell.previousElementSibling;
    }

    getRightCell$($cell) {
        return $cell.nextElementSibling;
    }

    getLeftMostCell$(rowIndex) {
        return this.getCell$(this.columnmanager.getFirstColumnIndex(), rowIndex);
    }

    getRightMostCell$(rowIndex) {
        return this.getCell$(this.columnmanager.getLastColumnIndex(), rowIndex);
    }

    getTopMostCell$(colIndex) {
        return this.getCell$(colIndex, this.rowmanager.getFirstRowIndex());
    }

    getBottomMostCell$(colIndex) {
        return this.getCell$(colIndex, this.rowmanager.getLastRowIndex());
    }

    getCell(colIndex, rowIndex) {
        return this.instance.datamanager.getCell(colIndex, rowIndex);
    }

    getCellAttr($cell) {
        return this.instance.getCellAttr($cell);
    }

    getRowHeight() {
        return $.style($('.data-table-row', this.bodyScrollable), 'height');
    }

    scrollToCell($cell) {
        if ($.inViewport($cell, this.bodyScrollable)) return false;

        const {
            rowIndex
        } = $.data($cell);
        this.rowmanager.scrollToRow(rowIndex);
        return false;
    }

    getRowCountPerPage() {
        return Math.ceil(this.instance.getViewportHeight() / this.getRowHeight());
    }

    getCellHTML(cell) {
        const {
            rowIndex,
            colIndex,
            isHeader,
            isFilter
        } = cell;
        const dataAttr = makeDataAttributeString({
            rowIndex,
            colIndex,
            isHeader,
            isFilter
        });

        return `
            <td class="data-table-cell noselect" ${dataAttr} tabindex="0">
                ${this.getCellContent(cell)}
            </td>
        `;
    }

    getCellContent(cell) {
        const {
            isHeader,
            isFilter
        } = cell;

        const editable = !isHeader && cell.editable !== false;
        const editCellHTML = editable ? this.getEditCellHTML() : '';

        const sortable = isHeader && cell.sortable !== false;
        const sortIndicator = sortable ? '<span class="sort-indicator"></span>' : '';

        const resizable = isHeader && cell.resizable !== false;
        const resizeColumn = resizable ? '<span class="column-resizer"></span>' : '';

        const hasDropdown = isHeader && cell.dropdown !== false;
        const dropdown = hasDropdown ? `<div class="data-table-dropdown">${getDropdownHTML()}</div>` : '';

        const customFormatter = cell.format || (cell.column && cell.column.format) || null;

        let contentHTML;
        if (isHeader || isFilter || !customFormatter) {
            contentHTML = cell.content;
        } else {
            const row = this.datamanager.getRow(cell.rowIndex);
            const data = this.datamanager.getData(cell.rowIndex);
            contentHTML = customFormatter(cell.content, row, cell.column, data);
        }

        if (this.options.treeView && !(isHeader || isFilter) && cell.indent !== undefined) {
            const nextRow = this.datamanager.getRow(cell.rowIndex + 1);
            const addToggle = nextRow && nextRow.meta.indent > cell.indent;

            // Add toggle and indent in the first column
            const firstColumnIndex = this.datamanager.getColumnIndexById('_rowIndex') + 1;
            if (firstColumnIndex === cell.colIndex) {
                const padding = ((cell.indent || 0) + 1) * 1.5;
                const toggleHTML = addToggle ? `<span class="toggle" style="left: ${padding - 1.5}rem"></span>` : '';
                contentHTML = `<span class="tree-node" style="padding-left: ${padding}rem">
                    ${toggleHTML}${contentHTML}</span>`;
            }
        }

        return `
            <div class="content ellipsis">
                ${contentHTML}
                ${sortIndicator}
                ${resizeColumn}
                ${dropdown}
            </div>
            ${editCellHTML}
        `;
    }

    getEditCellHTML() {
        return `
      <div class="edit-cell"></div>
    `;
    }

    selector(colIndex, rowIndex) {
        return `.data-table-cell[data-col-index="${colIndex}"][data-row-index="${rowIndex}"]`;
    }
}

class RowManager {
    constructor(instance) {
        this.instance = instance;
        linkProperties(this, this.instance, [
            'options',
            'fireEvent',
            'wrapper',
            'bodyScrollable',
            'bodyRenderer'
        ]);

        this.bindEvents();
        this.refreshRows = nextTick(this.refreshRows, this);
    }

    get datamanager() {
        return this.instance.datamanager;
    }

    get cellmanager() {
        return this.instance.cellmanager;
    }

    bindEvents() {
        this.bindCheckbox();
    }

    bindCheckbox() {
        if (!this.options.checkboxColumn) return;

        // map of checked rows
        this.checkMap = [];

        $.on(this.wrapper, 'click', '.data-table-cell[data-col-index="0"] [type="checkbox"]', (e, $checkbox) => {
            const $cell = $checkbox.closest('.data-table-cell');
            const {
                rowIndex,
                isHeader
            } = $.data($cell);
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

    refreshRow(row, rowIndex) {
        const _row = this.datamanager.updateRow(row, rowIndex);

        _row.forEach(cell => {
            this.cellmanager.refreshCell(cell);
        });
    }

    getCheckedRows() {
        if (!this.checkMap) {
            return [];
        }

        let out = [];
        for (let rowIndex in this.checkMap) {
            const checked = this.checkMap[rowIndex];
            if (checked === 1) {
                out.push(rowIndex);
            }
        }

        return out;
    }

    highlightCheckedRows() {
        this.getCheckedRows()
            .map(rowIndex => this.checkRow(rowIndex, true));
    }

    checkRow(rowIndex, toggle) {
        const value = toggle ? 1 : 0;
        const selector = rowIndex =>
            `.data-table-cell[data-row-index="${rowIndex}"][data-col-index="0"] [type="checkbox"]`;
        // update internal map
        this.checkMap[rowIndex] = value;
        // set checkbox value explicitly
        $.each(selector(rowIndex), this.bodyScrollable)
            .map(input => {
                input.checked = toggle;
            });
        // highlight row
        this.highlightRow(rowIndex, toggle);
        this.showCheckStatus();
        this.fireEvent('onCheckRow', this.datamanager.getRow(rowIndex));
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
        $.each('.data-table-cell[data-col-index="0"] [type="checkbox"]', this.bodyScrollable)
            .map(input => {
                input.checked = toggle;
            });
        // highlight all
        this.highlightAll(toggle);
        this.showCheckStatus();
    }

    showCheckStatus() {
        if (!this.options.checkedRowStatus) return;
        const checkedRows = this.getCheckedRows();
        const count = checkedRows.length;
        if (count > 0) {
            this.bodyRenderer.showToastMessage(`${count} row${count > 1 ? 's' : ''} selected`);
        } else {
            this.bodyRenderer.clearToastMessage();
        }
    }

    highlightRow(rowIndex, toggle = true) {
        const $row = this.getRow$(rowIndex);
        if (!$row) return;

        if (!toggle && this.bodyScrollable.classList.contains('row-highlight-all')) {
            $row.classList.add('row-unhighlight');
            return;
        }

        if (toggle && $row.classList.contains('row-unhighlight')) {
            $row.classList.remove('row-unhighlight');
        }

        this._highlightedRows = this._highlightedRows || {};

        if (toggle) {
            $row.classList.add('row-highlight');
            this._highlightedRows[rowIndex] = $row;
        } else {
            $row.classList.remove('row-highlight');
            delete this._highlightedRows[rowIndex];
        }
    }

    highlightAll(toggle = true) {
        if (toggle) {
            this.bodyScrollable.classList.add('row-highlight-all');
        } else {
            this.bodyScrollable.classList.remove('row-highlight-all');
            for (const rowIndex in this._highlightedRows) {
                const $row = this._highlightedRows[rowIndex];
                $row.classList.remove('row-highlight');
            }
            this._highlightedRows = {};
        }
    }

    hideRows(rowIndices) {
        rowIndices = ensureArray(rowIndices);
        rowIndices.map(rowIndex => {
            const $tr = this.getRow$(rowIndex);
            $tr.classList.add('hide');
        });
    }

    showRows(rowIndices) {
        rowIndices = ensureArray(rowIndices);
        rowIndices.map(rowIndex => {
            const $tr = this.getRow$(rowIndex);
            $tr.classList.remove('hide');
        });
    }

    openSingleNode(rowIndex) {
        const rowsToShow = this.datamanager.getImmediateChildren(rowIndex);
        this.showRows(rowsToShow);
        this.cellmanager.toggleTreeButton(rowIndex, true);
    }

    closeSingleNode(rowIndex) {
        const children = this.datamanager.getImmediateChildren(rowIndex);
        children.forEach(childIndex => {
            const row = this.datamanager.getRow(childIndex);
            if (row.meta.isLeaf) {
                // close
                this.hideRows(childIndex);
                this.cellmanager.toggleTreeButton(childIndex, false);
            } else {
                this.closeSingleNode(childIndex);
                this.hideRows(childIndex);
            }
        });
        this.cellmanager.toggleTreeButton(rowIndex, false);
    }

    getRow$(rowIndex) {
        return $(this.selector(rowIndex), this.bodyScrollable);
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

    scrollToRow(rowIndex) {
        rowIndex = +rowIndex;
        this._lastScrollTo = this._lastScrollTo || 0;
        const $row = this.getRow$(rowIndex);
        if ($.inViewport($row, this.bodyScrollable)) return;

        const {
            height
        } = $row.getBoundingClientRect();
        const {
            top,
            bottom
        } = this.bodyScrollable.getBoundingClientRect();
        const rowsInView = Math.floor((bottom - top) / height);

        let offset = 0;
        if (rowIndex > this._lastScrollTo) {
            offset = height * ((rowIndex + 1) - rowsInView);
        } else {
            offset = height * ((rowIndex + 1) - 1);
        }

        this._lastScrollTo = rowIndex;
        $.scrollTop(this.bodyScrollable, offset);
    }

    getRowHTML(row, props) {
        const dataAttr = makeDataAttributeString(props);

        if (props.isFilter) {
            row = row.map(cell => (Object.assign({}, cell, {
                content: this.getFilterInput({
                    colIndex: cell.colIndex
                }),
                isFilter: 1,
                isHeader: undefined,
                editable: false
            })));
        }

        return `
            <tr class="data-table-row" ${dataAttr}>
                ${row.map(cell => this.cellmanager.getCellHTML(cell)).join('')}
            </tr>
        `;
    }

    getFilterInput(props) {
        const dataAttr = makeDataAttributeString(props);
        return `<input class="data-table-filter input-style" type="text" ${dataAttr} />`;
    }

    selector(rowIndex) {
        return `.data-table-row[data-row-index="${rowIndex}"]`;
    }
}

class BodyRenderer {
    constructor(instance) {
        this.instance = instance;
        this.options = instance.options;
        this.datamanager = instance.datamanager;
        this.rowmanager = instance.rowmanager;
        this.cellmanager = instance.cellmanager;
        this.bodyScrollable = instance.bodyScrollable;
        this.log = instance.log;
        this.appendRemainingData = nextTick(this.appendRemainingData, this);
    }

    render() {
        if (this.options.clusterize) {
            this.renderBodyWithClusterize();
        } else {
            this.renderBodyHTML();
        }
    }

    renderBodyHTML() {
        const rows = this.datamanager.getRowsForView();

        this.bodyScrollable.innerHTML = `
            <table class="data-table-body">
                ${this.getBodyHTML(rows)}
            </table>
        `;
        this.instance.setDimensions();
        this.restoreState();
    }

    renderBodyWithClusterize() {
        // first page
        const rows = this.datamanager.getRowsForView(0, 20);
        let initialData = this.getDataForClusterize(rows);

        if (initialData.length === 0) {
            initialData = [`<tr class="no-data"><td>${this.options.noDataMessage}</td></tr>`];
        }

        if (!this.clusterize) {
            // empty body
            this.bodyScrollable.innerHTML = `
                <table class="data-table-body">
                    ${this.getBodyHTML([])}
                </table>
            `;

            // first 20 rows will appended
            // rest of them in nextTick
            this.clusterize = new Clusterize({
                rows: initialData,
                scrollElem: this.bodyScrollable,
                contentElem: $('tbody', this.bodyScrollable),
                callbacks: {
                    clusterChanged: () => {
                        this.restoreState();
                    }
                },
                /* eslint-disable */
                show_no_data_row: false,
                /* eslint-enable */
            });

            // setDimensions requires atleast 1 row to exist in dom
            this.instance.setDimensions();
        } else {
            this.clusterize.update(initialData);
        }

        this.appendRemainingData();
    }

    restoreState() {
        this.rowmanager.highlightCheckedRows();
        this.cellmanager.selectAreaOnClusterChanged();
        this.cellmanager.focusCellOnClusterChanged();
    }

    appendRemainingData() {
        const rows = this.datamanager.getRowsForView(20);
        const data = this.getDataForClusterize(rows);
        this.clusterize.append(data);
    }

    showToastMessage(message) {
        this.instance.toastMessage.innerHTML = `<span>${message}</span>`;
    }

    clearToastMessage() {
        this.instance.toastMessage.innerHTML = '';
    }

    getDataForClusterize(rows) {
        return rows.map((row) => this.rowmanager.getRowHTML(row, row.meta));
    }

    getBodyHTML(rows) {
        return `
            <tbody>
                ${rows.map(row => this.rowmanager.getRowHTML(row, row.meta)).join('')}
            </tbody>
        `;
    }
}

class Style {
    constructor(instance) {
        this.instance = instance;

        linkProperties(this, this.instance, [
            'options', 'datamanager', 'columnmanager',
            'header', 'bodyScrollable', 'datatableWrapper',
            'getColumn'
        ]);

        this.scopeClass = 'datatable-instance-' + instance.constructor.instances;
        instance.datatableWrapper.classList.add(this.scopeClass);

        const styleEl = document.createElement('style');
        instance.wrapper.insertBefore(styleEl, instance.datatableWrapper);
        this.styleEl = styleEl;

        this.bindResizeWindow();
    }

    get stylesheet() {
        return this.styleEl.sheet;
    }

    bindResizeWindow() {
        if (this.options.layout === 'fluid') {
            $.on(window, 'resize', throttle$1(() => {
                this.distributeRemainingWidth();
                this.refreshColumnWidth();
                this.compensateScrollbarWidth();
                this.setBodyStyle();
            }, 300));
        }
    }

    destroy() {
        this.styleEl.remove();
    }

    setStyle(selector, styleMap, index = -1) {
        const styles = Object.keys(styleMap)
            .map(prop => {
                if (!prop.includes('-')) {
                    prop = camelCaseToDash(prop);
                }
                return `${prop}:${styleMap[prop]};`;
            })
            .join('');
        let prefixedSelector = selector
            .split(',')
            .map(r => `.${this.scopeClass} ${r}`)
            .join(',');

        let ruleString = `${prefixedSelector} { ${styles} }`;

        if (!this.stylesheet) return;

        let _index = this.stylesheet.cssRules.length;
        if (index !== -1) {
            this.stylesheet.deleteRule(index);
            _index = index;
        }

        this.stylesheet.insertRule(ruleString, _index);
        return _index; // eslint-disable-line
    }

    setDimensions() {
        this.setHeaderStyle();

        this.setupMinWidth();
        this.setupNaturalColumnWidth();
        this.setupColumnWidth();
        this.distributeRemainingWidth();
        this.setColumnStyle();
        this.compensateScrollbarWidth();

        this.setDefaultCellHeight();
        this.setBodyStyle();
    }

    setHeaderStyle() {
        if (this.options.layout === 'fluid') {
            // setting width as 0 will ensure that the
            // header doesn't take the available space
            $.style(this.header, {
                width: 0
            });
        }

        $.style(this.header, {
            margin: 0
        });

        // don't show resize cursor on nonResizable columns
        const nonResizableColumnsSelector = this.datamanager.getColumns()
            .filter(col => col.resizable === false)
            .map(col => col.colIndex)
            .map(i => `.data-table-header [data-col-index="${i}"]`)
            .join();

        this.setStyle(nonResizableColumnsSelector, {
            cursor: 'pointer'
        });
    }

    setupMinWidth() {
        $.each('.data-table-cell[data-is-header]', this.header).map(col => {
            const width = $.style($('.content', col), 'width');
            const {
                colIndex
            } = $.data(col);
            const column = this.getColumn(colIndex);

            if (!column.minWidth) {
                // only set this once
                column.minWidth = width;
            }
        });
    }

    setupNaturalColumnWidth() {
        if (!$('.data-table-row')) return;

        // set initial width as naturally calculated by table's first row
        $.each('.data-table-row[data-row-index="0"] .data-table-cell', this.bodyScrollable).map($cell => {
            const {
                colIndex
            } = $.data($cell);
            const column = this.datamanager.getColumn(colIndex);

            let naturalWidth = $.style($('.content', $cell), 'width');

            if (column.id === '_rowIndex') {
                naturalWidth = this.getRowIndexColumnWidth(naturalWidth);
                column.width = naturalWidth;
            }

            column.naturalWidth = naturalWidth;
        });
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
                    if (column.width < column.minWidth) {
                        column.width = column.minWidth;
                    }
                });
        }
    }

    compensateScrollbarWidth() {
        const scrollbarWidth = $.scrollbarWidth();
        const lastCol = this.datamanager.getColumn(-1);
        const width = lastCol.width - scrollbarWidth;
        this.columnmanager.setColumnWidth(lastCol.colIndex, width);
    }

    distributeRemainingWidth() {
        if (this.options.layout !== 'fluid') return;

        const wrapperWidth = $.style(this.instance.datatableWrapper, 'width');
        const headerWidth = $.style(this.header, 'width');
        const resizableColumns = this.datamanager.getColumns().filter(col => col.resizable);
        const deltaWidth = (wrapperWidth - headerWidth) / resizableColumns.length;

        resizableColumns.map(col => {
            const width = $.style(this.getColumnHeaderElement(col.colIndex), 'width');
            let finalWidth = Math.floor(width + deltaWidth) - 2;

            this.datamanager.updateColumn(col.colIndex, {
                width: finalWidth
            });
        });
    }

    setDefaultCellHeight() {
        if (this.options.dynamicRowHeight) return;
        if (this.__cellHeightSet) return;
        const $firstCell = $('.data-table-cell[data-is-header]', this.instance.header);
        if (!$firstCell) return;

        const height = this.options.cellHeight || $.style($firstCell, 'height');
        if (height) {
            this.setCellHeight(height);
            this.__cellHeightSet = true;
        }
    }

    setCellHeight(height) {
        this.setStyle('.data-table-cell .content', {
            height: height + 'px'
        });
        this.setStyle('.data-table-cell .edit-cell', {
            height: height + 'px'
        });
    }

    setColumnStyle() {
        // align columns
        this.datamanager.getColumns()
            .map(column => {
                // alignment
                if (['left', 'center', 'right'].includes(column.align)) {
                    this.setStyle(`[data-col-index="${column.colIndex}"]`, {
                        'text-align': column.align
                    });
                }
                // width
                this.columnmanager.setColumnHeaderWidth(column.colIndex);
                this.columnmanager.setColumnWidth(column.colIndex);
            });
        this.setBodyStyle();
    }

    refreshColumnWidth() {
        this.datamanager.getColumns()
            .map(column => {
                this.columnmanager.setColumnHeaderWidth(column.colIndex);
                this.columnmanager.setColumnWidth(column.colIndex);
            });
    }

    setBodyStyle() {
        const width = $.style(this.header, 'width');

        $.style(this.bodyScrollable, {
            width: width + 'px'
        });

        const $body = $('.data-table-body', this.bodyScrollable);

        if ($body) {
            $.style($body, {
                height: '0px'
            });
        }

        $.style(this.bodyScrollable, {
            marginTop: $.style(this.header, 'height') + 'px'
        });

        $.style($('table', this.bodyScrollable), {
            margin: 0,
            width: '100%'
        });
    }

    getColumnHeaderElement(colIndex) {
        colIndex = +colIndex;
        if (colIndex < 0) return null;
        return $(`.data-table-cell[data-col-index="${colIndex}"]`, this.header);
    }

    getRowIndexColumnWidth(baseWidth) {
        this._rowIndexColumnWidthMap = this._rowIndexColumnWidthMap || {};
        const rowCount = this.datamanager.getRowCount();
        const digits = (rowCount + '').length;

        if (!this._rowIndexColumnWidthMap[digits]) {
            // add 8px for each unit
            this._rowIndexColumnWidthMap[digits] = baseWidth + ((digits - 1) * 8);
        }

        return this._rowIndexColumnWidthMap[digits];
    }
}

const KEYCODES = {
    13: 'enter',
    91: 'meta',
    16: 'shift',
    17: 'ctrl',
    18: 'alt',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    9: 'tab',
    27: 'esc',
    67: 'c',
    70: 'f'
};

class Keyboard {
    constructor(element) {
        this.listeners = {};
        $.on(element, 'keydown', this.handler.bind(this));
    }

    handler(e) {
        let key = KEYCODES[e.keyCode];

        if (e.shiftKey && key !== 'shift') {
            key = 'shift+' + key;
        }

        if ((e.ctrlKey && key !== 'ctrl') || (e.metaKey && key !== 'meta')) {
            key = 'ctrl+' + key;
        }

        const listeners = this.listeners[key];

        if (listeners && listeners.length > 0) {
            for (let listener of listeners) {
                const preventBubbling = listener(e);
                if (preventBubbling === undefined || preventBubbling === true) {
                    e.preventDefault();
                }
            }
        }
    }

    on(key, listener) {
        const keys = key.split(',').map(k => k.trim());

        keys.map(key => {
            this.listeners[key] = this.listeners[key] || [];
            this.listeners[key].push(listener);
        });
    }
}

var DEFAULT_OPTIONS = {
    columns: [],
    data: [],
    dropdownButton: '▼',
    headerDropdown: [
        {
            label: 'Sort Ascending',
            action: function (column) {
                this.sortColumn(column.colIndex, 'asc');
            }
        },
        {
            label: 'Sort Descending',
            action: function (column) {
                this.sortColumn(column.colIndex, 'desc');
            }
        },
        {
            label: 'Reset sorting',
            action: function (column) {
                this.sortColumn(column.colIndex, 'none');
            }
        },
        {
            label: 'Remove column',
            action: function (column) {
                this.removeColumn(column.colIndex);
            }
        }
    ],
    events: {
        onRemoveColumn(column) {},
        onSwitchColumn(column1, column2) {},
        onSortColumn(column) {},
        onCheckRow(row) {}
    },
    sortIndicator: {
        asc: '↑',
        desc: '↓',
        none: ''
    },
    freezeMessage: '',
    getEditor: null,
    serialNoColumn: true,
    checkboxColumn: false,
    clusterize: true,
    logs: false,
    layout: 'fixed', // fixed, fluid, ratio
    noDataMessage: 'No Data',
    cellHeight: null,
    inlineFilters: false,
    treeView: false,
    checkedRowStatus: true,
    dynamicRowHeight: false
};

class DataTable {
    constructor(wrapper, options) {
        DataTable.instances++;

        if (typeof wrapper === 'string') {
            // css selector
            wrapper = document.querySelector(wrapper);
        }
        this.wrapper = wrapper;
        if (!(this.wrapper instanceof HTMLElement)) {
            throw new Error('Invalid argument given for `wrapper`');
        }

        this.buildOptions(options);
        this.prepare();

        this.style = new Style(this);
        this.keyboard = new Keyboard(this.wrapper);
        this.datamanager = new DataManager(this.options);
        this.rowmanager = new RowManager(this);
        this.columnmanager = new ColumnManager(this);
        this.cellmanager = new CellManager(this);
        this.bodyRenderer = new BodyRenderer(this);

        if (this.options.data) {
            this.refresh();
        }
    }

    buildOptions(options) {
        this.options = this.options || {};

        this.options = Object.assign(
            {}, DEFAULT_OPTIONS,
            this.options || {}, options
        );

        this.options.headerDropdown
            .push(...(options.headerDropdown || []));

        // custom user events
        this.events = Object.assign(
            {}, DEFAULT_OPTIONS.events,
            this.options.events || {},
            options.events || {}
        );
        this.fireEvent = this.fireEvent.bind(this);
    }

    prepare() {
        this.prepareDom();
        this.unfreeze();
    }

    prepareDom() {
        this.wrapper.innerHTML = `
            <div class="data-table">
                <table class="data-table-header">
                </table>
                <div class="body-scrollable">
                </div>
                <div class="freeze-container">
                <span>${this.options.freezeMessage}</span>
                </div>
                <div class="data-table-footer">
                </div>
                <div class="toast-message"></div>
            </div>
        `;

        this.datatableWrapper = $('.data-table', this.wrapper);
        this.header = $('.data-table-header', this.wrapper);
        this.bodyScrollable = $('.body-scrollable', this.wrapper);
        this.freezeContainer = $('.freeze-container', this.wrapper);
        this.toastMessage = $('.toast-message', this.wrapper);
    }

    refresh(data, columns) {
        this.datamanager.init(data, columns);
        this.render();
        this.setDimensions();
    }

    destroy() {
        this.wrapper.innerHTML = '';
        this.style.destroy();
    }

    appendRows(rows) {
        this.datamanager.appendRows(rows);
        this.rowmanager.refreshRows();
    }

    refreshRow(row, rowIndex) {
        this.rowmanager.refreshRow(row, rowIndex);
    }

    render() {
        this.renderHeader();
        this.renderBody();
    }

    renderHeader() {
        this.columnmanager.renderHeader();
    }

    renderBody() {
        this.bodyRenderer.render();
    }

    setDimensions() {
        this.style.setDimensions();
    }

    showToastMessage(message) {
        this.bodyRenderer.showToastMessage(message);
    }

    clearToastMessage() {
        this.bodyRenderer.clearToastMessage();
    }

    getColumn(colIndex) {
        return this.datamanager.getColumn(colIndex);
    }

    getColumns() {
        return this.datamanager.getColumns();
    }

    getRows() {
        return this.datamanager.getRows();
    }

    getCell(colIndex, rowIndex) {
        return this.datamanager.getCell(colIndex, rowIndex);
    }

    getColumnHeaderElement(colIndex) {
        return this.columnmanager.getColumnHeaderElement(colIndex);
    }

    getViewportHeight() {
        if (!this.viewportHeight) {
            this.viewportHeight = $.style(this.bodyScrollable, 'height');
        }

        return this.viewportHeight;
    }

    sortColumn(colIndex, sortOrder) {
        this.columnmanager.sortColumn(colIndex, sortOrder);
    }

    removeColumn(colIndex) {
        this.columnmanager.removeColumn(colIndex);
    }

    scrollToLastColumn() {
        this.datatableWrapper.scrollLeft = 9999;
    }

    freeze() {
        $.style(this.freezeContainer, {
            display: ''
        });
    }

    unfreeze() {
        $.style(this.freezeContainer, {
            display: 'none'
        });
    }

    updateOptions(options) {
        this.buildOptions(options);
    }

    fireEvent(eventName, ...args) {
        this.events[eventName].apply(this, args);
    }

    log() {
        if (this.options.logs) {
            console.log.apply(console, arguments);
        }
    }
}

DataTable.instances = 0;

var name = "frappe-datatable";
var version = "0.0.4";
var description = "A modern datatable library for the web";
var main = "dist/frappe-datatable.cjs.js";
var scripts = {"start":"yarn run dev","build":"rollup -c","production":"rollup -c --production","build:docs":"rollup -c --docs","dev":"rollup -c -w","test":"mocha --compilers js:babel-core/register --colors ./test/*.spec.js"};
var devDependencies = {"chai":"3.5.0","deepmerge":"^2.0.1","mocha":"3.3.0","postcss-cssnext":"^3.1.0","postcss-nested":"^3.0.0","rollup-plugin-commonjs":"^8.3.0","rollup-plugin-eslint":"^4.0.0","rollup-plugin-json":"^2.3.0","rollup-plugin-node-resolve":"^3.0.3","rollup-plugin-postcss":"^1.2.8","rollup-plugin-uglify-es":"^0.0.1"};
var repository = {"type":"git","url":"https://github.com/frappe/datatable.git"};
var keywords = ["datatable","data","grid","table"];
var author = "Faris Ansari";
var license = "MIT";
var bugs = {"url":"https://github.com/frappe/datatable/issues"};
var homepage = "https://frappe.github.io/datatable";
var dependencies = {"clusterize.js":"^0.18.0","lodash":"^4.17.5","sortablejs":"^1.7.0"};
var packageJson = {
	name: name,
	version: version,
	description: description,
	main: main,
	scripts: scripts,
	devDependencies: devDependencies,
	repository: repository,
	keywords: keywords,
	author: author,
	license: license,
	bugs: bugs,
	homepage: homepage,
	dependencies: dependencies
};

DataTable.__version__ = packageJson.version;

return DataTable;

}(Sortable,Clusterize));
