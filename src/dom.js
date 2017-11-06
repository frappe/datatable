
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
