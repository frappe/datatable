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
  27: 'esc'
};

const handlers = {};

function bind() {
  $(document).on('keydown', handler);
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
    _handlers.map(h => h());

    if (!e.isDefaultPrevented()) {
      e.preventDefault();
    }
  }
}

bind();

export default {
  on(key, handler) {
    const keys = key.split(',').map(k => k.trim());

    keys.map(key => {
      handlers[key] = handlers[key] || [];
      handlers[key].push(handler);
    });
  }
};
