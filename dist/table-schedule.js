/**
 * TableSchedule.js v0.2.0 by Monkey-D-Pixel
 * git@github.com:Monkey-D-Pixel/table-schedule.git
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.TableSchedule = factory());
}(this, function () { 'use strict';

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  var createElem = function createElem(obj) {
    if (!obj || !obj.tagName) {
      return null;
    }

    var el = document.createElement(obj.tagName);

    if (obj.attr && Object.keys(obj.attr).length) {
      for (var key in obj.attr) {
        if (obj.attr[key] !== null && obj.attr[key] !== undefined) {
          el.setAttribute(key, String(obj.attr[key]));
        }
      }
    }

    if (obj.id && typeof obj.id === 'string') {
      el.id = obj.id;
    }

    if (obj.className && typeof obj.className === 'string') {
      el.className = obj.className;
    }

    if (obj.style && _typeof(obj.style) === 'object' && Object.keys(obj.style).length) {
      Object.assign(el.style, obj.style);
    }

    var c = obj.children;

    if (c && c instanceof Array && c.length) {
      for (var i = 0; i < c.length; i++) {
        var child = createElem(c[i]);

        if (child) {
          el.appendChild(child);
        }
      }
    } else if (c !== undefined && c !== null) {
      if (obj.html) {
        el.innerHTML = String(c);
      } else {
        el.innerText = String(c);
      }
    }

    return el;
  };
  var zeroize = function zeroize(n) {
    if (n < 10) {
      return '0' + n;
    } else {
      return n.toString();
    }
  };
  var fullDate = function fullDate(date) {
    return date.getFullYear() + '/' + zeroize(date.getMonth() + 1) + '/' + zeroize(date.getDate());
  };
  var parseDate = function parseDate(s) {
    s = (s || '').replace(/-/g, '/');
    var parsed = Date.parse(s);
    return new Date(parsed);
  };
  var hhmm = function hhmm(date) {
    return zeroize(date.getHours()) + ':' + zeroize(date.getMinutes());
  };
  var minuteToTimeStr = function minuteToTimeStr(minute) {
    var h = parseInt(minute / 60),
        m = parseInt(minute % 60);
    if (h < 10) h = '0' + h;
    if (m < 10) m = '0' + m;
    return h + ':' + m;
  };
  var timeStrToMinute = function timeStrToMinute(s) {
    s = s || '';
    var arr = s.split(':');
    var h = parseInt(arr[0]);
    var m = parseInt(arr[1]);

    if (!isNaN(h) && !isNaN(m)) {
      return h * 60 + m;
    } else {
      return 0;
    }
  };
  var closest = function closest(el, selector) {
    var ans = el.parentElement;

    while (ans && !ans.matches(selector)) {
      ans = ans.parentElement;
    }

    return ans;
  };
  var getDelegate = function getDelegate(e, selector) {
    var el = e.target;

    while (el && !el.matches(selector)) {
      if (el === e.currentTarget) {
        el = null;
        break;
      }

      el = el.parentElement;
    }

    return el;
  }; // https://github.com/olahol/scrollparent.js/blob/master/scrollparent.js

  var regex = /(auto|scroll)/;

  var style = function style(node, prop) {
    return getComputedStyle(node, null).getPropertyValue(prop);
  };

  var overflow = function overflow(node) {
    return style(node, "overflow") + style(node, "overflow-y") + style(node, "overflow-x");
  };

  var scroll = function scroll(node) {
    return regex.test(overflow(node));
  };

  var findScrollParent = function findScrollParent(el) {
    var ans = el.parentElement;

    while (ans && !scroll(ans)) {
      ans = ans.parentElement;
    }

    return ans || document.scrollingElement || document.documentElement;
  };
  var getFixRect = function getFixRect(el) {
    return el.getBoundingClientRect();
  };
  var getRect = function getRect(el, scroll) {
    scroll = scroll || findScrollParent(el);
    var rect = el.getBoundingClientRect().toJSON();
    rect.top += scroll.scrollTop;
    rect.bottom += scroll.scrollTop;
    rect.left += scroll.scrollLeft;
    rect.right += scroll.scrollLeft;
    return rect;
  };
  var getOffset = function getOffset(el, parent) {
    parent = parent || el.parentElement;
    var rect1 = getFixRect(el);
    var rect2 = getFixRect(parent);
    return {
      top: rect1.top - rect2.top,
      left: rect1.left - rect2.left,
      width: rect1.width,
      height: rect1.height
    };
  };
  var dispatchEvent = function dispatchEvent(element, type, data) {
    var event; // Event and CustomEvent on IE9-11 are global objects, not constructors

    if (typeof Event === 'function' && typeof CustomEvent === 'function') {
      event = new CustomEvent(type, {
        detail: data,
        bubbles: true,
        cancelable: true
      });
    } else {
      event = document.createEvent('CustomEvent');
      event.initCustomEvent(type, true, true, data);
    }

    return element.dispatchEvent(event);
  };
  var hasProp = function hasProp(obj, p) {
    return Object.prototype.hasOwnProperty.call(obj, p);
  };
  var includesAny = function includesAny(arr1, arr2) {
    if (!Array.isArray(arr1) || !arr1.length) {
      return false;
    }

    var pool = [];

    if (Array.isArray(arr2)) {
      pool = arr2;
    } else {
      pool.push(arr2);
    }

    for (var i = 0; i < pool.length; i++) {
      if (arr1.indexOf(pool[i]) > -1) {
        return true;
      }
    }

    return false;
  };

  var DEFAULTS = {
    startDate: new Date(),
    num: 7,
    dayStart: 6,
    // hour
    dayEnd: 22,
    gap: 10,
    // minute
    quantizing: true,
    // use quantization without(true) or with(false) SHIFT key
    createThreshold: 10,
    // minute, used on touchmove & touchend
    stretchThreshold: 5,
    // minute, used on touchmove
    moveYThreshold: 5,
    // minute, used on touchmove
    dateFormat: function dateFormat(date) {
      return fullDate(date).substring(5);
    },
    directChange: false,
    // if true, addEvent/updateEvent will be automatically called; or array of wanted ones
    extraDataset: null,
    // add extra dataset entries to event element, e.g. {id: 'ID'} will add 'data-id' with value from eventItem.ID
    labelGroups: false,
    // whether show group header
    groupHeaderText: null // default using item.group | a key from item object | a function which takes item.group

  };

  var CELL_HEIGHT = 20; // px

  var MOVE_X_THRESHOLD = 40; // px

  var EVENT = {
    create: 'create',
    modify: 'modify',
    remove: 'remove'
  };
  var TOUCH_DELAY = 500; // ms

  var privates = {
    _genDates: function _genDates(update) {
      this.dates = [];
      var ite = new Date(this.config.startDate);

      for (var i = 0; i < this.config.num; i++) {
        this.dates.push(new Date(ite));

        if (!update) {
          this.events.push([]);

          this._events.push([]);
        }

        ite.setDate(ite.getDate() + 1);
      }
    },
    _genThead: function _genThead() {
      var c = this.config;
      var dates = this.dates;
      var thead = {
        tagName: 'THEAD',
        props: {},
        children: [{
          tagName: 'TR',
          children: [{
            tagName: 'TH'
          }]
        }]
      };

      for (var i = 0; i < dates.length; i++) {
        thead.children[0].children.push({
          tagName: 'TH',
          children: [{
            tagName: 'div',
            children: c.dateFormat(dates[i]),
            html: true
          }, {
            tagName: 'table',
            className: 'group-header',
            children: [{
              tagName: 'thead',
              children: [{
                tagName: 'tr'
              }]
            }]
          }]
        });
      }

      return thead;
    },
    _renderOuter: function _renderOuter() {
      var c = this.config;
      var dates = this.dates; // thead for dates

      var thead = this._genThead(); // left column


      var timeline = {
        tagName: 'TABLE',
        className: 'time-line',
        children: [{
          tagName: 'TBODY',
          children: []
        }]
      };
      var da = new Date();
      da.setHours(c.dayStart, 0, 0, 0);
      var rows = Math.ceil((c.dayEnd - c.dayStart) * 60 / c.gap);

      for (var i = 0; i < rows; i++) {
        timeline.children[0].children.push({
          tagName: 'TR',
          children: [{
            tagName: 'TH',
            children: [{
              tagName: 'div',
              children: hhmm(da)
            }]
          }]
        });
        da.setMinutes(da.getMinutes() + c.gap);
      } // tbody


      var tbody = {
        tagName: 'TBODY',
        children: [{
          tagName: 'TR',
          children: [{
            tagName: 'TD',
            className: 'time-line-wrapper',
            children: [timeline]
          }]
        }]
      };

      for (var j = 0; j < dates.length; j++) {
        tbody.children[0].children.push({
          tagName: 'TD',
          className: 'day-col'
        });
      }

      this.el.root.appendChild(createElem(thead));
      this.el.root.appendChild(createElem(tbody));
    },
    _setGrid: function _setGrid(index, cols) {
      cols = cols || 1;
      var c = this.config;
      var rows = Math.ceil((c.dayEnd - c.dayStart) * 60 / c.gap);
      var grid = this.el.dayGrids[index].querySelector('tbody');
      var r = {
        tagName: 'TR',
        children: []
      };

      for (var i = 0; i < cols; i++) {
        r.children.push({
          tagName: 'TD',
          className: 'grid-cell'
        });
      }

      grid.innerHTML = '';

      for (var _i = 0; _i < rows; _i++) {
        grid.appendChild(createElem(r));
      }
    },
    _renderInner: function _renderInner(index) {
      var dayCols = this.el.dayCols;
      var h = {
        tagName: 'DIV',
        className: 'events-container',
        attr: {
          'data-index': 0
        },
        children: [{
          tagName: 'DIV',
          className: 'events-col'
        }]
      };
      var g = {
        tagName: 'TABLE',
        className: 'day-grid',
        children: [{
          tagName: 'TBODY',
          children: []
        }]
      };

      if (typeof index === 'number' && dayCols[index]) {
        dayCols[index].innerHTML = '';
        dayCols[index].appendChild(createElem(g));

        this._setGrid(index);

        h.attr['data-index'] = index;
        dayCols[index].appendChild(createElem(h));
      } else {
        for (var i = 0; i < dayCols.length; i++) {
          dayCols[i].innerHTML = '';
          dayCols[i].appendChild(createElem(g));

          this._setGrid(i);

          h.attr['data-index'] = i;
          dayCols[i].appendChild(createElem(h));
        }
      }
    },
    _renderEvent: function _renderEvent(item) {
      var c = this.config;
      var index = item.dateIndex;
      var top = (item.startm - c.dayStart * 60) / c.gap * CELL_HEIGHT;
      var h = (item.endm - item.startm) / c.gap * CELL_HEIGHT;
      var style = item.style && _typeof(item.style) === 'object' ? item.style : {};
      var className = item.className ? String(item.className).trim() : '';
      var attr = {
        'data-startm': item.startm,
        'data-endm': item.endm,
        'data-nr': item.nr
      };

      if (c.extraDataset && Object.keys(c.extraDataset).length) {
        for (var key in c.extraDataset) {
          if (!hasProp(attr, 'data-' + key) && hasProp(item, c.extraDataset[key])) {
            attr['data-' + key] = item[c.extraDataset[key]];
          }
        }
      }

      var elem = createElem({
        tagName: 'DIV',
        className: 'event' + (className ? ' ' + className : ''),
        style: Object.assign({}, style, {
          top: top + 'px',
          height: h + 'px'
        }),
        attr: attr,
        children: [{
          tagName: 'DIV',
          className: 'event-content-wrapper',
          children: [{
            tagName: 'DIV',
            className: 'event-title',
            children: item.title || ''
          }, {
            tagName: 'DIV',
            className: 'event-content',
            children: item.content,
            html: true
          }]
        }, {
          tagName: 'DIV',
          className: 'event-bar-wrapper',
          children: [{
            tagName: 'SPAN',
            className: 'event-bar'
          }]
        }]
      });

      this._insertIntoDate(elem, index);
    },
    _insertIntoDate: function _insertIntoDate(elem, index) {
      // get event-cols; try to insert into one of them; if fails, add one col
      var allCon = this.el.eventsContainers;
      var cols = allCon[index].children;
      var inserted = false;
      var nr = elem.dataset['nr'];
      var item = this.events[index][nr];

      for (var i = 0; i < cols.length; i++) {
        inserted = this._insertIntoCol(elem, cols[i]);

        if (inserted) {
          break;
        }
      }

      if (!inserted) {
        var idx = this._addCol(index, item.group);

        this._insertIntoCol(elem, cols[idx]);
      }

      this._setGroupHeader(index);
    },
    _setGroupHeader: function _setGroupHeader(index) {
      var _this = this;

      var c = this.config;

      var getHeaderText = function getHeaderText(col) {
        var ans = null;

        var item = _this.getEvent(col.children[0]);

        if (item) {
          ans = item.group;

          if (c.groupHeaderText) {
            if (typeof c.groupHeaderText === 'string') {
              if (item && hasProp(item, c.groupHeaderText)) {
                ans = item[c.groupHeaderText] || '';
              }
            } else if (typeof c.groupHeaderText === 'function') {
              ans = c.groupHeaderText(item.group);
            }
          }
        }

        return ans;
      };

      var tr = this.el.groupHeaders[index].querySelector('tr');
      tr.innerHTML = '';

      if (c.labelGroups) {
        var cols = this.el.eventsContainers[index].children;
        var colspan = 1;
        var group = cols[0] && cols[0].dataset['group'];
        var headerText = getHeaderText(cols[0]);
        var thObj = {
          tagName: 'th',
          style: {},
          children: [{
            tagName: 'div',
            attr: {
              title: headerText
            },
            children: headerText
          }]
        };

        if (cols.length > 1) {
          for (var i = 1; i < cols.length; i++) {
            var col = cols[i];

            if (col.dataset['group'] !== group) {
              // new group
              thObj.style.width = colspan / cols.length * 100 + '%';

              var _headerText2 = getHeaderText(cols[i - 1]);

              thObj.children[0].children = _headerText2;
              thObj.children[0].attr.title = _headerText2;
              tr.appendChild(createElem(thObj));
              group = col.dataset['group'];
              colspan = 1;
            } else {
              colspan += 1;
            }
          }

          thObj.style.width = colspan / cols.length * 100 + '%';

          var _headerText = getHeaderText(cols[cols.length - 1]);

          thObj.children[0].children = _headerText;
          thObj.children[0].attr.title = _headerText;
          tr.appendChild(createElem(thObj)); // last group
        } else if (thObj.children[0].children !== undefined && thObj.children[0].children !== null) {
          tr.appendChild(createElem(thObj)); // only one group
        }

        this._coords.grid = getRect(this.el.dayGrids[0], this.el.scroll);
      }
    },
    _arrangeEvents: function _arrangeEvents(dateIndex) {
      var con = this.el.eventsContainers[dateIndex];
      var cols = con.children; // remove dataset['group'] / remove empty cols

      for (var i = 0; i < cols.length; i++) {
        if (cols[i].childElementCount === 0) {
          if (i === 0) {
            cols[i].removeAttribute('data-group');
          } else {
            con.removeChild(cols[i]);
            i -= 1;
          }
        }
      }

      if (cols.length > 1) {
        // begin from col[1], for each event block inside, try to push the block left
        for (var _i2 = 1; _i2 < cols.length; _i2++) {
          var blocks = cols[_i2].children;

          for (var j = 0; j < blocks.length; j++) {
            var inserted = false;
            var k = 0;

            while (!inserted && k < _i2) {
              inserted = this._insertIntoCol(blocks[j], cols[k]);
              k += 1;
            }

            if (inserted) {
              j -= 1;
            }
          }
        } // remove empty cols


        if (cols.length > 1) {
          for (var _i3 = 0; _i3 < cols.length; _i3++) {
            if (cols[_i3].childElementCount === 0) {
              con.removeChild(cols[_i3]);
              _i3 -= 1;
            }
          }
        }
      }

      this._setGrid(dateIndex, cols.length);

      this._setGroupHeader(dateIndex);
    },
    _addCol: function _addCol(index, group) {
      var col = createElem({
        tagName: 'DIV',
        className: 'events-col'
      });
      var idx = -1;
      var con = this.el.eventsContainers[index];

      if (group !== undefined) {
        group = String(group);
        col.dataset['group'] = group;
        var fellows = con.querySelectorAll('[data-group="' + group + '"]');

        if (fellows.length) {
          fellows[fellows.length - 1].insertAdjacentElement('afterEnd', col);
          idx = [].indexOf.call(con.children, col);
        } else {
          con.appendChild(col);
          idx = con.children.length - 1;
        }
      } else {
        con.appendChild(col);
        idx = con.children.length - 1;
      }

      this._setGrid(index, con.children.length);

      return idx;
    },
    _insertIntoCol: function _insertIntoCol(elem, col) {
      var nr = elem.dataset['nr'];
      var index = col.parentElement.dataset['index'];
      var _item = this._events[index][nr];
      var group = _item.group;

      if (group !== undefined) {
        group = String(group); // null will also be a valid group
      }

      var s = _item.startm;
      var e = _item.endm;
      var items = col.children;

      if (items.length) {
        if (col.dataset['group'] !== group) {
          return false;
        }

        var hasSpace = true;

        for (var i = 0; i < items.length; i++) {
          if (items[i] !== elem) {
            var se = this._posToMinute(items[i]);

            if (!(se.startm >= e || se.endm <= s)) {
              // overlap
              hasSpace = false;
              break;
            }
          }
        }

        if (hasSpace) {
          col.appendChild(elem);
          return true;
        } else {
          return false;
        }
      } else {
        if (group !== undefined) {
          col.dataset['group'] = String(group);
        }

        col.appendChild(elem);
        return true;
      }
    },
    _clearDom: function _clearDom(which) {
      var _this2 = this;

      var pool = this._toDateIndexList(which);

      pool.forEach(function (index) {
        var blocks = _this2.el.eventsContainers[index].getElementsByClassName('event');

        for (var i = 0; i < blocks.length; i++) {
          blocks[i].parentElement.removeChild(blocks[i]);
          i -= 1;
        }

        _this2._renderInner(index);

        _this2._setGroupHeader(index);
      });
    }
  };

  var publics = {
    addEvent: function addEvent(eventItem) {
      var item = this._tsItem(eventItem);

      if (item) {
        var i = 0;
        var _pool = this._events[item.dateIndex];
        var pool = this.events[item.dateIndex];

        while (i < _pool.length && _pool[i].startm <= item.startm) {
          i += 1;
        }

        item.nr = i; // nr is for locating data provided for modify event

        i = _pool.length - 1;

        while (i >= item.nr) {
          // update nr of those behind. important: decrease i
          this.el.dayCols[item.dateIndex].querySelector('[data-nr="' + _pool[i].nr + '"]').dataset['nr'] = _pool[i].nr + 1;
          _pool[i].nr += 1;
          i -= 1;
        }

        _pool.splice(item.nr, 0, item);

        pool.splice(item.nr, 0, eventItem);

        this._renderEvent(item);
      }

      return this;
    },
    updateEvent: function updateEvent(coords, modified) {
      var c = this.config;
      var valid = Array.isArray(coords) && coords.length >= 2 && coords[0] >= 0 && coords[0] < c.num && coords[1] >= 0 && coords[1] < this.events[coords[0]].length;

      var _modified = this._tsItem(modified);

      if (valid && _modified) {
        var dateIndex = coords[0];
        var nr = coords[1];

        if (_modified.dateIndex !== dateIndex) {
          this.deleteEvent(coords);
          this.addEvent(modified);

          this._arrangeEvents(_modified.dateIndex);
        } else {
          _modified.nr = nr;
          this.events[dateIndex][nr] = modified;
          this._events[dateIndex][nr] = _modified;
          var block = this.el.eventsContainers[dateIndex].querySelector('[data-nr="' + nr + '"]');

          var top = this._minuteToTop(_modified.startm);

          if (block && top >= 0) {
            Object.assign(block.style, {
              top: top + 'px',
              height: this._minuteToTop(_modified.endm) - top + 'px'
            });

            this._insertIntoDate(block, dateIndex);

            this._arrangeEvents(dateIndex);
          }
        }
      }

      return this;
    },
    deleteEvent: function deleteEvent(coords) {
      var c = this.config;
      var valid = Array.isArray(coords) && coords.length >= 2 && coords[0] >= 0 && coords[0] < c.num && coords[1] >= 0 && coords[1] < this.events[coords[0]].length;

      if (valid) {
        var dateIndex = coords[0];
        var nr = coords[1];
        var _pool = this._events[dateIndex];
        var pool = this.events[dateIndex];

        _pool.splice(nr, 1);

        pool.splice(nr, 1);
        var el = this.el.dayCols[dateIndex].querySelector('[data-nr="' + nr + '"]');
        el.parentElement.removeChild(el);
        var i = nr;

        while (i < _pool.length) {
          // update nr of those behind
          this.el.dayCols[dateIndex].querySelector('[data-nr="' + _pool[i].nr + '"]').dataset['nr'] = _pool[i].nr - 1;
          _pool[i].nr -= 1;
          i += 1;
        }

        this._arrangeEvents(dateIndex);
      }

      return this;
    },

    /**
     * 
     * @param {*} which 
     */
    clear: function clear(which) {
      var _this = this;

      this._clearDom(which);

      var pool = this._toDateIndexList(which);

      pool.forEach(function (index) {
        _this.events[index] = [];
        _this._events[index] = [];
      });
      return this;
    },
    rerender: function rerender() {
      var _this2 = this;

      var c = this.config;

      this._clearDom();

      for (var i = 0; i < c.num; i++) {
        this._events[i].forEach(function (item) {
          _this2._renderEvent(item);
        });

        this._arrangeEvents(i);
      }

      return this;
    },
    changeStartDate: function changeStartDate(date) {
      var _this3 = this;

      var c = this.config;

      if (date instanceof Date && date.toString() !== 'Invalid Date') {
        (function () {
          var d = new Date(date);

          var _d = new Date(c.startDate);

          d.setHours(0, 0, 0, 0);

          _d.setHours(0, 0, 0, 0);

          var offset = (d.getTime() - _d.getTime()) / 1000 / 60 / 60 / 24;

          var theadEl = _this3.el.root.querySelector('thead');

          if (offset !== 0 && theadEl) {
            c.startDate = d;

            _this3._genDates(true); // events, _events are preserved


            var thead = createElem(_this3._genThead());
            theadEl.innerHTML = thead.innerHTML;

            if (offset < c.num && offset > 0) {
              for (var i = offset; i < c.num; i++) {
                _this3._events[i].forEach(function (item) {
                  item.dateIndex -= offset;
                });
              }

              _this3.events.splice(0, offset);

              _this3._events.splice(0, offset);

              for (var _i = 0; _i < offset; _i++) {
                _this3.events.push([]);

                _this3._events.push([]);
              }

              _this3.rerender();
            } else if (offset < 0 && offset > -c.num) {
              for (var _i2 = 0; _i2 < c.num + offset; _i2++) {
                _this3._events[_i2].forEach(function (item) {
                  item.dateIndex -= offset;
                });
              }

              _this3.events.splice(c.num + offset, -offset);

              _this3._events.splice(c.num + offset, -offset);

              for (var _i3 = 0; _i3 < -offset; _i3++) {
                _this3.events.unshift([]);

                _this3._events.unshift([]);
              }

              _this3.rerender();
            } else {
              _this3.clear();
            }
          }
        })();
      }

      return this;
    },
    destroy: function destroy() {
      this._unbind();

      var ch = this.el.root.children;

      for (var i = 0; i < ch.length; i++) {
        this.el.root.removeChild(ch[i]);
        i -= 1;
      }

      for (var key in this.el) {
        this.el[key] = null;
      }

      this.dates = [];
      this.events = [];
      this._events = [];
    },
    getEvent: function getEvent(elem) {
      if (elem && elem instanceof HTMLElement) {
        var coords = this._getEventCoords(elem);

        return this.events[coords[0]][coords[1]];
      }

      return null;
    },
    getElem: function getElem(eventItem) {
      if (eventItem) {
        for (var i = 0; i < this.events.length; i++) {
          var j = this.events[i].indexOf(eventItem);

          if (j > -1) {
            return this.el.dayCols[i].querySelector('[data-nr="' + j + '"]');
          }
        }
      }

      return null;
    }
  };

  var timeRegex = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/;
  var helpers = {
    _posToMinute: function _posToMinute(elem) {
      var c = this.config;
      var top = elem.offsetTop;
      var h = elem.offsetHeight;
      var startm = c.dayStart * 60 + top / CELL_HEIGHT * c.gap;
      var endm = startm + h / CELL_HEIGHT * c.gap;
      return {
        startm: startm,
        endm: endm
      };
    },
    _minuteToTop: function _minuteToTop(m) {
      m = parseInt(m);
      var ans = -1;

      if (typeof m === 'number' && !isNaN(m)) {
        var c = this.config;
        ans = (m - c.dayStart * 60) / c.gap * CELL_HEIGHT;
      }

      return ans;
    },
    _quantizeH: function _quantizeH(h) {
      return Math.round(h / CELL_HEIGHT) * CELL_HEIGHT;
    },
    _quantize: function _quantize(y) {
      var top = this._coords.grid.top;
      var scrolled = this.el.scroll.scrollTop;
      var raw = y - top + scrolled;
      return this._quantizeH(raw) + top - scrolled;
    },
    _quantizeTop: function _quantizeTop(t) {
      var top = this._coords.grid.top - this.el.scroll.scrollTop;
      return this._quantize(t + top) - top;
    },
    _getEventCoords: function _getEventCoords(elem) {
      var nr = parseInt(elem.dataset['nr']);
      var index = parseInt(closest(elem, '.events-container').dataset['index']);
      return [index, nr];
    },

    /**
     * validate eventItem, if valid, return a clone with additional info
     * Note: nr is not added here
     * @param {Object} eventItem 
     */
    _tsItem: function _tsItem(eventItem) {
      if (!eventItem) {
        return null;
      }

      var valid = true;
      valid &= eventItem.date && parseDate(eventItem.date).toString() !== 'Invalid Date';
      valid &= eventItem.start && timeRegex.test(eventItem.start) && eventItem.end && timeRegex.test(eventItem.end);

      if (valid) {
        var c = this.config;
        var dayStartm = c.dayStart * 60;
        var dayEndm = c.dayEnd * 60;
        var parsedDate = parseDate(eventItem.date);
        var ymd = fullDate(parsedDate);
        var startm = timeStrToMinute(eventItem.start);
        var endm = timeStrToMinute(eventItem.end);
        var dateIndex = -1;

        for (var i = 0; i < this.dates.length; i++) {
          if (ymd === fullDate(this.dates[i])) {
            dateIndex = i;
            break;
          }
        }

        if (dateIndex > -1 && startm < endm && startm >= dayStartm && endm <= dayEndm) {
          return Object.assign({}, eventItem, {
            parsedDate: parsedDate,
            ymd: ymd,
            startm: startm,
            endm: endm,
            dateIndex: dateIndex
          });
        } else {
          return null;
        }
      } else {
        return null;
      }
    },
    _toDateIndex: function _toDateIndex(what) {
      var c = this.config;

      if (typeof what === 'number') {
        if (what < c.num && what > -1) {
          return what;
        } else {
          return -1;
        }
      }

      if (!what) {
        return -1;
      }

      if (typeof what === 'string') {
        var parsed = parseDate(what);

        if (parsed.toString() !== 'Invalid Date') {
          var index = -1;

          for (var i = 0; i < this.dates.length; i++) {
            if (fullDate(parsed) === fullDate(this.dates[i])) {
              index = i;
              break;
            }
          }

          return index;
        } else {
          return -1;
        }
      }

      if (_typeof(what) === 'object' && what instanceof Date && what.toString() !== 'Invalid Date') {
        var _index = -1;

        for (var _i = 0; _i < this.dates.length; _i++) {
          if (fullDate(what) === fullDate(this.dates[_i])) {
            _index = _i;
            break;
          }
        }

        return _index;
      }

      return -1;
    },
    _toDateIndexList: function _toDateIndexList(which) {
      var _this = this;

      var c = this.config;
      var pool = [];

      if (which === undefined) {
        for (var i = 0; i < c.num; i++) {
          pool.push(i);
        }
      } else if (Array.isArray(which)) {
        var p = which.map(function (w) {
          return _this._toDateIndex(w);
        });
        p.forEach(function (q) {
          if (q > -1 && pool.indexOf(q) === -1) {
            pool.push(q);
          }
        });
      } else {
        var index = this._toDateIndex(which);

        if (index > -1) {
          pool.push(index);
        }
      }

      return pool;
    }
  };

  var touchStartEl = null;
  var touchData = {
    startY: 0,
    startX: 0,
    yArr: [],
    xArr: [],
    timestamp: Date.now()
  };
  var touchTO = null;
  var drawing = null;
  var modifying = null;
  var modifyingH = 0;
  var modifyingTop = 0;
  var yTriggered = false;
  var dragging = null;
  var oPos;
  var colLeft = [];
  var dropIndex;
  var bound = {
    top: -Infinity,
    right: Infinity,
    bottom: Infinity,
    left: -Infinity
  };

  var autoScroll = function () {
    var scrollInt = {
      h: null,
      v: null
    };
    var velocity = {
      h: 0,
      v: 0
    };
    var initScroll = {
      h: 0,
      v: 0
    };

    var set = function set(d, v) {
      var el = this.el.scroll;
      velocity[d] = v;

      if (v === 0) {
        reset.call(this, d);
      } else {
        if (!scrollInt[d]) {
          scrollInt[d] = setInterval(function () {
            if (d === 'h') {
              el.scrollLeft += velocity[d];
            } else {
              el.scrollTop += velocity[d];
            }
          }, 16);
        }
      }
    };

    var reset = function reset(d) {
      var t = [];

      if (!d) {
        t = ['h', 'v'];
      } else {
        t.push(d);
      }

      var delta = {
        h: this.el.scroll.scrollLeft - initScroll.h,
        v: this.el.scroll.scrollTop - initScroll.v
      };
      t.forEach(function (di) {
        clearInterval(scrollInt[di]);
        scrollInt[di] = null;
        velocity[di] = 0;
      });
      record.call(this, d);
      return delta;
    };

    var scrolling = function scrolling(d) {
      return velocity[d] !== 0;
    };

    var record = function record(d) {
      if (!d || d === 'h') {
        initScroll.h = this.el.scroll.scrollLeft;
      }

      if (!d || d === 'v') {
        initScroll.v = this.el.scroll.scrollTop;
      }
    };

    return {
      set: set,
      reset: reset,
      scrolling: scrolling,
      record: record,
      initScroll: initScroll
    };
  }();

  var land = function land() {
    touchData.startY = 0;
    touchData.yArr = [];
    touchData.startX = 0;
    touchData.xArr = [];
    touchData.timestamp = Date.now();
    touchStartEl = null;
    drawing = null;
    modifying = null;
    dragging = null;
    yTriggered = false;
    modifyingH = 0;
    modifyingTop = 0;
    bound = {
      top: -Infinity,
      right: Infinity,
      bottom: Infinity,
      left: -Infinity
    };
  };

  var getXY = function getXY(e) {
    if (/mouse/.test(e.type)) {
      return {
        x: e.clientX,
        y: e.clientY
      };
    } else {
      return {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  };

  var preventClick = function preventClick(e) {
    e.stopImmediatePropagation();
  };

  var preventContextMenu = function preventContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  var scrollDetector = function scrollDetector() {
    // TODO: if no scroll container provided, <html> is chosen, which doesn't seem to response to scroll event
    // may be auto add a scroll container?
    clearTimeout(touchTO);
    touchTO = null;
  };

  var handlers = {
    touchstart: function touchstart(e) {
      var c = this.config;
      var xy = getXY(e);
      var eventY = xy.y;

      if (c.quantizing ^ e.shiftKey) {
        eventY = this._quantize(eventY);
      }

      var common = function () {
        touchData.timestamp = Date.now();
        touchData.startY = xy.y;
        touchData.yArr.push(eventY);
        var eventX = xy.x;
        touchData.startX = eventX;
        touchData.xArr.push(eventX);
        document.addEventListener('mousemove', this._handlers.touchmove, {
          passive: false
        });
        document.addEventListener('touchmove', this._handlers.touchmove, {
          passive: false
        });
        document.addEventListener('mouseup', this._handlers.touchend);
        document.addEventListener('touchend', this._handlers.touchend);
      }.bind(this);

      var catchers = [['.event-bar', function (e, el) {
        common();
        touchStartEl = el;
        el.style.opacity = 1;
        modifying = closest(el, '.event');
        var offset = getOffset(modifying);
        modifyingH = offset.height;
        modifyingTop = offset.top;
        bound.top = this._coords.grid.top;
        bound.bottom = this._coords.scroll.top + getOffset(this.el.scroll).height;
        modifying.removeEventListener('click', preventClick);
      }], ['.event', function (e, el) {
        common();
        touchStartEl = el;
        var root = this.el.root;
        var scroll = this.el.scroll;
        modifying = el;
        var offset = getOffset(modifying);
        modifyingTop = offset.top;
        modifyingH = offset.height;
        oPos = getRect(el, scroll);
        colLeft = [].map.call(this.el.dayCols, function (col) {
          return getRect(col, scroll).left;
        });
        dropIndex = -1;
        autoScroll.record.call(this);
        var sPos = this._coords.scroll;
        var oFixPos = getFixRect(el);
        var sOffset = getOffset(scroll);
        var tOffset = getOffset(touchStartEl);
        bound = {
          top: xy.y - oFixPos.top + sPos.top + getOffset(root.querySelector('thead')).height,
          right: sPos.left + sOffset.width - (tOffset.width - (xy.x - oFixPos.left)),
          bottom: sPos.top + sOffset.height - (tOffset.height - (xy.y - oFixPos.top)),
          left: xy.x - oFixPos.left + sPos.left + getOffset(root.querySelector('.time-line')).width
        }; // won't work when in touchend handler

        touchStartEl.removeEventListener('click', preventClick);
      }], ['.events-col', function (e, el) {
        var _this = this;

        if (el === e.target) {
          // start drawing only when touch on .events-col
          common();

          var starter = function starter() {
            touchStartEl = el;
            var top = eventY - _this._coords.grid.top + _this.el.scroll.scrollTop;
            drawing = createElem({
              tagName: 'DIV',
              className: 'event drawing',
              style: {
                top: top + 'px'
              }
            });
            el.appendChild(drawing);
          }; // if touch - set a timer, unset when touchend


          if (e.type === 'touchstart') {
            touchTO = setTimeout(function () {
              starter();
            }, TOUCH_DELAY);
            window.addEventListener('contextmenu', preventContextMenu);
            this.el.scroll.addEventListener('scroll', scrollDetector);
          } else {
            starter();
          }
        } else if (e.target.className !== 'event-bar' && el.contains(e.target)) {
          e.stopPropagation();
        }
      }]];

      for (var i = 0; i < catchers.length; i++) {
        var selector = catchers[i][0];
        var catcher = catchers[i][1].bind(this);
        var el = getDelegate(e, selector);

        if (el) {
          this.el.root.style.userSelect = 'none';
          catcher(e, el);
          break;
        }
      }
    },
    touchmove: function touchmove(e) {
      var c = this.config;
      var xy = getXY(e);
      var eventY = xy.y;
      var startY = touchData.startY;
      var doQ = c.quantizing ^ e.shiftKey;

      if (doQ) {
        eventY = this._quantize(eventY);
        startY = this._quantize(startY);
      }

      touchData.yArr.push(eventY);
      var eventX = xy.x;
      var startX = touchData.startX;
      touchData.xArr.push(eventX);
      var movedY = eventY - startY;
      var movedX = eventX - startX;

      if (touchStartEl) {
        e.preventDefault();

        if (touchStartEl.className === 'events-col' && drawing && movedY > 0) {
          drawing.style.height = movedY + 'px';
        } else if (touchStartEl.className === 'event-bar' && modifying) {
          if (Math.abs(movedY) >= c.stretchThreshold / c.gap * CELL_HEIGHT || yTriggered) {
            if (!yTriggered) {
              modifying.addEventListener('click', preventClick);
            }

            yTriggered = true;
            var h;

            if (xy.y >= bound.top && xy.y <= bound.bottom) {
              var sV = autoScroll.scrolling('v');

              if (sV) {
                autoScroll.reset.call(this, 'v');
              }

              h = eventY - this._coords.grid.top - modifyingTop + this.el.scroll.scrollTop;

              if (!doQ) {
                // otherwise bottom will move suddenly to where the handle bar was
                h = modifyingH + movedY;
              }
            } else {
              if (xy.y < bound.top) {
                autoScroll.set.call(this, 'v', xy.y - bound.top);
              }

              if (xy.y > bound.bottom) {
                autoScroll.set.call(this, 'v', xy.y - bound.bottom);
              }
            }

            if (h > -0.1 && modifyingTop + h <= (c.dayEnd - c.dayStart) * 60 / c.gap * CELL_HEIGHT) {
              modifying.style.height = Math.max(h, 0) + 'px';

              if (Math.round(h) >= c.createThreshold / c.gap * CELL_HEIGHT) {
                modifying.classList.remove('drawing');
              } else {
                modifying.classList.add('drawing');
              }
            }
          }
        } else if (touchStartEl.classList.contains('event') && modifying) {
          var root = this.el.root;
          var scroll = this.el.scroll;

          if (Math.abs(movedX) > MOVE_X_THRESHOLD) {
            var fixTop = oPos.top - scroll.scrollTop;
            var fixLeft = oPos.left - scroll.scrollLeft;

            if (!dragging) {
              dragging = touchStartEl.cloneNode(true);
              Object.assign(dragging.style, {
                cursor: 'move',
                position: 'fixed',
                top: fixTop + 'px',
                left: fixLeft + 'px',
                width: touchStartEl.offsetWidth + 'px',
                opacity: 0.5
              });
              root.appendChild(dragging);
            }

            if (xy.x > bound.left && xy.x < bound.right) {
              var left = fixLeft + movedX;
              var sH = autoScroll.scrolling('h');

              if (sH) {
                var dh = autoScroll.reset.call(this, 'h').h;
                touchData.startX -= dh; // update old data

                left += dh;
              }

              dragging.style.left = left + 'px';
            } else {
              if (xy.x < bound.left) {
                autoScroll.set.call(this, 'h', xy.x - bound.left);
              }

              if (xy.x > bound.right) {
                autoScroll.set.call(this, 'h', xy.x - bound.right);
              }
            }

            if (xy.y > bound.top && xy.y < bound.bottom) {
              var top = (doQ ? this._quantize(fixTop) : fixTop) + movedY;

              var _sV = autoScroll.scrolling('v');

              if (_sV) {
                var dv = autoScroll.reset.call(this, 'v').v;
                touchData.startY -= dv;
                top += dv;
              }

              dragging.style.top = top + 'px';
            } else {
              if (xy.y < bound.top) {
                autoScroll.set.call(this, 'v', xy.y - bound.top);
              }

              if (xy.y > bound.bottom) {
                autoScroll.set.call(this, 'v', xy.y - bound.bottom);
              }
            }

            dropIndex = -1;
            var srcIndex = parseInt(closest(touchStartEl, '.events-container').dataset['index']);

            for (var i = colLeft.length - 1; i >= 0; i--) {
              if (colLeft[i] < eventX + scroll.scrollLeft) {
                if (i !== srcIndex) {
                  dropIndex = i;
                }

                break;
              }
            }

            [].forEach.call(this.el.dayCols, function (col, i) {
              if (i === dropIndex) {
                col.classList.add('drop-target');
              } else {
                col.classList.remove('drop-target');
              }
            });

            if (dropIndex > -1) {
              this.el.dayCols[dropIndex].classList.add('drop-target');
            }
          } else {
            [].forEach.call(this.el.dayCols, function (col) {
              col.classList.remove('drop-target');
            });

            if (dragging) {
              this.el.root.removeChild(dragging);
              dragging = null;
            }

            if (Math.abs(movedY) >= c.moveYThreshold / c.gap * CELL_HEIGHT || yTriggered) {
              // when triggered, ignore the threshold
              if (!yTriggered) {
                // specific fix so that delegated click event handler won't be called
                touchStartEl.addEventListener('click', preventClick);
              }

              yTriggered = true;
              touchStartEl.style.cursor = 'move';

              if (xy.y > bound.top && xy.y < bound.bottom) {
                Object.assign(touchStartEl.style, {
                  position: '',
                  left: '',
                  width: ''
                });

                if (doQ) {
                  var _top = this._quantizeTop(modifyingTop) + movedY;

                  var _sV2 = autoScroll.scrolling('v');

                  if (_sV2) {
                    var _dv = autoScroll.reset.call(this, 'v').v;
                    touchData.startY -= _dv;
                    _top += _dv;
                  }

                  if (_top >= 0 && _top + modifyingH <= (c.dayEnd - c.dayStart) * 60 / c.gap * CELL_HEIGHT) {
                    touchStartEl.style.top = _top + 'px';
                  }
                } else {
                  touchStartEl.style.top = modifyingTop + movedY + 'px';
                }
              } else {
                var _fixTop = oPos.top - autoScroll.initScroll.v;

                var _fixLeft = oPos.left - autoScroll.initScroll.h;

                Object.assign(touchStartEl.style, {
                  position: 'fixed',
                  left: _fixLeft + 'px',
                  width: touchStartEl.offsetWidth + 'px'
                });

                if (xy.y < bound.top) {
                  autoScroll.set.call(this, 'v', xy.y - bound.top);
                  touchStartEl.style.top = bound.top - (touchData.startY - _fixTop) + 'px';
                }

                if (xy.y > bound.bottom) {
                  autoScroll.set.call(this, 'v', xy.y - bound.bottom);
                  touchStartEl.style.top = bound.bottom - (touchData.startY - _fixTop) + 'px';
                }
              }
            }
          }
        }
      }
    },
    touchend: function touchend(e) {
      this.el.root.style.userSelect = '';
      clearTimeout(touchTO);
      touchTO = null;
      window.removeEventListener('contextmenu', preventContextMenu);
      this.el.scroll.removeEventListener('scroll', scrollDetector);

      if (!touchStartEl) {
        return;
      }

      var c = this.config;
      var doQ = c.quantizing ^ e.shiftKey;
      var lastY = touchData.yArr[touchData.yArr.length - 1];

      if (touchStartEl.className === 'events-col' && drawing) {
        var se = this._posToMinute(drawing);

        touchStartEl.removeChild(drawing);

        if (se.endm - se.startm >= c.createThreshold) {
          var index = parseInt(touchStartEl.parentElement.dataset['index']);
          var date = fullDate(this.dates[index]);
          var item = {
            date: date,
            start: minuteToTimeStr(se.startm),
            end: minuteToTimeStr(se.endm)
          };
          dispatchEvent(this.el.root, EVENT.create, {
            item: item
          });

          if (c.directChange === true || includesAny(c.directChange, EVENT.create)) {
            this.addEvent(item);
          }
        }

        land();
      } else if (touchStartEl.className === 'event-bar' && modifying) {
        touchStartEl.style.opacity = '';
        modifying.classList.remove('drawing');

        if (Math.abs(modifying.offsetHeight - modifyingH) > 0) {
          var _se = this._posToMinute(modifying);

          var coords = this._getEventCoords(modifying);

          var _item2 = this.events[coords[0]][coords[1]];
          var mod = {
            type: 'end',
            date: _item2.date,
            start: _item2.start,
            end: minuteToTimeStr(_se.endm)
          };

          if (modifying.offsetHeight >= c.createThreshold / c.gap * CELL_HEIGHT) {
            modifying.style.height = modifyingH + 'px';
            dispatchEvent(this.el.root, EVENT.modify, {
              item: _item2,
              coords: coords,
              mod: mod
            });

            if (c.directChange === true || includesAny(c.directChange, [EVENT.modify, 'end'])) {
              _item2.end = mod.end;
              this.updateEvent(coords, _item2);
            }
          } else {
            modifying.style.height = modifyingH + 'px';
            dispatchEvent(this.el.root, EVENT.remove, {
              item: _item2,
              coords: coords
            });

            if (c.directChange === true || includesAny(c.directChange, EVENT.remove)) {
              this.deleteEvent(coords);
            }
          }
        } else {
          modifying.style.height = modifyingH + 'px';
        }

        land();
        autoScroll.reset.call(this);
      } else if (touchStartEl.classList.contains('event')) {
        if (dragging && modifying) {
          if (dropIndex > -1) {
            var top = Math.round(parseFloat(dragging.style.top) + this.el.scroll.scrollTop - this._coords.grid.top);
            top = Math.max(top, 0);
            top = Math.min(top, (c.dayEnd - c.dayStart) * 60 / c.gap * CELL_HEIGHT - modifyingH);

            if (doQ) {
              top = this._quantizeTop(top);
            }

            var startm = c.dayStart * 60 + top / CELL_HEIGHT * c.gap;
            var endm = startm + Math.round(modifyingH / CELL_HEIGHT * c.gap);

            var _coords = this._getEventCoords(modifying);

            var _item3 = this.events[_coords[0]][_coords[1]];
            var _item = this._events[_coords[0]][_coords[1]];
            var type = startm == _item.startm ? 'date' : 'datetime';
            var _mod = {
              type: type,
              date: fullDate(this.dates[dropIndex]),
              start: minuteToTimeStr(startm),
              end: minuteToTimeStr(endm)
            };
            dispatchEvent(this.el.root, EVENT.modify, {
              item: _item3,
              coords: _coords,
              mod: _mod
            });

            if (c.directChange === true || includesAny(c.directChange, [EVENT.modify, type])) {
              Object.assign(_item3, {
                date: _mod.date,
                start: _mod.start,
                end: _mod.end
              });
              this.updateEvent(_coords, _item3);
            }
          }

          Object.assign(modifying.style, {
            top: modifyingTop + 'px',
            height: modifyingH
          });
          this.el.root.removeChild(dragging);
          [].forEach.call(this.el.dayCols, function (col) {
            col.classList.remove('drop-target');
          });
        } else if (modifying) {
          var offset = getOffset(modifying);

          if (Math.abs(offset.top - modifyingTop) > 0) {
            if (modifying.style.position === 'fixed') {
              // been scrolling, restore to absolute position, update top
              var dv = autoScroll.reset.call(this, 'v').v;
              Object.assign(modifying.style, {
                position: '',
                left: '',
                width: ''
              });

              var _top2;

              if (lastY <= bound.top) {
                _top2 = modifyingTop - (touchData.startY - bound.top) + dv;
              } else if (lastY >= bound.bottom) {
                _top2 = modifyingTop + (bound.bottom - touchData.startY) + dv;
              }

              _top2 = Math.max(_top2, 0);
              _top2 = Math.min(_top2, (c.dayEnd - c.dayStart) * 60 / c.gap * CELL_HEIGHT - modifyingH);

              if (doQ) {
                _top2 = this._quantizeTop(_top2);
              }

              modifying.style.top = _top2 + 'px';
            }

            var _se2 = this._posToMinute(modifying);

            var _coords2 = this._getEventCoords(modifying);

            var _item4 = this.events[_coords2[0]][_coords2[1]];
            var _mod2 = {
              type: 'start',
              date: _item4.date,
              start: minuteToTimeStr(_se2.startm),
              end: minuteToTimeStr(_se2.endm)
            };
            Object.assign(modifying.style, {
              top: modifyingTop + 'px',
              height: modifyingH + 'px'
            });
            dispatchEvent(this.el.root, EVENT.modify, {
              item: _item4,
              coords: _coords2,
              mod: _mod2
            });

            if (c.directChange === true || includesAny(c.directChange, [EVENT.modify, 'start'])) {
              _item4.start = _mod2.start;
              _item4.end = _mod2.end;
              this.updateEvent(_coords2, _item4);
            }
          }
        }

        touchStartEl.style.cursor = '';
        land();
        autoScroll.reset.call(this);
      }

      document.removeEventListener('mousemove', this._handlers.touchmove, {
        passive: false
      });
      document.removeEventListener('touchmove', this._handlers.touchmove, {
        passive: false
      });
      document.removeEventListener('mouseup', this._handlers.touchend);
      document.removeEventListener('touchend', this._handlers.touchend);
    },
    keydown: function keydown(e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        // cancel all moves
        if (drawing) {
          drawing.parentElement.removeChild(drawing);
        }

        if (modifying) {
          Object.assign(modifying.style, {
            top: modifyingTop + 'px',
            height: modifyingH + 'px',
            position: '',
            width: '',
            left: ''
          });
        }

        if (dragging) {
          dragging.parentElement.removeChild(dragging);
          [].forEach.call(this.el.dayCols, function (col) {
            col.classList.remove('drop-target');
          });
        }

        land();
        autoScroll.reset.call(this);
        document.removeEventListener('mousemove', this._handlers.touchmove, {
          passive: false
        });
        document.removeEventListener('touchmove', this._handlers.touchmove, {
          passive: false
        });
      }
    }
  };

  var events = {
    _bind: function _bind() {
      for (var key in handlers) {
        this._handlers[key] = handlers[key].bind(this);
      }

      this.el.root.addEventListener('mousedown', this._handlers.touchstart);
      this.el.root.addEventListener('touchstart', this._handlers.touchstart);
      document.addEventListener('keydown', this._handlers.keydown);
    },
    _unbind: function _unbind() {
      this.el.root.removeEventListener('mousedown', this._handlers.touchstart);
      this.el.root.removeEventListener('touchstart', this._handlers.touchstart);
      document.removeEventListener('keydown', this._handlers.keydown);
    }
  };

  var TableSchedule = function TableSchedule(el, config) {
    var elem;

    if (typeof el === 'string') {
      elem = document.querySelector(el);
    } else {
      elem = el;
    }

    if (!elem || elem.tagName !== 'TABLE') {
      throw new TypeError('el must be a <TABLE> element or a valid selector');
    }

    this.config = Object.assign({}, DEFAULTS, config);
    this.dates = [];
    this.el = {
      root: elem,
      dayCols: elem.getElementsByClassName('day-col'),
      dayGrids: elem.getElementsByClassName('day-grid'),
      eventsContainers: elem.getElementsByClassName('events-container'),
      groupHeaders: elem.getElementsByClassName('group-header'),
      scroll: findScrollParent(elem)
    };
    /**
     * event {
     *      date, *
     *      start, *
     *      end, *
     *      title,
     *      content,
     *      
     *      style,
     *      className,
     *      group,
     *      ...
     * }
     */

    this.events = []; // original

    this._events = []; // internal use

    this._handlers = {};

    this._init();

    this._coords = {
      grid: getRect(this.el.dayGrids[0]),
      scroll: getRect(this.el.scroll)
    };
  };

  TableSchedule.prototype._init = function () {
    this.el.root.classList.add('table-schedule');

    this._genDates();

    this._renderOuter();

    this._renderInner();

    this._bind();
  };

  Object.assign(TableSchedule.prototype, privates, publics, helpers, events);

  return TableSchedule;

}));
