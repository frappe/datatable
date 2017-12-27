import $ from './dom';

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
  67: 'c'
};

let initDone = false;
const handlers = {};

function bind(dom) {
  if (initDone) return;
  $.on(dom, 'keydown', handler);
  initDone = true;
}

function handler(e) {
  let key = KEYCODES[e.keyCode];

  if (e.shiftKey && key !== 'shift') {
    key = 'shift+' + key;
  }

  if ((e.ctrlKey && key !== 'ctrl') || (e.metaKey && key !== 'meta')) {
    key = 'ctrl+' + key;
  }

  const _handlers = handlers[key];

  if (_handlers && _handlers.length > 0) {
    _handlers.map(handler => {
      const preventBubbling = handler();

      if (preventBubbling === undefined || preventBubbling === true) {
        e.preventDefault();
      }
    });
  }
}

export default {
  init(dom) {
    bind(dom);
  },
  on(key, handler) {
    const keys = key.split(',').map(k => k.trim());

    keys.map(key => {
      handlers[key] = handlers[key] || [];
      handlers[key].push(handler);
    });
  }
};
