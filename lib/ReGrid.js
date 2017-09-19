(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("ReGrid", [], factory);
	else if(typeof exports === 'object')
		exports["ReGrid"] = factory();
	else
		root["ReGrid"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ReGrid = undefined;

var _regrid = __webpack_require__(1);

var _regrid2 = _interopRequireDefault(_regrid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.ReGrid = _regrid2.default;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = __webpack_require__(2);

var _jQuery = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"jQuery\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

var _jQuery2 = _interopRequireDefault(_jQuery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ReGrid = function () {
  function ReGrid(_ref) {
    var wrapper = _ref.wrapper,
        events = _ref.events;

    _classCallCheck(this, ReGrid);

    this.wrapper = wrapper;
    this.events = events || {};
    this.makeDom();
    this.bindEvents();
  }

  _createClass(ReGrid, [{
    key: 'makeDom',
    value: function makeDom() {
      this.wrapper.html('\n      <div class="data-table">\n        <table class="data-table-header table table-bordered">\n        </table>\n        <div class="body-scrollable">\n          <table class="data-table-body table table-bordered">\n          </table>\n        </div>\n        <div class="data-table-footer">\n        </div>\n        <div class="data-table-popup">\n          <div class="edit-popup"></div>\n        </div>\n      </div>\n    ');

      this.header = this.wrapper.find('.data-table-header');
      this.bodyScrollable = this.wrapper.find('.body-scrollable');
      this.body = this.wrapper.find('.data-table-body');
      this.footer = this.wrapper.find('.data-table-footer');
    }
  }, {
    key: 'render',
    value: function render(_ref2) {
      var columns = _ref2.columns,
          rows = _ref2.rows;

      if (this.wrapper.find('.data-table').length === 0) {
        this.makeDom();
        this.bindEvents();
      }

      this.columns = this.prepareColumns(columns);
      this.rows = this.prepareRows(rows);

      this.header.html((0, _utils.getHeader)(this.columns));
      this.body.html((0, _utils.getBody)(this.rows));

      this.setDimensions();
    }
  }, {
    key: 'updateCell',
    value: function updateCell(rowIndex, colIndex, value) {
      var row = this.getRow(rowIndex);
      var cell = row.find(function (cell) {
        return cell.col_index === colIndex;
      });

      cell.data = value;
      this.refreshCell(cell);
    }
  }, {
    key: 'refreshRows',
    value: function refreshRows(rows) {
      if (rows) {
        this.rows = this.prepareRows(rows);
      }
      this.body.html((0, _utils.getBody)(this.rows));
      this.setDimensions();
    }
  }, {
    key: 'refreshCell',
    value: function refreshCell(cell) {
      var selector = '.data-table-col[data-row-index="' + cell.row_index + '"][data-col-index="' + cell.col_index + '"]';
      var $cell = this.body.find(selector);
      var $newCell = (0, _jQuery2.default)((0, _utils.getCell)(cell));

      $cell.replaceWith($newCell);
    }
  }, {
    key: 'prepareColumns',
    value: function prepareColumns(columns) {
      return columns.map(function (col, i) {
        col.colIndex = i;
        col.isHeader = 1;
        col.format = function (val) {
          return '<span>' + val + '</span>';
        };
        return col;
      });
    }
  }, {
    key: 'prepareRows',
    value: function prepareRows(rows) {
      return rows.map(function (cells, i) {
        return cells.map(function (cell, j) {
          cell.colIndex = j;
          cell.rowIndex = i;
          return cell;
        });
      });
    }
  }, {
    key: 'bindEvents',
    value: function bindEvents() {
      var me = this;

      this.bodyScrollable.on('click', '.data-table-col', function () {
        var $col = (0, _jQuery2.default)(this);

        me.bodyScrollable.find('.data-table-col').removeClass('selected');
        $col.addClass('selected');
      });

      this.bindCellDoubleClick();
      this.bindResizeColumn();
      this.bindSortColumn();
    }
  }, {
    key: 'setDimensions',
    value: function setDimensions() {
      var me = this;

      // set the width for each cell
      this.header.find('.data-table-col').each(function () {
        var col = (0, _jQuery2.default)(this);
        var height = col.find('.content').height();
        var width = col.find('.content').width();
        var colIndex = col.attr('data-col-index');
        var selector = '.data-table-col[data-col-index="' + colIndex + '"] .content';
        var $cell = me.bodyScrollable.find(selector);

        $cell.width(width);
        $cell.height(height);
      });

      // setting width as 0 will ensure that the
      // header doesn't take the available space
      this.header.css({
        width: 0,
        margin: 0
      });

      this.bodyScrollable.css({
        width: this.header.css('width'),
        marginTop: this.header.height() + 1
      });

      this.bodyScrollable.find('.table').css('margin', 0);
    }
  }, {
    key: 'bindCellDoubleClick',
    value: function bindCellDoubleClick() {
      var events = this.events;


      var $editPopup = this.wrapper.find('.edit-popup');

      $editPopup.hide();

      this.bodyScrollable.on('dblclick', '.data-table-col', function () {
        var $cell = (0, _jQuery2.default)(this);
        var rowIndex = $cell.attr('data-row-index');
        var colIndex = $cell.attr('data-col-index');

        $editPopup.empty();

        var _$cell$position = $cell.position(),
            top = _$cell$position.top,
            left = _$cell$position.left;

        $editPopup.css({
          top: top - 12,
          left: left - 12
        });

        // showing the popup is the responsibility of event handler
        events.on_cell_doubleclick($cell.get(0), $editPopup, rowIndex, colIndex);
      });

      (0, _jQuery2.default)(document.body).on('click', function (e) {
        if ((0, _jQuery2.default)(e.target).is('.edit-popup, .edit-popup *')) return;
        $editPopup.hide();
      });
    }
  }, {
    key: 'bindResizeColumn',
    value: function bindResizeColumn() {
      var me = this;
      var isDragging = false;
      var $currCell = void 0,
          startWidth = void 0,
          startX = void 0;

      this.header.on('mousedown', '.data-table-col', function (e) {
        $currCell = (0, _jQuery2.default)(this);
        var col = me.getColumn($currCell.attr('data-col-index'));

        if (col && col.resizable === false) {
          return;
        }

        isDragging = true;
        startWidth = $currCell.find('.content').width();
        startX = e.pageX;
      });

      (0, _jQuery2.default)('body').on('mouseup', function (e) {
        if (!$currCell) return;
        isDragging = false;
        var colIndex = $currCell.attr('data-col-index');

        if ($currCell) {
          var width = $currCell.find('.content').css('width');

          me.setColumnWidth(colIndex, width);
          me.bodyScrollable.css('width', me.header.css('width'));
          $currCell = null;
        }
      });

      this.header.on('mousemove', '.data-table-col', function (e) {
        if (!isDragging) return;
        var fwidth = startWidth + (e.pageX - startX);

        $currCell.find('.content').width(fwidth);
      });
    }
  }, {
    key: 'bindSortColumn',
    value: function bindSortColumn() {
      var me = this;

      this.header.on('click', '.data-table-col .content span', function () {
        var $cell = (0, _jQuery2.default)(this).closest('.data-table-col');
        var sortBy = $cell.attr('data-sort-by');
        var colIndex = $cell.attr('data-col-index');

        if (sortBy === 'none') {
          $cell.attr('data-sort-by', 'asc');
          $cell.find('.content').append('<span class="octicon octicon-chevron-up">');
        } else if (sortBy === 'asc') {
          $cell.attr('data-sort-by', 'desc');
          $cell.find('.content .octicon').removeClass('octicon-chevron-up').addClass('octicon-chevron-down');
        } else if (sortBy === 'desc') {
          $cell.attr('data-sort-by', 'none');
          $cell.find('.content .octicon').remove();
        }

        var sortByAction = $cell.attr('data-sort-by');

        if (me.events.on_sort) {
          me.events.on_sort.apply(null, [colIndex, sortByAction]);
        } else {
          me.sortRows(colIndex, sortByAction);
          me.refreshRows();
        }
      });
    }
  }, {
    key: 'sortRows',
    value: function sortRows(colIndex) {
      var sortBy = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'none';

      this.rows.sort(function (a, b) {
        var _aIndex = a[0].row_index;
        var _bIndex = b[0].row_index;
        var _a = a[colIndex].data;
        var _b = b[colIndex].data;

        if (sortBy === 'none') {
          return _aIndex - _bIndex;
        } else if (sortBy === 'asc') {
          if (_a < _b) return -1;
          if (_a > _b) return 1;
          if (_a === _b) return 0;
        } else if (sortBy === 'desc') {
          if (_a < _b) return 1;
          if (_a > _b) return -1;
          if (_a === _b) return 0;
        }
        return 0;
      });
    }
  }, {
    key: 'setColumnWidth',
    value: function setColumnWidth(colIndex, width) {
      var header = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      var selector = '.data-table-col[data-col-index="' + colIndex + '"] .content';
      var $el = void 0;

      if (header) {
        $el = this.header.find(selector);
      } else {
        $el = this.bodyScrollable.find(selector);
      }
      $el.css('width', width);
    }
  }, {
    key: 'getColumn',
    value: function getColumn(colIndex) {
      return this.columns.find(function (col) {
        return col.col_index === colIndex;
      });
    }
  }, {
    key: 'getRow',
    value: function getRow(rowIndex) {
      return this.rows.find(function (row) {
        return row[0].row_index === rowIndex;
      });
    }
  }]);

  return ReGrid;
}();

exports.default = ReGrid;
module.exports = exports['default'];

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _jQuery = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"jQuery\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));

var _jQuery2 = _interopRequireDefault(_jQuery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getCell(cell) {
  var customAttr = [!isNaN(cell.colIndex) ? 'data-col-index="' + cell.colIndex + '"' : '', !isNaN(cell.rowIndex) ? 'data-row-index="' + cell.rowIndex + '"' : '', cell.isHeader ? 'data-sort-by="none"' : ''].join(' ');

  return '\n      <td class="data-table-col noselect" ' + customAttr + '>\n        <div class="content ellipsis">\n          ' + (cell.format ? cell.format(cell.data) : cell.data) + '\n        </div>\n      </td>\n    ';
}

function getRow(row) {
  var header = row.isHeader ? 'data-header' : '';
  var cells = row.cells;
  var dataRowIndex = !isNaN(cells[0].rowIndex) ? 'data-row-index="' + cells[0].rowIndex + '"' : '';

  return '\n      <tr class="data-table-row" ' + dataRowIndex + ' ' + header + '>\n        ' + cells.map(getCell).join('') + '\n      </tr>\n    ';
}

function getHeader(columns) {
  var $header = (0, _jQuery2.default)('<thead>\n      ' + getRow({ cells: columns, isHeader: 1 }) + '\n    </thead>\n    ');

  columns.map(function (col) {
    if (!col.width) return;
    var $cellContent = $header.find('.data-table-col[data-col-index="' + col.colIndex + '"] .content');

    $cellContent.width(col.width);
    // $cell_content.css('max-width', col.width + 'px');
  });

  return $header;
}

function getBody(rows) {
  return '<tbody>\n      ' + rows.map(function (row) {
    return getRow({ cells: row });
  }).join('') + '\n    </tbody>\n    ';
}

exports.default = {
  getHeader: getHeader,
  getBody: getBody,
  getRow: getRow,
  getCell: getCell
};
module.exports = exports['default'];

/***/ })
/******/ ]);
});
//# sourceMappingURL=ReGrid.js.map