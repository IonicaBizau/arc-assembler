"use strict";
"no use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

;(function (window) {
  if (typeof window.window != "undefined" && window.document) {
    return;
  }

  window.console = function () {
    var msgs = Array.prototype.slice.call(arguments, 0);
    postMessage({ type: "log", data: msgs });
  };
  window.console.error = window.console.warn = window.console.log = window.console.trace = window.console;

  window.window = window;
  window.ace = window;

  window.onerror = function (message, file, line, col, err) {
    postMessage({ type: "error", data: {
        message: message,
        file: file,
        line: line,
        col: col,
        stack: err.stack
      } });
  };

  window.normalizeModule = function (parentId, moduleName) {
    // normalize plugin requires
    if (moduleName.indexOf("!") !== -1) {
      var chunks = moduleName.split("!");
      return window.normalizeModule(parentId, chunks[0]) + "!" + window.normalizeModule(parentId, chunks[1]);
    }
    // normalize relative requires
    if (moduleName.charAt(0) == ".") {
      var base = parentId.split("/").slice(0, -1).join("/");
      moduleName = (base ? base + "/" : "") + moduleName;

      while (moduleName.indexOf(".") !== -1 && previous != moduleName) {
        var previous = moduleName;
        moduleName = moduleName.replace(/^\.\//, "").replace(/\/\.\//, "/").replace(/[^\/]+\/\.\.\//, "");
      }
    }

    return moduleName;
  };

  window.require = function (parentId, id) {
    if (!id) {
      id = parentId;
      parentId = null;
    }
    if (!id.charAt) throw new Error("worker.js require() accepts only (parentId, id) as arguments");

    id = window.normalizeModule(parentId, id);

    var module = window.require.modules[id];
    if (module) {
      if (!module.initialized) {
        module.initialized = true;
        module.exports = module.factory().exports;
      }
      return module.exports;
    }

    var chunks = id.split("/");
    if (!window.require.tlns) return console.log("unable to load " + id);
    chunks[0] = window.require.tlns[chunks[0]] || chunks[0];
    var path = chunks.join("/") + ".js";

    window.require.id = id;
    importScripts(path);
    return window.require(parentId, id);
  };
  window.require.modules = {};
  window.require.tlns = {};

  window.define = function (id, deps, _factory) {
    if (arguments.length == 2) {
      _factory = deps;
      if (typeof id != "string") {
        deps = id;
        id = window.require.id;
      }
    } else if (arguments.length == 1) {
      _factory = id;
      deps = [];
      id = window.require.id;
    }

    if (typeof _factory != "function") {
      window.require.modules[id] = {
        exports: _factory,
        initialized: true
      };
      return;
    }

    if (!deps.length)
      // If there is no dependencies, we inject 'require', 'exports' and
      // 'module' as dependencies, to provide CommonJS compatibility.
      deps = ['require', 'exports', 'module'];

    var req = function req(childId) {
      return window.require(id, childId);
    };

    window.require.modules[id] = {
      exports: {},
      factory: function factory() {
        var module = this;
        var returnExports = _factory.apply(this, deps.map(function (dep) {
          switch (dep) {
            // Because 'require', 'exports' and 'module' aren't actual
            // dependencies, we must handle them seperately.
            case 'require':
              return req;
            case 'exports':
              return module.exports;
            case 'module':
              return module;
            // But for all other dependencies, we can just go ahead and
            // require them.
            default:
              return req(dep);
          }
        }));
        if (returnExports) module.exports = returnExports;
        return module;
      }
    };
  };
  window.define.amd = {};

  window.initBaseUrls = function initBaseUrls(topLevelNamespaces) {
    require.tlns = topLevelNamespaces;
  };

  window.initSender = function initSender() {

    var EventEmitter = window.require("ace/lib/event_emitter").EventEmitter;
    var oop = window.require("ace/lib/oop");

    var Sender = function Sender() {};

    (function () {

      oop.implement(this, EventEmitter);

      this.callback = function (data, callbackId) {
        postMessage({
          type: "call",
          id: callbackId,
          data: data
        });
      };

      this.emit = function (name, data) {
        postMessage({
          type: "event",
          name: name,
          data: data
        });
      };
    }).call(Sender.prototype);

    return new Sender();
  };

  var main = window.main = null;
  var sender = window.sender = null;

  window.onmessage = function (e) {
    var msg = e.data;
    if (msg.command) {
      if (main[msg.command]) main[msg.command].apply(main, msg.args);else throw new Error("Unknown command:" + msg.command);
    } else if (msg.init) {
      initBaseUrls(msg.tlns);
      require("ace/lib/es5-shim");
      sender = window.sender = initSender();
      var clazz = require(msg.module)[msg.classname];
      main = window.main = new clazz(sender);
    } else if (msg.event && sender) {
      sender._signal(msg.event, msg.data);
    }
  };
})(undefined);

ace.define("ace/lib/oop", ["require", "exports", "module"], function (require, exports, module) {
  "use strict";

  exports.inherits = function (ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };

  exports.mixin = function (obj, mixin) {
    for (var key in mixin) {
      obj[key] = mixin[key];
    }
    return obj;
  };

  exports.implement = function (proto, mixin) {
    exports.mixin(proto, mixin);
  };
});

ace.define("ace/lib/event_emitter", ["require", "exports", "module"], function (require, exports, module) {
  "use strict";

  var EventEmitter = {};
  var stopPropagation = function stopPropagation() {
    this.propagationStopped = true;
  };
  var preventDefault = function preventDefault() {
    this.defaultPrevented = true;
  };

  EventEmitter._emit = EventEmitter._dispatchEvent = function (eventName, e) {
    this._eventRegistry || (this._eventRegistry = {});
    this._defaultHandlers || (this._defaultHandlers = {});

    var listeners = this._eventRegistry[eventName] || [];
    var defaultHandler = this._defaultHandlers[eventName];
    if (!listeners.length && !defaultHandler) return;

    if ((typeof e === "undefined" ? "undefined" : _typeof(e)) != "object" || !e) e = {};

    if (!e.type) e.type = eventName;
    if (!e.stopPropagation) e.stopPropagation = stopPropagation;
    if (!e.preventDefault) e.preventDefault = preventDefault;

    listeners = listeners.slice();
    for (var i = 0; i < listeners.length; i++) {
      listeners[i](e, this);
      if (e.propagationStopped) break;
    }

    if (defaultHandler && !e.defaultPrevented) return defaultHandler(e, this);
  };

  EventEmitter._signal = function (eventName, e) {
    var listeners = (this._eventRegistry || {})[eventName];
    if (!listeners) return;
    listeners = listeners.slice();
    for (var i = 0; i < listeners.length; i++) {
      listeners[i](e, this);
    }
  };

  EventEmitter.once = function (eventName, callback) {
    var _self = this;
    callback && this.addEventListener(eventName, function newCallback() {
      _self.removeEventListener(eventName, newCallback);
      callback.apply(null, arguments);
    });
  };

  EventEmitter.setDefaultHandler = function (eventName, callback) {
    var handlers = this._defaultHandlers;
    if (!handlers) handlers = this._defaultHandlers = { _disabled_: {} };

    if (handlers[eventName]) {
      var old = handlers[eventName];
      var disabled = handlers._disabled_[eventName];
      if (!disabled) handlers._disabled_[eventName] = disabled = [];
      disabled.push(old);
      var i = disabled.indexOf(callback);
      if (i != -1) disabled.splice(i, 1);
    }
    handlers[eventName] = callback;
  };
  EventEmitter.removeDefaultHandler = function (eventName, callback) {
    var handlers = this._defaultHandlers;
    if (!handlers) return;
    var disabled = handlers._disabled_[eventName];

    if (handlers[eventName] == callback) {
      var old = handlers[eventName];
      if (disabled) this.setDefaultHandler(eventName, disabled.pop());
    } else if (disabled) {
      var i = disabled.indexOf(callback);
      if (i != -1) disabled.splice(i, 1);
    }
  };

  EventEmitter.on = EventEmitter.addEventListener = function (eventName, callback, capturing) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners) listeners = this._eventRegistry[eventName] = [];

    if (listeners.indexOf(callback) == -1) listeners[capturing ? "unshift" : "push"](callback);
    return callback;
  };

  EventEmitter.off = EventEmitter.removeListener = EventEmitter.removeEventListener = function (eventName, callback) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners) return;

    var index = listeners.indexOf(callback);
    if (index !== -1) listeners.splice(index, 1);
  };

  EventEmitter.removeAllListeners = function (eventName) {
    if (this._eventRegistry) this._eventRegistry[eventName] = [];
  };

  exports.EventEmitter = EventEmitter;
});

ace.define("ace/range", ["require", "exports", "module"], function (require, exports, module) {
  "use strict";

  var comparePoints = function comparePoints(p1, p2) {
    return p1.row - p2.row || p1.column - p2.column;
  };
  var Range = function Range(startRow, startColumn, endRow, endColumn) {
    this.start = {
      row: startRow,
      column: startColumn
    };

    this.end = {
      row: endRow,
      column: endColumn
    };
  };

  (function () {
    this.isEqual = function (range) {
      return this.start.row === range.start.row && this.end.row === range.end.row && this.start.column === range.start.column && this.end.column === range.end.column;
    };
    this.toString = function () {
      return "Range: [" + this.start.row + "/" + this.start.column + "] -> [" + this.end.row + "/" + this.end.column + "]";
    };

    this.contains = function (row, column) {
      return this.compare(row, column) == 0;
    };
    this.compareRange = function (range) {
      var cmp,
          end = range.end,
          start = range.start;

      cmp = this.compare(end.row, end.column);
      if (cmp == 1) {
        cmp = this.compare(start.row, start.column);
        if (cmp == 1) {
          return 2;
        } else if (cmp == 0) {
          return 1;
        } else {
          return 0;
        }
      } else if (cmp == -1) {
        return -2;
      } else {
        cmp = this.compare(start.row, start.column);
        if (cmp == -1) {
          return -1;
        } else if (cmp == 1) {
          return 42;
        } else {
          return 0;
        }
      }
    };
    this.comparePoint = function (p) {
      return this.compare(p.row, p.column);
    };
    this.containsRange = function (range) {
      return this.comparePoint(range.start) == 0 && this.comparePoint(range.end) == 0;
    };
    this.intersects = function (range) {
      var cmp = this.compareRange(range);
      return cmp == -1 || cmp == 0 || cmp == 1;
    };
    this.isEnd = function (row, column) {
      return this.end.row == row && this.end.column == column;
    };
    this.isStart = function (row, column) {
      return this.start.row == row && this.start.column == column;
    };
    this.setStart = function (row, column) {
      if ((typeof row === "undefined" ? "undefined" : _typeof(row)) == "object") {
        this.start.column = row.column;
        this.start.row = row.row;
      } else {
        this.start.row = row;
        this.start.column = column;
      }
    };
    this.setEnd = function (row, column) {
      if ((typeof row === "undefined" ? "undefined" : _typeof(row)) == "object") {
        this.end.column = row.column;
        this.end.row = row.row;
      } else {
        this.end.row = row;
        this.end.column = column;
      }
    };
    this.inside = function (row, column) {
      if (this.compare(row, column) == 0) {
        if (this.isEnd(row, column) || this.isStart(row, column)) {
          return false;
        } else {
          return true;
        }
      }
      return false;
    };
    this.insideStart = function (row, column) {
      if (this.compare(row, column) == 0) {
        if (this.isEnd(row, column)) {
          return false;
        } else {
          return true;
        }
      }
      return false;
    };
    this.insideEnd = function (row, column) {
      if (this.compare(row, column) == 0) {
        if (this.isStart(row, column)) {
          return false;
        } else {
          return true;
        }
      }
      return false;
    };
    this.compare = function (row, column) {
      if (!this.isMultiLine()) {
        if (row === this.start.row) {
          return column < this.start.column ? -1 : column > this.end.column ? 1 : 0;
        };
      }

      if (row < this.start.row) return -1;

      if (row > this.end.row) return 1;

      if (this.start.row === row) return column >= this.start.column ? 0 : -1;

      if (this.end.row === row) return column <= this.end.column ? 0 : 1;

      return 0;
    };
    this.compareStart = function (row, column) {
      if (this.start.row == row && this.start.column == column) {
        return -1;
      } else {
        return this.compare(row, column);
      }
    };
    this.compareEnd = function (row, column) {
      if (this.end.row == row && this.end.column == column) {
        return 1;
      } else {
        return this.compare(row, column);
      }
    };
    this.compareInside = function (row, column) {
      if (this.end.row == row && this.end.column == column) {
        return 1;
      } else if (this.start.row == row && this.start.column == column) {
        return -1;
      } else {
        return this.compare(row, column);
      }
    };
    this.clipRows = function (firstRow, lastRow) {
      if (this.end.row > lastRow) var end = { row: lastRow + 1, column: 0 };else if (this.end.row < firstRow) var end = { row: firstRow, column: 0 };

      if (this.start.row > lastRow) var start = { row: lastRow + 1, column: 0 };else if (this.start.row < firstRow) var start = { row: firstRow, column: 0 };

      return Range.fromPoints(start || this.start, end || this.end);
    };
    this.extend = function (row, column) {
      var cmp = this.compare(row, column);

      if (cmp == 0) return this;else if (cmp == -1) var start = { row: row, column: column };else var end = { row: row, column: column };

      return Range.fromPoints(start || this.start, end || this.end);
    };

    this.isEmpty = function () {
      return this.start.row === this.end.row && this.start.column === this.end.column;
    };
    this.isMultiLine = function () {
      return this.start.row !== this.end.row;
    };
    this.clone = function () {
      return Range.fromPoints(this.start, this.end);
    };
    this.collapseRows = function () {
      if (this.end.column == 0) return new Range(this.start.row, 0, Math.max(this.start.row, this.end.row - 1), 0);else return new Range(this.start.row, 0, this.end.row, 0);
    };
    this.toScreenRange = function (session) {
      var screenPosStart = session.documentToScreenPosition(this.start);
      var screenPosEnd = session.documentToScreenPosition(this.end);

      return new Range(screenPosStart.row, screenPosStart.column, screenPosEnd.row, screenPosEnd.column);
    };
    this.moveBy = function (row, column) {
      this.start.row += row;
      this.start.column += column;
      this.end.row += row;
      this.end.column += column;
    };
  }).call(Range.prototype);
  Range.fromPoints = function (start, end) {
    return new Range(start.row, start.column, end.row, end.column);
  };
  Range.comparePoints = comparePoints;

  Range.comparePoints = function (p1, p2) {
    return p1.row - p2.row || p1.column - p2.column;
  };

  exports.Range = Range;
});

ace.define("ace/anchor", ["require", "exports", "module", "ace/lib/oop", "ace/lib/event_emitter"], function (require, exports, module) {
  "use strict";

  var oop = require("./lib/oop");
  var EventEmitter = require("./lib/event_emitter").EventEmitter;

  var Anchor = exports.Anchor = function (doc, row, column) {
    this.$onChange = this.onChange.bind(this);
    this.attach(doc);

    if (typeof column == "undefined") this.setPosition(row.row, row.column);else this.setPosition(row, column);
  };

  (function () {

    oop.implement(this, EventEmitter);
    this.getPosition = function () {
      return this.$clipPositionToDocument(this.row, this.column);
    };
    this.getDocument = function () {
      return this.document;
    };
    this.$insertRight = false;
    this.onChange = function (e) {
      var delta = e.data;
      var range = delta.range;

      if (range.start.row == range.end.row && range.start.row != this.row) return;

      if (range.start.row > this.row) return;

      if (range.start.row == this.row && range.start.column > this.column) return;

      var row = this.row;
      var column = this.column;
      var start = range.start;
      var end = range.end;

      if (delta.action === "insertText") {
        if (start.row === row && start.column <= column) {
          if (start.column === column && this.$insertRight) {} else if (start.row === end.row) {
            column += end.column - start.column;
          } else {
            column -= start.column;
            row += end.row - start.row;
          }
        } else if (start.row !== end.row && start.row < row) {
          row += end.row - start.row;
        }
      } else if (delta.action === "insertLines") {
        if (start.row === row && column === 0 && this.$insertRight) {} else if (start.row <= row) {
          row += end.row - start.row;
        }
      } else if (delta.action === "removeText") {
        if (start.row === row && start.column < column) {
          if (end.column >= column) column = start.column;else column = Math.max(0, column - (end.column - start.column));
        } else if (start.row !== end.row && start.row < row) {
          if (end.row === row) column = Math.max(0, column - end.column) + start.column;
          row -= end.row - start.row;
        } else if (end.row === row) {
          row -= end.row - start.row;
          column = Math.max(0, column - end.column) + start.column;
        }
      } else if (delta.action == "removeLines") {
        if (start.row <= row) {
          if (end.row <= row) row -= end.row - start.row;else {
            row = start.row;
            column = 0;
          }
        }
      }

      this.setPosition(row, column, true);
    };
    this.setPosition = function (row, column, noClip) {
      var pos;
      if (noClip) {
        pos = {
          row: row,
          column: column
        };
      } else {
        pos = this.$clipPositionToDocument(row, column);
      }

      if (this.row == pos.row && this.column == pos.column) return;

      var old = {
        row: this.row,
        column: this.column
      };

      this.row = pos.row;
      this.column = pos.column;
      this._signal("change", {
        old: old,
        value: pos
      });
    };
    this.detach = function () {
      this.document.removeEventListener("change", this.$onChange);
    };
    this.attach = function (doc) {
      this.document = doc || this.document;
      this.document.on("change", this.$onChange);
    };
    this.$clipPositionToDocument = function (row, column) {
      var pos = {};

      if (row >= this.document.getLength()) {
        pos.row = Math.max(0, this.document.getLength() - 1);
        pos.column = this.document.getLine(pos.row).length;
      } else if (row < 0) {
        pos.row = 0;
        pos.column = 0;
      } else {
        pos.row = row;
        pos.column = Math.min(this.document.getLine(pos.row).length, Math.max(0, column));
      }

      if (column < 0) pos.column = 0;

      return pos;
    };
  }).call(Anchor.prototype);
});

ace.define("ace/document", ["require", "exports", "module", "ace/lib/oop", "ace/lib/event_emitter", "ace/range", "ace/anchor"], function (require, exports, module) {
  "use strict";

  var oop = require("./lib/oop");
  var EventEmitter = require("./lib/event_emitter").EventEmitter;
  var Range = require("./range").Range;
  var Anchor = require("./anchor").Anchor;

  var Document = function Document(text) {
    this.$lines = [];
    if (text.length === 0) {
      this.$lines = [""];
    } else if (Array.isArray(text)) {
      this._insertLines(0, text);
    } else {
      this.insert({ row: 0, column: 0 }, text);
    }
  };

  (function () {

    oop.implement(this, EventEmitter);
    this.setValue = function (text) {
      var len = this.getLength();
      this.remove(new Range(0, 0, len, this.getLine(len - 1).length));
      this.insert({ row: 0, column: 0 }, text);
    };
    this.getValue = function () {
      return this.getAllLines().join(this.getNewLineCharacter());
    };
    this.createAnchor = function (row, column) {
      return new Anchor(this, row, column);
    };
    if ("aaa".split(/a/).length === 0) this.$split = function (text) {
      return text.replace(/\r\n|\r/g, "\n").split("\n");
    };else this.$split = function (text) {
      return text.split(/\r\n|\r|\n/);
    };

    this.$detectNewLine = function (text) {
      var match = text.match(/^.*?(\r\n|\r|\n)/m);
      this.$autoNewLine = match ? match[1] : "\n";
      this._signal("changeNewLineMode");
    };
    this.getNewLineCharacter = function () {
      switch (this.$newLineMode) {
        case "windows":
          return "\r\n";
        case "unix":
          return "\n";
        default:
          return this.$autoNewLine || "\n";
      }
    };

    this.$autoNewLine = "";
    this.$newLineMode = "auto";
    this.setNewLineMode = function (newLineMode) {
      if (this.$newLineMode === newLineMode) return;

      this.$newLineMode = newLineMode;
      this._signal("changeNewLineMode");
    };
    this.getNewLineMode = function () {
      return this.$newLineMode;
    };
    this.isNewLine = function (text) {
      return text == "\r\n" || text == "\r" || text == "\n";
    };
    this.getLine = function (row) {
      return this.$lines[row] || "";
    };
    this.getLines = function (firstRow, lastRow) {
      return this.$lines.slice(firstRow, lastRow + 1);
    };
    this.getAllLines = function () {
      return this.getLines(0, this.getLength());
    };
    this.getLength = function () {
      return this.$lines.length;
    };
    this.getTextRange = function (range) {
      if (range.start.row == range.end.row) {
        return this.getLine(range.start.row).substring(range.start.column, range.end.column);
      }
      var lines = this.getLines(range.start.row, range.end.row);
      lines[0] = (lines[0] || "").substring(range.start.column);
      var l = lines.length - 1;
      if (range.end.row - range.start.row == l) lines[l] = lines[l].substring(0, range.end.column);
      return lines.join(this.getNewLineCharacter());
    };

    this.$clipPosition = function (position) {
      var length = this.getLength();
      if (position.row >= length) {
        position.row = Math.max(0, length - 1);
        position.column = this.getLine(length - 1).length;
      } else if (position.row < 0) position.row = 0;
      return position;
    };
    this.insert = function (position, text) {
      if (!text || text.length === 0) return position;

      position = this.$clipPosition(position);
      if (this.getLength() <= 1) this.$detectNewLine(text);

      var lines = this.$split(text);
      var firstLine = lines.splice(0, 1)[0];
      var lastLine = lines.length == 0 ? null : lines.splice(lines.length - 1, 1)[0];

      position = this.insertInLine(position, firstLine);
      if (lastLine !== null) {
        position = this.insertNewLine(position); // terminate first line
        position = this._insertLines(position.row, lines);
        position = this.insertInLine(position, lastLine || "");
      }
      return position;
    };
    this.insertLines = function (row, lines) {
      if (row >= this.getLength()) return this.insert({ row: row, column: 0 }, "\n" + lines.join("\n"));
      return this._insertLines(Math.max(row, 0), lines);
    };
    this._insertLines = function (row, lines) {
      if (lines.length == 0) return { row: row, column: 0 };
      while (lines.length > 0xF000) {
        var end = this._insertLines(row, lines.slice(0, 0xF000));
        lines = lines.slice(0xF000);
        row = end.row;
      }

      var args = [row, 0];
      args.push.apply(args, lines);
      this.$lines.splice.apply(this.$lines, args);

      var range = new Range(row, 0, row + lines.length, 0);
      var delta = {
        action: "insertLines",
        range: range,
        lines: lines
      };
      this._signal("change", { data: delta });
      return range.end;
    };
    this.insertNewLine = function (position) {
      position = this.$clipPosition(position);
      var line = this.$lines[position.row] || "";

      this.$lines[position.row] = line.substring(0, position.column);
      this.$lines.splice(position.row + 1, 0, line.substring(position.column, line.length));

      var end = {
        row: position.row + 1,
        column: 0
      };

      var delta = {
        action: "insertText",
        range: Range.fromPoints(position, end),
        text: this.getNewLineCharacter()
      };
      this._signal("change", { data: delta });

      return end;
    };
    this.insertInLine = function (position, text) {
      if (text.length == 0) return position;

      var line = this.$lines[position.row] || "";

      this.$lines[position.row] = line.substring(0, position.column) + text + line.substring(position.column);

      var end = {
        row: position.row,
        column: position.column + text.length
      };

      var delta = {
        action: "insertText",
        range: Range.fromPoints(position, end),
        text: text
      };
      this._signal("change", { data: delta });

      return end;
    };
    this.remove = function (range) {
      if (!(range instanceof Range)) range = Range.fromPoints(range.start, range.end);
      range.start = this.$clipPosition(range.start);
      range.end = this.$clipPosition(range.end);

      if (range.isEmpty()) return range.start;

      var firstRow = range.start.row;
      var lastRow = range.end.row;

      if (range.isMultiLine()) {
        var firstFullRow = range.start.column == 0 ? firstRow : firstRow + 1;
        var lastFullRow = lastRow - 1;

        if (range.end.column > 0) this.removeInLine(lastRow, 0, range.end.column);

        if (lastFullRow >= firstFullRow) this._removeLines(firstFullRow, lastFullRow);

        if (firstFullRow != firstRow) {
          this.removeInLine(firstRow, range.start.column, this.getLine(firstRow).length);
          this.removeNewLine(range.start.row);
        }
      } else {
        this.removeInLine(firstRow, range.start.column, range.end.column);
      }
      return range.start;
    };
    this.removeInLine = function (row, startColumn, endColumn) {
      if (startColumn == endColumn) return;

      var range = new Range(row, startColumn, row, endColumn);
      var line = this.getLine(row);
      var removed = line.substring(startColumn, endColumn);
      var newLine = line.substring(0, startColumn) + line.substring(endColumn, line.length);
      this.$lines.splice(row, 1, newLine);

      var delta = {
        action: "removeText",
        range: range,
        text: removed
      };
      this._signal("change", { data: delta });
      return range.start;
    };
    this.removeLines = function (firstRow, lastRow) {
      if (firstRow < 0 || lastRow >= this.getLength()) return this.remove(new Range(firstRow, 0, lastRow + 1, 0));
      return this._removeLines(firstRow, lastRow);
    };

    this._removeLines = function (firstRow, lastRow) {
      var range = new Range(firstRow, 0, lastRow + 1, 0);
      var removed = this.$lines.splice(firstRow, lastRow - firstRow + 1);

      var delta = {
        action: "removeLines",
        range: range,
        nl: this.getNewLineCharacter(),
        lines: removed
      };
      this._signal("change", { data: delta });
      return removed;
    };
    this.removeNewLine = function (row) {
      var firstLine = this.getLine(row);
      var secondLine = this.getLine(row + 1);

      var range = new Range(row, firstLine.length, row + 1, 0);
      var line = firstLine + secondLine;

      this.$lines.splice(row, 2, line);

      var delta = {
        action: "removeText",
        range: range,
        text: this.getNewLineCharacter()
      };
      this._signal("change", { data: delta });
    };
    this.replace = function (range, text) {
      if (!(range instanceof Range)) range = Range.fromPoints(range.start, range.end);
      if (text.length == 0 && range.isEmpty()) return range.start;
      if (text == this.getTextRange(range)) return range.end;

      this.remove(range);
      if (text) {
        var end = this.insert(range.start, text);
      } else {
        end = range.start;
      }

      return end;
    };
    this.applyDeltas = function (deltas) {
      for (var i = 0; i < deltas.length; i++) {
        var delta = deltas[i];
        var range = Range.fromPoints(delta.range.start, delta.range.end);

        if (delta.action == "insertLines") this.insertLines(range.start.row, delta.lines);else if (delta.action == "insertText") this.insert(range.start, delta.text);else if (delta.action == "removeLines") this._removeLines(range.start.row, range.end.row - 1);else if (delta.action == "removeText") this.remove(range);
      }
    };
    this.revertDeltas = function (deltas) {
      for (var i = deltas.length - 1; i >= 0; i--) {
        var delta = deltas[i];

        var range = Range.fromPoints(delta.range.start, delta.range.end);

        if (delta.action == "insertLines") this._removeLines(range.start.row, range.end.row - 1);else if (delta.action == "insertText") this.remove(range);else if (delta.action == "removeLines") this._insertLines(range.start.row, delta.lines);else if (delta.action == "removeText") this.insert(range.start, delta.text);
      }
    };
    this.indexToPosition = function (index, startRow) {
      var lines = this.$lines || this.getAllLines();
      var newlineLength = this.getNewLineCharacter().length;
      for (var i = startRow || 0, l = lines.length; i < l; i++) {
        index -= lines[i].length + newlineLength;
        if (index < 0) return { row: i, column: index + lines[i].length + newlineLength };
      }
      return { row: l - 1, column: lines[l - 1].length };
    };
    this.positionToIndex = function (pos, startRow) {
      var lines = this.$lines || this.getAllLines();
      var newlineLength = this.getNewLineCharacter().length;
      var index = 0;
      var row = Math.min(pos.row, lines.length);
      for (var i = startRow || 0; i < row; ++i) {
        index += lines[i].length + newlineLength;
      }return index + pos.column;
    };
  }).call(Document.prototype);

  exports.Document = Document;
});

ace.define("ace/lib/lang", ["require", "exports", "module"], function (require, exports, module) {
  "use strict";

  exports.last = function (a) {
    return a[a.length - 1];
  };

  exports.stringReverse = function (string) {
    return string.split("").reverse().join("");
  };

  exports.stringRepeat = function (string, count) {
    var result = '';
    while (count > 0) {
      if (count & 1) result += string;

      if (count >>= 1) string += string;
    }
    return result;
  };

  var trimBeginRegexp = /^\s\s*/;
  var trimEndRegexp = /\s\s*$/;

  exports.stringTrimLeft = function (string) {
    return string.replace(trimBeginRegexp, '');
  };

  exports.stringTrimRight = function (string) {
    return string.replace(trimEndRegexp, '');
  };

  exports.copyObject = function (obj) {
    var copy = {};
    for (var key in obj) {
      copy[key] = obj[key];
    }
    return copy;
  };

  exports.copyArray = function (array) {
    var copy = [];
    for (var i = 0, l = array.length; i < l; i++) {
      if (array[i] && _typeof(array[i]) == "object") copy[i] = this.copyObject(array[i]);else copy[i] = array[i];
    }
    return copy;
  };

  exports.deepCopy = function (obj) {
    if ((typeof obj === "undefined" ? "undefined" : _typeof(obj)) !== "object" || !obj) return obj;
    var cons = obj.constructor;
    if (cons === RegExp) return obj;

    var copy = cons();
    for (var key in obj) {
      if (_typeof(obj[key]) === "object") {
        copy[key] = exports.deepCopy(obj[key]);
      } else {
        copy[key] = obj[key];
      }
    }
    return copy;
  };

  exports.arrayToMap = function (arr) {
    var map = {};
    for (var i = 0; i < arr.length; i++) {
      map[arr[i]] = 1;
    }
    return map;
  };

  exports.createMap = function (props) {
    var map = Object.create(null);
    for (var i in props) {
      map[i] = props[i];
    }
    return map;
  };
  exports.arrayRemove = function (array, value) {
    for (var i = 0; i <= array.length; i++) {
      if (value === array[i]) {
        array.splice(i, 1);
      }
    }
  };

  exports.escapeRegExp = function (str) {
    return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
  };

  exports.escapeHTML = function (str) {
    return str.replace(/&/g, "&#38;").replace(/"/g, "&#34;").replace(/'/g, "&#39;").replace(/</g, "&#60;");
  };

  exports.getMatchOffsets = function (string, regExp) {
    var matches = [];

    string.replace(regExp, function (str) {
      matches.push({
        offset: arguments[arguments.length - 2],
        length: str.length
      });
    });

    return matches;
  };
  exports.deferredCall = function (fcn) {
    var timer = null;
    var callback = function callback() {
      timer = null;
      fcn();
    };

    var deferred = function deferred(timeout) {
      deferred.cancel();
      timer = setTimeout(callback, timeout || 0);
      return deferred;
    };

    deferred.schedule = deferred;

    deferred.call = function () {
      this.cancel();
      fcn();
      return deferred;
    };

    deferred.cancel = function () {
      clearTimeout(timer);
      timer = null;
      return deferred;
    };

    deferred.isPending = function () {
      return timer;
    };

    return deferred;
  };

  exports.delayedCall = function (fcn, defaultTimeout) {
    var timer = null;
    var callback = function callback() {
      timer = null;
      fcn();
    };

    var _self = function _self(timeout) {
      if (timer == null) timer = setTimeout(callback, timeout || defaultTimeout);
    };

    _self.delay = function (timeout) {
      timer && clearTimeout(timer);
      timer = setTimeout(callback, timeout || defaultTimeout);
    };
    _self.schedule = _self;

    _self.call = function () {
      this.cancel();
      fcn();
    };

    _self.cancel = function () {
      timer && clearTimeout(timer);
      timer = null;
    };

    _self.isPending = function () {
      return timer;
    };

    return _self;
  };
});

ace.define("ace/worker/mirror", ["require", "exports", "module", "ace/document", "ace/lib/lang"], function (require, exports, module) {
  "use strict";

  var Document = require("../document").Document;
  var lang = require("../lib/lang");

  var Mirror = exports.Mirror = function (sender) {
    this.sender = sender;
    var doc = this.doc = new Document("");

    var deferredUpdate = this.deferredUpdate = lang.delayedCall(this.onUpdate.bind(this));

    var _self = this;
    sender.on("change", function (e) {
      doc.applyDeltas(e.data);
      if (_self.$timeout) return deferredUpdate.schedule(_self.$timeout);
      _self.onUpdate();
    });
  };

  (function () {

    this.$timeout = 500;

    this.setTimeout = function (timeout) {
      this.$timeout = timeout;
    };

    this.setValue = function (value) {
      this.doc.setValue(value);
      this.deferredUpdate.schedule(this.$timeout);
    };

    this.getValue = function (callbackId) {
      this.sender.callback(this.doc.getValue(), callbackId);
    };

    this.onUpdate = function () {};

    this.isPending = function () {
      return this.deferredUpdate.isPending();
    };
  }).call(Mirror.prototype);
});

ace.define("ace/mode/coffee/rewriter", ["require", "exports", "module"], function (require, exports, module) {

  var BALANCED_PAIRS,
      CALL_CLOSERS,
      EXPRESSION_CLOSE,
      EXPRESSION_END,
      EXPRESSION_START,
      IMPLICIT_CALL,
      IMPLICIT_END,
      IMPLICIT_FUNC,
      IMPLICIT_UNSPACED_CALL,
      INVERSES,
      LINEBREAKS,
      SINGLE_CLOSERS,
      SINGLE_LINERS,
      generate,
      left,
      rite,
      _i,
      _len,
      _ref,
      __indexOf = [].indexOf || function (item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (i in this && this[i] === item) return i;
    }return -1;
  },
      __slice = [].slice;

  generate = function generate(tag, value) {
    var tok;
    tok = [tag, value];
    tok.generated = true;
    return tok;
  };

  exports.Rewriter = function () {
    function Rewriter() {}

    Rewriter.prototype.rewrite = function (tokens) {
      this.tokens = tokens;
      this.removeLeadingNewlines();
      this.closeOpenCalls();
      this.closeOpenIndexes();
      this.normalizeLines();
      this.tagPostfixConditionals();
      this.addImplicitBracesAndParens();
      this.addLocationDataToGeneratedTokens();
      return this.tokens;
    };

    Rewriter.prototype.scanTokens = function (block) {
      var i, token, tokens;
      tokens = this.tokens;
      i = 0;
      while (token = tokens[i]) {
        i += block.call(this, token, i, tokens);
      }
      return true;
    };

    Rewriter.prototype.detectEnd = function (i, condition, action) {
      var levels, token, tokens, _ref, _ref1;
      tokens = this.tokens;
      levels = 0;
      while (token = tokens[i]) {
        if (levels === 0 && condition.call(this, token, i)) {
          return action.call(this, token, i);
        }
        if (!token || levels < 0) {
          return action.call(this, token, i - 1);
        }
        if (_ref = token[0], __indexOf.call(EXPRESSION_START, _ref) >= 0) {
          levels += 1;
        } else if (_ref1 = token[0], __indexOf.call(EXPRESSION_END, _ref1) >= 0) {
          levels -= 1;
        }
        i += 1;
      }
      return i - 1;
    };

    Rewriter.prototype.removeLeadingNewlines = function () {
      var i, tag, _i, _len, _ref;
      _ref = this.tokens;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        tag = _ref[i][0];
        if (tag !== 'TERMINATOR') {
          break;
        }
      }
      if (i) {
        return this.tokens.splice(0, i);
      }
    };

    Rewriter.prototype.closeOpenCalls = function () {
      var action, condition;
      condition = function condition(token, i) {
        var _ref;
        return (_ref = token[0]) === ')' || _ref === 'CALL_END' || token[0] === 'OUTDENT' && this.tag(i - 1) === ')';
      };
      action = function action(token, i) {
        return this.tokens[token[0] === 'OUTDENT' ? i - 1 : i][0] = 'CALL_END';
      };
      return this.scanTokens(function (token, i) {
        if (token[0] === 'CALL_START') {
          this.detectEnd(i + 1, condition, action);
        }
        return 1;
      });
    };

    Rewriter.prototype.closeOpenIndexes = function () {
      var action, condition;
      condition = function condition(token, i) {
        var _ref;
        return (_ref = token[0]) === ']' || _ref === 'INDEX_END';
      };
      action = function action(token, i) {
        return token[0] = 'INDEX_END';
      };
      return this.scanTokens(function (token, i) {
        if (token[0] === 'INDEX_START') {
          this.detectEnd(i + 1, condition, action);
        }
        return 1;
      });
    };

    Rewriter.prototype.matchTags = function () {
      var fuzz, i, j, pattern, _i, _ref, _ref1;
      i = arguments[0], pattern = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      fuzz = 0;
      for (j = _i = 0, _ref = pattern.length; 0 <= _ref ? _i < _ref : _i > _ref; j = 0 <= _ref ? ++_i : --_i) {
        while (this.tag(i + j + fuzz) === 'HERECOMMENT') {
          fuzz += 2;
        }
        if (pattern[j] == null) {
          continue;
        }
        if (typeof pattern[j] === 'string') {
          pattern[j] = [pattern[j]];
        }
        if (_ref1 = this.tag(i + j + fuzz), __indexOf.call(pattern[j], _ref1) < 0) {
          return false;
        }
      }
      return true;
    };

    Rewriter.prototype.looksObjectish = function (j) {
      return this.matchTags(j, '@', null, ':') || this.matchTags(j, null, ':');
    };

    Rewriter.prototype.findTagsBackwards = function (i, tags) {
      var backStack, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
      backStack = [];
      while (i >= 0 && (backStack.length || (_ref2 = this.tag(i), __indexOf.call(tags, _ref2) < 0) && ((_ref3 = this.tag(i), __indexOf.call(EXPRESSION_START, _ref3) < 0) || this.tokens[i].generated) && (_ref4 = this.tag(i), __indexOf.call(LINEBREAKS, _ref4) < 0))) {
        if (_ref = this.tag(i), __indexOf.call(EXPRESSION_END, _ref) >= 0) {
          backStack.push(this.tag(i));
        }
        if ((_ref1 = this.tag(i), __indexOf.call(EXPRESSION_START, _ref1) >= 0) && backStack.length) {
          backStack.pop();
        }
        i -= 1;
      }
      return _ref5 = this.tag(i), __indexOf.call(tags, _ref5) >= 0;
    };

    Rewriter.prototype.addImplicitBracesAndParens = function () {
      var stack;
      stack = [];
      return this.scanTokens(function (token, i, tokens) {
        var endAllImplicitCalls, endImplicitCall, endImplicitObject, forward, inImplicit, inImplicitCall, inImplicitControl, inImplicitObject, nextTag, offset, prevTag, prevToken, s, sameLine, stackIdx, stackTag, stackTop, startIdx, startImplicitCall, startImplicitObject, startsLine, tag, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
        tag = token[0];
        prevTag = (prevToken = i > 0 ? tokens[i - 1] : [])[0];
        nextTag = (i < tokens.length - 1 ? tokens[i + 1] : [])[0];
        stackTop = function stackTop() {
          return stack[stack.length - 1];
        };
        startIdx = i;
        forward = function forward(n) {
          return i - startIdx + n;
        };
        inImplicit = function inImplicit() {
          var _ref, _ref1;
          return (_ref = stackTop()) != null ? (_ref1 = _ref[2]) != null ? _ref1.ours : void 0 : void 0;
        };
        inImplicitCall = function inImplicitCall() {
          var _ref;
          return inImplicit() && ((_ref = stackTop()) != null ? _ref[0] : void 0) === '(';
        };
        inImplicitObject = function inImplicitObject() {
          var _ref;
          return inImplicit() && ((_ref = stackTop()) != null ? _ref[0] : void 0) === '{';
        };
        inImplicitControl = function inImplicitControl() {
          var _ref;
          return inImplicit && ((_ref = stackTop()) != null ? _ref[0] : void 0) === 'CONTROL';
        };
        startImplicitCall = function startImplicitCall(j) {
          var idx;
          idx = j != null ? j : i;
          stack.push(['(', idx, {
            ours: true
          }]);
          tokens.splice(idx, 0, generate('CALL_START', '('));
          if (j == null) {
            return i += 1;
          }
        };
        endImplicitCall = function endImplicitCall() {
          stack.pop();
          tokens.splice(i, 0, generate('CALL_END', ')'));
          return i += 1;
        };
        endAllImplicitCalls = function endAllImplicitCalls() {
          while (inImplicitCall()) {
            endImplicitCall();
          }
        };
        startImplicitObject = function startImplicitObject(j, startsLine) {
          var idx;
          if (startsLine == null) {
            startsLine = true;
          }
          idx = j != null ? j : i;
          stack.push(['{', idx, {
            sameLine: true,
            startsLine: startsLine,
            ours: true
          }]);
          tokens.splice(idx, 0, generate('{', generate(new String('{'))));
          if (j == null) {
            return i += 1;
          }
        };
        endImplicitObject = function endImplicitObject(j) {
          j = j != null ? j : i;
          stack.pop();
          tokens.splice(j, 0, generate('}', '}'));
          return i += 1;
        };
        if (inImplicitCall() && (tag === 'IF' || tag === 'TRY' || tag === 'FINALLY' || tag === 'CATCH' || tag === 'CLASS' || tag === 'SWITCH')) {
          stack.push(['CONTROL', i, {
            ours: true
          }]);
          return forward(1);
        }
        if (tag === 'INDENT' && inImplicit()) {
          if (prevTag !== '=>' && prevTag !== '->' && prevTag !== '[' && prevTag !== '(' && prevTag !== ',' && prevTag !== '{' && prevTag !== 'TRY' && prevTag !== 'ELSE' && prevTag !== '=') {
            while (inImplicitCall()) {
              endImplicitCall();
            }
          }
          if (inImplicitControl()) {
            stack.pop();
          }
          stack.push([tag, i]);
          return forward(1);
        }
        if (__indexOf.call(EXPRESSION_START, tag) >= 0) {
          stack.push([tag, i]);
          return forward(1);
        }
        if (__indexOf.call(EXPRESSION_END, tag) >= 0) {
          while (inImplicit()) {
            if (inImplicitCall()) {
              endImplicitCall();
            } else if (inImplicitObject()) {
              endImplicitObject();
            } else {
              stack.pop();
            }
          }
          stack.pop();
        }
        if ((__indexOf.call(IMPLICIT_FUNC, tag) >= 0 && token.spaced && !token.stringEnd || tag === '?' && i > 0 && !tokens[i - 1].spaced) && (__indexOf.call(IMPLICIT_CALL, nextTag) >= 0 || __indexOf.call(IMPLICIT_UNSPACED_CALL, nextTag) >= 0 && !((_ref = tokens[i + 1]) != null ? _ref.spaced : void 0) && !((_ref1 = tokens[i + 1]) != null ? _ref1.newLine : void 0))) {
          if (tag === '?') {
            tag = token[0] = 'FUNC_EXIST';
          }
          startImplicitCall(i + 1);
          return forward(2);
        }
        if (__indexOf.call(IMPLICIT_FUNC, tag) >= 0 && this.matchTags(i + 1, 'INDENT', null, ':') && !this.findTagsBackwards(i, ['CLASS', 'EXTENDS', 'IF', 'CATCH', 'SWITCH', 'LEADING_WHEN', 'FOR', 'WHILE', 'UNTIL'])) {
          startImplicitCall(i + 1);
          stack.push(['INDENT', i + 2]);
          return forward(3);
        }
        if (tag === ':') {
          if (this.tag(i - 2) === '@') {
            s = i - 2;
          } else {
            s = i - 1;
          }
          while (this.tag(s - 2) === 'HERECOMMENT') {
            s -= 2;
          }
          startsLine = s === 0 || (_ref2 = this.tag(s - 1), __indexOf.call(LINEBREAKS, _ref2) >= 0) || tokens[s - 1].newLine;
          if (stackTop()) {
            _ref3 = stackTop(), stackTag = _ref3[0], stackIdx = _ref3[1];
            if ((stackTag === '{' || stackTag === 'INDENT' && this.tag(stackIdx - 1) === '{') && (startsLine || this.tag(s - 1) === ',' || this.tag(s - 1) === '{')) {
              return forward(1);
            }
          }
          startImplicitObject(s, !!startsLine);
          return forward(2);
        }
        if (inImplicitCall() && __indexOf.call(CALL_CLOSERS, tag) >= 0) {
          if (prevTag === 'OUTDENT') {
            endImplicitCall();
            return forward(1);
          }
          if (prevToken.newLine) {
            endAllImplicitCalls();
            return forward(1);
          }
        }
        if (inImplicitObject() && __indexOf.call(LINEBREAKS, tag) >= 0) {
          stackTop()[2].sameLine = false;
        }
        if (__indexOf.call(IMPLICIT_END, tag) >= 0) {
          while (inImplicit()) {
            _ref4 = stackTop(), stackTag = _ref4[0], stackIdx = _ref4[1], (_ref5 = _ref4[2], sameLine = _ref5.sameLine, startsLine = _ref5.startsLine);
            if (inImplicitCall() && prevTag !== ',') {
              endImplicitCall();
            } else if (inImplicitObject() && sameLine && !startsLine) {
              endImplicitObject();
            } else if (inImplicitObject() && tag === 'TERMINATOR' && prevTag !== ',' && !(startsLine && this.looksObjectish(i + 1))) {
              endImplicitObject();
            } else {
              break;
            }
          }
        }
        if (tag === ',' && !this.looksObjectish(i + 1) && inImplicitObject() && (nextTag !== 'TERMINATOR' || !this.looksObjectish(i + 2))) {
          offset = nextTag === 'OUTDENT' ? 1 : 0;
          while (inImplicitObject()) {
            endImplicitObject(i + offset);
          }
        }
        return forward(1);
      });
    };

    Rewriter.prototype.addLocationDataToGeneratedTokens = function () {
      return this.scanTokens(function (token, i, tokens) {
        var column, line, nextLocation, prevLocation, _ref, _ref1;
        if (token[2]) {
          return 1;
        }
        if (!(token.generated || token.explicit)) {
          return 1;
        }
        if (token[0] === '{' && (nextLocation = (_ref = tokens[i + 1]) != null ? _ref[2] : void 0)) {
          line = nextLocation.first_line, column = nextLocation.first_column;
        } else if (prevLocation = (_ref1 = tokens[i - 1]) != null ? _ref1[2] : void 0) {
          line = prevLocation.last_line, column = prevLocation.last_column;
        } else {
          line = column = 0;
        }
        token[2] = {
          first_line: line,
          first_column: column,
          last_line: line,
          last_column: column
        };
        return 1;
      });
    };

    Rewriter.prototype.normalizeLines = function () {
      var action, condition, indent, outdent, starter;
      starter = indent = outdent = null;
      condition = function condition(token, i) {
        var _ref, _ref1, _ref2, _ref3;
        return token[1] !== ';' && (_ref = token[0], __indexOf.call(SINGLE_CLOSERS, _ref) >= 0) && !(token[0] === 'TERMINATOR' && (_ref1 = this.tag(i + 1), __indexOf.call(EXPRESSION_CLOSE, _ref1) >= 0)) && !(token[0] === 'ELSE' && starter !== 'THEN') && !(((_ref2 = token[0]) === 'CATCH' || _ref2 === 'FINALLY') && (starter === '->' || starter === '=>')) || (_ref3 = token[0], __indexOf.call(CALL_CLOSERS, _ref3) >= 0) && this.tokens[i - 1].newLine;
      };
      action = function action(token, i) {
        return this.tokens.splice(this.tag(i - 1) === ',' ? i - 1 : i, 0, outdent);
      };
      return this.scanTokens(function (token, i, tokens) {
        var j, tag, _i, _ref, _ref1, _ref2;
        tag = token[0];
        if (tag === 'TERMINATOR') {
          if (this.tag(i + 1) === 'ELSE' && this.tag(i - 1) !== 'OUTDENT') {
            tokens.splice.apply(tokens, [i, 1].concat(__slice.call(this.indentation())));
            return 1;
          }
          if (_ref = this.tag(i + 1), __indexOf.call(EXPRESSION_CLOSE, _ref) >= 0) {
            tokens.splice(i, 1);
            return 0;
          }
        }
        if (tag === 'CATCH') {
          for (j = _i = 1; _i <= 2; j = ++_i) {
            if (!((_ref1 = this.tag(i + j)) === 'OUTDENT' || _ref1 === 'TERMINATOR' || _ref1 === 'FINALLY')) {
              continue;
            }
            tokens.splice.apply(tokens, [i + j, 0].concat(__slice.call(this.indentation())));
            return 2 + j;
          }
        }
        if (__indexOf.call(SINGLE_LINERS, tag) >= 0 && this.tag(i + 1) !== 'INDENT' && !(tag === 'ELSE' && this.tag(i + 1) === 'IF')) {
          starter = tag;
          _ref2 = this.indentation(true), indent = _ref2[0], outdent = _ref2[1];
          if (starter === 'THEN') {
            indent.fromThen = true;
          }
          tokens.splice(i + 1, 0, indent);
          this.detectEnd(i + 2, condition, action);
          if (tag === 'THEN') {
            tokens.splice(i, 1);
          }
          return 1;
        }
        return 1;
      });
    };

    Rewriter.prototype.tagPostfixConditionals = function () {
      var action, condition, original;
      original = null;
      condition = function condition(token, i) {
        var prevTag, tag;
        tag = token[0];
        prevTag = this.tokens[i - 1][0];
        return tag === 'TERMINATOR' || tag === 'INDENT' && __indexOf.call(SINGLE_LINERS, prevTag) < 0;
      };
      action = function action(token, i) {
        if (token[0] !== 'INDENT' || token.generated && !token.fromThen) {
          return original[0] = 'POST_' + original[0];
        }
      };
      return this.scanTokens(function (token, i) {
        if (token[0] !== 'IF') {
          return 1;
        }
        original = token;
        this.detectEnd(i + 1, condition, action);
        return 1;
      });
    };

    Rewriter.prototype.indentation = function (implicit) {
      var indent, outdent;
      if (implicit == null) {
        implicit = false;
      }
      indent = ['INDENT', 2];
      outdent = ['OUTDENT', 2];
      if (implicit) {
        indent.generated = outdent.generated = true;
      }
      if (!implicit) {
        indent.explicit = outdent.explicit = true;
      }
      return [indent, outdent];
    };

    Rewriter.prototype.generate = generate;

    Rewriter.prototype.tag = function (i) {
      var _ref;
      return (_ref = this.tokens[i]) != null ? _ref[0] : void 0;
    };

    return Rewriter;
  }();

  BALANCED_PAIRS = [['(', ')'], ['[', ']'], ['{', '}'], ['INDENT', 'OUTDENT'], ['CALL_START', 'CALL_END'], ['PARAM_START', 'PARAM_END'], ['INDEX_START', 'INDEX_END']];

  exports.INVERSES = INVERSES = {};

  EXPRESSION_START = [];

  EXPRESSION_END = [];

  for (_i = 0, _len = BALANCED_PAIRS.length; _i < _len; _i++) {
    _ref = BALANCED_PAIRS[_i], left = _ref[0], rite = _ref[1];
    EXPRESSION_START.push(INVERSES[rite] = left);
    EXPRESSION_END.push(INVERSES[left] = rite);
  }

  EXPRESSION_CLOSE = ['CATCH', 'THEN', 'ELSE', 'FINALLY'].concat(EXPRESSION_END);

  IMPLICIT_FUNC = ['IDENTIFIER', 'SUPER', ')', 'CALL_END', ']', 'INDEX_END', '@', 'THIS'];

  IMPLICIT_CALL = ['IDENTIFIER', 'NUMBER', 'STRING', 'JS', 'REGEX', 'NEW', 'PARAM_START', 'CLASS', 'IF', 'TRY', 'SWITCH', 'THIS', 'BOOL', 'NULL', 'UNDEFINED', 'UNARY', 'SUPER', 'THROW', '@', '->', '=>', '[', '(', '{', '--', '++'];

  IMPLICIT_UNSPACED_CALL = ['+', '-'];

  IMPLICIT_END = ['POST_IF', 'FOR', 'WHILE', 'UNTIL', 'WHEN', 'BY', 'LOOP', 'TERMINATOR'];

  SINGLE_LINERS = ['ELSE', '->', '=>', 'TRY', 'FINALLY', 'THEN'];

  SINGLE_CLOSERS = ['TERMINATOR', 'CATCH', 'FINALLY', 'ELSE', 'OUTDENT', 'LEADING_WHEN'];

  LINEBREAKS = ['TERMINATOR', 'INDENT', 'OUTDENT'];

  CALL_CLOSERS = ['.', '?.', '::', '?::'];
});

ace.define("ace/mode/coffee/helpers", ["require", "exports", "module"], function (require, exports, module) {

  var buildLocationData, extend, _flatten, last, repeat, syntaxErrorToString, _ref;

  exports.starts = function (string, literal, start) {
    return literal === string.substr(start, literal.length);
  };

  exports.ends = function (string, literal, back) {
    var len;
    len = literal.length;
    return literal === string.substr(string.length - len - (back || 0), len);
  };

  exports.repeat = repeat = function repeat(str, n) {
    var res;
    res = '';
    while (n > 0) {
      if (n & 1) {
        res += str;
      }
      n >>>= 1;
      str += str;
    }
    return res;
  };

  exports.compact = function (array) {
    var item, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      item = array[_i];
      if (item) {
        _results.push(item);
      }
    }
    return _results;
  };

  exports.count = function (string, substr) {
    var num, pos;
    num = pos = 0;
    if (!substr.length) {
      return 1 / 0;
    }
    while (pos = 1 + string.indexOf(substr, pos)) {
      num++;
    }
    return num;
  };

  exports.merge = function (options, overrides) {
    return extend(extend({}, options), overrides);
  };

  extend = exports.extend = function (object, properties) {
    var key, val;
    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
    return object;
  };

  exports.flatten = _flatten = function flatten(array) {
    var element, flattened, _i, _len;
    flattened = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      element = array[_i];
      if (element instanceof Array) {
        flattened = flattened.concat(_flatten(element));
      } else {
        flattened.push(element);
      }
    }
    return flattened;
  };

  exports.del = function (obj, key) {
    var val;
    val = obj[key];
    delete obj[key];
    return val;
  };

  exports.last = last = function last(array, back) {
    return array[array.length - (back || 0) - 1];
  };

  exports.some = (_ref = Array.prototype.some) != null ? _ref : function (fn) {
    var e, _i, _len;
    for (_i = 0, _len = this.length; _i < _len; _i++) {
      e = this[_i];
      if (fn(e)) {
        return true;
      }
    }
    return false;
  };

  exports.invertLiterate = function (code) {
    var line, lines, maybe_code;
    maybe_code = true;
    lines = function () {
      var _i, _len, _ref1, _results;
      _ref1 = code.split('\n');
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        line = _ref1[_i];
        if (maybe_code && /^([ ]{4}|[ ]{0,3}\t)/.test(line)) {
          _results.push(line);
        } else if (maybe_code = /^\s*$/.test(line)) {
          _results.push(line);
        } else {
          _results.push('# ' + line);
        }
      }
      return _results;
    }();
    return lines.join('\n');
  };

  buildLocationData = function buildLocationData(first, last) {
    if (!last) {
      return first;
    } else {
      return {
        first_line: first.first_line,
        first_column: first.first_column,
        last_line: last.last_line,
        last_column: last.last_column
      };
    }
  };

  exports.addLocationDataFn = function (first, last) {
    return function (obj) {
      if ((typeof obj === "undefined" ? "undefined" : _typeof(obj)) === 'object' && !!obj['updateLocationDataIfMissing']) {
        obj.updateLocationDataIfMissing(buildLocationData(first, last));
      }
      return obj;
    };
  };

  exports.locationDataToString = function (obj) {
    var locationData;
    if ("2" in obj && "first_line" in obj[2]) {
      locationData = obj[2];
    } else if ("first_line" in obj) {
      locationData = obj;
    }
    if (locationData) {
      return "" + (locationData.first_line + 1) + ":" + (locationData.first_column + 1) + "-" + ("" + (locationData.last_line + 1) + ":" + (locationData.last_column + 1));
    } else {
      return "No location data";
    }
  };

  exports.baseFileName = function (file, stripExt, useWinPathSep) {
    var parts, pathSep;
    if (stripExt == null) {
      stripExt = false;
    }
    if (useWinPathSep == null) {
      useWinPathSep = false;
    }
    pathSep = useWinPathSep ? /\\|\// : /\//;
    parts = file.split(pathSep);
    file = parts[parts.length - 1];
    if (!(stripExt && file.indexOf('.') >= 0)) {
      return file;
    }
    parts = file.split('.');
    parts.pop();
    if (parts[parts.length - 1] === 'coffee' && parts.length > 1) {
      parts.pop();
    }
    return parts.join('.');
  };

  exports.isCoffee = function (file) {
    return (/\.((lit)?coffee|coffee\.md)$/.test(file)
    );
  };

  exports.isLiterate = function (file) {
    return (/\.(litcoffee|coffee\.md)$/.test(file)
    );
  };

  exports.throwSyntaxError = function (message, location) {
    var error;
    if (location.last_line == null) {
      location.last_line = location.first_line;
    }
    if (location.last_column == null) {
      location.last_column = location.first_column;
    }
    error = new SyntaxError(message);
    error.location = location;
    error.toString = syntaxErrorToString;
    error.stack = error.toString();
    throw error;
  };

  exports.updateSyntaxError = function (error, code, filename) {
    if (error.toString === syntaxErrorToString) {
      error.code || (error.code = code);
      error.filename || (error.filename = filename);
      error.stack = error.toString();
    }
    return error;
  };

  syntaxErrorToString = function syntaxErrorToString() {
    var codeLine, colorize, colorsEnabled, end, filename, first_column, first_line, last_column, last_line, marker, start, _ref1, _ref2;
    if (!(this.code && this.location)) {
      return Error.prototype.toString.call(this);
    }
    _ref1 = this.location, first_line = _ref1.first_line, first_column = _ref1.first_column, last_line = _ref1.last_line, last_column = _ref1.last_column;
    if (last_line == null) {
      last_line = first_line;
    }
    if (last_column == null) {
      last_column = first_column;
    }
    filename = this.filename || '[stdin]';
    codeLine = this.code.split('\n')[first_line];
    start = first_column;
    end = first_line === last_line ? last_column + 1 : codeLine.length;
    marker = repeat(' ', start) + repeat('^', end - start);
    if (typeof process !== "undefined" && process !== null) {
      colorsEnabled = process.stdout.isTTY && !process.env.NODE_DISABLE_COLORS;
    }
    if ((_ref2 = this.colorful) != null ? _ref2 : colorsEnabled) {
      colorize = function colorize(str) {
        return "\x1B[1;31m" + str + "\x1B[0m";
      };
      codeLine = codeLine.slice(0, start) + colorize(codeLine.slice(start, end)) + codeLine.slice(end);
      marker = colorize(marker);
    }
    return "" + filename + ":" + (first_line + 1) + ":" + (first_column + 1) + ": error: " + this.message + "\n" + codeLine + "\n" + marker;
  };
});

ace.define("ace/mode/coffee/lexer", ["require", "exports", "module", "ace/mode/coffee/rewriter", "ace/mode/coffee/helpers"], function (require, exports, module) {

  var BOM,
      BOOL,
      CALLABLE,
      CODE,
      COFFEE_ALIASES,
      COFFEE_ALIAS_MAP,
      COFFEE_KEYWORDS,
      COMMENT,
      COMPARE,
      COMPOUND_ASSIGN,
      HEREDOC,
      HEREDOC_ILLEGAL,
      HEREDOC_INDENT,
      HEREGEX,
      HEREGEX_OMIT,
      IDENTIFIER,
      INDEXABLE,
      INVERSES,
      JSTOKEN,
      JS_FORBIDDEN,
      JS_KEYWORDS,
      LINE_BREAK,
      LINE_CONTINUER,
      LOGIC,
      Lexer,
      MATH,
      MULTILINER,
      MULTI_DENT,
      NOT_REGEX,
      NOT_SPACED_REGEX,
      NUMBER,
      OPERATOR,
      REGEX,
      RELATION,
      RESERVED,
      Rewriter,
      SHIFT,
      SIMPLESTR,
      STRICT_PROSCRIBED,
      TRAILING_SPACES,
      UNARY,
      WHITESPACE,
      compact,
      count,
      invertLiterate,
      key,
      last,
      locationDataToString,
      repeat,
      starts,
      throwSyntaxError,
      _ref,
      _ref1,
      __indexOf = [].indexOf || function (item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (i in this && this[i] === item) return i;
    }return -1;
  };

  _ref = require('./rewriter'), Rewriter = _ref.Rewriter, INVERSES = _ref.INVERSES;

  _ref1 = require('./helpers'), count = _ref1.count, starts = _ref1.starts, compact = _ref1.compact, last = _ref1.last, repeat = _ref1.repeat, invertLiterate = _ref1.invertLiterate, locationDataToString = _ref1.locationDataToString, throwSyntaxError = _ref1.throwSyntaxError;

  exports.Lexer = Lexer = function () {
    function Lexer() {}

    Lexer.prototype.tokenize = function (code, opts) {
      var consumed, i, tag, _ref2;
      if (opts == null) {
        opts = {};
      }
      this.literate = opts.literate;
      this.indent = 0;
      this.baseIndent = 0;
      this.indebt = 0;
      this.outdebt = 0;
      this.indents = [];
      this.ends = [];
      this.tokens = [];
      this.chunkLine = opts.line || 0;
      this.chunkColumn = opts.column || 0;
      code = this.clean(code);
      i = 0;
      while (this.chunk = code.slice(i)) {
        consumed = this.identifierToken() || this.commentToken() || this.whitespaceToken() || this.lineToken() || this.heredocToken() || this.stringToken() || this.numberToken() || this.regexToken() || this.jsToken() || this.literalToken();
        _ref2 = this.getLineAndColumnFromChunk(consumed), this.chunkLine = _ref2[0], this.chunkColumn = _ref2[1];
        i += consumed;
      }
      this.closeIndentation();
      if (tag = this.ends.pop()) {
        this.error("missing " + tag);
      }
      if (opts.rewrite === false) {
        return this.tokens;
      }
      return new Rewriter().rewrite(this.tokens);
    };

    Lexer.prototype.clean = function (code) {
      if (code.charCodeAt(0) === BOM) {
        code = code.slice(1);
      }
      code = code.replace(/\r/g, '').replace(TRAILING_SPACES, '');
      if (WHITESPACE.test(code)) {
        code = "\n" + code;
        this.chunkLine--;
      }
      if (this.literate) {
        code = invertLiterate(code);
      }
      return code;
    };

    Lexer.prototype.identifierToken = function () {
      var colon, colonOffset, forcedIdentifier, id, idLength, input, match, poppedToken, prev, tag, tagToken, _ref2, _ref3, _ref4;
      if (!(match = IDENTIFIER.exec(this.chunk))) {
        return 0;
      }
      input = match[0], id = match[1], colon = match[2];
      idLength = id.length;
      poppedToken = void 0;
      if (id === 'own' && this.tag() === 'FOR') {
        this.token('OWN', id);
        return id.length;
      }
      forcedIdentifier = colon || (prev = last(this.tokens)) && ((_ref2 = prev[0]) === '.' || _ref2 === '?.' || _ref2 === '::' || _ref2 === '?::' || !prev.spaced && prev[0] === '@');
      tag = 'IDENTIFIER';
      if (!forcedIdentifier && (__indexOf.call(JS_KEYWORDS, id) >= 0 || __indexOf.call(COFFEE_KEYWORDS, id) >= 0)) {
        tag = id.toUpperCase();
        if (tag === 'WHEN' && (_ref3 = this.tag(), __indexOf.call(LINE_BREAK, _ref3) >= 0)) {
          tag = 'LEADING_WHEN';
        } else if (tag === 'FOR') {
          this.seenFor = true;
        } else if (tag === 'UNLESS') {
          tag = 'IF';
        } else if (__indexOf.call(UNARY, tag) >= 0) {
          tag = 'UNARY';
        } else if (__indexOf.call(RELATION, tag) >= 0) {
          if (tag !== 'INSTANCEOF' && this.seenFor) {
            tag = 'FOR' + tag;
            this.seenFor = false;
          } else {
            tag = 'RELATION';
            if (this.value() === '!') {
              poppedToken = this.tokens.pop();
              id = '!' + id;
            }
          }
        }
      }
      if (__indexOf.call(JS_FORBIDDEN, id) >= 0) {
        if (forcedIdentifier) {
          tag = 'IDENTIFIER';
          id = new String(id);
          id.reserved = true;
        } else if (__indexOf.call(RESERVED, id) >= 0) {
          this.error("reserved word \"" + id + "\"");
        }
      }
      if (!forcedIdentifier) {
        if (__indexOf.call(COFFEE_ALIASES, id) >= 0) {
          id = COFFEE_ALIAS_MAP[id];
        }
        tag = function () {
          switch (id) {
            case '!':
              return 'UNARY';
            case '==':
            case '!=':
              return 'COMPARE';
            case '&&':
            case '||':
              return 'LOGIC';
            case 'true':
            case 'false':
              return 'BOOL';
            case 'break':
            case 'continue':
              return 'STATEMENT';
            default:
              return tag;
          }
        }();
      }
      tagToken = this.token(tag, id, 0, idLength);
      if (poppedToken) {
        _ref4 = [poppedToken[2].first_line, poppedToken[2].first_column], tagToken[2].first_line = _ref4[0], tagToken[2].first_column = _ref4[1];
      }
      if (colon) {
        colonOffset = input.lastIndexOf(':');
        this.token(':', ':', colonOffset, colon.length);
      }
      return input.length;
    };

    Lexer.prototype.numberToken = function () {
      var binaryLiteral, lexedLength, match, number, octalLiteral;
      if (!(match = NUMBER.exec(this.chunk))) {
        return 0;
      }
      number = match[0];
      if (/^0[BOX]/.test(number)) {
        this.error("radix prefix '" + number + "' must be lowercase");
      } else if (/E/.test(number) && !/^0x/.test(number)) {
        this.error("exponential notation '" + number + "' must be indicated with a lowercase 'e'");
      } else if (/^0\d*[89]/.test(number)) {
        this.error("decimal literal '" + number + "' must not be prefixed with '0'");
      } else if (/^0\d+/.test(number)) {
        this.error("octal literal '" + number + "' must be prefixed with '0o'");
      }
      lexedLength = number.length;
      if (octalLiteral = /^0o([0-7]+)/.exec(number)) {
        number = '0x' + parseInt(octalLiteral[1], 8).toString(16);
      }
      if (binaryLiteral = /^0b([01]+)/.exec(number)) {
        number = '0x' + parseInt(binaryLiteral[1], 2).toString(16);
      }
      this.token('NUMBER', number, 0, lexedLength);
      return lexedLength;
    };

    Lexer.prototype.stringToken = function () {
      var octalEsc, quote, string, trimmed;
      switch (quote = this.chunk.charAt(0)) {
        case "'":
          string = SIMPLESTR.exec(this.chunk)[0];
          break;
        case '"':
          string = this.balancedString(this.chunk, '"');
      }
      if (!string) {
        return 0;
      }
      trimmed = this.removeNewlines(string.slice(1, -1));
      if (quote === '"' && 0 < string.indexOf('#{', 1)) {
        this.interpolateString(trimmed, {
          strOffset: 1,
          lexedLength: string.length
        });
      } else {
        this.token('STRING', quote + this.escapeLines(trimmed) + quote, 0, string.length);
      }
      if (octalEsc = /^(?:\\.|[^\\])*\\(?:0[0-7]|[1-7])/.test(string)) {
        this.error("octal escape sequences " + string + " are not allowed");
      }
      return string.length;
    };

    Lexer.prototype.heredocToken = function () {
      var doc, heredoc, match, quote;
      if (!(match = HEREDOC.exec(this.chunk))) {
        return 0;
      }
      heredoc = match[0];
      quote = heredoc.charAt(0);
      doc = this.sanitizeHeredoc(match[2], {
        quote: quote,
        indent: null
      });
      if (quote === '"' && 0 <= doc.indexOf('#{')) {
        this.interpolateString(doc, {
          heredoc: true,
          strOffset: 3,
          lexedLength: heredoc.length
        });
      } else {
        this.token('STRING', this.makeString(doc, quote, true), 0, heredoc.length);
      }
      return heredoc.length;
    };

    Lexer.prototype.commentToken = function () {
      var comment, here, match;
      if (!(match = this.chunk.match(COMMENT))) {
        return 0;
      }
      comment = match[0], here = match[1];
      if (here) {
        this.token('HERECOMMENT', this.sanitizeHeredoc(here, {
          herecomment: true,
          indent: repeat(' ', this.indent)
        }), 0, comment.length);
      }
      return comment.length;
    };

    Lexer.prototype.jsToken = function () {
      var match, script;
      if (!(this.chunk.charAt(0) === '`' && (match = JSTOKEN.exec(this.chunk)))) {
        return 0;
      }
      this.token('JS', (script = match[0]).slice(1, -1), 0, script.length);
      return script.length;
    };

    Lexer.prototype.regexToken = function () {
      var flags, length, match, prev, regex, _ref2, _ref3;
      if (this.chunk.charAt(0) !== '/') {
        return 0;
      }
      if (match = HEREGEX.exec(this.chunk)) {
        length = this.heregexToken(match);
        return length;
      }
      prev = last(this.tokens);
      if (prev && (_ref2 = prev[0], __indexOf.call(prev.spaced ? NOT_REGEX : NOT_SPACED_REGEX, _ref2) >= 0)) {
        return 0;
      }
      if (!(match = REGEX.exec(this.chunk))) {
        return 0;
      }
      _ref3 = match, match = _ref3[0], regex = _ref3[1], flags = _ref3[2];
      if (regex.slice(0, 2) === '/*') {
        this.error('regular expressions cannot begin with `*`');
      }
      if (regex === '//') {
        regex = '/(?:)/';
      }
      this.token('REGEX', "" + regex + flags, 0, match.length);
      return match.length;
    };

    Lexer.prototype.heregexToken = function (match) {
      var body, flags, flagsOffset, heregex, plusToken, prev, re, tag, token, tokens, value, _i, _len, _ref2, _ref3, _ref4;
      heregex = match[0], body = match[1], flags = match[2];
      if (0 > body.indexOf('#{')) {
        re = this.escapeLines(body.replace(HEREGEX_OMIT, '$1$2').replace(/\//g, '\\/'), true);
        if (re.match(/^\*/)) {
          this.error('regular expressions cannot begin with `*`');
        }
        this.token('REGEX', "/" + (re || '(?:)') + "/" + flags, 0, heregex.length);
        return heregex.length;
      }
      this.token('IDENTIFIER', 'RegExp', 0, 0);
      this.token('CALL_START', '(', 0, 0);
      tokens = [];
      _ref2 = this.interpolateString(body, {
        regex: true
      });
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        token = _ref2[_i];
        tag = token[0], value = token[1];
        if (tag === 'TOKENS') {
          tokens.push.apply(tokens, value);
        } else if (tag === 'NEOSTRING') {
          if (!(value = value.replace(HEREGEX_OMIT, '$1$2'))) {
            continue;
          }
          value = value.replace(/\\/g, '\\\\');
          token[0] = 'STRING';
          token[1] = this.makeString(value, '"', true);
          tokens.push(token);
        } else {
          this.error("Unexpected " + tag);
        }
        prev = last(this.tokens);
        plusToken = ['+', '+'];
        plusToken[2] = prev[2];
        tokens.push(plusToken);
      }
      tokens.pop();
      if (((_ref3 = tokens[0]) != null ? _ref3[0] : void 0) !== 'STRING') {
        this.token('STRING', '""', 0, 0);
        this.token('+', '+', 0, 0);
      }
      (_ref4 = this.tokens).push.apply(_ref4, tokens);
      if (flags) {
        flagsOffset = heregex.lastIndexOf(flags);
        this.token(',', ',', flagsOffset, 0);
        this.token('STRING', '"' + flags + '"', flagsOffset, flags.length);
      }
      this.token(')', ')', heregex.length - 1, 0);
      return heregex.length;
    };

    Lexer.prototype.lineToken = function () {
      var diff, indent, match, noNewlines, size;
      if (!(match = MULTI_DENT.exec(this.chunk))) {
        return 0;
      }
      indent = match[0];
      this.seenFor = false;
      size = indent.length - 1 - indent.lastIndexOf('\n');
      noNewlines = this.unfinished();
      if (size - this.indebt === this.indent) {
        if (noNewlines) {
          this.suppressNewlines();
        } else {
          this.newlineToken(0);
        }
        return indent.length;
      }
      if (size > this.indent) {
        if (noNewlines) {
          this.indebt = size - this.indent;
          this.suppressNewlines();
          return indent.length;
        }
        if (!this.tokens.length) {
          this.baseIndent = this.indent = size;
          return indent.length;
        }
        diff = size - this.indent + this.outdebt;
        this.token('INDENT', diff, indent.length - size, size);
        this.indents.push(diff);
        this.ends.push('OUTDENT');
        this.outdebt = this.indebt = 0;
      } else if (size < this.baseIndent) {
        this.error('missing indentation', indent.length);
      } else {
        this.indebt = 0;
        this.outdentToken(this.indent - size, noNewlines, indent.length);
      }
      this.indent = size;
      return indent.length;
    };

    Lexer.prototype.outdentToken = function (moveOut, noNewlines, outdentLength) {
      var dent, len;
      while (moveOut > 0) {
        len = this.indents.length - 1;
        if (this.indents[len] === void 0) {
          moveOut = 0;
        } else if (this.indents[len] === this.outdebt) {
          moveOut -= this.outdebt;
          this.outdebt = 0;
        } else if (this.indents[len] < this.outdebt) {
          this.outdebt -= this.indents[len];
          moveOut -= this.indents[len];
        } else {
          dent = this.indents.pop() + this.outdebt;
          moveOut -= dent;
          this.outdebt = 0;
          this.pair('OUTDENT');
          this.token('OUTDENT', dent, 0, outdentLength);
        }
      }
      if (dent) {
        this.outdebt -= moveOut;
      }
      while (this.value() === ';') {
        this.tokens.pop();
      }
      if (!(this.tag() === 'TERMINATOR' || noNewlines)) {
        this.token('TERMINATOR', '\n', outdentLength, 0);
      }
      return this;
    };

    Lexer.prototype.whitespaceToken = function () {
      var match, nline, prev;
      if (!((match = WHITESPACE.exec(this.chunk)) || (nline = this.chunk.charAt(0) === '\n'))) {
        return 0;
      }
      prev = last(this.tokens);
      if (prev) {
        prev[match ? 'spaced' : 'newLine'] = true;
      }
      if (match) {
        return match[0].length;
      } else {
        return 0;
      }
    };

    Lexer.prototype.newlineToken = function (offset) {
      while (this.value() === ';') {
        this.tokens.pop();
      }
      if (this.tag() !== 'TERMINATOR') {
        this.token('TERMINATOR', '\n', offset, 0);
      }
      return this;
    };

    Lexer.prototype.suppressNewlines = function () {
      if (this.value() === '\\') {
        this.tokens.pop();
      }
      return this;
    };

    Lexer.prototype.literalToken = function () {
      var match, prev, tag, value, _ref2, _ref3, _ref4, _ref5;
      if (match = OPERATOR.exec(this.chunk)) {
        value = match[0];
        if (CODE.test(value)) {
          this.tagParameters();
        }
      } else {
        value = this.chunk.charAt(0);
      }
      tag = value;
      prev = last(this.tokens);
      if (value === '=' && prev) {
        if (!prev[1].reserved && (_ref2 = prev[1], __indexOf.call(JS_FORBIDDEN, _ref2) >= 0)) {
          this.error("reserved word \"" + this.value() + "\" can't be assigned");
        }
        if ((_ref3 = prev[1]) === '||' || _ref3 === '&&') {
          prev[0] = 'COMPOUND_ASSIGN';
          prev[1] += '=';
          return value.length;
        }
      }
      if (value === ';') {
        this.seenFor = false;
        tag = 'TERMINATOR';
      } else if (__indexOf.call(MATH, value) >= 0) {
        tag = 'MATH';
      } else if (__indexOf.call(COMPARE, value) >= 0) {
        tag = 'COMPARE';
      } else if (__indexOf.call(COMPOUND_ASSIGN, value) >= 0) {
        tag = 'COMPOUND_ASSIGN';
      } else if (__indexOf.call(UNARY, value) >= 0) {
        tag = 'UNARY';
      } else if (__indexOf.call(SHIFT, value) >= 0) {
        tag = 'SHIFT';
      } else if (__indexOf.call(LOGIC, value) >= 0 || value === '?' && (prev != null ? prev.spaced : void 0)) {
        tag = 'LOGIC';
      } else if (prev && !prev.spaced) {
        if (value === '(' && (_ref4 = prev[0], __indexOf.call(CALLABLE, _ref4) >= 0)) {
          if (prev[0] === '?') {
            prev[0] = 'FUNC_EXIST';
          }
          tag = 'CALL_START';
        } else if (value === '[' && (_ref5 = prev[0], __indexOf.call(INDEXABLE, _ref5) >= 0)) {
          tag = 'INDEX_START';
          switch (prev[0]) {
            case '?':
              prev[0] = 'INDEX_SOAK';
          }
        }
      }
      switch (value) {
        case '(':
        case '{':
        case '[':
          this.ends.push(INVERSES[value]);
          break;
        case ')':
        case '}':
        case ']':
          this.pair(value);
      }
      this.token(tag, value);
      return value.length;
    };

    Lexer.prototype.sanitizeHeredoc = function (doc, options) {
      var attempt, herecomment, indent, match, _ref2;
      indent = options.indent, herecomment = options.herecomment;
      if (herecomment) {
        if (HEREDOC_ILLEGAL.test(doc)) {
          this.error("block comment cannot contain \"*/\", starting");
        }
        if (doc.indexOf('\n') < 0) {
          return doc;
        }
      } else {
        while (match = HEREDOC_INDENT.exec(doc)) {
          attempt = match[1];
          if (indent === null || 0 < (_ref2 = attempt.length) && _ref2 < indent.length) {
            indent = attempt;
          }
        }
      }
      if (indent) {
        doc = doc.replace(RegExp("\\n" + indent, "g"), '\n');
      }
      if (!herecomment) {
        doc = doc.replace(/^\n/, '');
      }
      return doc;
    };

    Lexer.prototype.tagParameters = function () {
      var i, stack, tok, tokens;
      if (this.tag() !== ')') {
        return this;
      }
      stack = [];
      tokens = this.tokens;
      i = tokens.length;
      tokens[--i][0] = 'PARAM_END';
      while (tok = tokens[--i]) {
        switch (tok[0]) {
          case ')':
            stack.push(tok);
            break;
          case '(':
          case 'CALL_START':
            if (stack.length) {
              stack.pop();
            } else if (tok[0] === '(') {
              tok[0] = 'PARAM_START';
              return this;
            } else {
              return this;
            }
        }
      }
      return this;
    };

    Lexer.prototype.closeIndentation = function () {
      return this.outdentToken(this.indent);
    };

    Lexer.prototype.balancedString = function (str, end) {
      var continueCount, i, letter, match, prev, stack, _i, _ref2;
      continueCount = 0;
      stack = [end];
      for (i = _i = 1, _ref2 = str.length; 1 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 1 <= _ref2 ? ++_i : --_i) {
        if (continueCount) {
          --continueCount;
          continue;
        }
        switch (letter = str.charAt(i)) {
          case '\\':
            ++continueCount;
            continue;
          case end:
            stack.pop();
            if (!stack.length) {
              return str.slice(0, +i + 1 || 9e9);
            }
            end = stack[stack.length - 1];
            continue;
        }
        if (end === '}' && (letter === '"' || letter === "'")) {
          stack.push(end = letter);
        } else if (end === '}' && letter === '/' && (match = HEREGEX.exec(str.slice(i)) || REGEX.exec(str.slice(i)))) {
          continueCount += match[0].length - 1;
        } else if (end === '}' && letter === '{') {
          stack.push(end = '}');
        } else if (end === '"' && prev === '#' && letter === '{') {
          stack.push(end = '}');
        }
        prev = letter;
      }
      return this.error("missing " + stack.pop() + ", starting");
    };

    Lexer.prototype.interpolateString = function (str, options) {
      var column, expr, heredoc, i, inner, interpolated, len, letter, lexedLength, line, locationToken, nested, offsetInChunk, pi, plusToken, popped, regex, rparen, strOffset, tag, token, tokens, value, _i, _len, _ref2, _ref3, _ref4;
      if (options == null) {
        options = {};
      }
      heredoc = options.heredoc, regex = options.regex, offsetInChunk = options.offsetInChunk, strOffset = options.strOffset, lexedLength = options.lexedLength;
      offsetInChunk = offsetInChunk || 0;
      strOffset = strOffset || 0;
      lexedLength = lexedLength || str.length;
      tokens = [];
      pi = 0;
      i = -1;
      while (letter = str.charAt(i += 1)) {
        if (letter === '\\') {
          i += 1;
          continue;
        }
        if (!(letter === '#' && str.charAt(i + 1) === '{' && (expr = this.balancedString(str.slice(i + 1), '}')))) {
          continue;
        }
        if (pi < i) {
          tokens.push(this.makeToken('NEOSTRING', str.slice(pi, i), strOffset + pi));
        }
        inner = expr.slice(1, -1);
        if (inner.length) {
          _ref2 = this.getLineAndColumnFromChunk(strOffset + i + 1), line = _ref2[0], column = _ref2[1];
          nested = new Lexer().tokenize(inner, {
            line: line,
            column: column,
            rewrite: false
          });
          popped = nested.pop();
          if (((_ref3 = nested[0]) != null ? _ref3[0] : void 0) === 'TERMINATOR') {
            popped = nested.shift();
          }
          if (len = nested.length) {
            if (len > 1) {
              nested.unshift(this.makeToken('(', '(', strOffset + i + 1, 0));
              nested.push(this.makeToken(')', ')', strOffset + i + 1 + inner.length, 0));
            }
            tokens.push(['TOKENS', nested]);
          }
        }
        i += expr.length;
        pi = i + 1;
      }
      if (i > pi && pi < str.length) {
        tokens.push(this.makeToken('NEOSTRING', str.slice(pi), strOffset + pi));
      }
      if (regex) {
        return tokens;
      }
      if (!tokens.length) {
        return this.token('STRING', '""', offsetInChunk, lexedLength);
      }
      if (tokens[0][0] !== 'NEOSTRING') {
        tokens.unshift(this.makeToken('NEOSTRING', '', offsetInChunk));
      }
      if (interpolated = tokens.length > 1) {
        this.token('(', '(', offsetInChunk, 0);
      }
      for (i = _i = 0, _len = tokens.length; _i < _len; i = ++_i) {
        token = tokens[i];
        tag = token[0], value = token[1];
        if (i) {
          if (i) {
            plusToken = this.token('+', '+');
          }
          locationToken = tag === 'TOKENS' ? value[0] : token;
          plusToken[2] = {
            first_line: locationToken[2].first_line,
            first_column: locationToken[2].first_column,
            last_line: locationToken[2].first_line,
            last_column: locationToken[2].first_column
          };
        }
        if (tag === 'TOKENS') {
          (_ref4 = this.tokens).push.apply(_ref4, value);
        } else if (tag === 'NEOSTRING') {
          token[0] = 'STRING';
          token[1] = this.makeString(value, '"', heredoc);
          this.tokens.push(token);
        } else {
          this.error("Unexpected " + tag);
        }
      }
      if (interpolated) {
        rparen = this.makeToken(')', ')', offsetInChunk + lexedLength, 0);
        rparen.stringEnd = true;
        this.tokens.push(rparen);
      }
      return tokens;
    };

    Lexer.prototype.pair = function (tag) {
      var size, wanted;
      if (tag !== (wanted = last(this.ends))) {
        if ('OUTDENT' !== wanted) {
          this.error("unmatched " + tag);
        }
        this.indent -= size = last(this.indents);
        this.outdentToken(size, true);
        return this.pair(tag);
      }
      return this.ends.pop();
    };

    Lexer.prototype.getLineAndColumnFromChunk = function (offset) {
      var column, lineCount, lines, string;
      if (offset === 0) {
        return [this.chunkLine, this.chunkColumn];
      }
      if (offset >= this.chunk.length) {
        string = this.chunk;
      } else {
        string = this.chunk.slice(0, +(offset - 1) + 1 || 9e9);
      }
      lineCount = count(string, '\n');
      column = this.chunkColumn;
      if (lineCount > 0) {
        lines = string.split('\n');
        column = last(lines).length;
      } else {
        column += string.length;
      }
      return [this.chunkLine + lineCount, column];
    };

    Lexer.prototype.makeToken = function (tag, value, offsetInChunk, length) {
      var lastCharacter, locationData, token, _ref2, _ref3;
      if (offsetInChunk == null) {
        offsetInChunk = 0;
      }
      if (length == null) {
        length = value.length;
      }
      locationData = {};
      _ref2 = this.getLineAndColumnFromChunk(offsetInChunk), locationData.first_line = _ref2[0], locationData.first_column = _ref2[1];
      lastCharacter = Math.max(0, length - 1);
      _ref3 = this.getLineAndColumnFromChunk(offsetInChunk + lastCharacter), locationData.last_line = _ref3[0], locationData.last_column = _ref3[1];
      token = [tag, value, locationData];
      return token;
    };

    Lexer.prototype.token = function (tag, value, offsetInChunk, length) {
      var token;
      token = this.makeToken(tag, value, offsetInChunk, length);
      this.tokens.push(token);
      return token;
    };

    Lexer.prototype.tag = function (index, tag) {
      var tok;
      return (tok = last(this.tokens, index)) && (tag ? tok[0] = tag : tok[0]);
    };

    Lexer.prototype.value = function (index, val) {
      var tok;
      return (tok = last(this.tokens, index)) && (val ? tok[1] = val : tok[1]);
    };

    Lexer.prototype.unfinished = function () {
      var _ref2;
      return LINE_CONTINUER.test(this.chunk) || (_ref2 = this.tag()) === '\\' || _ref2 === '.' || _ref2 === '?.' || _ref2 === '?::' || _ref2 === 'UNARY' || _ref2 === 'MATH' || _ref2 === '+' || _ref2 === '-' || _ref2 === 'SHIFT' || _ref2 === 'RELATION' || _ref2 === 'COMPARE' || _ref2 === 'LOGIC' || _ref2 === 'THROW' || _ref2 === 'EXTENDS';
    };

    Lexer.prototype.removeNewlines = function (str) {
      return str.replace(/^\s*\n\s*/, '').replace(/([^\\]|\\\\)\s*\n\s*$/, '$1');
    };

    Lexer.prototype.escapeLines = function (str, heredoc) {
      str = str.replace(/\\[^\S\n]*(\n|\\)\s*/g, function (escaped, character) {
        if (character === '\n') {
          return '';
        } else {
          return escaped;
        }
      });
      if (heredoc) {
        return str.replace(MULTILINER, '\\n');
      } else {
        return str.replace(/\s*\n\s*/g, ' ');
      }
    };

    Lexer.prototype.makeString = function (body, quote, heredoc) {
      if (!body) {
        return quote + quote;
      }
      body = body.replace(RegExp("\\\\(" + quote + "|\\\\)", "g"), function (match, contents) {
        if (contents === quote) {
          return contents;
        } else {
          return match;
        }
      });
      body = body.replace(RegExp("" + quote, "g"), '\\$&');
      return quote + this.escapeLines(body, heredoc) + quote;
    };

    Lexer.prototype.error = function (message, offset) {
      var first_column, first_line, _ref2;
      if (offset == null) {
        offset = 0;
      }
      _ref2 = this.getLineAndColumnFromChunk(offset), first_line = _ref2[0], first_column = _ref2[1];
      return throwSyntaxError(message, {
        first_line: first_line,
        first_column: first_column
      });
    };

    return Lexer;
  }();

  JS_KEYWORDS = ['true', 'false', 'null', 'this', 'new', 'delete', 'typeof', 'in', 'instanceof', 'return', 'throw', 'break', 'continue', 'debugger', 'if', 'else', 'switch', 'for', 'while', 'do', 'try', 'catch', 'finally', 'class', 'extends', 'super'];

  COFFEE_KEYWORDS = ['undefined', 'then', 'unless', 'until', 'loop', 'of', 'by', 'when'];

  COFFEE_ALIAS_MAP = {
    and: '&&',
    or: '||',
    is: '==',
    isnt: '!=',
    not: '!',
    yes: 'true',
    no: 'false',
    on: 'true',
    off: 'false'
  };

  COFFEE_ALIASES = function () {
    var _results;
    _results = [];
    for (key in COFFEE_ALIAS_MAP) {
      _results.push(key);
    }
    return _results;
  }();

  COFFEE_KEYWORDS = COFFEE_KEYWORDS.concat(COFFEE_ALIASES);

  RESERVED = ['case', 'default', 'function', 'var', 'void', 'with', 'const', 'let', 'enum', 'export', 'import', 'native', '__hasProp', '__extends', '__slice', '__bind', '__indexOf', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'static', 'yield'];

  STRICT_PROSCRIBED = ['arguments', 'eval'];

  JS_FORBIDDEN = JS_KEYWORDS.concat(RESERVED).concat(STRICT_PROSCRIBED);

  exports.RESERVED = RESERVED.concat(JS_KEYWORDS).concat(COFFEE_KEYWORDS).concat(STRICT_PROSCRIBED);

  exports.STRICT_PROSCRIBED = STRICT_PROSCRIBED;

  BOM = 65279;

  IDENTIFIER = /^([$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*)([^\n\S]*:(?!:))?/;

  NUMBER = /^0b[01]+|^0o[0-7]+|^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;

  HEREDOC = /^("""|''')((?:\\[\s\S]|[^\\])*?)(?:\n[^\n\S]*)?\1/;

  OPERATOR = /^(?:[-=]>|[-+*\/%<>&|^!?=]=|>>>=?|([-+:])\1|([&|<>])\2=?|\?(\.|::)|\.{2,3})/;

  WHITESPACE = /^[^\n\S]+/;

  COMMENT = /^###([^#][\s\S]*?)(?:###[^\n\S]*|###$)|^(?:\s*#(?!##[^#]).*)+/;

  CODE = /^[-=]>/;

  MULTI_DENT = /^(?:\n[^\n\S]*)+/;

  SIMPLESTR = /^'[^\\']*(?:\\[\s\S][^\\']*)*'/;

  JSTOKEN = /^`[^\\`]*(?:\\.[^\\`]*)*`/;

  REGEX = /^(\/(?![\s=])[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/)([imgy]{0,4})(?!\w)/;

  HEREGEX = /^\/{3}((?:\\?[\s\S])+?)\/{3}([imgy]{0,4})(?!\w)/;

  HEREGEX_OMIT = /((?:\\\\)+)|\\(\s|\/)|\s+(?:#.*)?/g;

  MULTILINER = /\n/g;

  HEREDOC_INDENT = /\n+([^\n\S]*)/g;

  HEREDOC_ILLEGAL = /\*\//;

  LINE_CONTINUER = /^\s*(?:,|\??\.(?![.\d])|::)/;

  TRAILING_SPACES = /\s+$/;

  COMPOUND_ASSIGN = ['-=', '+=', '/=', '*=', '%=', '||=', '&&=', '?=', '<<=', '>>=', '>>>=', '&=', '^=', '|='];

  UNARY = ['!', '~', 'NEW', 'TYPEOF', 'DELETE', 'DO'];

  LOGIC = ['&&', '||', '&', '|', '^'];

  SHIFT = ['<<', '>>', '>>>'];

  COMPARE = ['==', '!=', '<', '>', '<=', '>='];

  MATH = ['*', '/', '%'];

  RELATION = ['IN', 'OF', 'INSTANCEOF'];

  BOOL = ['TRUE', 'FALSE'];

  NOT_REGEX = ['NUMBER', 'REGEX', 'BOOL', 'NULL', 'UNDEFINED', '++', '--'];

  NOT_SPACED_REGEX = NOT_REGEX.concat(')', '}', 'THIS', 'IDENTIFIER', 'STRING', ']');

  CALLABLE = ['IDENTIFIER', 'STRING', 'REGEX', ')', ']', '}', '?', '::', '@', 'THIS', 'SUPER'];

  INDEXABLE = CALLABLE.concat('NUMBER', 'BOOL', 'NULL', 'UNDEFINED');

  LINE_BREAK = ['INDENT', 'OUTDENT', 'TERMINATOR'];
});

ace.define("ace/mode/coffee/parser", ["require", "exports", "module"], function (require, exports, module) {

  var parser = { trace: function trace() {},
    yy: {},
    symbols_: { "error": 2, "Root": 3, "Body": 4, "Line": 5, "TERMINATOR": 6, "Expression": 7, "Statement": 8, "Return": 9, "Comment": 10, "STATEMENT": 11, "Value": 12, "Invocation": 13, "Code": 14, "Operation": 15, "Assign": 16, "If": 17, "Try": 18, "While": 19, "For": 20, "Switch": 21, "Class": 22, "Throw": 23, "Block": 24, "INDENT": 25, "OUTDENT": 26, "Identifier": 27, "IDENTIFIER": 28, "AlphaNumeric": 29, "NUMBER": 30, "STRING": 31, "Literal": 32, "JS": 33, "REGEX": 34, "DEBUGGER": 35, "UNDEFINED": 36, "NULL": 37, "BOOL": 38, "Assignable": 39, "=": 40, "AssignObj": 41, "ObjAssignable": 42, ":": 43, "ThisProperty": 44, "RETURN": 45, "HERECOMMENT": 46, "PARAM_START": 47, "ParamList": 48, "PARAM_END": 49, "FuncGlyph": 50, "->": 51, "=>": 52, "OptComma": 53, ",": 54, "Param": 55, "ParamVar": 56, "...": 57, "Array": 58, "Object": 59, "Splat": 60, "SimpleAssignable": 61, "Accessor": 62, "Parenthetical": 63, "Range": 64, "This": 65, ".": 66, "?.": 67, "::": 68, "?::": 69, "Index": 70, "INDEX_START": 71, "IndexValue": 72, "INDEX_END": 73, "INDEX_SOAK": 74, "Slice": 75, "{": 76, "AssignList": 77, "}": 78, "CLASS": 79, "EXTENDS": 80, "OptFuncExist": 81, "Arguments": 82, "SUPER": 83, "FUNC_EXIST": 84, "CALL_START": 85, "CALL_END": 86, "ArgList": 87, "THIS": 88, "@": 89, "[": 90, "]": 91, "RangeDots": 92, "..": 93, "Arg": 94, "SimpleArgs": 95, "TRY": 96, "Catch": 97, "FINALLY": 98, "CATCH": 99, "THROW": 100, "(": 101, ")": 102, "WhileSource": 103, "WHILE": 104, "WHEN": 105, "UNTIL": 106, "Loop": 107, "LOOP": 108, "ForBody": 109, "FOR": 110, "ForStart": 111, "ForSource": 112, "ForVariables": 113, "OWN": 114, "ForValue": 115, "FORIN": 116, "FOROF": 117, "BY": 118, "SWITCH": 119, "Whens": 120, "ELSE": 121, "When": 122, "LEADING_WHEN": 123, "IfBlock": 124, "IF": 125, "POST_IF": 126, "UNARY": 127, "-": 128, "+": 129, "--": 130, "++": 131, "?": 132, "MATH": 133, "SHIFT": 134, "COMPARE": 135, "LOGIC": 136, "RELATION": 137, "COMPOUND_ASSIGN": 138, "$accept": 0, "$end": 1 },
    terminals_: { 2: "error", 6: "TERMINATOR", 11: "STATEMENT", 25: "INDENT", 26: "OUTDENT", 28: "IDENTIFIER", 30: "NUMBER", 31: "STRING", 33: "JS", 34: "REGEX", 35: "DEBUGGER", 36: "UNDEFINED", 37: "NULL", 38: "BOOL", 40: "=", 43: ":", 45: "RETURN", 46: "HERECOMMENT", 47: "PARAM_START", 49: "PARAM_END", 51: "->", 52: "=>", 54: ",", 57: "...", 66: ".", 67: "?.", 68: "::", 69: "?::", 71: "INDEX_START", 73: "INDEX_END", 74: "INDEX_SOAK", 76: "{", 78: "}", 79: "CLASS", 80: "EXTENDS", 83: "SUPER", 84: "FUNC_EXIST", 85: "CALL_START", 86: "CALL_END", 88: "THIS", 89: "@", 90: "[", 91: "]", 93: "..", 96: "TRY", 98: "FINALLY", 99: "CATCH", 100: "THROW", 101: "(", 102: ")", 104: "WHILE", 105: "WHEN", 106: "UNTIL", 108: "LOOP", 110: "FOR", 114: "OWN", 116: "FORIN", 117: "FOROF", 118: "BY", 119: "SWITCH", 121: "ELSE", 123: "LEADING_WHEN", 125: "IF", 126: "POST_IF", 127: "UNARY", 128: "-", 129: "+", 130: "--", 131: "++", 132: "?", 133: "MATH", 134: "SHIFT", 135: "COMPARE", 136: "LOGIC", 137: "RELATION", 138: "COMPOUND_ASSIGN" },
    productions_: [0, [3, 0], [3, 1], [4, 1], [4, 3], [4, 2], [5, 1], [5, 1], [8, 1], [8, 1], [8, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [24, 2], [24, 3], [27, 1], [29, 1], [29, 1], [32, 1], [32, 1], [32, 1], [32, 1], [32, 1], [32, 1], [32, 1], [16, 3], [16, 4], [16, 5], [41, 1], [41, 3], [41, 5], [41, 1], [42, 1], [42, 1], [42, 1], [9, 2], [9, 1], [10, 1], [14, 5], [14, 2], [50, 1], [50, 1], [53, 0], [53, 1], [48, 0], [48, 1], [48, 3], [48, 4], [48, 6], [55, 1], [55, 2], [55, 3], [56, 1], [56, 1], [56, 1], [56, 1], [60, 2], [61, 1], [61, 2], [61, 2], [61, 1], [39, 1], [39, 1], [39, 1], [12, 1], [12, 1], [12, 1], [12, 1], [12, 1], [62, 2], [62, 2], [62, 2], [62, 2], [62, 1], [62, 1], [70, 3], [70, 2], [72, 1], [72, 1], [59, 4], [77, 0], [77, 1], [77, 3], [77, 4], [77, 6], [22, 1], [22, 2], [22, 3], [22, 4], [22, 2], [22, 3], [22, 4], [22, 5], [13, 3], [13, 3], [13, 1], [13, 2], [81, 0], [81, 1], [82, 2], [82, 4], [65, 1], [65, 1], [44, 2], [58, 2], [58, 4], [92, 1], [92, 1], [64, 5], [75, 3], [75, 2], [75, 2], [75, 1], [87, 1], [87, 3], [87, 4], [87, 4], [87, 6], [94, 1], [94, 1], [95, 1], [95, 3], [18, 2], [18, 3], [18, 4], [18, 5], [97, 3], [97, 3], [97, 2], [23, 2], [63, 3], [63, 5], [103, 2], [103, 4], [103, 2], [103, 4], [19, 2], [19, 2], [19, 2], [19, 1], [107, 2], [107, 2], [20, 2], [20, 2], [20, 2], [109, 2], [109, 2], [111, 2], [111, 3], [115, 1], [115, 1], [115, 1], [115, 1], [113, 1], [113, 3], [112, 2], [112, 2], [112, 4], [112, 4], [112, 4], [112, 6], [112, 6], [21, 5], [21, 7], [21, 4], [21, 6], [120, 1], [120, 2], [122, 3], [122, 4], [124, 3], [124, 5], [17, 1], [17, 3], [17, 3], [17, 3], [15, 2], [15, 2], [15, 2], [15, 2], [15, 2], [15, 2], [15, 2], [15, 2], [15, 3], [15, 3], [15, 3], [15, 3], [15, 3], [15, 3], [15, 3], [15, 3], [15, 5], [15, 4], [15, 3]],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {

      var $0 = $$.length - 1;
      switch (yystate) {
        case 1:
          return this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Block());
          break;
        case 2:
          return this.$ = $$[$0];
          break;
        case 3:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(yy.Block.wrap([$$[$0]]));
          break;
        case 4:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])($$[$0 - 2].push($$[$0]));
          break;
        case 5:
          this.$ = $$[$0 - 1];
          break;
        case 6:
          this.$ = $$[$0];
          break;
        case 7:
          this.$ = $$[$0];
          break;
        case 8:
          this.$ = $$[$0];
          break;
        case 9:
          this.$ = $$[$0];
          break;
        case 10:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
          break;
        case 11:
          this.$ = $$[$0];
          break;
        case 12:
          this.$ = $$[$0];
          break;
        case 13:
          this.$ = $$[$0];
          break;
        case 14:
          this.$ = $$[$0];
          break;
        case 15:
          this.$ = $$[$0];
          break;
        case 16:
          this.$ = $$[$0];
          break;
        case 17:
          this.$ = $$[$0];
          break;
        case 18:
          this.$ = $$[$0];
          break;
        case 19:
          this.$ = $$[$0];
          break;
        case 20:
          this.$ = $$[$0];
          break;
        case 21:
          this.$ = $$[$0];
          break;
        case 22:
          this.$ = $$[$0];
          break;
        case 23:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Block());
          break;
        case 24:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])($$[$0 - 1]);
          break;
        case 25:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
          break;
        case 26:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
          break;
        case 27:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
          break;
        case 28:
          this.$ = $$[$0];
          break;
        case 29:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
          break;
        case 30:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
          break;
        case 31:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
          break;
        case 32:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Undefined());
          break;
        case 33:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Null());
          break;
        case 34:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Bool($$[$0]));
          break;
        case 35:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Assign($$[$0 - 2], $$[$0]));
          break;
        case 36:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])(new yy.Assign($$[$0 - 3], $$[$0]));
          break;
        case 37:
          this.$ = yy.addLocationDataFn(_$[$0 - 4], _$[$0])(new yy.Assign($$[$0 - 4], $$[$0 - 1]));
          break;
        case 38:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
          break;
        case 39:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Assign(yy.addLocationDataFn(_$[$0 - 2])(new yy.Value($$[$0 - 2])), $$[$0], 'object'));
          break;
        case 40:
          this.$ = yy.addLocationDataFn(_$[$0 - 4], _$[$0])(new yy.Assign(yy.addLocationDataFn(_$[$0 - 4])(new yy.Value($$[$0 - 4])), $$[$0 - 1], 'object'));
          break;
        case 41:
          this.$ = $$[$0];
          break;
        case 42:
          this.$ = $$[$0];
          break;
        case 43:
          this.$ = $$[$0];
          break;
        case 44:
          this.$ = $$[$0];
          break;
        case 45:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Return($$[$0]));
          break;
        case 46:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Return());
          break;
        case 47:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Comment($$[$0]));
          break;
        case 48:
          this.$ = yy.addLocationDataFn(_$[$0 - 4], _$[$0])(new yy.Code($$[$0 - 3], $$[$0], $$[$0 - 1]));
          break;
        case 49:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Code([], $$[$0], $$[$0 - 1]));
          break;
        case 50:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])('func');
          break;
        case 51:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])('boundfunc');
          break;
        case 52:
          this.$ = $$[$0];
          break;
        case 53:
          this.$ = $$[$0];
          break;
        case 54:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([]);
          break;
        case 55:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([$$[$0]]);
          break;
        case 56:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])($$[$0 - 2].concat($$[$0]));
          break;
        case 57:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])($$[$0 - 3].concat($$[$0]));
          break;
        case 58:
          this.$ = yy.addLocationDataFn(_$[$0 - 5], _$[$0])($$[$0 - 5].concat($$[$0 - 2]));
          break;
        case 59:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Param($$[$0]));
          break;
        case 60:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Param($$[$0 - 1], null, true));
          break;
        case 61:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Param($$[$0 - 2], $$[$0]));
          break;
        case 62:
          this.$ = $$[$0];
          break;
        case 63:
          this.$ = $$[$0];
          break;
        case 64:
          this.$ = $$[$0];
          break;
        case 65:
          this.$ = $$[$0];
          break;
        case 66:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Splat($$[$0 - 1]));
          break;
        case 67:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
          break;
        case 68:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])($$[$0 - 1].add($$[$0]));
          break;
        case 69:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Value($$[$0 - 1], [].concat($$[$0])));
          break;
        case 70:
          this.$ = $$[$0];
          break;
        case 71:
          this.$ = $$[$0];
          break;
        case 72:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
          break;
        case 73:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
          break;
        case 74:
          this.$ = $$[$0];
          break;
        case 75:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
          break;
        case 76:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
          break;
        case 77:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
          break;
        case 78:
          this.$ = $$[$0];
          break;
        case 79:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Access($$[$0]));
          break;
        case 80:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Access($$[$0], 'soak'));
          break;
        case 81:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])([yy.addLocationDataFn(_$[$0 - 1])(new yy.Access(new yy.Literal('prototype'))), yy.addLocationDataFn(_$[$0])(new yy.Access($$[$0]))]);
          break;
        case 82:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])([yy.addLocationDataFn(_$[$0 - 1])(new yy.Access(new yy.Literal('prototype'), 'soak')), yy.addLocationDataFn(_$[$0])(new yy.Access($$[$0]))]);
          break;
        case 83:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Access(new yy.Literal('prototype')));
          break;
        case 84:
          this.$ = $$[$0];
          break;
        case 85:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])($$[$0 - 1]);
          break;
        case 86:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(yy.extend($$[$0], {
            soak: true
          }));
          break;
        case 87:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Index($$[$0]));
          break;
        case 88:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Slice($$[$0]));
          break;
        case 89:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])(new yy.Obj($$[$0 - 2], $$[$0 - 3].generated));
          break;
        case 90:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([]);
          break;
        case 91:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([$$[$0]]);
          break;
        case 92:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])($$[$0 - 2].concat($$[$0]));
          break;
        case 93:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])($$[$0 - 3].concat($$[$0]));
          break;
        case 94:
          this.$ = yy.addLocationDataFn(_$[$0 - 5], _$[$0])($$[$0 - 5].concat($$[$0 - 2]));
          break;
        case 95:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Class());
          break;
        case 96:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Class(null, null, $$[$0]));
          break;
        case 97:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Class(null, $$[$0]));
          break;
        case 98:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])(new yy.Class(null, $$[$0 - 1], $$[$0]));
          break;
        case 99:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Class($$[$0]));
          break;
        case 100:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Class($$[$0 - 1], null, $$[$0]));
          break;
        case 101:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])(new yy.Class($$[$0 - 2], $$[$0]));
          break;
        case 102:
          this.$ = yy.addLocationDataFn(_$[$0 - 4], _$[$0])(new yy.Class($$[$0 - 3], $$[$0 - 1], $$[$0]));
          break;
        case 103:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Call($$[$0 - 2], $$[$0], $$[$0 - 1]));
          break;
        case 104:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Call($$[$0 - 2], $$[$0], $$[$0 - 1]));
          break;
        case 105:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Call('super', [new yy.Splat(new yy.Literal('arguments'))]));
          break;
        case 106:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Call('super', $$[$0]));
          break;
        case 107:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(false);
          break;
        case 108:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(true);
          break;
        case 109:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])([]);
          break;
        case 110:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])($$[$0 - 2]);
          break;
        case 111:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value(new yy.Literal('this')));
          break;
        case 112:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value(new yy.Literal('this')));
          break;
        case 113:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Value(yy.addLocationDataFn(_$[$0 - 1])(new yy.Literal('this')), [yy.addLocationDataFn(_$[$0])(new yy.Access($$[$0]))], 'this'));
          break;
        case 114:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Arr([]));
          break;
        case 115:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])(new yy.Arr($$[$0 - 2]));
          break;
        case 116:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])('inclusive');
          break;
        case 117:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])('exclusive');
          break;
        case 118:
          this.$ = yy.addLocationDataFn(_$[$0 - 4], _$[$0])(new yy.Range($$[$0 - 3], $$[$0 - 1], $$[$0 - 2]));
          break;
        case 119:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Range($$[$0 - 2], $$[$0], $$[$0 - 1]));
          break;
        case 120:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Range($$[$0 - 1], null, $$[$0]));
          break;
        case 121:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Range(null, $$[$0], $$[$0 - 1]));
          break;
        case 122:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Range(null, null, $$[$0]));
          break;
        case 123:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([$$[$0]]);
          break;
        case 124:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])($$[$0 - 2].concat($$[$0]));
          break;
        case 125:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])($$[$0 - 3].concat($$[$0]));
          break;
        case 126:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])($$[$0 - 2]);
          break;
        case 127:
          this.$ = yy.addLocationDataFn(_$[$0 - 5], _$[$0])($$[$0 - 5].concat($$[$0 - 2]));
          break;
        case 128:
          this.$ = $$[$0];
          break;
        case 129:
          this.$ = $$[$0];
          break;
        case 130:
          this.$ = $$[$0];
          break;
        case 131:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])([].concat($$[$0 - 2], $$[$0]));
          break;
        case 132:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Try($$[$0]));
          break;
        case 133:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Try($$[$0 - 1], $$[$0][0], $$[$0][1]));
          break;
        case 134:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])(new yy.Try($$[$0 - 2], null, null, $$[$0]));
          break;
        case 135:
          this.$ = yy.addLocationDataFn(_$[$0 - 4], _$[$0])(new yy.Try($$[$0 - 3], $$[$0 - 2][0], $$[$0 - 2][1], $$[$0]));
          break;
        case 136:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])([$$[$0 - 1], $$[$0]]);
          break;
        case 137:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])([yy.addLocationDataFn(_$[$0 - 1])(new yy.Value($$[$0 - 1])), $$[$0]]);
          break;
        case 138:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])([null, $$[$0]]);
          break;
        case 139:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Throw($$[$0]));
          break;
        case 140:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Parens($$[$0 - 1]));
          break;
        case 141:
          this.$ = yy.addLocationDataFn(_$[$0 - 4], _$[$0])(new yy.Parens($$[$0 - 2]));
          break;
        case 142:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.While($$[$0]));
          break;
        case 143:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])(new yy.While($$[$0 - 2], {
            guard: $$[$0]
          }));
          break;
        case 144:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.While($$[$0], {
            invert: true
          }));
          break;
        case 145:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])(new yy.While($$[$0 - 2], {
            invert: true,
            guard: $$[$0]
          }));
          break;
        case 146:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])($$[$0 - 1].addBody($$[$0]));
          break;
        case 147:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])($$[$0].addBody(yy.addLocationDataFn(_$[$0 - 1])(yy.Block.wrap([$$[$0 - 1]]))));
          break;
        case 148:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])($$[$0].addBody(yy.addLocationDataFn(_$[$0 - 1])(yy.Block.wrap([$$[$0 - 1]]))));
          break;
        case 149:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])($$[$0]);
          break;
        case 150:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.While(yy.addLocationDataFn(_$[$0 - 1])(new yy.Literal('true'))).addBody($$[$0]));
          break;
        case 151:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.While(yy.addLocationDataFn(_$[$0 - 1])(new yy.Literal('true'))).addBody(yy.addLocationDataFn(_$[$0])(yy.Block.wrap([$$[$0]]))));
          break;
        case 152:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.For($$[$0 - 1], $$[$0]));
          break;
        case 153:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.For($$[$0 - 1], $$[$0]));
          break;
        case 154:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.For($$[$0], $$[$0 - 1]));
          break;
        case 155:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])({
            source: yy.addLocationDataFn(_$[$0])(new yy.Value($$[$0]))
          });
          break;
        case 156:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(function () {
            $$[$0].own = $$[$0 - 1].own;
            $$[$0].name = $$[$0 - 1][0];
            $$[$0].index = $$[$0 - 1][1];
            return $$[$0];
          }());
          break;
        case 157:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])($$[$0]);
          break;
        case 158:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(function () {
            $$[$0].own = true;
            return $$[$0];
          }());
          break;
        case 159:
          this.$ = $$[$0];
          break;
        case 160:
          this.$ = $$[$0];
          break;
        case 161:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
          break;
        case 162:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
          break;
        case 163:
          this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([$$[$0]]);
          break;
        case 164:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])([$$[$0 - 2], $$[$0]]);
          break;
        case 165:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])({
            source: $$[$0]
          });
          break;
        case 166:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])({
            source: $$[$0],
            object: true
          });
          break;
        case 167:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])({
            source: $$[$0 - 2],
            guard: $$[$0]
          });
          break;
        case 168:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])({
            source: $$[$0 - 2],
            guard: $$[$0],
            object: true
          });
          break;
        case 169:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])({
            source: $$[$0 - 2],
            step: $$[$0]
          });
          break;
        case 170:
          this.$ = yy.addLocationDataFn(_$[$0 - 5], _$[$0])({
            source: $$[$0 - 4],
            guard: $$[$0 - 2],
            step: $$[$0]
          });
          break;
        case 171:
          this.$ = yy.addLocationDataFn(_$[$0 - 5], _$[$0])({
            source: $$[$0 - 4],
            step: $$[$0 - 2],
            guard: $$[$0]
          });
          break;
        case 172:
          this.$ = yy.addLocationDataFn(_$[$0 - 4], _$[$0])(new yy.Switch($$[$0 - 3], $$[$0 - 1]));
          break;
        case 173:
          this.$ = yy.addLocationDataFn(_$[$0 - 6], _$[$0])(new yy.Switch($$[$0 - 5], $$[$0 - 3], $$[$0 - 1]));
          break;
        case 174:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])(new yy.Switch(null, $$[$0 - 1]));
          break;
        case 175:
          this.$ = yy.addLocationDataFn(_$[$0 - 5], _$[$0])(new yy.Switch(null, $$[$0 - 3], $$[$0 - 1]));
          break;
        case 176:
          this.$ = $$[$0];
          break;
        case 177:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])($$[$0 - 1].concat($$[$0]));
          break;
        case 178:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])([[$$[$0 - 1], $$[$0]]]);
          break;
        case 179:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])([[$$[$0 - 2], $$[$0 - 1]]]);
          break;
        case 180:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.If($$[$0 - 1], $$[$0], {
            type: $$[$0 - 2]
          }));
          break;
        case 181:
          this.$ = yy.addLocationDataFn(_$[$0 - 4], _$[$0])($$[$0 - 4].addElse(yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.If($$[$0 - 1], $$[$0], {
            type: $$[$0 - 2]
          }))));
          break;
        case 182:
          this.$ = $$[$0];
          break;
        case 183:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])($$[$0 - 2].addElse($$[$0]));
          break;
        case 184:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.If($$[$0], yy.addLocationDataFn(_$[$0 - 2])(yy.Block.wrap([$$[$0 - 2]])), {
            type: $$[$0 - 1],
            statement: true
          }));
          break;
        case 185:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.If($$[$0], yy.addLocationDataFn(_$[$0 - 2])(yy.Block.wrap([$$[$0 - 2]])), {
            type: $$[$0 - 1],
            statement: true
          }));
          break;
        case 186:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Op($$[$0 - 1], $$[$0]));
          break;
        case 187:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Op('-', $$[$0]));
          break;
        case 188:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Op('+', $$[$0]));
          break;
        case 189:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Op('--', $$[$0]));
          break;
        case 190:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Op('++', $$[$0]));
          break;
        case 191:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Op('--', $$[$0 - 1], null, true));
          break;
        case 192:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Op('++', $$[$0 - 1], null, true));
          break;
        case 193:
          this.$ = yy.addLocationDataFn(_$[$0 - 1], _$[$0])(new yy.Existence($$[$0 - 1]));
          break;
        case 194:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Op('+', $$[$0 - 2], $$[$0]));
          break;
        case 195:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Op('-', $$[$0 - 2], $$[$0]));
          break;
        case 196:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Op($$[$0 - 1], $$[$0 - 2], $$[$0]));
          break;
        case 197:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Op($$[$0 - 1], $$[$0 - 2], $$[$0]));
          break;
        case 198:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Op($$[$0 - 1], $$[$0 - 2], $$[$0]));
          break;
        case 199:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Op($$[$0 - 1], $$[$0 - 2], $$[$0]));
          break;
        case 200:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(function () {
            if ($$[$0 - 1].charAt(0) === '!') {
              return new yy.Op($$[$0 - 1].slice(1), $$[$0 - 2], $$[$0]).invert();
            } else {
              return new yy.Op($$[$0 - 1], $$[$0 - 2], $$[$0]);
            }
          }());
          break;
        case 201:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Assign($$[$0 - 2], $$[$0], $$[$0 - 1]));
          break;
        case 202:
          this.$ = yy.addLocationDataFn(_$[$0 - 4], _$[$0])(new yy.Assign($$[$0 - 4], $$[$0 - 1], $$[$0 - 3]));
          break;
        case 203:
          this.$ = yy.addLocationDataFn(_$[$0 - 3], _$[$0])(new yy.Assign($$[$0 - 3], $$[$0], $$[$0 - 2]));
          break;
        case 204:
          this.$ = yy.addLocationDataFn(_$[$0 - 2], _$[$0])(new yy.Extends($$[$0 - 2], $$[$0]));
          break;
      }
    },
    table: [{ 1: [2, 1], 3: 1, 4: 2, 5: 3, 7: 4, 8: 5, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [3] }, { 1: [2, 2], 6: [1, 72] }, { 1: [2, 3], 6: [2, 3], 26: [2, 3], 102: [2, 3] }, { 1: [2, 6], 6: [2, 6], 26: [2, 6], 102: [2, 6], 103: 82, 104: [1, 63], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 7], 6: [2, 7], 26: [2, 7], 102: [2, 7], 103: 85, 104: [1, 63], 106: [1, 64], 109: 86, 110: [1, 66], 111: 67, 126: [1, 84] }, { 1: [2, 11], 6: [2, 11], 25: [2, 11], 26: [2, 11], 49: [2, 11], 54: [2, 11], 57: [2, 11], 62: 88, 66: [1, 90], 67: [1, 91], 68: [1, 92], 69: [1, 93], 70: 94, 71: [1, 95], 73: [2, 11], 74: [1, 96], 78: [2, 11], 81: 87, 84: [1, 89], 85: [2, 107], 86: [2, 11], 91: [2, 11], 93: [2, 11], 102: [2, 11], 104: [2, 11], 105: [2, 11], 106: [2, 11], 110: [2, 11], 118: [2, 11], 126: [2, 11], 128: [2, 11], 129: [2, 11], 132: [2, 11], 133: [2, 11], 134: [2, 11], 135: [2, 11], 136: [2, 11], 137: [2, 11] }, { 1: [2, 12], 6: [2, 12], 25: [2, 12], 26: [2, 12], 49: [2, 12], 54: [2, 12], 57: [2, 12], 62: 98, 66: [1, 90], 67: [1, 91], 68: [1, 92], 69: [1, 93], 70: 94, 71: [1, 95], 73: [2, 12], 74: [1, 96], 78: [2, 12], 81: 97, 84: [1, 89], 85: [2, 107], 86: [2, 12], 91: [2, 12], 93: [2, 12], 102: [2, 12], 104: [2, 12], 105: [2, 12], 106: [2, 12], 110: [2, 12], 118: [2, 12], 126: [2, 12], 128: [2, 12], 129: [2, 12], 132: [2, 12], 133: [2, 12], 134: [2, 12], 135: [2, 12], 136: [2, 12], 137: [2, 12] }, { 1: [2, 13], 6: [2, 13], 25: [2, 13], 26: [2, 13], 49: [2, 13], 54: [2, 13], 57: [2, 13], 73: [2, 13], 78: [2, 13], 86: [2, 13], 91: [2, 13], 93: [2, 13], 102: [2, 13], 104: [2, 13], 105: [2, 13], 106: [2, 13], 110: [2, 13], 118: [2, 13], 126: [2, 13], 128: [2, 13], 129: [2, 13], 132: [2, 13], 133: [2, 13], 134: [2, 13], 135: [2, 13], 136: [2, 13], 137: [2, 13] }, { 1: [2, 14], 6: [2, 14], 25: [2, 14], 26: [2, 14], 49: [2, 14], 54: [2, 14], 57: [2, 14], 73: [2, 14], 78: [2, 14], 86: [2, 14], 91: [2, 14], 93: [2, 14], 102: [2, 14], 104: [2, 14], 105: [2, 14], 106: [2, 14], 110: [2, 14], 118: [2, 14], 126: [2, 14], 128: [2, 14], 129: [2, 14], 132: [2, 14], 133: [2, 14], 134: [2, 14], 135: [2, 14], 136: [2, 14], 137: [2, 14] }, { 1: [2, 15], 6: [2, 15], 25: [2, 15], 26: [2, 15], 49: [2, 15], 54: [2, 15], 57: [2, 15], 73: [2, 15], 78: [2, 15], 86: [2, 15], 91: [2, 15], 93: [2, 15], 102: [2, 15], 104: [2, 15], 105: [2, 15], 106: [2, 15], 110: [2, 15], 118: [2, 15], 126: [2, 15], 128: [2, 15], 129: [2, 15], 132: [2, 15], 133: [2, 15], 134: [2, 15], 135: [2, 15], 136: [2, 15], 137: [2, 15] }, { 1: [2, 16], 6: [2, 16], 25: [2, 16], 26: [2, 16], 49: [2, 16], 54: [2, 16], 57: [2, 16], 73: [2, 16], 78: [2, 16], 86: [2, 16], 91: [2, 16], 93: [2, 16], 102: [2, 16], 104: [2, 16], 105: [2, 16], 106: [2, 16], 110: [2, 16], 118: [2, 16], 126: [2, 16], 128: [2, 16], 129: [2, 16], 132: [2, 16], 133: [2, 16], 134: [2, 16], 135: [2, 16], 136: [2, 16], 137: [2, 16] }, { 1: [2, 17], 6: [2, 17], 25: [2, 17], 26: [2, 17], 49: [2, 17], 54: [2, 17], 57: [2, 17], 73: [2, 17], 78: [2, 17], 86: [2, 17], 91: [2, 17], 93: [2, 17], 102: [2, 17], 104: [2, 17], 105: [2, 17], 106: [2, 17], 110: [2, 17], 118: [2, 17], 126: [2, 17], 128: [2, 17], 129: [2, 17], 132: [2, 17], 133: [2, 17], 134: [2, 17], 135: [2, 17], 136: [2, 17], 137: [2, 17] }, { 1: [2, 18], 6: [2, 18], 25: [2, 18], 26: [2, 18], 49: [2, 18], 54: [2, 18], 57: [2, 18], 73: [2, 18], 78: [2, 18], 86: [2, 18], 91: [2, 18], 93: [2, 18], 102: [2, 18], 104: [2, 18], 105: [2, 18], 106: [2, 18], 110: [2, 18], 118: [2, 18], 126: [2, 18], 128: [2, 18], 129: [2, 18], 132: [2, 18], 133: [2, 18], 134: [2, 18], 135: [2, 18], 136: [2, 18], 137: [2, 18] }, { 1: [2, 19], 6: [2, 19], 25: [2, 19], 26: [2, 19], 49: [2, 19], 54: [2, 19], 57: [2, 19], 73: [2, 19], 78: [2, 19], 86: [2, 19], 91: [2, 19], 93: [2, 19], 102: [2, 19], 104: [2, 19], 105: [2, 19], 106: [2, 19], 110: [2, 19], 118: [2, 19], 126: [2, 19], 128: [2, 19], 129: [2, 19], 132: [2, 19], 133: [2, 19], 134: [2, 19], 135: [2, 19], 136: [2, 19], 137: [2, 19] }, { 1: [2, 20], 6: [2, 20], 25: [2, 20], 26: [2, 20], 49: [2, 20], 54: [2, 20], 57: [2, 20], 73: [2, 20], 78: [2, 20], 86: [2, 20], 91: [2, 20], 93: [2, 20], 102: [2, 20], 104: [2, 20], 105: [2, 20], 106: [2, 20], 110: [2, 20], 118: [2, 20], 126: [2, 20], 128: [2, 20], 129: [2, 20], 132: [2, 20], 133: [2, 20], 134: [2, 20], 135: [2, 20], 136: [2, 20], 137: [2, 20] }, { 1: [2, 21], 6: [2, 21], 25: [2, 21], 26: [2, 21], 49: [2, 21], 54: [2, 21], 57: [2, 21], 73: [2, 21], 78: [2, 21], 86: [2, 21], 91: [2, 21], 93: [2, 21], 102: [2, 21], 104: [2, 21], 105: [2, 21], 106: [2, 21], 110: [2, 21], 118: [2, 21], 126: [2, 21], 128: [2, 21], 129: [2, 21], 132: [2, 21], 133: [2, 21], 134: [2, 21], 135: [2, 21], 136: [2, 21], 137: [2, 21] }, { 1: [2, 22], 6: [2, 22], 25: [2, 22], 26: [2, 22], 49: [2, 22], 54: [2, 22], 57: [2, 22], 73: [2, 22], 78: [2, 22], 86: [2, 22], 91: [2, 22], 93: [2, 22], 102: [2, 22], 104: [2, 22], 105: [2, 22], 106: [2, 22], 110: [2, 22], 118: [2, 22], 126: [2, 22], 128: [2, 22], 129: [2, 22], 132: [2, 22], 133: [2, 22], 134: [2, 22], 135: [2, 22], 136: [2, 22], 137: [2, 22] }, { 1: [2, 8], 6: [2, 8], 26: [2, 8], 102: [2, 8], 104: [2, 8], 106: [2, 8], 110: [2, 8], 126: [2, 8] }, { 1: [2, 9], 6: [2, 9], 26: [2, 9], 102: [2, 9], 104: [2, 9], 106: [2, 9], 110: [2, 9], 126: [2, 9] }, { 1: [2, 10], 6: [2, 10], 26: [2, 10], 102: [2, 10], 104: [2, 10], 106: [2, 10], 110: [2, 10], 126: [2, 10] }, { 1: [2, 74], 6: [2, 74], 25: [2, 74], 26: [2, 74], 40: [1, 99], 49: [2, 74], 54: [2, 74], 57: [2, 74], 66: [2, 74], 67: [2, 74], 68: [2, 74], 69: [2, 74], 71: [2, 74], 73: [2, 74], 74: [2, 74], 78: [2, 74], 84: [2, 74], 85: [2, 74], 86: [2, 74], 91: [2, 74], 93: [2, 74], 102: [2, 74], 104: [2, 74], 105: [2, 74], 106: [2, 74], 110: [2, 74], 118: [2, 74], 126: [2, 74], 128: [2, 74], 129: [2, 74], 132: [2, 74], 133: [2, 74], 134: [2, 74], 135: [2, 74], 136: [2, 74], 137: [2, 74] }, { 1: [2, 75], 6: [2, 75], 25: [2, 75], 26: [2, 75], 49: [2, 75], 54: [2, 75], 57: [2, 75], 66: [2, 75], 67: [2, 75], 68: [2, 75], 69: [2, 75], 71: [2, 75], 73: [2, 75], 74: [2, 75], 78: [2, 75], 84: [2, 75], 85: [2, 75], 86: [2, 75], 91: [2, 75], 93: [2, 75], 102: [2, 75], 104: [2, 75], 105: [2, 75], 106: [2, 75], 110: [2, 75], 118: [2, 75], 126: [2, 75], 128: [2, 75], 129: [2, 75], 132: [2, 75], 133: [2, 75], 134: [2, 75], 135: [2, 75], 136: [2, 75], 137: [2, 75] }, { 1: [2, 76], 6: [2, 76], 25: [2, 76], 26: [2, 76], 49: [2, 76], 54: [2, 76], 57: [2, 76], 66: [2, 76], 67: [2, 76], 68: [2, 76], 69: [2, 76], 71: [2, 76], 73: [2, 76], 74: [2, 76], 78: [2, 76], 84: [2, 76], 85: [2, 76], 86: [2, 76], 91: [2, 76], 93: [2, 76], 102: [2, 76], 104: [2, 76], 105: [2, 76], 106: [2, 76], 110: [2, 76], 118: [2, 76], 126: [2, 76], 128: [2, 76], 129: [2, 76], 132: [2, 76], 133: [2, 76], 134: [2, 76], 135: [2, 76], 136: [2, 76], 137: [2, 76] }, { 1: [2, 77], 6: [2, 77], 25: [2, 77], 26: [2, 77], 49: [2, 77], 54: [2, 77], 57: [2, 77], 66: [2, 77], 67: [2, 77], 68: [2, 77], 69: [2, 77], 71: [2, 77], 73: [2, 77], 74: [2, 77], 78: [2, 77], 84: [2, 77], 85: [2, 77], 86: [2, 77], 91: [2, 77], 93: [2, 77], 102: [2, 77], 104: [2, 77], 105: [2, 77], 106: [2, 77], 110: [2, 77], 118: [2, 77], 126: [2, 77], 128: [2, 77], 129: [2, 77], 132: [2, 77], 133: [2, 77], 134: [2, 77], 135: [2, 77], 136: [2, 77], 137: [2, 77] }, { 1: [2, 78], 6: [2, 78], 25: [2, 78], 26: [2, 78], 49: [2, 78], 54: [2, 78], 57: [2, 78], 66: [2, 78], 67: [2, 78], 68: [2, 78], 69: [2, 78], 71: [2, 78], 73: [2, 78], 74: [2, 78], 78: [2, 78], 84: [2, 78], 85: [2, 78], 86: [2, 78], 91: [2, 78], 93: [2, 78], 102: [2, 78], 104: [2, 78], 105: [2, 78], 106: [2, 78], 110: [2, 78], 118: [2, 78], 126: [2, 78], 128: [2, 78], 129: [2, 78], 132: [2, 78], 133: [2, 78], 134: [2, 78], 135: [2, 78], 136: [2, 78], 137: [2, 78] }, { 1: [2, 105], 6: [2, 105], 25: [2, 105], 26: [2, 105], 49: [2, 105], 54: [2, 105], 57: [2, 105], 66: [2, 105], 67: [2, 105], 68: [2, 105], 69: [2, 105], 71: [2, 105], 73: [2, 105], 74: [2, 105], 78: [2, 105], 82: 100, 84: [2, 105], 85: [1, 101], 86: [2, 105], 91: [2, 105], 93: [2, 105], 102: [2, 105], 104: [2, 105], 105: [2, 105], 106: [2, 105], 110: [2, 105], 118: [2, 105], 126: [2, 105], 128: [2, 105], 129: [2, 105], 132: [2, 105], 133: [2, 105], 134: [2, 105], 135: [2, 105], 136: [2, 105], 137: [2, 105] }, { 6: [2, 54], 25: [2, 54], 27: 105, 28: [1, 71], 44: 106, 48: 102, 49: [2, 54], 54: [2, 54], 55: 103, 56: 104, 58: 107, 59: 108, 76: [1, 68], 89: [1, 109], 90: [1, 110] }, { 24: 111, 25: [1, 112] }, { 7: 113, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 115, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 116, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 12: 118, 13: 119, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 120, 44: 61, 58: 45, 59: 46, 61: 117, 63: 23, 64: 24, 65: 25, 76: [1, 68], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 101: [1, 54] }, { 12: 118, 13: 119, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 120, 44: 61, 58: 45, 59: 46, 61: 121, 63: 23, 64: 24, 65: 25, 76: [1, 68], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 101: [1, 54] }, { 1: [2, 71], 6: [2, 71], 25: [2, 71], 26: [2, 71], 40: [2, 71], 49: [2, 71], 54: [2, 71], 57: [2, 71], 66: [2, 71], 67: [2, 71], 68: [2, 71], 69: [2, 71], 71: [2, 71], 73: [2, 71], 74: [2, 71], 78: [2, 71], 80: [1, 125], 84: [2, 71], 85: [2, 71], 86: [2, 71], 91: [2, 71], 93: [2, 71], 102: [2, 71], 104: [2, 71], 105: [2, 71], 106: [2, 71], 110: [2, 71], 118: [2, 71], 126: [2, 71], 128: [2, 71], 129: [2, 71], 130: [1, 122], 131: [1, 123], 132: [2, 71], 133: [2, 71], 134: [2, 71], 135: [2, 71], 136: [2, 71], 137: [2, 71], 138: [1, 124] }, { 1: [2, 182], 6: [2, 182], 25: [2, 182], 26: [2, 182], 49: [2, 182], 54: [2, 182], 57: [2, 182], 73: [2, 182], 78: [2, 182], 86: [2, 182], 91: [2, 182], 93: [2, 182], 102: [2, 182], 104: [2, 182], 105: [2, 182], 106: [2, 182], 110: [2, 182], 118: [2, 182], 121: [1, 126], 126: [2, 182], 128: [2, 182], 129: [2, 182], 132: [2, 182], 133: [2, 182], 134: [2, 182], 135: [2, 182], 136: [2, 182], 137: [2, 182] }, { 24: 127, 25: [1, 112] }, { 24: 128, 25: [1, 112] }, { 1: [2, 149], 6: [2, 149], 25: [2, 149], 26: [2, 149], 49: [2, 149], 54: [2, 149], 57: [2, 149], 73: [2, 149], 78: [2, 149], 86: [2, 149], 91: [2, 149], 93: [2, 149], 102: [2, 149], 104: [2, 149], 105: [2, 149], 106: [2, 149], 110: [2, 149], 118: [2, 149], 126: [2, 149], 128: [2, 149], 129: [2, 149], 132: [2, 149], 133: [2, 149], 134: [2, 149], 135: [2, 149], 136: [2, 149], 137: [2, 149] }, { 24: 129, 25: [1, 112] }, { 7: 130, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 25: [1, 131], 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 95], 6: [2, 95], 12: 118, 13: 119, 24: 132, 25: [1, 112], 26: [2, 95], 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 120, 44: 61, 49: [2, 95], 54: [2, 95], 57: [2, 95], 58: 45, 59: 46, 61: 134, 63: 23, 64: 24, 65: 25, 73: [2, 95], 76: [1, 68], 78: [2, 95], 80: [1, 133], 83: [1, 26], 86: [2, 95], 88: [1, 56], 89: [1, 57], 90: [1, 55], 91: [2, 95], 93: [2, 95], 101: [1, 54], 102: [2, 95], 104: [2, 95], 105: [2, 95], 106: [2, 95], 110: [2, 95], 118: [2, 95], 126: [2, 95], 128: [2, 95], 129: [2, 95], 132: [2, 95], 133: [2, 95], 134: [2, 95], 135: [2, 95], 136: [2, 95], 137: [2, 95] }, { 7: 135, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 46], 6: [2, 46], 7: 136, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 26: [2, 46], 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 102: [2, 46], 103: 37, 104: [2, 46], 106: [2, 46], 107: 38, 108: [1, 65], 109: 39, 110: [2, 46], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 126: [2, 46], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 47], 6: [2, 47], 25: [2, 47], 26: [2, 47], 54: [2, 47], 78: [2, 47], 102: [2, 47], 104: [2, 47], 106: [2, 47], 110: [2, 47], 126: [2, 47] }, { 1: [2, 72], 6: [2, 72], 25: [2, 72], 26: [2, 72], 40: [2, 72], 49: [2, 72], 54: [2, 72], 57: [2, 72], 66: [2, 72], 67: [2, 72], 68: [2, 72], 69: [2, 72], 71: [2, 72], 73: [2, 72], 74: [2, 72], 78: [2, 72], 84: [2, 72], 85: [2, 72], 86: [2, 72], 91: [2, 72], 93: [2, 72], 102: [2, 72], 104: [2, 72], 105: [2, 72], 106: [2, 72], 110: [2, 72], 118: [2, 72], 126: [2, 72], 128: [2, 72], 129: [2, 72], 132: [2, 72], 133: [2, 72], 134: [2, 72], 135: [2, 72], 136: [2, 72], 137: [2, 72] }, { 1: [2, 73], 6: [2, 73], 25: [2, 73], 26: [2, 73], 40: [2, 73], 49: [2, 73], 54: [2, 73], 57: [2, 73], 66: [2, 73], 67: [2, 73], 68: [2, 73], 69: [2, 73], 71: [2, 73], 73: [2, 73], 74: [2, 73], 78: [2, 73], 84: [2, 73], 85: [2, 73], 86: [2, 73], 91: [2, 73], 93: [2, 73], 102: [2, 73], 104: [2, 73], 105: [2, 73], 106: [2, 73], 110: [2, 73], 118: [2, 73], 126: [2, 73], 128: [2, 73], 129: [2, 73], 132: [2, 73], 133: [2, 73], 134: [2, 73], 135: [2, 73], 136: [2, 73], 137: [2, 73] }, { 1: [2, 28], 6: [2, 28], 25: [2, 28], 26: [2, 28], 49: [2, 28], 54: [2, 28], 57: [2, 28], 66: [2, 28], 67: [2, 28], 68: [2, 28], 69: [2, 28], 71: [2, 28], 73: [2, 28], 74: [2, 28], 78: [2, 28], 84: [2, 28], 85: [2, 28], 86: [2, 28], 91: [2, 28], 93: [2, 28], 102: [2, 28], 104: [2, 28], 105: [2, 28], 106: [2, 28], 110: [2, 28], 118: [2, 28], 126: [2, 28], 128: [2, 28], 129: [2, 28], 132: [2, 28], 133: [2, 28], 134: [2, 28], 135: [2, 28], 136: [2, 28], 137: [2, 28] }, { 1: [2, 29], 6: [2, 29], 25: [2, 29], 26: [2, 29], 49: [2, 29], 54: [2, 29], 57: [2, 29], 66: [2, 29], 67: [2, 29], 68: [2, 29], 69: [2, 29], 71: [2, 29], 73: [2, 29], 74: [2, 29], 78: [2, 29], 84: [2, 29], 85: [2, 29], 86: [2, 29], 91: [2, 29], 93: [2, 29], 102: [2, 29], 104: [2, 29], 105: [2, 29], 106: [2, 29], 110: [2, 29], 118: [2, 29], 126: [2, 29], 128: [2, 29], 129: [2, 29], 132: [2, 29], 133: [2, 29], 134: [2, 29], 135: [2, 29], 136: [2, 29], 137: [2, 29] }, { 1: [2, 30], 6: [2, 30], 25: [2, 30], 26: [2, 30], 49: [2, 30], 54: [2, 30], 57: [2, 30], 66: [2, 30], 67: [2, 30], 68: [2, 30], 69: [2, 30], 71: [2, 30], 73: [2, 30], 74: [2, 30], 78: [2, 30], 84: [2, 30], 85: [2, 30], 86: [2, 30], 91: [2, 30], 93: [2, 30], 102: [2, 30], 104: [2, 30], 105: [2, 30], 106: [2, 30], 110: [2, 30], 118: [2, 30], 126: [2, 30], 128: [2, 30], 129: [2, 30], 132: [2, 30], 133: [2, 30], 134: [2, 30], 135: [2, 30], 136: [2, 30], 137: [2, 30] }, { 1: [2, 31], 6: [2, 31], 25: [2, 31], 26: [2, 31], 49: [2, 31], 54: [2, 31], 57: [2, 31], 66: [2, 31], 67: [2, 31], 68: [2, 31], 69: [2, 31], 71: [2, 31], 73: [2, 31], 74: [2, 31], 78: [2, 31], 84: [2, 31], 85: [2, 31], 86: [2, 31], 91: [2, 31], 93: [2, 31], 102: [2, 31], 104: [2, 31], 105: [2, 31], 106: [2, 31], 110: [2, 31], 118: [2, 31], 126: [2, 31], 128: [2, 31], 129: [2, 31], 132: [2, 31], 133: [2, 31], 134: [2, 31], 135: [2, 31], 136: [2, 31], 137: [2, 31] }, { 1: [2, 32], 6: [2, 32], 25: [2, 32], 26: [2, 32], 49: [2, 32], 54: [2, 32], 57: [2, 32], 66: [2, 32], 67: [2, 32], 68: [2, 32], 69: [2, 32], 71: [2, 32], 73: [2, 32], 74: [2, 32], 78: [2, 32], 84: [2, 32], 85: [2, 32], 86: [2, 32], 91: [2, 32], 93: [2, 32], 102: [2, 32], 104: [2, 32], 105: [2, 32], 106: [2, 32], 110: [2, 32], 118: [2, 32], 126: [2, 32], 128: [2, 32], 129: [2, 32], 132: [2, 32], 133: [2, 32], 134: [2, 32], 135: [2, 32], 136: [2, 32], 137: [2, 32] }, { 1: [2, 33], 6: [2, 33], 25: [2, 33], 26: [2, 33], 49: [2, 33], 54: [2, 33], 57: [2, 33], 66: [2, 33], 67: [2, 33], 68: [2, 33], 69: [2, 33], 71: [2, 33], 73: [2, 33], 74: [2, 33], 78: [2, 33], 84: [2, 33], 85: [2, 33], 86: [2, 33], 91: [2, 33], 93: [2, 33], 102: [2, 33], 104: [2, 33], 105: [2, 33], 106: [2, 33], 110: [2, 33], 118: [2, 33], 126: [2, 33], 128: [2, 33], 129: [2, 33], 132: [2, 33], 133: [2, 33], 134: [2, 33], 135: [2, 33], 136: [2, 33], 137: [2, 33] }, { 1: [2, 34], 6: [2, 34], 25: [2, 34], 26: [2, 34], 49: [2, 34], 54: [2, 34], 57: [2, 34], 66: [2, 34], 67: [2, 34], 68: [2, 34], 69: [2, 34], 71: [2, 34], 73: [2, 34], 74: [2, 34], 78: [2, 34], 84: [2, 34], 85: [2, 34], 86: [2, 34], 91: [2, 34], 93: [2, 34], 102: [2, 34], 104: [2, 34], 105: [2, 34], 106: [2, 34], 110: [2, 34], 118: [2, 34], 126: [2, 34], 128: [2, 34], 129: [2, 34], 132: [2, 34], 133: [2, 34], 134: [2, 34], 135: [2, 34], 136: [2, 34], 137: [2, 34] }, { 4: 137, 5: 3, 7: 4, 8: 5, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 25: [1, 138], 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 139, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 25: [1, 143], 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 60: 144, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 87: 141, 88: [1, 56], 89: [1, 57], 90: [1, 55], 91: [1, 140], 94: 142, 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 111], 6: [2, 111], 25: [2, 111], 26: [2, 111], 49: [2, 111], 54: [2, 111], 57: [2, 111], 66: [2, 111], 67: [2, 111], 68: [2, 111], 69: [2, 111], 71: [2, 111], 73: [2, 111], 74: [2, 111], 78: [2, 111], 84: [2, 111], 85: [2, 111], 86: [2, 111], 91: [2, 111], 93: [2, 111], 102: [2, 111], 104: [2, 111], 105: [2, 111], 106: [2, 111], 110: [2, 111], 118: [2, 111], 126: [2, 111], 128: [2, 111], 129: [2, 111], 132: [2, 111], 133: [2, 111], 134: [2, 111], 135: [2, 111], 136: [2, 111], 137: [2, 111] }, { 1: [2, 112], 6: [2, 112], 25: [2, 112], 26: [2, 112], 27: 145, 28: [1, 71], 49: [2, 112], 54: [2, 112], 57: [2, 112], 66: [2, 112], 67: [2, 112], 68: [2, 112], 69: [2, 112], 71: [2, 112], 73: [2, 112], 74: [2, 112], 78: [2, 112], 84: [2, 112], 85: [2, 112], 86: [2, 112], 91: [2, 112], 93: [2, 112], 102: [2, 112], 104: [2, 112], 105: [2, 112], 106: [2, 112], 110: [2, 112], 118: [2, 112], 126: [2, 112], 128: [2, 112], 129: [2, 112], 132: [2, 112], 133: [2, 112], 134: [2, 112], 135: [2, 112], 136: [2, 112], 137: [2, 112] }, { 25: [2, 50] }, { 25: [2, 51] }, { 1: [2, 67], 6: [2, 67], 25: [2, 67], 26: [2, 67], 40: [2, 67], 49: [2, 67], 54: [2, 67], 57: [2, 67], 66: [2, 67], 67: [2, 67], 68: [2, 67], 69: [2, 67], 71: [2, 67], 73: [2, 67], 74: [2, 67], 78: [2, 67], 80: [2, 67], 84: [2, 67], 85: [2, 67], 86: [2, 67], 91: [2, 67], 93: [2, 67], 102: [2, 67], 104: [2, 67], 105: [2, 67], 106: [2, 67], 110: [2, 67], 118: [2, 67], 126: [2, 67], 128: [2, 67], 129: [2, 67], 130: [2, 67], 131: [2, 67], 132: [2, 67], 133: [2, 67], 134: [2, 67], 135: [2, 67], 136: [2, 67], 137: [2, 67], 138: [2, 67] }, { 1: [2, 70], 6: [2, 70], 25: [2, 70], 26: [2, 70], 40: [2, 70], 49: [2, 70], 54: [2, 70], 57: [2, 70], 66: [2, 70], 67: [2, 70], 68: [2, 70], 69: [2, 70], 71: [2, 70], 73: [2, 70], 74: [2, 70], 78: [2, 70], 80: [2, 70], 84: [2, 70], 85: [2, 70], 86: [2, 70], 91: [2, 70], 93: [2, 70], 102: [2, 70], 104: [2, 70], 105: [2, 70], 106: [2, 70], 110: [2, 70], 118: [2, 70], 126: [2, 70], 128: [2, 70], 129: [2, 70], 130: [2, 70], 131: [2, 70], 132: [2, 70], 133: [2, 70], 134: [2, 70], 135: [2, 70], 136: [2, 70], 137: [2, 70], 138: [2, 70] }, { 7: 146, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 147, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 148, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 150, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 24: 149, 25: [1, 112], 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 27: 155, 28: [1, 71], 44: 156, 58: 157, 59: 158, 64: 151, 76: [1, 68], 89: [1, 109], 90: [1, 55], 113: 152, 114: [1, 153], 115: 154 }, { 112: 159, 116: [1, 160], 117: [1, 161] }, { 6: [2, 90], 10: 165, 25: [2, 90], 27: 166, 28: [1, 71], 29: 167, 30: [1, 69], 31: [1, 70], 41: 163, 42: 164, 44: 168, 46: [1, 44], 54: [2, 90], 77: 162, 78: [2, 90], 89: [1, 109] }, { 1: [2, 26], 6: [2, 26], 25: [2, 26], 26: [2, 26], 43: [2, 26], 49: [2, 26], 54: [2, 26], 57: [2, 26], 66: [2, 26], 67: [2, 26], 68: [2, 26], 69: [2, 26], 71: [2, 26], 73: [2, 26], 74: [2, 26], 78: [2, 26], 84: [2, 26], 85: [2, 26], 86: [2, 26], 91: [2, 26], 93: [2, 26], 102: [2, 26], 104: [2, 26], 105: [2, 26], 106: [2, 26], 110: [2, 26], 118: [2, 26], 126: [2, 26], 128: [2, 26], 129: [2, 26], 132: [2, 26], 133: [2, 26], 134: [2, 26], 135: [2, 26], 136: [2, 26], 137: [2, 26] }, { 1: [2, 27], 6: [2, 27], 25: [2, 27], 26: [2, 27], 43: [2, 27], 49: [2, 27], 54: [2, 27], 57: [2, 27], 66: [2, 27], 67: [2, 27], 68: [2, 27], 69: [2, 27], 71: [2, 27], 73: [2, 27], 74: [2, 27], 78: [2, 27], 84: [2, 27], 85: [2, 27], 86: [2, 27], 91: [2, 27], 93: [2, 27], 102: [2, 27], 104: [2, 27], 105: [2, 27], 106: [2, 27], 110: [2, 27], 118: [2, 27], 126: [2, 27], 128: [2, 27], 129: [2, 27], 132: [2, 27], 133: [2, 27], 134: [2, 27], 135: [2, 27], 136: [2, 27], 137: [2, 27] }, { 1: [2, 25], 6: [2, 25], 25: [2, 25], 26: [2, 25], 40: [2, 25], 43: [2, 25], 49: [2, 25], 54: [2, 25], 57: [2, 25], 66: [2, 25], 67: [2, 25], 68: [2, 25], 69: [2, 25], 71: [2, 25], 73: [2, 25], 74: [2, 25], 78: [2, 25], 80: [2, 25], 84: [2, 25], 85: [2, 25], 86: [2, 25], 91: [2, 25], 93: [2, 25], 102: [2, 25], 104: [2, 25], 105: [2, 25], 106: [2, 25], 110: [2, 25], 116: [2, 25], 117: [2, 25], 118: [2, 25], 126: [2, 25], 128: [2, 25], 129: [2, 25], 130: [2, 25], 131: [2, 25], 132: [2, 25], 133: [2, 25], 134: [2, 25], 135: [2, 25], 136: [2, 25], 137: [2, 25], 138: [2, 25] }, { 1: [2, 5], 5: 169, 6: [2, 5], 7: 4, 8: 5, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 26: [2, 5], 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 102: [2, 5], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 193], 6: [2, 193], 25: [2, 193], 26: [2, 193], 49: [2, 193], 54: [2, 193], 57: [2, 193], 73: [2, 193], 78: [2, 193], 86: [2, 193], 91: [2, 193], 93: [2, 193], 102: [2, 193], 104: [2, 193], 105: [2, 193], 106: [2, 193], 110: [2, 193], 118: [2, 193], 126: [2, 193], 128: [2, 193], 129: [2, 193], 132: [2, 193], 133: [2, 193], 134: [2, 193], 135: [2, 193], 136: [2, 193], 137: [2, 193] }, { 7: 170, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 171, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 172, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 173, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 174, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 175, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 176, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 177, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 148], 6: [2, 148], 25: [2, 148], 26: [2, 148], 49: [2, 148], 54: [2, 148], 57: [2, 148], 73: [2, 148], 78: [2, 148], 86: [2, 148], 91: [2, 148], 93: [2, 148], 102: [2, 148], 104: [2, 148], 105: [2, 148], 106: [2, 148], 110: [2, 148], 118: [2, 148], 126: [2, 148], 128: [2, 148], 129: [2, 148], 132: [2, 148], 133: [2, 148], 134: [2, 148], 135: [2, 148], 136: [2, 148], 137: [2, 148] }, { 1: [2, 153], 6: [2, 153], 25: [2, 153], 26: [2, 153], 49: [2, 153], 54: [2, 153], 57: [2, 153], 73: [2, 153], 78: [2, 153], 86: [2, 153], 91: [2, 153], 93: [2, 153], 102: [2, 153], 104: [2, 153], 105: [2, 153], 106: [2, 153], 110: [2, 153], 118: [2, 153], 126: [2, 153], 128: [2, 153], 129: [2, 153], 132: [2, 153], 133: [2, 153], 134: [2, 153], 135: [2, 153], 136: [2, 153], 137: [2, 153] }, { 7: 178, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 147], 6: [2, 147], 25: [2, 147], 26: [2, 147], 49: [2, 147], 54: [2, 147], 57: [2, 147], 73: [2, 147], 78: [2, 147], 86: [2, 147], 91: [2, 147], 93: [2, 147], 102: [2, 147], 104: [2, 147], 105: [2, 147], 106: [2, 147], 110: [2, 147], 118: [2, 147], 126: [2, 147], 128: [2, 147], 129: [2, 147], 132: [2, 147], 133: [2, 147], 134: [2, 147], 135: [2, 147], 136: [2, 147], 137: [2, 147] }, { 1: [2, 152], 6: [2, 152], 25: [2, 152], 26: [2, 152], 49: [2, 152], 54: [2, 152], 57: [2, 152], 73: [2, 152], 78: [2, 152], 86: [2, 152], 91: [2, 152], 93: [2, 152], 102: [2, 152], 104: [2, 152], 105: [2, 152], 106: [2, 152], 110: [2, 152], 118: [2, 152], 126: [2, 152], 128: [2, 152], 129: [2, 152], 132: [2, 152], 133: [2, 152], 134: [2, 152], 135: [2, 152], 136: [2, 152], 137: [2, 152] }, { 82: 179, 85: [1, 101] }, { 1: [2, 68], 6: [2, 68], 25: [2, 68], 26: [2, 68], 40: [2, 68], 49: [2, 68], 54: [2, 68], 57: [2, 68], 66: [2, 68], 67: [2, 68], 68: [2, 68], 69: [2, 68], 71: [2, 68], 73: [2, 68], 74: [2, 68], 78: [2, 68], 80: [2, 68], 84: [2, 68], 85: [2, 68], 86: [2, 68], 91: [2, 68], 93: [2, 68], 102: [2, 68], 104: [2, 68], 105: [2, 68], 106: [2, 68], 110: [2, 68], 118: [2, 68], 126: [2, 68], 128: [2, 68], 129: [2, 68], 130: [2, 68], 131: [2, 68], 132: [2, 68], 133: [2, 68], 134: [2, 68], 135: [2, 68], 136: [2, 68], 137: [2, 68], 138: [2, 68] }, { 85: [2, 108] }, { 27: 180, 28: [1, 71] }, { 27: 181, 28: [1, 71] }, { 1: [2, 83], 6: [2, 83], 25: [2, 83], 26: [2, 83], 27: 182, 28: [1, 71], 40: [2, 83], 49: [2, 83], 54: [2, 83], 57: [2, 83], 66: [2, 83], 67: [2, 83], 68: [2, 83], 69: [2, 83], 71: [2, 83], 73: [2, 83], 74: [2, 83], 78: [2, 83], 80: [2, 83], 84: [2, 83], 85: [2, 83], 86: [2, 83], 91: [2, 83], 93: [2, 83], 102: [2, 83], 104: [2, 83], 105: [2, 83], 106: [2, 83], 110: [2, 83], 118: [2, 83], 126: [2, 83], 128: [2, 83], 129: [2, 83], 130: [2, 83], 131: [2, 83], 132: [2, 83], 133: [2, 83], 134: [2, 83], 135: [2, 83], 136: [2, 83], 137: [2, 83], 138: [2, 83] }, { 27: 183, 28: [1, 71] }, { 1: [2, 84], 6: [2, 84], 25: [2, 84], 26: [2, 84], 40: [2, 84], 49: [2, 84], 54: [2, 84], 57: [2, 84], 66: [2, 84], 67: [2, 84], 68: [2, 84], 69: [2, 84], 71: [2, 84], 73: [2, 84], 74: [2, 84], 78: [2, 84], 80: [2, 84], 84: [2, 84], 85: [2, 84], 86: [2, 84], 91: [2, 84], 93: [2, 84], 102: [2, 84], 104: [2, 84], 105: [2, 84], 106: [2, 84], 110: [2, 84], 118: [2, 84], 126: [2, 84], 128: [2, 84], 129: [2, 84], 130: [2, 84], 131: [2, 84], 132: [2, 84], 133: [2, 84], 134: [2, 84], 135: [2, 84], 136: [2, 84], 137: [2, 84], 138: [2, 84] }, { 7: 185, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 57: [1, 189], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 72: 184, 75: 186, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 92: 187, 93: [1, 188], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 70: 190, 71: [1, 95], 74: [1, 96] }, { 82: 191, 85: [1, 101] }, { 1: [2, 69], 6: [2, 69], 25: [2, 69], 26: [2, 69], 40: [2, 69], 49: [2, 69], 54: [2, 69], 57: [2, 69], 66: [2, 69], 67: [2, 69], 68: [2, 69], 69: [2, 69], 71: [2, 69], 73: [2, 69], 74: [2, 69], 78: [2, 69], 80: [2, 69], 84: [2, 69], 85: [2, 69], 86: [2, 69], 91: [2, 69], 93: [2, 69], 102: [2, 69], 104: [2, 69], 105: [2, 69], 106: [2, 69], 110: [2, 69], 118: [2, 69], 126: [2, 69], 128: [2, 69], 129: [2, 69], 130: [2, 69], 131: [2, 69], 132: [2, 69], 133: [2, 69], 134: [2, 69], 135: [2, 69], 136: [2, 69], 137: [2, 69], 138: [2, 69] }, { 6: [1, 193], 7: 192, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 25: [1, 194], 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 106], 6: [2, 106], 25: [2, 106], 26: [2, 106], 49: [2, 106], 54: [2, 106], 57: [2, 106], 66: [2, 106], 67: [2, 106], 68: [2, 106], 69: [2, 106], 71: [2, 106], 73: [2, 106], 74: [2, 106], 78: [2, 106], 84: [2, 106], 85: [2, 106], 86: [2, 106], 91: [2, 106], 93: [2, 106], 102: [2, 106], 104: [2, 106], 105: [2, 106], 106: [2, 106], 110: [2, 106], 118: [2, 106], 126: [2, 106], 128: [2, 106], 129: [2, 106], 132: [2, 106], 133: [2, 106], 134: [2, 106], 135: [2, 106], 136: [2, 106], 137: [2, 106] }, { 7: 197, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 25: [1, 143], 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 60: 144, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 86: [1, 195], 87: 196, 88: [1, 56], 89: [1, 57], 90: [1, 55], 94: 142, 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 6: [2, 52], 25: [2, 52], 49: [1, 198], 53: 200, 54: [1, 199] }, { 6: [2, 55], 25: [2, 55], 26: [2, 55], 49: [2, 55], 54: [2, 55] }, { 6: [2, 59], 25: [2, 59], 26: [2, 59], 40: [1, 202], 49: [2, 59], 54: [2, 59], 57: [1, 201] }, { 6: [2, 62], 25: [2, 62], 26: [2, 62], 40: [2, 62], 49: [2, 62], 54: [2, 62], 57: [2, 62] }, { 6: [2, 63], 25: [2, 63], 26: [2, 63], 40: [2, 63], 49: [2, 63], 54: [2, 63], 57: [2, 63] }, { 6: [2, 64], 25: [2, 64], 26: [2, 64], 40: [2, 64], 49: [2, 64], 54: [2, 64], 57: [2, 64] }, { 6: [2, 65], 25: [2, 65], 26: [2, 65], 40: [2, 65], 49: [2, 65], 54: [2, 65], 57: [2, 65] }, { 27: 145, 28: [1, 71] }, { 7: 197, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 25: [1, 143], 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 60: 144, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 87: 141, 88: [1, 56], 89: [1, 57], 90: [1, 55], 91: [1, 140], 94: 142, 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 49], 6: [2, 49], 25: [2, 49], 26: [2, 49], 49: [2, 49], 54: [2, 49], 57: [2, 49], 73: [2, 49], 78: [2, 49], 86: [2, 49], 91: [2, 49], 93: [2, 49], 102: [2, 49], 104: [2, 49], 105: [2, 49], 106: [2, 49], 110: [2, 49], 118: [2, 49], 126: [2, 49], 128: [2, 49], 129: [2, 49], 132: [2, 49], 133: [2, 49], 134: [2, 49], 135: [2, 49], 136: [2, 49], 137: [2, 49] }, { 4: 204, 5: 3, 7: 4, 8: 5, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 26: [1, 203], 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 186], 6: [2, 186], 25: [2, 186], 26: [2, 186], 49: [2, 186], 54: [2, 186], 57: [2, 186], 73: [2, 186], 78: [2, 186], 86: [2, 186], 91: [2, 186], 93: [2, 186], 102: [2, 186], 103: 82, 104: [2, 186], 105: [2, 186], 106: [2, 186], 109: 83, 110: [2, 186], 111: 67, 118: [2, 186], 126: [2, 186], 128: [2, 186], 129: [2, 186], 132: [1, 73], 133: [2, 186], 134: [2, 186], 135: [2, 186], 136: [2, 186], 137: [2, 186] }, { 103: 85, 104: [1, 63], 106: [1, 64], 109: 86, 110: [1, 66], 111: 67, 126: [1, 84] }, { 1: [2, 187], 6: [2, 187], 25: [2, 187], 26: [2, 187], 49: [2, 187], 54: [2, 187], 57: [2, 187], 73: [2, 187], 78: [2, 187], 86: [2, 187], 91: [2, 187], 93: [2, 187], 102: [2, 187], 103: 82, 104: [2, 187], 105: [2, 187], 106: [2, 187], 109: 83, 110: [2, 187], 111: 67, 118: [2, 187], 126: [2, 187], 128: [2, 187], 129: [2, 187], 132: [1, 73], 133: [2, 187], 134: [2, 187], 135: [2, 187], 136: [2, 187], 137: [2, 187] }, { 1: [2, 188], 6: [2, 188], 25: [2, 188], 26: [2, 188], 49: [2, 188], 54: [2, 188], 57: [2, 188], 73: [2, 188], 78: [2, 188], 86: [2, 188], 91: [2, 188], 93: [2, 188], 102: [2, 188], 103: 82, 104: [2, 188], 105: [2, 188], 106: [2, 188], 109: 83, 110: [2, 188], 111: 67, 118: [2, 188], 126: [2, 188], 128: [2, 188], 129: [2, 188], 132: [1, 73], 133: [2, 188], 134: [2, 188], 135: [2, 188], 136: [2, 188], 137: [2, 188] }, { 1: [2, 189], 6: [2, 189], 25: [2, 189], 26: [2, 189], 49: [2, 189], 54: [2, 189], 57: [2, 189], 66: [2, 71], 67: [2, 71], 68: [2, 71], 69: [2, 71], 71: [2, 71], 73: [2, 189], 74: [2, 71], 78: [2, 189], 84: [2, 71], 85: [2, 71], 86: [2, 189], 91: [2, 189], 93: [2, 189], 102: [2, 189], 104: [2, 189], 105: [2, 189], 106: [2, 189], 110: [2, 189], 118: [2, 189], 126: [2, 189], 128: [2, 189], 129: [2, 189], 132: [2, 189], 133: [2, 189], 134: [2, 189], 135: [2, 189], 136: [2, 189], 137: [2, 189] }, { 62: 88, 66: [1, 90], 67: [1, 91], 68: [1, 92], 69: [1, 93], 70: 94, 71: [1, 95], 74: [1, 96], 81: 87, 84: [1, 89], 85: [2, 107] }, { 62: 98, 66: [1, 90], 67: [1, 91], 68: [1, 92], 69: [1, 93], 70: 94, 71: [1, 95], 74: [1, 96], 81: 97, 84: [1, 89], 85: [2, 107] }, { 66: [2, 74], 67: [2, 74], 68: [2, 74], 69: [2, 74], 71: [2, 74], 74: [2, 74], 84: [2, 74], 85: [2, 74] }, { 1: [2, 190], 6: [2, 190], 25: [2, 190], 26: [2, 190], 49: [2, 190], 54: [2, 190], 57: [2, 190], 66: [2, 71], 67: [2, 71], 68: [2, 71], 69: [2, 71], 71: [2, 71], 73: [2, 190], 74: [2, 71], 78: [2, 190], 84: [2, 71], 85: [2, 71], 86: [2, 190], 91: [2, 190], 93: [2, 190], 102: [2, 190], 104: [2, 190], 105: [2, 190], 106: [2, 190], 110: [2, 190], 118: [2, 190], 126: [2, 190], 128: [2, 190], 129: [2, 190], 132: [2, 190], 133: [2, 190], 134: [2, 190], 135: [2, 190], 136: [2, 190], 137: [2, 190] }, { 1: [2, 191], 6: [2, 191], 25: [2, 191], 26: [2, 191], 49: [2, 191], 54: [2, 191], 57: [2, 191], 73: [2, 191], 78: [2, 191], 86: [2, 191], 91: [2, 191], 93: [2, 191], 102: [2, 191], 104: [2, 191], 105: [2, 191], 106: [2, 191], 110: [2, 191], 118: [2, 191], 126: [2, 191], 128: [2, 191], 129: [2, 191], 132: [2, 191], 133: [2, 191], 134: [2, 191], 135: [2, 191], 136: [2, 191], 137: [2, 191] }, { 1: [2, 192], 6: [2, 192], 25: [2, 192], 26: [2, 192], 49: [2, 192], 54: [2, 192], 57: [2, 192], 73: [2, 192], 78: [2, 192], 86: [2, 192], 91: [2, 192], 93: [2, 192], 102: [2, 192], 104: [2, 192], 105: [2, 192], 106: [2, 192], 110: [2, 192], 118: [2, 192], 126: [2, 192], 128: [2, 192], 129: [2, 192], 132: [2, 192], 133: [2, 192], 134: [2, 192], 135: [2, 192], 136: [2, 192], 137: [2, 192] }, { 6: [1, 207], 7: 205, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 25: [1, 206], 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 208, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 24: 209, 25: [1, 112], 125: [1, 210] }, { 1: [2, 132], 6: [2, 132], 25: [2, 132], 26: [2, 132], 49: [2, 132], 54: [2, 132], 57: [2, 132], 73: [2, 132], 78: [2, 132], 86: [2, 132], 91: [2, 132], 93: [2, 132], 97: 211, 98: [1, 212], 99: [1, 213], 102: [2, 132], 104: [2, 132], 105: [2, 132], 106: [2, 132], 110: [2, 132], 118: [2, 132], 126: [2, 132], 128: [2, 132], 129: [2, 132], 132: [2, 132], 133: [2, 132], 134: [2, 132], 135: [2, 132], 136: [2, 132], 137: [2, 132] }, { 1: [2, 146], 6: [2, 146], 25: [2, 146], 26: [2, 146], 49: [2, 146], 54: [2, 146], 57: [2, 146], 73: [2, 146], 78: [2, 146], 86: [2, 146], 91: [2, 146], 93: [2, 146], 102: [2, 146], 104: [2, 146], 105: [2, 146], 106: [2, 146], 110: [2, 146], 118: [2, 146], 126: [2, 146], 128: [2, 146], 129: [2, 146], 132: [2, 146], 133: [2, 146], 134: [2, 146], 135: [2, 146], 136: [2, 146], 137: [2, 146] }, { 1: [2, 154], 6: [2, 154], 25: [2, 154], 26: [2, 154], 49: [2, 154], 54: [2, 154], 57: [2, 154], 73: [2, 154], 78: [2, 154], 86: [2, 154], 91: [2, 154], 93: [2, 154], 102: [2, 154], 104: [2, 154], 105: [2, 154], 106: [2, 154], 110: [2, 154], 118: [2, 154], 126: [2, 154], 128: [2, 154], 129: [2, 154], 132: [2, 154], 133: [2, 154], 134: [2, 154], 135: [2, 154], 136: [2, 154], 137: [2, 154] }, { 25: [1, 214], 103: 82, 104: [1, 63], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 120: 215, 122: 216, 123: [1, 217] }, { 1: [2, 96], 6: [2, 96], 25: [2, 96], 26: [2, 96], 49: [2, 96], 54: [2, 96], 57: [2, 96], 73: [2, 96], 78: [2, 96], 86: [2, 96], 91: [2, 96], 93: [2, 96], 102: [2, 96], 104: [2, 96], 105: [2, 96], 106: [2, 96], 110: [2, 96], 118: [2, 96], 126: [2, 96], 128: [2, 96], 129: [2, 96], 132: [2, 96], 133: [2, 96], 134: [2, 96], 135: [2, 96], 136: [2, 96], 137: [2, 96] }, { 7: 218, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 99], 6: [2, 99], 24: 219, 25: [1, 112], 26: [2, 99], 49: [2, 99], 54: [2, 99], 57: [2, 99], 66: [2, 71], 67: [2, 71], 68: [2, 71], 69: [2, 71], 71: [2, 71], 73: [2, 99], 74: [2, 71], 78: [2, 99], 80: [1, 220], 84: [2, 71], 85: [2, 71], 86: [2, 99], 91: [2, 99], 93: [2, 99], 102: [2, 99], 104: [2, 99], 105: [2, 99], 106: [2, 99], 110: [2, 99], 118: [2, 99], 126: [2, 99], 128: [2, 99], 129: [2, 99], 132: [2, 99], 133: [2, 99], 134: [2, 99], 135: [2, 99], 136: [2, 99], 137: [2, 99] }, { 1: [2, 139], 6: [2, 139], 25: [2, 139], 26: [2, 139], 49: [2, 139], 54: [2, 139], 57: [2, 139], 73: [2, 139], 78: [2, 139], 86: [2, 139], 91: [2, 139], 93: [2, 139], 102: [2, 139], 103: 82, 104: [2, 139], 105: [2, 139], 106: [2, 139], 109: 83, 110: [2, 139], 111: 67, 118: [2, 139], 126: [2, 139], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 45], 6: [2, 45], 26: [2, 45], 102: [2, 45], 103: 82, 104: [2, 45], 106: [2, 45], 109: 83, 110: [2, 45], 111: 67, 126: [2, 45], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 6: [1, 72], 102: [1, 221] }, { 4: 222, 5: 3, 7: 4, 8: 5, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 6: [2, 128], 25: [2, 128], 54: [2, 128], 57: [1, 224], 91: [2, 128], 92: 223, 93: [1, 188], 103: 82, 104: [1, 63], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 114], 6: [2, 114], 25: [2, 114], 26: [2, 114], 40: [2, 114], 49: [2, 114], 54: [2, 114], 57: [2, 114], 66: [2, 114], 67: [2, 114], 68: [2, 114], 69: [2, 114], 71: [2, 114], 73: [2, 114], 74: [2, 114], 78: [2, 114], 84: [2, 114], 85: [2, 114], 86: [2, 114], 91: [2, 114], 93: [2, 114], 102: [2, 114], 104: [2, 114], 105: [2, 114], 106: [2, 114], 110: [2, 114], 116: [2, 114], 117: [2, 114], 118: [2, 114], 126: [2, 114], 128: [2, 114], 129: [2, 114], 132: [2, 114], 133: [2, 114], 134: [2, 114], 135: [2, 114], 136: [2, 114], 137: [2, 114] }, { 6: [2, 52], 25: [2, 52], 53: 225, 54: [1, 226], 91: [2, 52] }, { 6: [2, 123], 25: [2, 123], 26: [2, 123], 54: [2, 123], 86: [2, 123], 91: [2, 123] }, { 7: 197, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 25: [1, 143], 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 60: 144, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 87: 227, 88: [1, 56], 89: [1, 57], 90: [1, 55], 94: 142, 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 6: [2, 129], 25: [2, 129], 26: [2, 129], 54: [2, 129], 86: [2, 129], 91: [2, 129] }, { 1: [2, 113], 6: [2, 113], 25: [2, 113], 26: [2, 113], 40: [2, 113], 43: [2, 113], 49: [2, 113], 54: [2, 113], 57: [2, 113], 66: [2, 113], 67: [2, 113], 68: [2, 113], 69: [2, 113], 71: [2, 113], 73: [2, 113], 74: [2, 113], 78: [2, 113], 80: [2, 113], 84: [2, 113], 85: [2, 113], 86: [2, 113], 91: [2, 113], 93: [2, 113], 102: [2, 113], 104: [2, 113], 105: [2, 113], 106: [2, 113], 110: [2, 113], 116: [2, 113], 117: [2, 113], 118: [2, 113], 126: [2, 113], 128: [2, 113], 129: [2, 113], 130: [2, 113], 131: [2, 113], 132: [2, 113], 133: [2, 113], 134: [2, 113], 135: [2, 113], 136: [2, 113], 137: [2, 113], 138: [2, 113] }, { 24: 228, 25: [1, 112], 103: 82, 104: [1, 63], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 142], 6: [2, 142], 25: [2, 142], 26: [2, 142], 49: [2, 142], 54: [2, 142], 57: [2, 142], 73: [2, 142], 78: [2, 142], 86: [2, 142], 91: [2, 142], 93: [2, 142], 102: [2, 142], 103: 82, 104: [1, 63], 105: [1, 229], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 118: [2, 142], 126: [2, 142], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 144], 6: [2, 144], 25: [2, 144], 26: [2, 144], 49: [2, 144], 54: [2, 144], 57: [2, 144], 73: [2, 144], 78: [2, 144], 86: [2, 144], 91: [2, 144], 93: [2, 144], 102: [2, 144], 103: 82, 104: [1, 63], 105: [1, 230], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 118: [2, 144], 126: [2, 144], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 150], 6: [2, 150], 25: [2, 150], 26: [2, 150], 49: [2, 150], 54: [2, 150], 57: [2, 150], 73: [2, 150], 78: [2, 150], 86: [2, 150], 91: [2, 150], 93: [2, 150], 102: [2, 150], 104: [2, 150], 105: [2, 150], 106: [2, 150], 110: [2, 150], 118: [2, 150], 126: [2, 150], 128: [2, 150], 129: [2, 150], 132: [2, 150], 133: [2, 150], 134: [2, 150], 135: [2, 150], 136: [2, 150], 137: [2, 150] }, { 1: [2, 151], 6: [2, 151], 25: [2, 151], 26: [2, 151], 49: [2, 151], 54: [2, 151], 57: [2, 151], 73: [2, 151], 78: [2, 151], 86: [2, 151], 91: [2, 151], 93: [2, 151], 102: [2, 151], 103: 82, 104: [1, 63], 105: [2, 151], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 118: [2, 151], 126: [2, 151], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 155], 6: [2, 155], 25: [2, 155], 26: [2, 155], 49: [2, 155], 54: [2, 155], 57: [2, 155], 73: [2, 155], 78: [2, 155], 86: [2, 155], 91: [2, 155], 93: [2, 155], 102: [2, 155], 104: [2, 155], 105: [2, 155], 106: [2, 155], 110: [2, 155], 118: [2, 155], 126: [2, 155], 128: [2, 155], 129: [2, 155], 132: [2, 155], 133: [2, 155], 134: [2, 155], 135: [2, 155], 136: [2, 155], 137: [2, 155] }, { 116: [2, 157], 117: [2, 157] }, { 27: 155, 28: [1, 71], 44: 156, 58: 157, 59: 158, 76: [1, 68], 89: [1, 109], 90: [1, 110], 113: 231, 115: 154 }, { 54: [1, 232], 116: [2, 163], 117: [2, 163] }, { 54: [2, 159], 116: [2, 159], 117: [2, 159] }, { 54: [2, 160], 116: [2, 160], 117: [2, 160] }, { 54: [2, 161], 116: [2, 161], 117: [2, 161] }, { 54: [2, 162], 116: [2, 162], 117: [2, 162] }, { 1: [2, 156], 6: [2, 156], 25: [2, 156], 26: [2, 156], 49: [2, 156], 54: [2, 156], 57: [2, 156], 73: [2, 156], 78: [2, 156], 86: [2, 156], 91: [2, 156], 93: [2, 156], 102: [2, 156], 104: [2, 156], 105: [2, 156], 106: [2, 156], 110: [2, 156], 118: [2, 156], 126: [2, 156], 128: [2, 156], 129: [2, 156], 132: [2, 156], 133: [2, 156], 134: [2, 156], 135: [2, 156], 136: [2, 156], 137: [2, 156] }, { 7: 233, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 234, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 6: [2, 52], 25: [2, 52], 53: 235, 54: [1, 236], 78: [2, 52] }, { 6: [2, 91], 25: [2, 91], 26: [2, 91], 54: [2, 91], 78: [2, 91] }, { 6: [2, 38], 25: [2, 38], 26: [2, 38], 43: [1, 237], 54: [2, 38], 78: [2, 38] }, { 6: [2, 41], 25: [2, 41], 26: [2, 41], 54: [2, 41], 78: [2, 41] }, { 6: [2, 42], 25: [2, 42], 26: [2, 42], 43: [2, 42], 54: [2, 42], 78: [2, 42] }, { 6: [2, 43], 25: [2, 43], 26: [2, 43], 43: [2, 43], 54: [2, 43], 78: [2, 43] }, { 6: [2, 44], 25: [2, 44], 26: [2, 44], 43: [2, 44], 54: [2, 44], 78: [2, 44] }, { 1: [2, 4], 6: [2, 4], 26: [2, 4], 102: [2, 4] }, { 1: [2, 194], 6: [2, 194], 25: [2, 194], 26: [2, 194], 49: [2, 194], 54: [2, 194], 57: [2, 194], 73: [2, 194], 78: [2, 194], 86: [2, 194], 91: [2, 194], 93: [2, 194], 102: [2, 194], 103: 82, 104: [2, 194], 105: [2, 194], 106: [2, 194], 109: 83, 110: [2, 194], 111: 67, 118: [2, 194], 126: [2, 194], 128: [2, 194], 129: [2, 194], 132: [1, 73], 133: [1, 76], 134: [2, 194], 135: [2, 194], 136: [2, 194], 137: [2, 194] }, { 1: [2, 195], 6: [2, 195], 25: [2, 195], 26: [2, 195], 49: [2, 195], 54: [2, 195], 57: [2, 195], 73: [2, 195], 78: [2, 195], 86: [2, 195], 91: [2, 195], 93: [2, 195], 102: [2, 195], 103: 82, 104: [2, 195], 105: [2, 195], 106: [2, 195], 109: 83, 110: [2, 195], 111: 67, 118: [2, 195], 126: [2, 195], 128: [2, 195], 129: [2, 195], 132: [1, 73], 133: [1, 76], 134: [2, 195], 135: [2, 195], 136: [2, 195], 137: [2, 195] }, { 1: [2, 196], 6: [2, 196], 25: [2, 196], 26: [2, 196], 49: [2, 196], 54: [2, 196], 57: [2, 196], 73: [2, 196], 78: [2, 196], 86: [2, 196], 91: [2, 196], 93: [2, 196], 102: [2, 196], 103: 82, 104: [2, 196], 105: [2, 196], 106: [2, 196], 109: 83, 110: [2, 196], 111: 67, 118: [2, 196], 126: [2, 196], 128: [2, 196], 129: [2, 196], 132: [1, 73], 133: [2, 196], 134: [2, 196], 135: [2, 196], 136: [2, 196], 137: [2, 196] }, { 1: [2, 197], 6: [2, 197], 25: [2, 197], 26: [2, 197], 49: [2, 197], 54: [2, 197], 57: [2, 197], 73: [2, 197], 78: [2, 197], 86: [2, 197], 91: [2, 197], 93: [2, 197], 102: [2, 197], 103: 82, 104: [2, 197], 105: [2, 197], 106: [2, 197], 109: 83, 110: [2, 197], 111: 67, 118: [2, 197], 126: [2, 197], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [2, 197], 135: [2, 197], 136: [2, 197], 137: [2, 197] }, { 1: [2, 198], 6: [2, 198], 25: [2, 198], 26: [2, 198], 49: [2, 198], 54: [2, 198], 57: [2, 198], 73: [2, 198], 78: [2, 198], 86: [2, 198], 91: [2, 198], 93: [2, 198], 102: [2, 198], 103: 82, 104: [2, 198], 105: [2, 198], 106: [2, 198], 109: 83, 110: [2, 198], 111: 67, 118: [2, 198], 126: [2, 198], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [2, 198], 136: [2, 198], 137: [1, 80] }, { 1: [2, 199], 6: [2, 199], 25: [2, 199], 26: [2, 199], 49: [2, 199], 54: [2, 199], 57: [2, 199], 73: [2, 199], 78: [2, 199], 86: [2, 199], 91: [2, 199], 93: [2, 199], 102: [2, 199], 103: 82, 104: [2, 199], 105: [2, 199], 106: [2, 199], 109: 83, 110: [2, 199], 111: 67, 118: [2, 199], 126: [2, 199], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [2, 199], 137: [1, 80] }, { 1: [2, 200], 6: [2, 200], 25: [2, 200], 26: [2, 200], 49: [2, 200], 54: [2, 200], 57: [2, 200], 73: [2, 200], 78: [2, 200], 86: [2, 200], 91: [2, 200], 93: [2, 200], 102: [2, 200], 103: 82, 104: [2, 200], 105: [2, 200], 106: [2, 200], 109: 83, 110: [2, 200], 111: 67, 118: [2, 200], 126: [2, 200], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [2, 200], 136: [2, 200], 137: [2, 200] }, { 1: [2, 185], 6: [2, 185], 25: [2, 185], 26: [2, 185], 49: [2, 185], 54: [2, 185], 57: [2, 185], 73: [2, 185], 78: [2, 185], 86: [2, 185], 91: [2, 185], 93: [2, 185], 102: [2, 185], 103: 82, 104: [1, 63], 105: [2, 185], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 118: [2, 185], 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 184], 6: [2, 184], 25: [2, 184], 26: [2, 184], 49: [2, 184], 54: [2, 184], 57: [2, 184], 73: [2, 184], 78: [2, 184], 86: [2, 184], 91: [2, 184], 93: [2, 184], 102: [2, 184], 103: 82, 104: [1, 63], 105: [2, 184], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 118: [2, 184], 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 103], 6: [2, 103], 25: [2, 103], 26: [2, 103], 49: [2, 103], 54: [2, 103], 57: [2, 103], 66: [2, 103], 67: [2, 103], 68: [2, 103], 69: [2, 103], 71: [2, 103], 73: [2, 103], 74: [2, 103], 78: [2, 103], 84: [2, 103], 85: [2, 103], 86: [2, 103], 91: [2, 103], 93: [2, 103], 102: [2, 103], 104: [2, 103], 105: [2, 103], 106: [2, 103], 110: [2, 103], 118: [2, 103], 126: [2, 103], 128: [2, 103], 129: [2, 103], 132: [2, 103], 133: [2, 103], 134: [2, 103], 135: [2, 103], 136: [2, 103], 137: [2, 103] }, { 1: [2, 79], 6: [2, 79], 25: [2, 79], 26: [2, 79], 40: [2, 79], 49: [2, 79], 54: [2, 79], 57: [2, 79], 66: [2, 79], 67: [2, 79], 68: [2, 79], 69: [2, 79], 71: [2, 79], 73: [2, 79], 74: [2, 79], 78: [2, 79], 80: [2, 79], 84: [2, 79], 85: [2, 79], 86: [2, 79], 91: [2, 79], 93: [2, 79], 102: [2, 79], 104: [2, 79], 105: [2, 79], 106: [2, 79], 110: [2, 79], 118: [2, 79], 126: [2, 79], 128: [2, 79], 129: [2, 79], 130: [2, 79], 131: [2, 79], 132: [2, 79], 133: [2, 79], 134: [2, 79], 135: [2, 79], 136: [2, 79], 137: [2, 79], 138: [2, 79] }, { 1: [2, 80], 6: [2, 80], 25: [2, 80], 26: [2, 80], 40: [2, 80], 49: [2, 80], 54: [2, 80], 57: [2, 80], 66: [2, 80], 67: [2, 80], 68: [2, 80], 69: [2, 80], 71: [2, 80], 73: [2, 80], 74: [2, 80], 78: [2, 80], 80: [2, 80], 84: [2, 80], 85: [2, 80], 86: [2, 80], 91: [2, 80], 93: [2, 80], 102: [2, 80], 104: [2, 80], 105: [2, 80], 106: [2, 80], 110: [2, 80], 118: [2, 80], 126: [2, 80], 128: [2, 80], 129: [2, 80], 130: [2, 80], 131: [2, 80], 132: [2, 80], 133: [2, 80], 134: [2, 80], 135: [2, 80], 136: [2, 80], 137: [2, 80], 138: [2, 80] }, { 1: [2, 81], 6: [2, 81], 25: [2, 81], 26: [2, 81], 40: [2, 81], 49: [2, 81], 54: [2, 81], 57: [2, 81], 66: [2, 81], 67: [2, 81], 68: [2, 81], 69: [2, 81], 71: [2, 81], 73: [2, 81], 74: [2, 81], 78: [2, 81], 80: [2, 81], 84: [2, 81], 85: [2, 81], 86: [2, 81], 91: [2, 81], 93: [2, 81], 102: [2, 81], 104: [2, 81], 105: [2, 81], 106: [2, 81], 110: [2, 81], 118: [2, 81], 126: [2, 81], 128: [2, 81], 129: [2, 81], 130: [2, 81], 131: [2, 81], 132: [2, 81], 133: [2, 81], 134: [2, 81], 135: [2, 81], 136: [2, 81], 137: [2, 81], 138: [2, 81] }, { 1: [2, 82], 6: [2, 82], 25: [2, 82], 26: [2, 82], 40: [2, 82], 49: [2, 82], 54: [2, 82], 57: [2, 82], 66: [2, 82], 67: [2, 82], 68: [2, 82], 69: [2, 82], 71: [2, 82], 73: [2, 82], 74: [2, 82], 78: [2, 82], 80: [2, 82], 84: [2, 82], 85: [2, 82], 86: [2, 82], 91: [2, 82], 93: [2, 82], 102: [2, 82], 104: [2, 82], 105: [2, 82], 106: [2, 82], 110: [2, 82], 118: [2, 82], 126: [2, 82], 128: [2, 82], 129: [2, 82], 130: [2, 82], 131: [2, 82], 132: [2, 82], 133: [2, 82], 134: [2, 82], 135: [2, 82], 136: [2, 82], 137: [2, 82], 138: [2, 82] }, { 73: [1, 238] }, { 57: [1, 189], 73: [2, 87], 92: 239, 93: [1, 188], 103: 82, 104: [1, 63], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 73: [2, 88] }, { 7: 240, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 73: [2, 122], 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 11: [2, 116], 28: [2, 116], 30: [2, 116], 31: [2, 116], 33: [2, 116], 34: [2, 116], 35: [2, 116], 36: [2, 116], 37: [2, 116], 38: [2, 116], 45: [2, 116], 46: [2, 116], 47: [2, 116], 51: [2, 116], 52: [2, 116], 73: [2, 116], 76: [2, 116], 79: [2, 116], 83: [2, 116], 88: [2, 116], 89: [2, 116], 90: [2, 116], 96: [2, 116], 100: [2, 116], 101: [2, 116], 104: [2, 116], 106: [2, 116], 108: [2, 116], 110: [2, 116], 119: [2, 116], 125: [2, 116], 127: [2, 116], 128: [2, 116], 129: [2, 116], 130: [2, 116], 131: [2, 116] }, { 11: [2, 117], 28: [2, 117], 30: [2, 117], 31: [2, 117], 33: [2, 117], 34: [2, 117], 35: [2, 117], 36: [2, 117], 37: [2, 117], 38: [2, 117], 45: [2, 117], 46: [2, 117], 47: [2, 117], 51: [2, 117], 52: [2, 117], 73: [2, 117], 76: [2, 117], 79: [2, 117], 83: [2, 117], 88: [2, 117], 89: [2, 117], 90: [2, 117], 96: [2, 117], 100: [2, 117], 101: [2, 117], 104: [2, 117], 106: [2, 117], 108: [2, 117], 110: [2, 117], 119: [2, 117], 125: [2, 117], 127: [2, 117], 128: [2, 117], 129: [2, 117], 130: [2, 117], 131: [2, 117] }, { 1: [2, 86], 6: [2, 86], 25: [2, 86], 26: [2, 86], 40: [2, 86], 49: [2, 86], 54: [2, 86], 57: [2, 86], 66: [2, 86], 67: [2, 86], 68: [2, 86], 69: [2, 86], 71: [2, 86], 73: [2, 86], 74: [2, 86], 78: [2, 86], 80: [2, 86], 84: [2, 86], 85: [2, 86], 86: [2, 86], 91: [2, 86], 93: [2, 86], 102: [2, 86], 104: [2, 86], 105: [2, 86], 106: [2, 86], 110: [2, 86], 118: [2, 86], 126: [2, 86], 128: [2, 86], 129: [2, 86], 130: [2, 86], 131: [2, 86], 132: [2, 86], 133: [2, 86], 134: [2, 86], 135: [2, 86], 136: [2, 86], 137: [2, 86], 138: [2, 86] }, { 1: [2, 104], 6: [2, 104], 25: [2, 104], 26: [2, 104], 49: [2, 104], 54: [2, 104], 57: [2, 104], 66: [2, 104], 67: [2, 104], 68: [2, 104], 69: [2, 104], 71: [2, 104], 73: [2, 104], 74: [2, 104], 78: [2, 104], 84: [2, 104], 85: [2, 104], 86: [2, 104], 91: [2, 104], 93: [2, 104], 102: [2, 104], 104: [2, 104], 105: [2, 104], 106: [2, 104], 110: [2, 104], 118: [2, 104], 126: [2, 104], 128: [2, 104], 129: [2, 104], 132: [2, 104], 133: [2, 104], 134: [2, 104], 135: [2, 104], 136: [2, 104], 137: [2, 104] }, { 1: [2, 35], 6: [2, 35], 25: [2, 35], 26: [2, 35], 49: [2, 35], 54: [2, 35], 57: [2, 35], 73: [2, 35], 78: [2, 35], 86: [2, 35], 91: [2, 35], 93: [2, 35], 102: [2, 35], 103: 82, 104: [2, 35], 105: [2, 35], 106: [2, 35], 109: 83, 110: [2, 35], 111: 67, 118: [2, 35], 126: [2, 35], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 7: 241, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 242, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 109], 6: [2, 109], 25: [2, 109], 26: [2, 109], 49: [2, 109], 54: [2, 109], 57: [2, 109], 66: [2, 109], 67: [2, 109], 68: [2, 109], 69: [2, 109], 71: [2, 109], 73: [2, 109], 74: [2, 109], 78: [2, 109], 84: [2, 109], 85: [2, 109], 86: [2, 109], 91: [2, 109], 93: [2, 109], 102: [2, 109], 104: [2, 109], 105: [2, 109], 106: [2, 109], 110: [2, 109], 118: [2, 109], 126: [2, 109], 128: [2, 109], 129: [2, 109], 132: [2, 109], 133: [2, 109], 134: [2, 109], 135: [2, 109], 136: [2, 109], 137: [2, 109] }, { 6: [2, 52], 25: [2, 52], 53: 243, 54: [1, 226], 86: [2, 52] }, { 6: [2, 128], 25: [2, 128], 26: [2, 128], 54: [2, 128], 57: [1, 244], 86: [2, 128], 91: [2, 128], 103: 82, 104: [1, 63], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 50: 245, 51: [1, 58], 52: [1, 59] }, { 6: [2, 53], 25: [2, 53], 26: [2, 53], 27: 105, 28: [1, 71], 44: 106, 55: 246, 56: 104, 58: 107, 59: 108, 76: [1, 68], 89: [1, 109], 90: [1, 110] }, { 6: [1, 247], 25: [1, 248] }, { 6: [2, 60], 25: [2, 60], 26: [2, 60], 49: [2, 60], 54: [2, 60] }, { 7: 249, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 23], 6: [2, 23], 25: [2, 23], 26: [2, 23], 49: [2, 23], 54: [2, 23], 57: [2, 23], 73: [2, 23], 78: [2, 23], 86: [2, 23], 91: [2, 23], 93: [2, 23], 98: [2, 23], 99: [2, 23], 102: [2, 23], 104: [2, 23], 105: [2, 23], 106: [2, 23], 110: [2, 23], 118: [2, 23], 121: [2, 23], 123: [2, 23], 126: [2, 23], 128: [2, 23], 129: [2, 23], 132: [2, 23], 133: [2, 23], 134: [2, 23], 135: [2, 23], 136: [2, 23], 137: [2, 23] }, { 6: [1, 72], 26: [1, 250] }, { 1: [2, 201], 6: [2, 201], 25: [2, 201], 26: [2, 201], 49: [2, 201], 54: [2, 201], 57: [2, 201], 73: [2, 201], 78: [2, 201], 86: [2, 201], 91: [2, 201], 93: [2, 201], 102: [2, 201], 103: 82, 104: [2, 201], 105: [2, 201], 106: [2, 201], 109: 83, 110: [2, 201], 111: 67, 118: [2, 201], 126: [2, 201], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 7: 251, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 252, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 204], 6: [2, 204], 25: [2, 204], 26: [2, 204], 49: [2, 204], 54: [2, 204], 57: [2, 204], 73: [2, 204], 78: [2, 204], 86: [2, 204], 91: [2, 204], 93: [2, 204], 102: [2, 204], 103: 82, 104: [2, 204], 105: [2, 204], 106: [2, 204], 109: 83, 110: [2, 204], 111: 67, 118: [2, 204], 126: [2, 204], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 183], 6: [2, 183], 25: [2, 183], 26: [2, 183], 49: [2, 183], 54: [2, 183], 57: [2, 183], 73: [2, 183], 78: [2, 183], 86: [2, 183], 91: [2, 183], 93: [2, 183], 102: [2, 183], 104: [2, 183], 105: [2, 183], 106: [2, 183], 110: [2, 183], 118: [2, 183], 126: [2, 183], 128: [2, 183], 129: [2, 183], 132: [2, 183], 133: [2, 183], 134: [2, 183], 135: [2, 183], 136: [2, 183], 137: [2, 183] }, { 7: 253, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 133], 6: [2, 133], 25: [2, 133], 26: [2, 133], 49: [2, 133], 54: [2, 133], 57: [2, 133], 73: [2, 133], 78: [2, 133], 86: [2, 133], 91: [2, 133], 93: [2, 133], 98: [1, 254], 102: [2, 133], 104: [2, 133], 105: [2, 133], 106: [2, 133], 110: [2, 133], 118: [2, 133], 126: [2, 133], 128: [2, 133], 129: [2, 133], 132: [2, 133], 133: [2, 133], 134: [2, 133], 135: [2, 133], 136: [2, 133], 137: [2, 133] }, { 24: 255, 25: [1, 112] }, { 24: 258, 25: [1, 112], 27: 256, 28: [1, 71], 59: 257, 76: [1, 68] }, { 120: 259, 122: 216, 123: [1, 217] }, { 26: [1, 260], 121: [1, 261], 122: 262, 123: [1, 217] }, { 26: [2, 176], 121: [2, 176], 123: [2, 176] }, { 7: 264, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 95: 263, 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 97], 6: [2, 97], 24: 265, 25: [1, 112], 26: [2, 97], 49: [2, 97], 54: [2, 97], 57: [2, 97], 73: [2, 97], 78: [2, 97], 86: [2, 97], 91: [2, 97], 93: [2, 97], 102: [2, 97], 103: 82, 104: [1, 63], 105: [2, 97], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 118: [2, 97], 126: [2, 97], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 100], 6: [2, 100], 25: [2, 100], 26: [2, 100], 49: [2, 100], 54: [2, 100], 57: [2, 100], 73: [2, 100], 78: [2, 100], 86: [2, 100], 91: [2, 100], 93: [2, 100], 102: [2, 100], 104: [2, 100], 105: [2, 100], 106: [2, 100], 110: [2, 100], 118: [2, 100], 126: [2, 100], 128: [2, 100], 129: [2, 100], 132: [2, 100], 133: [2, 100], 134: [2, 100], 135: [2, 100], 136: [2, 100], 137: [2, 100] }, { 7: 266, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 140], 6: [2, 140], 25: [2, 140], 26: [2, 140], 49: [2, 140], 54: [2, 140], 57: [2, 140], 66: [2, 140], 67: [2, 140], 68: [2, 140], 69: [2, 140], 71: [2, 140], 73: [2, 140], 74: [2, 140], 78: [2, 140], 84: [2, 140], 85: [2, 140], 86: [2, 140], 91: [2, 140], 93: [2, 140], 102: [2, 140], 104: [2, 140], 105: [2, 140], 106: [2, 140], 110: [2, 140], 118: [2, 140], 126: [2, 140], 128: [2, 140], 129: [2, 140], 132: [2, 140], 133: [2, 140], 134: [2, 140], 135: [2, 140], 136: [2, 140], 137: [2, 140] }, { 6: [1, 72], 26: [1, 267] }, { 7: 268, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 6: [2, 66], 11: [2, 117], 25: [2, 66], 28: [2, 117], 30: [2, 117], 31: [2, 117], 33: [2, 117], 34: [2, 117], 35: [2, 117], 36: [2, 117], 37: [2, 117], 38: [2, 117], 45: [2, 117], 46: [2, 117], 47: [2, 117], 51: [2, 117], 52: [2, 117], 54: [2, 66], 76: [2, 117], 79: [2, 117], 83: [2, 117], 88: [2, 117], 89: [2, 117], 90: [2, 117], 91: [2, 66], 96: [2, 117], 100: [2, 117], 101: [2, 117], 104: [2, 117], 106: [2, 117], 108: [2, 117], 110: [2, 117], 119: [2, 117], 125: [2, 117], 127: [2, 117], 128: [2, 117], 129: [2, 117], 130: [2, 117], 131: [2, 117] }, { 6: [1, 270], 25: [1, 271], 91: [1, 269] }, { 6: [2, 53], 7: 197, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 25: [2, 53], 26: [2, 53], 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 60: 144, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 86: [2, 53], 88: [1, 56], 89: [1, 57], 90: [1, 55], 91: [2, 53], 94: 272, 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 6: [2, 52], 25: [2, 52], 26: [2, 52], 53: 273, 54: [1, 226] }, { 1: [2, 180], 6: [2, 180], 25: [2, 180], 26: [2, 180], 49: [2, 180], 54: [2, 180], 57: [2, 180], 73: [2, 180], 78: [2, 180], 86: [2, 180], 91: [2, 180], 93: [2, 180], 102: [2, 180], 104: [2, 180], 105: [2, 180], 106: [2, 180], 110: [2, 180], 118: [2, 180], 121: [2, 180], 126: [2, 180], 128: [2, 180], 129: [2, 180], 132: [2, 180], 133: [2, 180], 134: [2, 180], 135: [2, 180], 136: [2, 180], 137: [2, 180] }, { 7: 274, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 275, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 116: [2, 158], 117: [2, 158] }, { 27: 155, 28: [1, 71], 44: 156, 58: 157, 59: 158, 76: [1, 68], 89: [1, 109], 90: [1, 110], 115: 276 }, { 1: [2, 165], 6: [2, 165], 25: [2, 165], 26: [2, 165], 49: [2, 165], 54: [2, 165], 57: [2, 165], 73: [2, 165], 78: [2, 165], 86: [2, 165], 91: [2, 165], 93: [2, 165], 102: [2, 165], 103: 82, 104: [2, 165], 105: [1, 277], 106: [2, 165], 109: 83, 110: [2, 165], 111: 67, 118: [1, 278], 126: [2, 165], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 166], 6: [2, 166], 25: [2, 166], 26: [2, 166], 49: [2, 166], 54: [2, 166], 57: [2, 166], 73: [2, 166], 78: [2, 166], 86: [2, 166], 91: [2, 166], 93: [2, 166], 102: [2, 166], 103: 82, 104: [2, 166], 105: [1, 279], 106: [2, 166], 109: 83, 110: [2, 166], 111: 67, 118: [2, 166], 126: [2, 166], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 6: [1, 281], 25: [1, 282], 78: [1, 280] }, { 6: [2, 53], 10: 165, 25: [2, 53], 26: [2, 53], 27: 166, 28: [1, 71], 29: 167, 30: [1, 69], 31: [1, 70], 41: 283, 42: 164, 44: 168, 46: [1, 44], 78: [2, 53], 89: [1, 109] }, { 7: 284, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 25: [1, 285], 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 85], 6: [2, 85], 25: [2, 85], 26: [2, 85], 40: [2, 85], 49: [2, 85], 54: [2, 85], 57: [2, 85], 66: [2, 85], 67: [2, 85], 68: [2, 85], 69: [2, 85], 71: [2, 85], 73: [2, 85], 74: [2, 85], 78: [2, 85], 80: [2, 85], 84: [2, 85], 85: [2, 85], 86: [2, 85], 91: [2, 85], 93: [2, 85], 102: [2, 85], 104: [2, 85], 105: [2, 85], 106: [2, 85], 110: [2, 85], 118: [2, 85], 126: [2, 85], 128: [2, 85], 129: [2, 85], 130: [2, 85], 131: [2, 85], 132: [2, 85], 133: [2, 85], 134: [2, 85], 135: [2, 85], 136: [2, 85], 137: [2, 85], 138: [2, 85] }, { 7: 286, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 73: [2, 120], 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 73: [2, 121], 103: 82, 104: [1, 63], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 36], 6: [2, 36], 25: [2, 36], 26: [2, 36], 49: [2, 36], 54: [2, 36], 57: [2, 36], 73: [2, 36], 78: [2, 36], 86: [2, 36], 91: [2, 36], 93: [2, 36], 102: [2, 36], 103: 82, 104: [2, 36], 105: [2, 36], 106: [2, 36], 109: 83, 110: [2, 36], 111: 67, 118: [2, 36], 126: [2, 36], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 26: [1, 287], 103: 82, 104: [1, 63], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 6: [1, 270], 25: [1, 271], 86: [1, 288] }, { 6: [2, 66], 25: [2, 66], 26: [2, 66], 54: [2, 66], 86: [2, 66], 91: [2, 66] }, { 24: 289, 25: [1, 112] }, { 6: [2, 56], 25: [2, 56], 26: [2, 56], 49: [2, 56], 54: [2, 56] }, { 27: 105, 28: [1, 71], 44: 106, 55: 290, 56: 104, 58: 107, 59: 108, 76: [1, 68], 89: [1, 109], 90: [1, 110] }, { 6: [2, 54], 25: [2, 54], 26: [2, 54], 27: 105, 28: [1, 71], 44: 106, 48: 291, 54: [2, 54], 55: 103, 56: 104, 58: 107, 59: 108, 76: [1, 68], 89: [1, 109], 90: [1, 110] }, { 6: [2, 61], 25: [2, 61], 26: [2, 61], 49: [2, 61], 54: [2, 61], 103: 82, 104: [1, 63], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 24], 6: [2, 24], 25: [2, 24], 26: [2, 24], 49: [2, 24], 54: [2, 24], 57: [2, 24], 73: [2, 24], 78: [2, 24], 86: [2, 24], 91: [2, 24], 93: [2, 24], 98: [2, 24], 99: [2, 24], 102: [2, 24], 104: [2, 24], 105: [2, 24], 106: [2, 24], 110: [2, 24], 118: [2, 24], 121: [2, 24], 123: [2, 24], 126: [2, 24], 128: [2, 24], 129: [2, 24], 132: [2, 24], 133: [2, 24], 134: [2, 24], 135: [2, 24], 136: [2, 24], 137: [2, 24] }, { 26: [1, 292], 103: 82, 104: [1, 63], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 203], 6: [2, 203], 25: [2, 203], 26: [2, 203], 49: [2, 203], 54: [2, 203], 57: [2, 203], 73: [2, 203], 78: [2, 203], 86: [2, 203], 91: [2, 203], 93: [2, 203], 102: [2, 203], 103: 82, 104: [2, 203], 105: [2, 203], 106: [2, 203], 109: 83, 110: [2, 203], 111: 67, 118: [2, 203], 126: [2, 203], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 24: 293, 25: [1, 112], 103: 82, 104: [1, 63], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 24: 294, 25: [1, 112] }, { 1: [2, 134], 6: [2, 134], 25: [2, 134], 26: [2, 134], 49: [2, 134], 54: [2, 134], 57: [2, 134], 73: [2, 134], 78: [2, 134], 86: [2, 134], 91: [2, 134], 93: [2, 134], 102: [2, 134], 104: [2, 134], 105: [2, 134], 106: [2, 134], 110: [2, 134], 118: [2, 134], 126: [2, 134], 128: [2, 134], 129: [2, 134], 132: [2, 134], 133: [2, 134], 134: [2, 134], 135: [2, 134], 136: [2, 134], 137: [2, 134] }, { 24: 295, 25: [1, 112] }, { 24: 296, 25: [1, 112] }, { 1: [2, 138], 6: [2, 138], 25: [2, 138], 26: [2, 138], 49: [2, 138], 54: [2, 138], 57: [2, 138], 73: [2, 138], 78: [2, 138], 86: [2, 138], 91: [2, 138], 93: [2, 138], 98: [2, 138], 102: [2, 138], 104: [2, 138], 105: [2, 138], 106: [2, 138], 110: [2, 138], 118: [2, 138], 126: [2, 138], 128: [2, 138], 129: [2, 138], 132: [2, 138], 133: [2, 138], 134: [2, 138], 135: [2, 138], 136: [2, 138], 137: [2, 138] }, { 26: [1, 297], 121: [1, 298], 122: 262, 123: [1, 217] }, { 1: [2, 174], 6: [2, 174], 25: [2, 174], 26: [2, 174], 49: [2, 174], 54: [2, 174], 57: [2, 174], 73: [2, 174], 78: [2, 174], 86: [2, 174], 91: [2, 174], 93: [2, 174], 102: [2, 174], 104: [2, 174], 105: [2, 174], 106: [2, 174], 110: [2, 174], 118: [2, 174], 126: [2, 174], 128: [2, 174], 129: [2, 174], 132: [2, 174], 133: [2, 174], 134: [2, 174], 135: [2, 174], 136: [2, 174], 137: [2, 174] }, { 24: 299, 25: [1, 112] }, { 26: [2, 177], 121: [2, 177], 123: [2, 177] }, { 24: 300, 25: [1, 112], 54: [1, 301] }, { 25: [2, 130], 54: [2, 130], 103: 82, 104: [1, 63], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 98], 6: [2, 98], 25: [2, 98], 26: [2, 98], 49: [2, 98], 54: [2, 98], 57: [2, 98], 73: [2, 98], 78: [2, 98], 86: [2, 98], 91: [2, 98], 93: [2, 98], 102: [2, 98], 104: [2, 98], 105: [2, 98], 106: [2, 98], 110: [2, 98], 118: [2, 98], 126: [2, 98], 128: [2, 98], 129: [2, 98], 132: [2, 98], 133: [2, 98], 134: [2, 98], 135: [2, 98], 136: [2, 98], 137: [2, 98] }, { 1: [2, 101], 6: [2, 101], 24: 302, 25: [1, 112], 26: [2, 101], 49: [2, 101], 54: [2, 101], 57: [2, 101], 73: [2, 101], 78: [2, 101], 86: [2, 101], 91: [2, 101], 93: [2, 101], 102: [2, 101], 103: 82, 104: [1, 63], 105: [2, 101], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 118: [2, 101], 126: [2, 101], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 102: [1, 303] }, { 91: [1, 304], 103: 82, 104: [1, 63], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 115], 6: [2, 115], 25: [2, 115], 26: [2, 115], 40: [2, 115], 49: [2, 115], 54: [2, 115], 57: [2, 115], 66: [2, 115], 67: [2, 115], 68: [2, 115], 69: [2, 115], 71: [2, 115], 73: [2, 115], 74: [2, 115], 78: [2, 115], 84: [2, 115], 85: [2, 115], 86: [2, 115], 91: [2, 115], 93: [2, 115], 102: [2, 115], 104: [2, 115], 105: [2, 115], 106: [2, 115], 110: [2, 115], 116: [2, 115], 117: [2, 115], 118: [2, 115], 126: [2, 115], 128: [2, 115], 129: [2, 115], 132: [2, 115], 133: [2, 115], 134: [2, 115], 135: [2, 115], 136: [2, 115], 137: [2, 115] }, { 7: 197, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 60: 144, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 94: 305, 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 197, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 25: [1, 143], 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 60: 144, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 87: 306, 88: [1, 56], 89: [1, 57], 90: [1, 55], 94: 142, 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 6: [2, 124], 25: [2, 124], 26: [2, 124], 54: [2, 124], 86: [2, 124], 91: [2, 124] }, { 6: [1, 270], 25: [1, 271], 26: [1, 307] }, { 1: [2, 143], 6: [2, 143], 25: [2, 143], 26: [2, 143], 49: [2, 143], 54: [2, 143], 57: [2, 143], 73: [2, 143], 78: [2, 143], 86: [2, 143], 91: [2, 143], 93: [2, 143], 102: [2, 143], 103: 82, 104: [1, 63], 105: [2, 143], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 118: [2, 143], 126: [2, 143], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 145], 6: [2, 145], 25: [2, 145], 26: [2, 145], 49: [2, 145], 54: [2, 145], 57: [2, 145], 73: [2, 145], 78: [2, 145], 86: [2, 145], 91: [2, 145], 93: [2, 145], 102: [2, 145], 103: 82, 104: [1, 63], 105: [2, 145], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 118: [2, 145], 126: [2, 145], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 116: [2, 164], 117: [2, 164] }, { 7: 308, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 309, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 310, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 89], 6: [2, 89], 25: [2, 89], 26: [2, 89], 40: [2, 89], 49: [2, 89], 54: [2, 89], 57: [2, 89], 66: [2, 89], 67: [2, 89], 68: [2, 89], 69: [2, 89], 71: [2, 89], 73: [2, 89], 74: [2, 89], 78: [2, 89], 84: [2, 89], 85: [2, 89], 86: [2, 89], 91: [2, 89], 93: [2, 89], 102: [2, 89], 104: [2, 89], 105: [2, 89], 106: [2, 89], 110: [2, 89], 116: [2, 89], 117: [2, 89], 118: [2, 89], 126: [2, 89], 128: [2, 89], 129: [2, 89], 132: [2, 89], 133: [2, 89], 134: [2, 89], 135: [2, 89], 136: [2, 89], 137: [2, 89] }, { 10: 165, 27: 166, 28: [1, 71], 29: 167, 30: [1, 69], 31: [1, 70], 41: 311, 42: 164, 44: 168, 46: [1, 44], 89: [1, 109] }, { 6: [2, 90], 10: 165, 25: [2, 90], 26: [2, 90], 27: 166, 28: [1, 71], 29: 167, 30: [1, 69], 31: [1, 70], 41: 163, 42: 164, 44: 168, 46: [1, 44], 54: [2, 90], 77: 312, 89: [1, 109] }, { 6: [2, 92], 25: [2, 92], 26: [2, 92], 54: [2, 92], 78: [2, 92] }, { 6: [2, 39], 25: [2, 39], 26: [2, 39], 54: [2, 39], 78: [2, 39], 103: 82, 104: [1, 63], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 7: 313, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 73: [2, 119], 103: 82, 104: [1, 63], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 37], 6: [2, 37], 25: [2, 37], 26: [2, 37], 49: [2, 37], 54: [2, 37], 57: [2, 37], 73: [2, 37], 78: [2, 37], 86: [2, 37], 91: [2, 37], 93: [2, 37], 102: [2, 37], 104: [2, 37], 105: [2, 37], 106: [2, 37], 110: [2, 37], 118: [2, 37], 126: [2, 37], 128: [2, 37], 129: [2, 37], 132: [2, 37], 133: [2, 37], 134: [2, 37], 135: [2, 37], 136: [2, 37], 137: [2, 37] }, { 1: [2, 110], 6: [2, 110], 25: [2, 110], 26: [2, 110], 49: [2, 110], 54: [2, 110], 57: [2, 110], 66: [2, 110], 67: [2, 110], 68: [2, 110], 69: [2, 110], 71: [2, 110], 73: [2, 110], 74: [2, 110], 78: [2, 110], 84: [2, 110], 85: [2, 110], 86: [2, 110], 91: [2, 110], 93: [2, 110], 102: [2, 110], 104: [2, 110], 105: [2, 110], 106: [2, 110], 110: [2, 110], 118: [2, 110], 126: [2, 110], 128: [2, 110], 129: [2, 110], 132: [2, 110], 133: [2, 110], 134: [2, 110], 135: [2, 110], 136: [2, 110], 137: [2, 110] }, { 1: [2, 48], 6: [2, 48], 25: [2, 48], 26: [2, 48], 49: [2, 48], 54: [2, 48], 57: [2, 48], 73: [2, 48], 78: [2, 48], 86: [2, 48], 91: [2, 48], 93: [2, 48], 102: [2, 48], 104: [2, 48], 105: [2, 48], 106: [2, 48], 110: [2, 48], 118: [2, 48], 126: [2, 48], 128: [2, 48], 129: [2, 48], 132: [2, 48], 133: [2, 48], 134: [2, 48], 135: [2, 48], 136: [2, 48], 137: [2, 48] }, { 6: [2, 57], 25: [2, 57], 26: [2, 57], 49: [2, 57], 54: [2, 57] }, { 6: [2, 52], 25: [2, 52], 26: [2, 52], 53: 314, 54: [1, 199] }, { 1: [2, 202], 6: [2, 202], 25: [2, 202], 26: [2, 202], 49: [2, 202], 54: [2, 202], 57: [2, 202], 73: [2, 202], 78: [2, 202], 86: [2, 202], 91: [2, 202], 93: [2, 202], 102: [2, 202], 104: [2, 202], 105: [2, 202], 106: [2, 202], 110: [2, 202], 118: [2, 202], 126: [2, 202], 128: [2, 202], 129: [2, 202], 132: [2, 202], 133: [2, 202], 134: [2, 202], 135: [2, 202], 136: [2, 202], 137: [2, 202] }, { 1: [2, 181], 6: [2, 181], 25: [2, 181], 26: [2, 181], 49: [2, 181], 54: [2, 181], 57: [2, 181], 73: [2, 181], 78: [2, 181], 86: [2, 181], 91: [2, 181], 93: [2, 181], 102: [2, 181], 104: [2, 181], 105: [2, 181], 106: [2, 181], 110: [2, 181], 118: [2, 181], 121: [2, 181], 126: [2, 181], 128: [2, 181], 129: [2, 181], 132: [2, 181], 133: [2, 181], 134: [2, 181], 135: [2, 181], 136: [2, 181], 137: [2, 181] }, { 1: [2, 135], 6: [2, 135], 25: [2, 135], 26: [2, 135], 49: [2, 135], 54: [2, 135], 57: [2, 135], 73: [2, 135], 78: [2, 135], 86: [2, 135], 91: [2, 135], 93: [2, 135], 102: [2, 135], 104: [2, 135], 105: [2, 135], 106: [2, 135], 110: [2, 135], 118: [2, 135], 126: [2, 135], 128: [2, 135], 129: [2, 135], 132: [2, 135], 133: [2, 135], 134: [2, 135], 135: [2, 135], 136: [2, 135], 137: [2, 135] }, { 1: [2, 136], 6: [2, 136], 25: [2, 136], 26: [2, 136], 49: [2, 136], 54: [2, 136], 57: [2, 136], 73: [2, 136], 78: [2, 136], 86: [2, 136], 91: [2, 136], 93: [2, 136], 98: [2, 136], 102: [2, 136], 104: [2, 136], 105: [2, 136], 106: [2, 136], 110: [2, 136], 118: [2, 136], 126: [2, 136], 128: [2, 136], 129: [2, 136], 132: [2, 136], 133: [2, 136], 134: [2, 136], 135: [2, 136], 136: [2, 136], 137: [2, 136] }, { 1: [2, 137], 6: [2, 137], 25: [2, 137], 26: [2, 137], 49: [2, 137], 54: [2, 137], 57: [2, 137], 73: [2, 137], 78: [2, 137], 86: [2, 137], 91: [2, 137], 93: [2, 137], 98: [2, 137], 102: [2, 137], 104: [2, 137], 105: [2, 137], 106: [2, 137], 110: [2, 137], 118: [2, 137], 126: [2, 137], 128: [2, 137], 129: [2, 137], 132: [2, 137], 133: [2, 137], 134: [2, 137], 135: [2, 137], 136: [2, 137], 137: [2, 137] }, { 1: [2, 172], 6: [2, 172], 25: [2, 172], 26: [2, 172], 49: [2, 172], 54: [2, 172], 57: [2, 172], 73: [2, 172], 78: [2, 172], 86: [2, 172], 91: [2, 172], 93: [2, 172], 102: [2, 172], 104: [2, 172], 105: [2, 172], 106: [2, 172], 110: [2, 172], 118: [2, 172], 126: [2, 172], 128: [2, 172], 129: [2, 172], 132: [2, 172], 133: [2, 172], 134: [2, 172], 135: [2, 172], 136: [2, 172], 137: [2, 172] }, { 24: 315, 25: [1, 112] }, { 26: [1, 316] }, { 6: [1, 317], 26: [2, 178], 121: [2, 178], 123: [2, 178] }, { 7: 318, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 1: [2, 102], 6: [2, 102], 25: [2, 102], 26: [2, 102], 49: [2, 102], 54: [2, 102], 57: [2, 102], 73: [2, 102], 78: [2, 102], 86: [2, 102], 91: [2, 102], 93: [2, 102], 102: [2, 102], 104: [2, 102], 105: [2, 102], 106: [2, 102], 110: [2, 102], 118: [2, 102], 126: [2, 102], 128: [2, 102], 129: [2, 102], 132: [2, 102], 133: [2, 102], 134: [2, 102], 135: [2, 102], 136: [2, 102], 137: [2, 102] }, { 1: [2, 141], 6: [2, 141], 25: [2, 141], 26: [2, 141], 49: [2, 141], 54: [2, 141], 57: [2, 141], 66: [2, 141], 67: [2, 141], 68: [2, 141], 69: [2, 141], 71: [2, 141], 73: [2, 141], 74: [2, 141], 78: [2, 141], 84: [2, 141], 85: [2, 141], 86: [2, 141], 91: [2, 141], 93: [2, 141], 102: [2, 141], 104: [2, 141], 105: [2, 141], 106: [2, 141], 110: [2, 141], 118: [2, 141], 126: [2, 141], 128: [2, 141], 129: [2, 141], 132: [2, 141], 133: [2, 141], 134: [2, 141], 135: [2, 141], 136: [2, 141], 137: [2, 141] }, { 1: [2, 118], 6: [2, 118], 25: [2, 118], 26: [2, 118], 49: [2, 118], 54: [2, 118], 57: [2, 118], 66: [2, 118], 67: [2, 118], 68: [2, 118], 69: [2, 118], 71: [2, 118], 73: [2, 118], 74: [2, 118], 78: [2, 118], 84: [2, 118], 85: [2, 118], 86: [2, 118], 91: [2, 118], 93: [2, 118], 102: [2, 118], 104: [2, 118], 105: [2, 118], 106: [2, 118], 110: [2, 118], 118: [2, 118], 126: [2, 118], 128: [2, 118], 129: [2, 118], 132: [2, 118], 133: [2, 118], 134: [2, 118], 135: [2, 118], 136: [2, 118], 137: [2, 118] }, { 6: [2, 125], 25: [2, 125], 26: [2, 125], 54: [2, 125], 86: [2, 125], 91: [2, 125] }, { 6: [2, 52], 25: [2, 52], 26: [2, 52], 53: 319, 54: [1, 226] }, { 6: [2, 126], 25: [2, 126], 26: [2, 126], 54: [2, 126], 86: [2, 126], 91: [2, 126] }, { 1: [2, 167], 6: [2, 167], 25: [2, 167], 26: [2, 167], 49: [2, 167], 54: [2, 167], 57: [2, 167], 73: [2, 167], 78: [2, 167], 86: [2, 167], 91: [2, 167], 93: [2, 167], 102: [2, 167], 103: 82, 104: [2, 167], 105: [2, 167], 106: [2, 167], 109: 83, 110: [2, 167], 111: 67, 118: [1, 320], 126: [2, 167], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 169], 6: [2, 169], 25: [2, 169], 26: [2, 169], 49: [2, 169], 54: [2, 169], 57: [2, 169], 73: [2, 169], 78: [2, 169], 86: [2, 169], 91: [2, 169], 93: [2, 169], 102: [2, 169], 103: 82, 104: [2, 169], 105: [1, 321], 106: [2, 169], 109: 83, 110: [2, 169], 111: 67, 118: [2, 169], 126: [2, 169], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 168], 6: [2, 168], 25: [2, 168], 26: [2, 168], 49: [2, 168], 54: [2, 168], 57: [2, 168], 73: [2, 168], 78: [2, 168], 86: [2, 168], 91: [2, 168], 93: [2, 168], 102: [2, 168], 103: 82, 104: [2, 168], 105: [2, 168], 106: [2, 168], 109: 83, 110: [2, 168], 111: 67, 118: [2, 168], 126: [2, 168], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 6: [2, 93], 25: [2, 93], 26: [2, 93], 54: [2, 93], 78: [2, 93] }, { 6: [2, 52], 25: [2, 52], 26: [2, 52], 53: 322, 54: [1, 236] }, { 26: [1, 323], 103: 82, 104: [1, 63], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 6: [1, 247], 25: [1, 248], 26: [1, 324] }, { 26: [1, 325] }, { 1: [2, 175], 6: [2, 175], 25: [2, 175], 26: [2, 175], 49: [2, 175], 54: [2, 175], 57: [2, 175], 73: [2, 175], 78: [2, 175], 86: [2, 175], 91: [2, 175], 93: [2, 175], 102: [2, 175], 104: [2, 175], 105: [2, 175], 106: [2, 175], 110: [2, 175], 118: [2, 175], 126: [2, 175], 128: [2, 175], 129: [2, 175], 132: [2, 175], 133: [2, 175], 134: [2, 175], 135: [2, 175], 136: [2, 175], 137: [2, 175] }, { 26: [2, 179], 121: [2, 179], 123: [2, 179] }, { 25: [2, 131], 54: [2, 131], 103: 82, 104: [1, 63], 106: [1, 64], 109: 83, 110: [1, 66], 111: 67, 126: [1, 81], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 6: [1, 270], 25: [1, 271], 26: [1, 326] }, { 7: 327, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 7: 328, 8: 114, 9: 18, 10: 19, 11: [1, 20], 12: 6, 13: 7, 14: 8, 15: 9, 16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 16, 23: 17, 27: 60, 28: [1, 71], 29: 47, 30: [1, 69], 31: [1, 70], 32: 22, 33: [1, 48], 34: [1, 49], 35: [1, 50], 36: [1, 51], 37: [1, 52], 38: [1, 53], 39: 21, 44: 61, 45: [1, 43], 46: [1, 44], 47: [1, 27], 50: 28, 51: [1, 58], 52: [1, 59], 58: 45, 59: 46, 61: 34, 63: 23, 64: 24, 65: 25, 76: [1, 68], 79: [1, 41], 83: [1, 26], 88: [1, 56], 89: [1, 57], 90: [1, 55], 96: [1, 36], 100: [1, 42], 101: [1, 54], 103: 37, 104: [1, 63], 106: [1, 64], 107: 38, 108: [1, 65], 109: 39, 110: [1, 66], 111: 67, 119: [1, 40], 124: 35, 125: [1, 62], 127: [1, 29], 128: [1, 30], 129: [1, 31], 130: [1, 32], 131: [1, 33] }, { 6: [1, 281], 25: [1, 282], 26: [1, 329] }, { 6: [2, 40], 25: [2, 40], 26: [2, 40], 54: [2, 40], 78: [2, 40] }, { 6: [2, 58], 25: [2, 58], 26: [2, 58], 49: [2, 58], 54: [2, 58] }, { 1: [2, 173], 6: [2, 173], 25: [2, 173], 26: [2, 173], 49: [2, 173], 54: [2, 173], 57: [2, 173], 73: [2, 173], 78: [2, 173], 86: [2, 173], 91: [2, 173], 93: [2, 173], 102: [2, 173], 104: [2, 173], 105: [2, 173], 106: [2, 173], 110: [2, 173], 118: [2, 173], 126: [2, 173], 128: [2, 173], 129: [2, 173], 132: [2, 173], 133: [2, 173], 134: [2, 173], 135: [2, 173], 136: [2, 173], 137: [2, 173] }, { 6: [2, 127], 25: [2, 127], 26: [2, 127], 54: [2, 127], 86: [2, 127], 91: [2, 127] }, { 1: [2, 170], 6: [2, 170], 25: [2, 170], 26: [2, 170], 49: [2, 170], 54: [2, 170], 57: [2, 170], 73: [2, 170], 78: [2, 170], 86: [2, 170], 91: [2, 170], 93: [2, 170], 102: [2, 170], 103: 82, 104: [2, 170], 105: [2, 170], 106: [2, 170], 109: 83, 110: [2, 170], 111: 67, 118: [2, 170], 126: [2, 170], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 1: [2, 171], 6: [2, 171], 25: [2, 171], 26: [2, 171], 49: [2, 171], 54: [2, 171], 57: [2, 171], 73: [2, 171], 78: [2, 171], 86: [2, 171], 91: [2, 171], 93: [2, 171], 102: [2, 171], 103: 82, 104: [2, 171], 105: [2, 171], 106: [2, 171], 109: 83, 110: [2, 171], 111: 67, 118: [2, 171], 126: [2, 171], 128: [1, 75], 129: [1, 74], 132: [1, 73], 133: [1, 76], 134: [1, 77], 135: [1, 78], 136: [1, 79], 137: [1, 80] }, { 6: [2, 94], 25: [2, 94], 26: [2, 94], 54: [2, 94], 78: [2, 94] }],
    defaultActions: { 58: [2, 50], 59: [2, 51], 89: [2, 108], 186: [2, 88] },
    parseError: function parseError(str, hash) {
      if (hash.recoverable) {
        this.trace(str);
      } else {
        var e = new Error(str);
        e.location = hash.loc;
        throw e;
      }
    },
    parse: function parse(input) {
      var self = this,
          stack = [0],
          vstack = [null],
          lstack = [],
          table = this.table,
          yytext = '',
          yylineno = 0,
          yyleng = 0,
          recovering = 0,
          TERROR = 2,
          EOF = 1;
      this.lexer.setInput(input);
      this.lexer.yy = this.yy;
      this.yy.lexer = this.lexer;
      this.yy.parser = this;
      if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
      }
      var yyloc = this.lexer.yylloc;
      lstack.push(yyloc);
      var ranges = this.lexer.options && this.lexer.options.ranges;
      if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
      } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
      }
      function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
      }
      function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
          token = self.symbols_[token] || token;
        }
        return token;
      }
      var symbol,
          preErrorSymbol,
          state,
          action,
          a,
          r,
          yyval = {},
          p,
          len,
          newState,
          expected;
      while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
          action = this.defaultActions[state];
        } else {
          if (symbol === null || typeof symbol == 'undefined') {
            symbol = lex();
          }
          action = table[state] && table[state][symbol];
        }
        if (typeof action === 'undefined' || !action.length || !action[0]) {
          var errStr = '';
          expected = [];
          for (p in table[state]) {
            if (this.terminals_[p] && p > TERROR) {
              expected.push('\'' + this.terminals_[p] + '\'');
            }
          }
          if (this.lexer.showPosition) {
            errStr = 'Expecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
          } else {
            errStr = 'Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
          }
          if (this.lexer.yylloc.first_line !== yyloc.first_line) yyloc = this.lexer.yylloc;
          this.parseError(errStr, {
            text: this.lexer.match,
            token: this.terminals_[symbol] || symbol,
            line: this.lexer.yylineno,
            loc: yyloc,
            expected: expected
          });
        }
        if (action[0] instanceof Array && action.length > 1) {
          throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
          case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
              yyleng = this.lexer.yyleng;
              yytext = this.lexer.yytext;
              yylineno = this.lexer.yylineno;
              yyloc = this.lexer.yylloc;
              if (recovering > 0) {
                recovering--;
              }
            } else {
              symbol = preErrorSymbol;
              preErrorSymbol = null;
            }
            break;
          case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
              first_line: lstack[lstack.length - (len || 1)].first_line,
              last_line: lstack[lstack.length - 1].last_line,
              first_column: lstack[lstack.length - (len || 1)].first_column,
              last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
              yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== 'undefined') {
              return r;
            }
            if (len) {
              stack = stack.slice(0, -1 * len * 2);
              vstack = vstack.slice(0, -1 * len);
              lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
          case 3:
            return true;
        }
      }
      return true;
    } };
  undefined;
  function Parser() {
    this.yy = {};
  }
  Parser.prototype = parser;parser.Parser = Parser;

  module.exports = new Parser();
});

ace.define("ace/mode/coffee/scope", ["require", "exports", "module", "ace/mode/coffee/helpers"], function (require, exports, module) {

  var Scope, extend, last, _ref;

  _ref = require('./helpers'), extend = _ref.extend, last = _ref.last;

  exports.Scope = Scope = function () {
    Scope.root = null;

    function Scope(parent, expressions, method) {
      this.parent = parent;
      this.expressions = expressions;
      this.method = method;
      this.variables = [{
        name: 'arguments',
        type: 'arguments'
      }];
      this.positions = {};
      if (!this.parent) {
        Scope.root = this;
      }
    }

    Scope.prototype.add = function (name, type, immediate) {
      if (this.shared && !immediate) {
        return this.parent.add(name, type, immediate);
      }
      if (Object.prototype.hasOwnProperty.call(this.positions, name)) {
        return this.variables[this.positions[name]].type = type;
      } else {
        return this.positions[name] = this.variables.push({
          name: name,
          type: type
        }) - 1;
      }
    };

    Scope.prototype.namedMethod = function () {
      var _ref1;
      if (((_ref1 = this.method) != null ? _ref1.name : void 0) || !this.parent) {
        return this.method;
      }
      return this.parent.namedMethod();
    };

    Scope.prototype.find = function (name) {
      if (this.check(name)) {
        return true;
      }
      this.add(name, 'var');
      return false;
    };

    Scope.prototype.parameter = function (name) {
      if (this.shared && this.parent.check(name, true)) {
        return;
      }
      return this.add(name, 'param');
    };

    Scope.prototype.check = function (name) {
      var _ref1;
      return !!(this.type(name) || ((_ref1 = this.parent) != null ? _ref1.check(name) : void 0));
    };

    Scope.prototype.temporary = function (name, index) {
      if (name.length > 1) {
        return '_' + name + (index > 1 ? index - 1 : '');
      } else {
        return '_' + (index + parseInt(name, 36)).toString(36).replace(/\d/g, 'a');
      }
    };

    Scope.prototype.type = function (name) {
      var v, _i, _len, _ref1;
      _ref1 = this.variables;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        v = _ref1[_i];
        if (v.name === name) {
          return v.type;
        }
      }
      return null;
    };

    Scope.prototype.freeVariable = function (name, reserve) {
      var index, temp;
      if (reserve == null) {
        reserve = true;
      }
      index = 0;
      while (this.check(temp = this.temporary(name, index))) {
        index++;
      }
      if (reserve) {
        this.add(temp, 'var', true);
      }
      return temp;
    };

    Scope.prototype.assign = function (name, value) {
      this.add(name, {
        value: value,
        assigned: true
      }, true);
      return this.hasAssignments = true;
    };

    Scope.prototype.hasDeclarations = function () {
      return !!this.declaredVariables().length;
    };

    Scope.prototype.declaredVariables = function () {
      var realVars, tempVars, v, _i, _len, _ref1;
      realVars = [];
      tempVars = [];
      _ref1 = this.variables;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        v = _ref1[_i];
        if (v.type === 'var') {
          (v.name.charAt(0) === '_' ? tempVars : realVars).push(v.name);
        }
      }
      return realVars.sort().concat(tempVars.sort());
    };

    Scope.prototype.assignedVariables = function () {
      var v, _i, _len, _ref1, _results;
      _ref1 = this.variables;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        v = _ref1[_i];
        if (v.type.assigned) {
          _results.push("" + v.name + " = " + v.type.value);
        }
      }
      return _results;
    };

    return Scope;
  }();
});

ace.define("ace/mode/coffee/nodes", ["require", "exports", "module", "ace/mode/coffee/scope", "ace/mode/coffee/lexer", "ace/mode/coffee/helpers"], function (require, exports, module) {

  var Access,
      Arr,
      Assign,
      Base,
      Block,
      Call,
      Class,
      Code,
      CodeFragment,
      Comment,
      Existence,
      Extends,
      For,
      HEXNUM,
      IDENTIFIER,
      IDENTIFIER_STR,
      IS_REGEX,
      IS_STRING,
      If,
      In,
      Index,
      LEVEL_ACCESS,
      LEVEL_COND,
      LEVEL_LIST,
      LEVEL_OP,
      LEVEL_PAREN,
      LEVEL_TOP,
      Literal,
      METHOD_DEF,
      NEGATE,
      NO,
      NUMBER,
      Obj,
      Op,
      Param,
      Parens,
      RESERVED,
      Range,
      Return,
      SIMPLENUM,
      STRICT_PROSCRIBED,
      Scope,
      Slice,
      Splat,
      Switch,
      TAB,
      THIS,
      Throw,
      Try,
      UTILITIES,
      Value,
      While,
      YES,
      addLocationDataFn,
      compact,
      del,
      ends,
      extend,
      flatten,
      fragmentsToText,
      isLiteralArguments,
      isLiteralThis,
      last,
      locationDataToString,
      merge,
      multident,
      parseNum,
      some,
      starts,
      throwSyntaxError,
      unfoldSoak,
      utility,
      _ref,
      _ref1,
      __hasProp = {}.hasOwnProperty,
      __extends = function __extends(child, parent) {
    for (var key in parent) {
      if (__hasProp.call(parent, key)) child[key] = parent[key];
    }function ctor() {
      this.constructor = child;
    }ctor.prototype = parent.prototype;child.prototype = new ctor();child.__super__ = parent.prototype;return child;
  },
      __indexOf = [].indexOf || function (item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (i in this && this[i] === item) return i;
    }return -1;
  },
      __slice = [].slice;

  Error.stackTraceLimit = Infinity;

  Scope = require('./scope').Scope;

  _ref = require('./lexer'), RESERVED = _ref.RESERVED, STRICT_PROSCRIBED = _ref.STRICT_PROSCRIBED;

  _ref1 = require('./helpers'), compact = _ref1.compact, flatten = _ref1.flatten, extend = _ref1.extend, merge = _ref1.merge, del = _ref1.del, starts = _ref1.starts, ends = _ref1.ends, last = _ref1.last, some = _ref1.some, addLocationDataFn = _ref1.addLocationDataFn, locationDataToString = _ref1.locationDataToString, throwSyntaxError = _ref1.throwSyntaxError;

  exports.extend = extend;

  exports.addLocationDataFn = addLocationDataFn;

  YES = function YES() {
    return true;
  };

  NO = function NO() {
    return false;
  };

  THIS = function THIS() {
    return this;
  };

  NEGATE = function NEGATE() {
    this.negated = !this.negated;
    return this;
  };

  exports.CodeFragment = CodeFragment = function () {
    function CodeFragment(parent, code) {
      var _ref2;
      this.code = "" + code;
      this.locationData = parent != null ? parent.locationData : void 0;
      this.type = (parent != null ? (_ref2 = parent.constructor) != null ? _ref2.name : void 0 : void 0) || 'unknown';
    }

    CodeFragment.prototype.toString = function () {
      return "" + this.code + (this.locationData ? ": " + locationDataToString(this.locationData) : '');
    };

    return CodeFragment;
  }();

  fragmentsToText = function fragmentsToText(fragments) {
    var fragment;
    return function () {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = fragments.length; _i < _len; _i++) {
        fragment = fragments[_i];
        _results.push(fragment.code);
      }
      return _results;
    }().join('');
  };

  exports.Base = Base = function () {
    function Base() {}

    Base.prototype.compile = function (o, lvl) {
      return fragmentsToText(this.compileToFragments(o, lvl));
    };

    Base.prototype.compileToFragments = function (o, lvl) {
      var node;
      o = extend({}, o);
      if (lvl) {
        o.level = lvl;
      }
      node = this.unfoldSoak(o) || this;
      node.tab = o.indent;
      if (o.level === LEVEL_TOP || !node.isStatement(o)) {
        return node.compileNode(o);
      } else {
        return node.compileClosure(o);
      }
    };

    Base.prototype.compileClosure = function (o) {
      var args, argumentsNode, func, jumpNode, meth;
      if (jumpNode = this.jumps()) {
        jumpNode.error('cannot use a pure statement in an expression');
      }
      o.sharedScope = true;
      func = new Code([], Block.wrap([this]));
      args = [];
      if ((argumentsNode = this.contains(isLiteralArguments)) || this.contains(isLiteralThis)) {
        args = [new Literal('this')];
        if (argumentsNode) {
          meth = 'apply';
          args.push(new Literal('arguments'));
        } else {
          meth = 'call';
        }
        func = new Value(func, [new Access(new Literal(meth))]);
      }
      return new Call(func, args).compileNode(o);
    };

    Base.prototype.cache = function (o, level, reused) {
      var ref, sub;
      if (!this.isComplex()) {
        ref = level ? this.compileToFragments(o, level) : this;
        return [ref, ref];
      } else {
        ref = new Literal(reused || o.scope.freeVariable('ref'));
        sub = new Assign(ref, this);
        if (level) {
          return [sub.compileToFragments(o, level), [this.makeCode(ref.value)]];
        } else {
          return [sub, ref];
        }
      }
    };

    Base.prototype.cacheToCodeFragments = function (cacheValues) {
      return [fragmentsToText(cacheValues[0]), fragmentsToText(cacheValues[1])];
    };

    Base.prototype.makeReturn = function (res) {
      var me;
      me = this.unwrapAll();
      if (res) {
        return new Call(new Literal("" + res + ".push"), [me]);
      } else {
        return new Return(me);
      }
    };

    Base.prototype.contains = function (pred) {
      var node;
      node = void 0;
      this.traverseChildren(false, function (n) {
        if (pred(n)) {
          node = n;
          return false;
        }
      });
      return node;
    };

    Base.prototype.lastNonComment = function (list) {
      var i;
      i = list.length;
      while (i--) {
        if (!(list[i] instanceof Comment)) {
          return list[i];
        }
      }
      return null;
    };

    Base.prototype.toString = function (idt, name) {
      var tree;
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      tree = '\n' + idt + name;
      if (this.soak) {
        tree += '?';
      }
      this.eachChild(function (node) {
        return tree += node.toString(idt + TAB);
      });
      return tree;
    };

    Base.prototype.eachChild = function (func) {
      var attr, child, _i, _j, _len, _len1, _ref2, _ref3;
      if (!this.children) {
        return this;
      }
      _ref2 = this.children;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        attr = _ref2[_i];
        if (this[attr]) {
          _ref3 = flatten([this[attr]]);
          for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
            child = _ref3[_j];
            if (func(child) === false) {
              return this;
            }
          }
        }
      }
      return this;
    };

    Base.prototype.traverseChildren = function (crossScope, func) {
      return this.eachChild(function (child) {
        var recur;
        recur = func(child);
        if (recur !== false) {
          return child.traverseChildren(crossScope, func);
        }
      });
    };

    Base.prototype.invert = function () {
      return new Op('!', this);
    };

    Base.prototype.unwrapAll = function () {
      var node;
      node = this;
      while (node !== (node = node.unwrap())) {
        continue;
      }
      return node;
    };

    Base.prototype.children = [];

    Base.prototype.isStatement = NO;

    Base.prototype.jumps = NO;

    Base.prototype.isComplex = YES;

    Base.prototype.isChainable = NO;

    Base.prototype.isAssignable = NO;

    Base.prototype.unwrap = THIS;

    Base.prototype.unfoldSoak = NO;

    Base.prototype.assigns = NO;

    Base.prototype.updateLocationDataIfMissing = function (locationData) {
      if (this.locationData) {
        return this;
      }
      this.locationData = locationData;
      return this.eachChild(function (child) {
        return child.updateLocationDataIfMissing(locationData);
      });
    };

    Base.prototype.error = function (message) {
      return throwSyntaxError(message, this.locationData);
    };

    Base.prototype.makeCode = function (code) {
      return new CodeFragment(this, code);
    };

    Base.prototype.wrapInBraces = function (fragments) {
      return [].concat(this.makeCode('('), fragments, this.makeCode(')'));
    };

    Base.prototype.joinFragmentArrays = function (fragmentsList, joinStr) {
      var answer, fragments, i, _i, _len;
      answer = [];
      for (i = _i = 0, _len = fragmentsList.length; _i < _len; i = ++_i) {
        fragments = fragmentsList[i];
        if (i) {
          answer.push(this.makeCode(joinStr));
        }
        answer = answer.concat(fragments);
      }
      return answer;
    };

    return Base;
  }();

  exports.Block = Block = function (_super) {
    __extends(Block, _super);

    function Block(nodes) {
      this.expressions = compact(flatten(nodes || []));
    }

    Block.prototype.children = ['expressions'];

    Block.prototype.push = function (node) {
      this.expressions.push(node);
      return this;
    };

    Block.prototype.pop = function () {
      return this.expressions.pop();
    };

    Block.prototype.unshift = function (node) {
      this.expressions.unshift(node);
      return this;
    };

    Block.prototype.unwrap = function () {
      if (this.expressions.length === 1) {
        return this.expressions[0];
      } else {
        return this;
      }
    };

    Block.prototype.isEmpty = function () {
      return !this.expressions.length;
    };

    Block.prototype.isStatement = function (o) {
      var exp, _i, _len, _ref2;
      _ref2 = this.expressions;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        exp = _ref2[_i];
        if (exp.isStatement(o)) {
          return true;
        }
      }
      return false;
    };

    Block.prototype.jumps = function (o) {
      var exp, jumpNode, _i, _len, _ref2;
      _ref2 = this.expressions;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        exp = _ref2[_i];
        if (jumpNode = exp.jumps(o)) {
          return jumpNode;
        }
      }
    };

    Block.prototype.makeReturn = function (res) {
      var expr, len;
      len = this.expressions.length;
      while (len--) {
        expr = this.expressions[len];
        if (!(expr instanceof Comment)) {
          this.expressions[len] = expr.makeReturn(res);
          if (expr instanceof Return && !expr.expression) {
            this.expressions.splice(len, 1);
          }
          break;
        }
      }
      return this;
    };

    Block.prototype.compileToFragments = function (o, level) {
      if (o == null) {
        o = {};
      }
      if (o.scope) {
        return Block.__super__.compileToFragments.call(this, o, level);
      } else {
        return this.compileRoot(o);
      }
    };

    Block.prototype.compileNode = function (o) {
      var answer, compiledNodes, fragments, index, node, top, _i, _len, _ref2;
      this.tab = o.indent;
      top = o.level === LEVEL_TOP;
      compiledNodes = [];
      _ref2 = this.expressions;
      for (index = _i = 0, _len = _ref2.length; _i < _len; index = ++_i) {
        node = _ref2[index];
        node = node.unwrapAll();
        node = node.unfoldSoak(o) || node;
        if (node instanceof Block) {
          compiledNodes.push(node.compileNode(o));
        } else if (top) {
          node.front = true;
          fragments = node.compileToFragments(o);
          if (!node.isStatement(o)) {
            fragments.unshift(this.makeCode("" + this.tab));
            fragments.push(this.makeCode(";"));
          }
          compiledNodes.push(fragments);
        } else {
          compiledNodes.push(node.compileToFragments(o, LEVEL_LIST));
        }
      }
      if (top) {
        if (this.spaced) {
          return [].concat(this.joinFragmentArrays(compiledNodes, '\n\n'), this.makeCode("\n"));
        } else {
          return this.joinFragmentArrays(compiledNodes, '\n');
        }
      }
      if (compiledNodes.length) {
        answer = this.joinFragmentArrays(compiledNodes, ', ');
      } else {
        answer = [this.makeCode("void 0")];
      }
      if (compiledNodes.length > 1 && o.level >= LEVEL_LIST) {
        return this.wrapInBraces(answer);
      } else {
        return answer;
      }
    };

    Block.prototype.compileRoot = function (o) {
      var exp, fragments, i, name, prelude, preludeExps, rest, _i, _len, _ref2;
      o.indent = o.bare ? '' : TAB;
      o.level = LEVEL_TOP;
      this.spaced = true;
      o.scope = new Scope(null, this, null);
      _ref2 = o.locals || [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        name = _ref2[_i];
        o.scope.parameter(name);
      }
      prelude = [];
      if (!o.bare) {
        preludeExps = function () {
          var _j, _len1, _ref3, _results;
          _ref3 = this.expressions;
          _results = [];
          for (i = _j = 0, _len1 = _ref3.length; _j < _len1; i = ++_j) {
            exp = _ref3[i];
            if (!(exp.unwrap() instanceof Comment)) {
              break;
            }
            _results.push(exp);
          }
          return _results;
        }.call(this);
        rest = this.expressions.slice(preludeExps.length);
        this.expressions = preludeExps;
        if (preludeExps.length) {
          prelude = this.compileNode(merge(o, {
            indent: ''
          }));
          prelude.push(this.makeCode("\n"));
        }
        this.expressions = rest;
      }
      fragments = this.compileWithDeclarations(o);
      if (o.bare) {
        return fragments;
      }
      return [].concat(prelude, this.makeCode("(function() {\n"), fragments, this.makeCode("\n}).call(this);\n"));
    };

    Block.prototype.compileWithDeclarations = function (o) {
      var assigns, declars, exp, fragments, i, post, rest, scope, spaced, _i, _len, _ref2, _ref3, _ref4;
      fragments = [];
      post = [];
      _ref2 = this.expressions;
      for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
        exp = _ref2[i];
        exp = exp.unwrap();
        if (!(exp instanceof Comment || exp instanceof Literal)) {
          break;
        }
      }
      o = merge(o, {
        level: LEVEL_TOP
      });
      if (i) {
        rest = this.expressions.splice(i, 9e9);
        _ref3 = [this.spaced, false], spaced = _ref3[0], this.spaced = _ref3[1];
        _ref4 = [this.compileNode(o), spaced], fragments = _ref4[0], this.spaced = _ref4[1];
        this.expressions = rest;
      }
      post = this.compileNode(o);
      scope = o.scope;
      if (scope.expressions === this) {
        declars = o.scope.hasDeclarations();
        assigns = scope.hasAssignments;
        if (declars || assigns) {
          if (i) {
            fragments.push(this.makeCode('\n'));
          }
          fragments.push(this.makeCode("" + this.tab + "var "));
          if (declars) {
            fragments.push(this.makeCode(scope.declaredVariables().join(', ')));
          }
          if (assigns) {
            if (declars) {
              fragments.push(this.makeCode(",\n" + (this.tab + TAB)));
            }
            fragments.push(this.makeCode(scope.assignedVariables().join(",\n" + (this.tab + TAB))));
          }
          fragments.push(this.makeCode(";\n" + (this.spaced ? '\n' : '')));
        } else if (fragments.length && post.length) {
          fragments.push(this.makeCode("\n"));
        }
      }
      return fragments.concat(post);
    };

    Block.wrap = function (nodes) {
      if (nodes.length === 1 && nodes[0] instanceof Block) {
        return nodes[0];
      }
      return new Block(nodes);
    };

    return Block;
  }(Base);

  exports.Literal = Literal = function (_super) {
    __extends(Literal, _super);

    function Literal(value) {
      this.value = value;
    }

    Literal.prototype.makeReturn = function () {
      if (this.isStatement()) {
        return this;
      } else {
        return Literal.__super__.makeReturn.apply(this, arguments);
      }
    };

    Literal.prototype.isAssignable = function () {
      return IDENTIFIER.test(this.value);
    };

    Literal.prototype.isStatement = function () {
      var _ref2;
      return (_ref2 = this.value) === 'break' || _ref2 === 'continue' || _ref2 === 'debugger';
    };

    Literal.prototype.isComplex = NO;

    Literal.prototype.assigns = function (name) {
      return name === this.value;
    };

    Literal.prototype.jumps = function (o) {
      if (this.value === 'break' && !((o != null ? o.loop : void 0) || (o != null ? o.block : void 0))) {
        return this;
      }
      if (this.value === 'continue' && !(o != null ? o.loop : void 0)) {
        return this;
      }
    };

    Literal.prototype.compileNode = function (o) {
      var answer, code, _ref2;
      code = this.value === 'this' ? ((_ref2 = o.scope.method) != null ? _ref2.bound : void 0) ? o.scope.method.context : this.value : this.value.reserved ? "\"" + this.value + "\"" : this.value;
      answer = this.isStatement() ? "" + this.tab + code + ";" : code;
      return [this.makeCode(answer)];
    };

    Literal.prototype.toString = function () {
      return ' "' + this.value + '"';
    };

    return Literal;
  }(Base);

  exports.Undefined = function (_super) {
    __extends(Undefined, _super);

    function Undefined() {
      return Undefined.__super__.constructor.apply(this, arguments);
    }

    Undefined.prototype.isAssignable = NO;

    Undefined.prototype.isComplex = NO;

    Undefined.prototype.compileNode = function (o) {
      return [this.makeCode(o.level >= LEVEL_ACCESS ? '(void 0)' : 'void 0')];
    };

    return Undefined;
  }(Base);

  exports.Null = function (_super) {
    __extends(Null, _super);

    function Null() {
      return Null.__super__.constructor.apply(this, arguments);
    }

    Null.prototype.isAssignable = NO;

    Null.prototype.isComplex = NO;

    Null.prototype.compileNode = function () {
      return [this.makeCode("null")];
    };

    return Null;
  }(Base);

  exports.Bool = function (_super) {
    __extends(Bool, _super);

    Bool.prototype.isAssignable = NO;

    Bool.prototype.isComplex = NO;

    Bool.prototype.compileNode = function () {
      return [this.makeCode(this.val)];
    };

    function Bool(val) {
      this.val = val;
    }

    return Bool;
  }(Base);

  exports.Return = Return = function (_super) {
    __extends(Return, _super);

    function Return(expr) {
      if (expr && !expr.unwrap().isUndefined) {
        this.expression = expr;
      }
    }

    Return.prototype.children = ['expression'];

    Return.prototype.isStatement = YES;

    Return.prototype.makeReturn = THIS;

    Return.prototype.jumps = THIS;

    Return.prototype.compileToFragments = function (o, level) {
      var expr, _ref2;
      expr = (_ref2 = this.expression) != null ? _ref2.makeReturn() : void 0;
      if (expr && !(expr instanceof Return)) {
        return expr.compileToFragments(o, level);
      } else {
        return Return.__super__.compileToFragments.call(this, o, level);
      }
    };

    Return.prototype.compileNode = function (o) {
      var answer;
      answer = [];
      answer.push(this.makeCode(this.tab + ("return" + (this.expression ? " " : ""))));
      if (this.expression) {
        answer = answer.concat(this.expression.compileToFragments(o, LEVEL_PAREN));
      }
      answer.push(this.makeCode(";"));
      return answer;
    };

    return Return;
  }(Base);

  exports.Value = Value = function (_super) {
    __extends(Value, _super);

    function Value(base, props, tag) {
      if (!props && base instanceof Value) {
        return base;
      }
      this.base = base;
      this.properties = props || [];
      if (tag) {
        this[tag] = true;
      }
      return this;
    }

    Value.prototype.children = ['base', 'properties'];

    Value.prototype.add = function (props) {
      this.properties = this.properties.concat(props);
      return this;
    };

    Value.prototype.hasProperties = function () {
      return !!this.properties.length;
    };

    Value.prototype.bareLiteral = function (type) {
      return !this.properties.length && this.base instanceof type;
    };

    Value.prototype.isArray = function () {
      return this.bareLiteral(Arr);
    };

    Value.prototype.isRange = function () {
      return this.bareLiteral(Range);
    };

    Value.prototype.isComplex = function () {
      return this.hasProperties() || this.base.isComplex();
    };

    Value.prototype.isAssignable = function () {
      return this.hasProperties() || this.base.isAssignable();
    };

    Value.prototype.isSimpleNumber = function () {
      return this.bareLiteral(Literal) && SIMPLENUM.test(this.base.value);
    };

    Value.prototype.isString = function () {
      return this.bareLiteral(Literal) && IS_STRING.test(this.base.value);
    };

    Value.prototype.isRegex = function () {
      return this.bareLiteral(Literal) && IS_REGEX.test(this.base.value);
    };

    Value.prototype.isAtomic = function () {
      var node, _i, _len, _ref2;
      _ref2 = this.properties.concat(this.base);
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        node = _ref2[_i];
        if (node.soak || node instanceof Call) {
          return false;
        }
      }
      return true;
    };

    Value.prototype.isNotCallable = function () {
      return this.isSimpleNumber() || this.isString() || this.isRegex() || this.isArray() || this.isRange() || this.isSplice() || this.isObject();
    };

    Value.prototype.isStatement = function (o) {
      return !this.properties.length && this.base.isStatement(o);
    };

    Value.prototype.assigns = function (name) {
      return !this.properties.length && this.base.assigns(name);
    };

    Value.prototype.jumps = function (o) {
      return !this.properties.length && this.base.jumps(o);
    };

    Value.prototype.isObject = function (onlyGenerated) {
      if (this.properties.length) {
        return false;
      }
      return this.base instanceof Obj && (!onlyGenerated || this.base.generated);
    };

    Value.prototype.isSplice = function () {
      return last(this.properties) instanceof Slice;
    };

    Value.prototype.looksStatic = function (className) {
      var _ref2;
      return this.base.value === className && this.properties.length && ((_ref2 = this.properties[0].name) != null ? _ref2.value : void 0) !== 'prototype';
    };

    Value.prototype.unwrap = function () {
      if (this.properties.length) {
        return this;
      } else {
        return this.base;
      }
    };

    Value.prototype.cacheReference = function (o) {
      var base, bref, name, nref;
      name = last(this.properties);
      if (this.properties.length < 2 && !this.base.isComplex() && !(name != null ? name.isComplex() : void 0)) {
        return [this, this];
      }
      base = new Value(this.base, this.properties.slice(0, -1));
      if (base.isComplex()) {
        bref = new Literal(o.scope.freeVariable('base'));
        base = new Value(new Parens(new Assign(bref, base)));
      }
      if (!name) {
        return [base, bref];
      }
      if (name.isComplex()) {
        nref = new Literal(o.scope.freeVariable('name'));
        name = new Index(new Assign(nref, name.index));
        nref = new Index(nref);
      }
      return [base.add(name), new Value(bref || base.base, [nref || name])];
    };

    Value.prototype.compileNode = function (o) {
      var fragments, prop, props, _i, _len;
      this.base.front = this.front;
      props = this.properties;
      fragments = this.base.compileToFragments(o, props.length ? LEVEL_ACCESS : null);
      if ((this.base instanceof Parens || props.length) && SIMPLENUM.test(fragmentsToText(fragments))) {
        fragments.push(this.makeCode('.'));
      }
      for (_i = 0, _len = props.length; _i < _len; _i++) {
        prop = props[_i];
        fragments.push.apply(fragments, prop.compileToFragments(o));
      }
      return fragments;
    };

    Value.prototype.unfoldSoak = function (o) {
      return this.unfoldedSoak != null ? this.unfoldedSoak : this.unfoldedSoak = function (_this) {
        return function () {
          var fst, i, ifn, prop, ref, snd, _i, _len, _ref2, _ref3;
          if (ifn = _this.base.unfoldSoak(o)) {
            (_ref2 = ifn.body.properties).push.apply(_ref2, _this.properties);
            return ifn;
          }
          _ref3 = _this.properties;
          for (i = _i = 0, _len = _ref3.length; _i < _len; i = ++_i) {
            prop = _ref3[i];
            if (!prop.soak) {
              continue;
            }
            prop.soak = false;
            fst = new Value(_this.base, _this.properties.slice(0, i));
            snd = new Value(_this.base, _this.properties.slice(i));
            if (fst.isComplex()) {
              ref = new Literal(o.scope.freeVariable('ref'));
              fst = new Parens(new Assign(ref, fst));
              snd.base = ref;
            }
            return new If(new Existence(fst), snd, {
              soak: true
            });
          }
          return false;
        };
      }(this)();
    };

    return Value;
  }(Base);

  exports.Comment = Comment = function (_super) {
    __extends(Comment, _super);

    function Comment(comment) {
      this.comment = comment;
    }

    Comment.prototype.isStatement = YES;

    Comment.prototype.makeReturn = THIS;

    Comment.prototype.compileNode = function (o, level) {
      var code, comment;
      comment = this.comment.replace(/^(\s*)#/gm, "$1 *");
      code = "/*" + multident(comment, this.tab) + (__indexOf.call(comment, '\n') >= 0 ? "\n" + this.tab : '') + " */";
      if ((level || o.level) === LEVEL_TOP) {
        code = o.indent + code;
      }
      return [this.makeCode("\n"), this.makeCode(code)];
    };

    return Comment;
  }(Base);

  exports.Call = Call = function (_super) {
    __extends(Call, _super);

    function Call(variable, args, soak) {
      this.args = args != null ? args : [];
      this.soak = soak;
      this.isNew = false;
      this.isSuper = variable === 'super';
      this.variable = this.isSuper ? null : variable;
      if (variable instanceof Value && variable.isNotCallable()) {
        variable.error("literal is not a function");
      }
    }

    Call.prototype.children = ['variable', 'args'];

    Call.prototype.newInstance = function () {
      var base, _ref2;
      base = ((_ref2 = this.variable) != null ? _ref2.base : void 0) || this.variable;
      if (base instanceof Call && !base.isNew) {
        base.newInstance();
      } else {
        this.isNew = true;
      }
      return this;
    };

    Call.prototype.superReference = function (o) {
      var accesses, method;
      method = o.scope.namedMethod();
      if (method != null ? method.klass : void 0) {
        accesses = [new Access(new Literal('__super__'))];
        if (method["static"]) {
          accesses.push(new Access(new Literal('constructor')));
        }
        accesses.push(new Access(new Literal(method.name)));
        return new Value(new Literal(method.klass), accesses).compile(o);
      } else if (method != null ? method.ctor : void 0) {
        return "" + method.name + ".__super__.constructor";
      } else {
        return this.error('cannot call super outside of an instance method.');
      }
    };

    Call.prototype.superThis = function (o) {
      var method;
      method = o.scope.method;
      return method && !method.klass && method.context || "this";
    };

    Call.prototype.unfoldSoak = function (o) {
      var call, ifn, left, list, rite, _i, _len, _ref2, _ref3;
      if (this.soak) {
        if (this.variable) {
          if (ifn = unfoldSoak(o, this, 'variable')) {
            return ifn;
          }
          _ref2 = new Value(this.variable).cacheReference(o), left = _ref2[0], rite = _ref2[1];
        } else {
          left = new Literal(this.superReference(o));
          rite = new Value(left);
        }
        rite = new Call(rite, this.args);
        rite.isNew = this.isNew;
        left = new Literal("typeof " + left.compile(o) + " === \"function\"");
        return new If(left, new Value(rite), {
          soak: true
        });
      }
      call = this;
      list = [];
      while (true) {
        if (call.variable instanceof Call) {
          list.push(call);
          call = call.variable;
          continue;
        }
        if (!(call.variable instanceof Value)) {
          break;
        }
        list.push(call);
        if (!((call = call.variable.base) instanceof Call)) {
          break;
        }
      }
      _ref3 = list.reverse();
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        call = _ref3[_i];
        if (ifn) {
          if (call.variable instanceof Call) {
            call.variable = ifn;
          } else {
            call.variable.base = ifn;
          }
        }
        ifn = unfoldSoak(o, call, 'variable');
      }
      return ifn;
    };

    Call.prototype.compileNode = function (o) {
      var arg, argIndex, compiledArgs, compiledArray, fragments, preface, _i, _len, _ref2, _ref3;
      if ((_ref2 = this.variable) != null) {
        _ref2.front = this.front;
      }
      compiledArray = Splat.compileSplattedArray(o, this.args, true);
      if (compiledArray.length) {
        return this.compileSplat(o, compiledArray);
      }
      compiledArgs = [];
      _ref3 = this.args;
      for (argIndex = _i = 0, _len = _ref3.length; _i < _len; argIndex = ++_i) {
        arg = _ref3[argIndex];
        if (argIndex) {
          compiledArgs.push(this.makeCode(", "));
        }
        compiledArgs.push.apply(compiledArgs, arg.compileToFragments(o, LEVEL_LIST));
      }
      fragments = [];
      if (this.isSuper) {
        preface = this.superReference(o) + (".call(" + this.superThis(o));
        if (compiledArgs.length) {
          preface += ", ";
        }
        fragments.push(this.makeCode(preface));
      } else {
        if (this.isNew) {
          fragments.push(this.makeCode('new '));
        }
        fragments.push.apply(fragments, this.variable.compileToFragments(o, LEVEL_ACCESS));
        fragments.push(this.makeCode("("));
      }
      fragments.push.apply(fragments, compiledArgs);
      fragments.push(this.makeCode(")"));
      return fragments;
    };

    Call.prototype.compileSplat = function (o, splatArgs) {
      var answer, base, fun, idt, name, ref;
      if (this.isSuper) {
        return [].concat(this.makeCode("" + this.superReference(o) + ".apply(" + this.superThis(o) + ", "), splatArgs, this.makeCode(")"));
      }
      if (this.isNew) {
        idt = this.tab + TAB;
        return [].concat(this.makeCode("(function(func, args, ctor) {\n" + idt + "ctor.prototype = func.prototype;\n" + idt + "var child = new ctor, result = func.apply(child, args);\n" + idt + "return Object(result) === result ? result : child;\n" + this.tab + "})("), this.variable.compileToFragments(o, LEVEL_LIST), this.makeCode(", "), splatArgs, this.makeCode(", function(){})"));
      }
      answer = [];
      base = new Value(this.variable);
      if ((name = base.properties.pop()) && base.isComplex()) {
        ref = o.scope.freeVariable('ref');
        answer = answer.concat(this.makeCode("(" + ref + " = "), base.compileToFragments(o, LEVEL_LIST), this.makeCode(")"), name.compileToFragments(o));
      } else {
        fun = base.compileToFragments(o, LEVEL_ACCESS);
        if (SIMPLENUM.test(fragmentsToText(fun))) {
          fun = this.wrapInBraces(fun);
        }
        if (name) {
          ref = fragmentsToText(fun);
          fun.push.apply(fun, name.compileToFragments(o));
        } else {
          ref = 'null';
        }
        answer = answer.concat(fun);
      }
      return answer = answer.concat(this.makeCode(".apply(" + ref + ", "), splatArgs, this.makeCode(")"));
    };

    return Call;
  }(Base);

  exports.Extends = Extends = function (_super) {
    __extends(Extends, _super);

    function Extends(child, parent) {
      this.child = child;
      this.parent = parent;
    }

    Extends.prototype.children = ['child', 'parent'];

    Extends.prototype.compileToFragments = function (o) {
      return new Call(new Value(new Literal(utility('extends'))), [this.child, this.parent]).compileToFragments(o);
    };

    return Extends;
  }(Base);

  exports.Access = Access = function (_super) {
    __extends(Access, _super);

    function Access(name, tag) {
      this.name = name;
      this.name.asKey = true;
      this.soak = tag === 'soak';
    }

    Access.prototype.children = ['name'];

    Access.prototype.compileToFragments = function (o) {
      var name;
      name = this.name.compileToFragments(o);
      if (IDENTIFIER.test(fragmentsToText(name))) {
        name.unshift(this.makeCode("."));
      } else {
        name.unshift(this.makeCode("["));
        name.push(this.makeCode("]"));
      }
      return name;
    };

    Access.prototype.isComplex = NO;

    return Access;
  }(Base);

  exports.Index = Index = function (_super) {
    __extends(Index, _super);

    function Index(index) {
      this.index = index;
    }

    Index.prototype.children = ['index'];

    Index.prototype.compileToFragments = function (o) {
      return [].concat(this.makeCode("["), this.index.compileToFragments(o, LEVEL_PAREN), this.makeCode("]"));
    };

    Index.prototype.isComplex = function () {
      return this.index.isComplex();
    };

    return Index;
  }(Base);

  exports.Range = Range = function (_super) {
    __extends(Range, _super);

    Range.prototype.children = ['from', 'to'];

    function Range(from, to, tag) {
      this.from = from;
      this.to = to;
      this.exclusive = tag === 'exclusive';
      this.equals = this.exclusive ? '' : '=';
    }

    Range.prototype.compileVariables = function (o) {
      var step, _ref2, _ref3, _ref4, _ref5;
      o = merge(o, {
        top: true
      });
      _ref2 = this.cacheToCodeFragments(this.from.cache(o, LEVEL_LIST)), this.fromC = _ref2[0], this.fromVar = _ref2[1];
      _ref3 = this.cacheToCodeFragments(this.to.cache(o, LEVEL_LIST)), this.toC = _ref3[0], this.toVar = _ref3[1];
      if (step = del(o, 'step')) {
        _ref4 = this.cacheToCodeFragments(step.cache(o, LEVEL_LIST)), this.step = _ref4[0], this.stepVar = _ref4[1];
      }
      _ref5 = [this.fromVar.match(NUMBER), this.toVar.match(NUMBER)], this.fromNum = _ref5[0], this.toNum = _ref5[1];
      if (this.stepVar) {
        return this.stepNum = this.stepVar.match(NUMBER);
      }
    };

    Range.prototype.compileNode = function (o) {
      var cond, condPart, from, gt, idx, idxName, known, lt, namedIndex, stepPart, to, varPart, _ref2, _ref3;
      if (!this.fromVar) {
        this.compileVariables(o);
      }
      if (!o.index) {
        return this.compileArray(o);
      }
      known = this.fromNum && this.toNum;
      idx = del(o, 'index');
      idxName = del(o, 'name');
      namedIndex = idxName && idxName !== idx;
      varPart = "" + idx + " = " + this.fromC;
      if (this.toC !== this.toVar) {
        varPart += ", " + this.toC;
      }
      if (this.step !== this.stepVar) {
        varPart += ", " + this.step;
      }
      _ref2 = ["" + idx + " <" + this.equals, "" + idx + " >" + this.equals], lt = _ref2[0], gt = _ref2[1];
      condPart = this.stepNum ? parseNum(this.stepNum[0]) > 0 ? "" + lt + " " + this.toVar : "" + gt + " " + this.toVar : known ? ((_ref3 = [parseNum(this.fromNum[0]), parseNum(this.toNum[0])], from = _ref3[0], to = _ref3[1], _ref3), from <= to ? "" + lt + " " + to : "" + gt + " " + to) : (cond = this.stepVar ? "" + this.stepVar + " > 0" : "" + this.fromVar + " <= " + this.toVar, "" + cond + " ? " + lt + " " + this.toVar + " : " + gt + " " + this.toVar);
      stepPart = this.stepVar ? "" + idx + " += " + this.stepVar : known ? namedIndex ? from <= to ? "++" + idx : "--" + idx : from <= to ? "" + idx + "++" : "" + idx + "--" : namedIndex ? "" + cond + " ? ++" + idx + " : --" + idx : "" + cond + " ? " + idx + "++ : " + idx + "--";
      if (namedIndex) {
        varPart = "" + idxName + " = " + varPart;
      }
      if (namedIndex) {
        stepPart = "" + idxName + " = " + stepPart;
      }
      return [this.makeCode("" + varPart + "; " + condPart + "; " + stepPart)];
    };

    Range.prototype.compileArray = function (o) {
      var args, body, cond, hasArgs, i, idt, post, pre, range, result, vars, _i, _ref2, _ref3, _results;
      if (this.fromNum && this.toNum && Math.abs(this.fromNum - this.toNum) <= 20) {
        range = function () {
          _results = [];
          for (var _i = _ref2 = +this.fromNum, _ref3 = +this.toNum; _ref2 <= _ref3 ? _i <= _ref3 : _i >= _ref3; _ref2 <= _ref3 ? _i++ : _i--) {
            _results.push(_i);
          }
          return _results;
        }.apply(this);
        if (this.exclusive) {
          range.pop();
        }
        return [this.makeCode("[" + range.join(', ') + "]")];
      }
      idt = this.tab + TAB;
      i = o.scope.freeVariable('i');
      result = o.scope.freeVariable('results');
      pre = "\n" + idt + result + " = [];";
      if (this.fromNum && this.toNum) {
        o.index = i;
        body = fragmentsToText(this.compileNode(o));
      } else {
        vars = "" + i + " = " + this.fromC + (this.toC !== this.toVar ? ", " + this.toC : '');
        cond = "" + this.fromVar + " <= " + this.toVar;
        body = "var " + vars + "; " + cond + " ? " + i + " <" + this.equals + " " + this.toVar + " : " + i + " >" + this.equals + " " + this.toVar + "; " + cond + " ? " + i + "++ : " + i + "--";
      }
      post = "{ " + result + ".push(" + i + "); }\n" + idt + "return " + result + ";\n" + o.indent;
      hasArgs = function hasArgs(node) {
        return node != null ? node.contains(isLiteralArguments) : void 0;
      };
      if (hasArgs(this.from) || hasArgs(this.to)) {
        args = ', arguments';
      }
      return [this.makeCode("(function() {" + pre + "\n" + idt + "for (" + body + ")" + post + "}).apply(this" + (args != null ? args : '') + ")")];
    };

    return Range;
  }(Base);

  exports.Slice = Slice = function (_super) {
    __extends(Slice, _super);

    Slice.prototype.children = ['range'];

    function Slice(range) {
      this.range = range;
      Slice.__super__.constructor.call(this);
    }

    Slice.prototype.compileNode = function (o) {
      var compiled, compiledText, from, fromCompiled, to, toStr, _ref2;
      _ref2 = this.range, to = _ref2.to, from = _ref2.from;
      fromCompiled = from && from.compileToFragments(o, LEVEL_PAREN) || [this.makeCode('0')];
      if (to) {
        compiled = to.compileToFragments(o, LEVEL_PAREN);
        compiledText = fragmentsToText(compiled);
        if (!(!this.range.exclusive && +compiledText === -1)) {
          toStr = ', ' + (this.range.exclusive ? compiledText : SIMPLENUM.test(compiledText) ? "" + (+compiledText + 1) : (compiled = to.compileToFragments(o, LEVEL_ACCESS), "+" + fragmentsToText(compiled) + " + 1 || 9e9"));
        }
      }
      return [this.makeCode(".slice(" + fragmentsToText(fromCompiled) + (toStr || '') + ")")];
    };

    return Slice;
  }(Base);

  exports.Obj = Obj = function (_super) {
    __extends(Obj, _super);

    function Obj(props, generated) {
      this.generated = generated != null ? generated : false;
      this.objects = this.properties = props || [];
    }

    Obj.prototype.children = ['properties'];

    Obj.prototype.compileNode = function (o) {
      var answer, i, idt, indent, join, lastNoncom, node, prop, props, _i, _j, _len, _len1;
      props = this.properties;
      if (!props.length) {
        return [this.makeCode(this.front ? '({})' : '{}')];
      }
      if (this.generated) {
        for (_i = 0, _len = props.length; _i < _len; _i++) {
          node = props[_i];
          if (node instanceof Value) {
            node.error('cannot have an implicit value in an implicit object');
          }
        }
      }
      idt = o.indent += TAB;
      lastNoncom = this.lastNonComment(this.properties);
      answer = [];
      for (i = _j = 0, _len1 = props.length; _j < _len1; i = ++_j) {
        prop = props[i];
        join = i === props.length - 1 ? '' : prop === lastNoncom || prop instanceof Comment ? '\n' : ',\n';
        indent = prop instanceof Comment ? '' : idt;
        if (prop instanceof Assign && prop.variable instanceof Value && prop.variable.hasProperties()) {
          prop.variable.error('Invalid object key');
        }
        if (prop instanceof Value && prop["this"]) {
          prop = new Assign(prop.properties[0].name, prop, 'object');
        }
        if (!(prop instanceof Comment)) {
          if (!(prop instanceof Assign)) {
            prop = new Assign(prop, prop, 'object');
          }
          (prop.variable.base || prop.variable).asKey = true;
        }
        if (indent) {
          answer.push(this.makeCode(indent));
        }
        answer.push.apply(answer, prop.compileToFragments(o, LEVEL_TOP));
        if (join) {
          answer.push(this.makeCode(join));
        }
      }
      answer.unshift(this.makeCode("{" + (props.length && '\n')));
      answer.push(this.makeCode("" + (props.length && '\n' + this.tab) + "}"));
      if (this.front) {
        return this.wrapInBraces(answer);
      } else {
        return answer;
      }
    };

    Obj.prototype.assigns = function (name) {
      var prop, _i, _len, _ref2;
      _ref2 = this.properties;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        prop = _ref2[_i];
        if (prop.assigns(name)) {
          return true;
        }
      }
      return false;
    };

    return Obj;
  }(Base);

  exports.Arr = Arr = function (_super) {
    __extends(Arr, _super);

    function Arr(objs) {
      this.objects = objs || [];
    }

    Arr.prototype.children = ['objects'];

    Arr.prototype.compileNode = function (o) {
      var answer, compiledObjs, fragments, index, obj, _i, _len;
      if (!this.objects.length) {
        return [this.makeCode('[]')];
      }
      o.indent += TAB;
      answer = Splat.compileSplattedArray(o, this.objects);
      if (answer.length) {
        return answer;
      }
      answer = [];
      compiledObjs = function () {
        var _i, _len, _ref2, _results;
        _ref2 = this.objects;
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          obj = _ref2[_i];
          _results.push(obj.compileToFragments(o, LEVEL_LIST));
        }
        return _results;
      }.call(this);
      for (index = _i = 0, _len = compiledObjs.length; _i < _len; index = ++_i) {
        fragments = compiledObjs[index];
        if (index) {
          answer.push(this.makeCode(", "));
        }
        answer.push.apply(answer, fragments);
      }
      if (fragmentsToText(answer).indexOf('\n') >= 0) {
        answer.unshift(this.makeCode("[\n" + o.indent));
        answer.push(this.makeCode("\n" + this.tab + "]"));
      } else {
        answer.unshift(this.makeCode("["));
        answer.push(this.makeCode("]"));
      }
      return answer;
    };

    Arr.prototype.assigns = function (name) {
      var obj, _i, _len, _ref2;
      _ref2 = this.objects;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        obj = _ref2[_i];
        if (obj.assigns(name)) {
          return true;
        }
      }
      return false;
    };

    return Arr;
  }(Base);

  exports.Class = Class = function (_super) {
    __extends(Class, _super);

    function Class(variable, parent, body) {
      this.variable = variable;
      this.parent = parent;
      this.body = body != null ? body : new Block();
      this.boundFuncs = [];
      this.body.classBody = true;
    }

    Class.prototype.children = ['variable', 'parent', 'body'];

    Class.prototype.determineName = function () {
      var decl, tail;
      if (!this.variable) {
        return null;
      }
      decl = (tail = last(this.variable.properties)) ? tail instanceof Access && tail.name.value : this.variable.base.value;
      if (__indexOf.call(STRICT_PROSCRIBED, decl) >= 0) {
        this.variable.error("class variable name may not be " + decl);
      }
      return decl && (decl = IDENTIFIER.test(decl) && decl);
    };

    Class.prototype.setContext = function (name) {
      return this.body.traverseChildren(false, function (node) {
        if (node.classBody) {
          return false;
        }
        if (node instanceof Literal && node.value === 'this') {
          return node.value = name;
        } else if (node instanceof Code) {
          node.klass = name;
          if (node.bound) {
            return node.context = name;
          }
        }
      });
    };

    Class.prototype.addBoundFunctions = function (o) {
      var bvar, lhs, _i, _len, _ref2;
      _ref2 = this.boundFuncs;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        bvar = _ref2[_i];
        lhs = new Value(new Literal("this"), [new Access(bvar)]).compile(o);
        this.ctor.body.unshift(new Literal("" + lhs + " = " + utility('bind') + "(" + lhs + ", this)"));
      }
    };

    Class.prototype.addProperties = function (node, name, o) {
      var assign, base, exprs, func, props;
      props = node.base.properties.slice(0);
      exprs = function () {
        var _results;
        _results = [];
        while (assign = props.shift()) {
          if (assign instanceof Assign) {
            base = assign.variable.base;
            delete assign.context;
            func = assign.value;
            if (base.value === 'constructor') {
              if (this.ctor) {
                assign.error('cannot define more than one constructor in a class');
              }
              if (func.bound) {
                assign.error('cannot define a constructor as a bound function');
              }
              if (func instanceof Code) {
                assign = this.ctor = func;
              } else {
                this.externalCtor = o.classScope.freeVariable('class');
                assign = new Assign(new Literal(this.externalCtor), func);
              }
            } else {
              if (assign.variable["this"]) {
                func["static"] = true;
              } else {
                assign.variable = new Value(new Literal(name), [new Access(new Literal('prototype')), new Access(base)]);
                if (func instanceof Code && func.bound) {
                  this.boundFuncs.push(base);
                  func.bound = false;
                }
              }
            }
          }
          _results.push(assign);
        }
        return _results;
      }.call(this);
      return compact(exprs);
    };

    Class.prototype.walkBody = function (name, o) {
      return this.traverseChildren(false, function (_this) {
        return function (child) {
          var cont, exps, i, node, _i, _len, _ref2;
          cont = true;
          if (child instanceof Class) {
            return false;
          }
          if (child instanceof Block) {
            _ref2 = exps = child.expressions;
            for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
              node = _ref2[i];
              if (node instanceof Assign && node.variable.looksStatic(name)) {
                node.value["static"] = true;
              } else if (node instanceof Value && node.isObject(true)) {
                cont = false;
                exps[i] = _this.addProperties(node, name, o);
              }
            }
            child.expressions = exps = flatten(exps);
          }
          return cont && !(child instanceof Class);
        };
      }(this));
    };

    Class.prototype.hoistDirectivePrologue = function () {
      var expressions, index, node;
      index = 0;
      expressions = this.body.expressions;
      while ((node = expressions[index]) && node instanceof Comment || node instanceof Value && node.isString()) {
        ++index;
      }
      return this.directives = expressions.splice(0, index);
    };

    Class.prototype.ensureConstructor = function (name) {
      if (!this.ctor) {
        this.ctor = new Code();
        if (this.externalCtor) {
          this.ctor.body.push(new Literal("" + this.externalCtor + ".apply(this, arguments)"));
        } else if (this.parent) {
          this.ctor.body.push(new Literal("" + name + ".__super__.constructor.apply(this, arguments)"));
        }
        this.ctor.body.makeReturn();
        this.body.expressions.unshift(this.ctor);
      }
      this.ctor.ctor = this.ctor.name = name;
      this.ctor.klass = null;
      return this.ctor.noReturn = true;
    };

    Class.prototype.compileNode = function (o) {
      var args, argumentsNode, func, jumpNode, klass, lname, name, superClass, _ref2;
      if (jumpNode = this.body.jumps()) {
        jumpNode.error('Class bodies cannot contain pure statements');
      }
      if (argumentsNode = this.body.contains(isLiteralArguments)) {
        argumentsNode.error("Class bodies shouldn't reference arguments");
      }
      name = this.determineName() || '_Class';
      if (name.reserved) {
        name = "_" + name;
      }
      lname = new Literal(name);
      func = new Code([], Block.wrap([this.body]));
      args = [];
      o.classScope = func.makeScope(o.scope);
      this.hoistDirectivePrologue();
      this.setContext(name);
      this.walkBody(name, o);
      this.ensureConstructor(name);
      this.addBoundFunctions(o);
      this.body.spaced = true;
      this.body.expressions.push(lname);
      if (this.parent) {
        superClass = new Literal(o.classScope.freeVariable('super', false));
        this.body.expressions.unshift(new Extends(lname, superClass));
        func.params.push(new Param(superClass));
        args.push(this.parent);
      }
      (_ref2 = this.body.expressions).unshift.apply(_ref2, this.directives);
      klass = new Parens(new Call(func, args));
      if (this.variable) {
        klass = new Assign(this.variable, klass);
      }
      return klass.compileToFragments(o);
    };

    return Class;
  }(Base);

  exports.Assign = Assign = function (_super) {
    __extends(Assign, _super);

    function Assign(variable, value, context, options) {
      var forbidden, name, _ref2;
      this.variable = variable;
      this.value = value;
      this.context = context;
      this.param = options && options.param;
      this.subpattern = options && options.subpattern;
      forbidden = (_ref2 = name = this.variable.unwrapAll().value, __indexOf.call(STRICT_PROSCRIBED, _ref2) >= 0);
      if (forbidden && this.context !== 'object') {
        this.variable.error("variable name may not be \"" + name + "\"");
      }
    }

    Assign.prototype.children = ['variable', 'value'];

    Assign.prototype.isStatement = function (o) {
      return (o != null ? o.level : void 0) === LEVEL_TOP && this.context != null && __indexOf.call(this.context, "?") >= 0;
    };

    Assign.prototype.assigns = function (name) {
      return this[this.context === 'object' ? 'value' : 'variable'].assigns(name);
    };

    Assign.prototype.unfoldSoak = function (o) {
      return unfoldSoak(o, this, 'variable');
    };

    Assign.prototype.compileNode = function (o) {
      var answer, compiledName, isValue, match, name, val, varBase, _ref2, _ref3, _ref4;
      if (isValue = this.variable instanceof Value) {
        if (this.variable.isArray() || this.variable.isObject()) {
          return this.compilePatternMatch(o);
        }
        if (this.variable.isSplice()) {
          return this.compileSplice(o);
        }
        if ((_ref2 = this.context) === '||=' || _ref2 === '&&=' || _ref2 === '?=') {
          return this.compileConditional(o);
        }
      }
      compiledName = this.variable.compileToFragments(o, LEVEL_LIST);
      name = fragmentsToText(compiledName);
      if (!this.context) {
        varBase = this.variable.unwrapAll();
        if (!varBase.isAssignable()) {
          this.variable.error("\"" + this.variable.compile(o) + "\" cannot be assigned");
        }
        if (!(typeof varBase.hasProperties === "function" ? varBase.hasProperties() : void 0)) {
          if (this.param) {
            o.scope.add(name, 'var');
          } else {
            o.scope.find(name);
          }
        }
      }
      if (this.value instanceof Code && (match = METHOD_DEF.exec(name))) {
        if (match[2]) {
          this.value.klass = match[1];
        }
        this.value.name = (_ref3 = (_ref4 = match[3]) != null ? _ref4 : match[4]) != null ? _ref3 : match[5];
      }
      val = this.value.compileToFragments(o, LEVEL_LIST);
      if (this.context === 'object') {
        return compiledName.concat(this.makeCode(": "), val);
      }
      answer = compiledName.concat(this.makeCode(" " + (this.context || '=') + " "), val);
      if (o.level <= LEVEL_LIST) {
        return answer;
      } else {
        return this.wrapInBraces(answer);
      }
    };

    Assign.prototype.compilePatternMatch = function (o) {
      var acc, assigns, code, fragments, i, idx, isObject, ivar, name, obj, objects, olen, ref, rest, splat, top, val, value, vvar, vvarText, _i, _len, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      top = o.level === LEVEL_TOP;
      value = this.value;
      objects = this.variable.base.objects;
      if (!(olen = objects.length)) {
        code = value.compileToFragments(o);
        if (o.level >= LEVEL_OP) {
          return this.wrapInBraces(code);
        } else {
          return code;
        }
      }
      isObject = this.variable.isObject();
      if (top && olen === 1 && !((obj = objects[0]) instanceof Splat)) {
        if (obj instanceof Assign) {
          _ref2 = obj, (_ref3 = _ref2.variable, idx = _ref3.base), obj = _ref2.value;
        } else {
          idx = isObject ? obj["this"] ? obj.properties[0].name : obj : new Literal(0);
        }
        acc = IDENTIFIER.test(idx.unwrap().value || 0);
        value = new Value(value);
        value.properties.push(new (acc ? Access : Index)(idx));
        if (_ref4 = obj.unwrap().value, __indexOf.call(RESERVED, _ref4) >= 0) {
          obj.error("assignment to a reserved word: " + obj.compile(o));
        }
        return new Assign(obj, value, null, {
          param: this.param
        }).compileToFragments(o, LEVEL_TOP);
      }
      vvar = value.compileToFragments(o, LEVEL_LIST);
      vvarText = fragmentsToText(vvar);
      assigns = [];
      splat = false;
      if (!IDENTIFIER.test(vvarText) || this.variable.assigns(vvarText)) {
        assigns.push([this.makeCode("" + (ref = o.scope.freeVariable('ref')) + " = ")].concat(__slice.call(vvar)));
        vvar = [this.makeCode(ref)];
        vvarText = ref;
      }
      for (i = _i = 0, _len = objects.length; _i < _len; i = ++_i) {
        obj = objects[i];
        idx = i;
        if (isObject) {
          if (obj instanceof Assign) {
            _ref5 = obj, (_ref6 = _ref5.variable, idx = _ref6.base), obj = _ref5.value;
          } else {
            if (obj.base instanceof Parens) {
              _ref7 = new Value(obj.unwrapAll()).cacheReference(o), obj = _ref7[0], idx = _ref7[1];
            } else {
              idx = obj["this"] ? obj.properties[0].name : obj;
            }
          }
        }
        if (!splat && obj instanceof Splat) {
          name = obj.name.unwrap().value;
          obj = obj.unwrap();
          val = "" + olen + " <= " + vvarText + ".length ? " + utility('slice') + ".call(" + vvarText + ", " + i;
          if (rest = olen - i - 1) {
            ivar = o.scope.freeVariable('i');
            val += ", " + ivar + " = " + vvarText + ".length - " + rest + ") : (" + ivar + " = " + i + ", [])";
          } else {
            val += ") : []";
          }
          val = new Literal(val);
          splat = "" + ivar + "++";
        } else {
          name = obj.unwrap().value;
          if (obj instanceof Splat) {
            obj.error("multiple splats are disallowed in an assignment");
          }
          if (typeof idx === 'number') {
            idx = new Literal(splat || idx);
            acc = false;
          } else {
            acc = isObject && IDENTIFIER.test(idx.unwrap().value || 0);
          }
          val = new Value(new Literal(vvarText), [new (acc ? Access : Index)(idx)]);
        }
        if (name != null && __indexOf.call(RESERVED, name) >= 0) {
          obj.error("assignment to a reserved word: " + obj.compile(o));
        }
        assigns.push(new Assign(obj, val, null, {
          param: this.param,
          subpattern: true
        }).compileToFragments(o, LEVEL_LIST));
      }
      if (!(top || this.subpattern)) {
        assigns.push(vvar);
      }
      fragments = this.joinFragmentArrays(assigns, ', ');
      if (o.level < LEVEL_LIST) {
        return fragments;
      } else {
        return this.wrapInBraces(fragments);
      }
    };

    Assign.prototype.compileConditional = function (o) {
      var fragments, left, right, _ref2;
      _ref2 = this.variable.cacheReference(o), left = _ref2[0], right = _ref2[1];
      if (!left.properties.length && left.base instanceof Literal && left.base.value !== "this" && !o.scope.check(left.base.value)) {
        this.variable.error("the variable \"" + left.base.value + "\" can't be assigned with " + this.context + " because it has not been declared before");
      }
      if (__indexOf.call(this.context, "?") >= 0) {
        o.isExistentialEquals = true;
        return new If(new Existence(left), right, {
          type: 'if'
        }).addElse(new Assign(right, this.value, '=')).compileToFragments(o);
      } else {
        fragments = new Op(this.context.slice(0, -1), left, new Assign(right, this.value, '=')).compileToFragments(o);
        if (o.level <= LEVEL_LIST) {
          return fragments;
        } else {
          return this.wrapInBraces(fragments);
        }
      }
    };

    Assign.prototype.compileSplice = function (o) {
      var answer, exclusive, from, fromDecl, fromRef, name, to, valDef, valRef, _ref2, _ref3, _ref4;
      _ref2 = this.variable.properties.pop().range, from = _ref2.from, to = _ref2.to, exclusive = _ref2.exclusive;
      name = this.variable.compile(o);
      if (from) {
        _ref3 = this.cacheToCodeFragments(from.cache(o, LEVEL_OP)), fromDecl = _ref3[0], fromRef = _ref3[1];
      } else {
        fromDecl = fromRef = '0';
      }
      if (to) {
        if (from instanceof Value && from.isSimpleNumber() && to instanceof Value && to.isSimpleNumber()) {
          to = to.compile(o) - fromRef;
          if (!exclusive) {
            to += 1;
          }
        } else {
          to = to.compile(o, LEVEL_ACCESS) + ' - ' + fromRef;
          if (!exclusive) {
            to += ' + 1';
          }
        }
      } else {
        to = "9e9";
      }
      _ref4 = this.value.cache(o, LEVEL_LIST), valDef = _ref4[0], valRef = _ref4[1];
      answer = [].concat(this.makeCode("[].splice.apply(" + name + ", [" + fromDecl + ", " + to + "].concat("), valDef, this.makeCode(")), "), valRef);
      if (o.level > LEVEL_TOP) {
        return this.wrapInBraces(answer);
      } else {
        return answer;
      }
    };

    return Assign;
  }(Base);

  exports.Code = Code = function (_super) {
    __extends(Code, _super);

    function Code(params, body, tag) {
      this.params = params || [];
      this.body = body || new Block();
      this.bound = tag === 'boundfunc';
    }

    Code.prototype.children = ['params', 'body'];

    Code.prototype.isStatement = function () {
      return !!this.ctor;
    };

    Code.prototype.jumps = NO;

    Code.prototype.makeScope = function (parentScope) {
      return new Scope(parentScope, this.body, this);
    };

    Code.prototype.compileNode = function (o) {
      var answer, boundfunc, code, exprs, i, lit, p, param, params, ref, splats, uniqs, val, wasEmpty, wrapper, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      if (this.bound && ((_ref2 = o.scope.method) != null ? _ref2.bound : void 0)) {
        this.context = o.scope.method.context;
      }
      if (this.bound && !this.context) {
        this.context = '_this';
        wrapper = new Code([new Param(new Literal(this.context))], new Block([this]));
        boundfunc = new Call(wrapper, [new Literal('this')]);
        boundfunc.updateLocationDataIfMissing(this.locationData);
        return boundfunc.compileNode(o);
      }
      o.scope = del(o, 'classScope') || this.makeScope(o.scope);
      o.scope.shared = del(o, 'sharedScope');
      o.indent += TAB;
      delete o.bare;
      delete o.isExistentialEquals;
      params = [];
      exprs = [];
      _ref3 = this.params;
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        param = _ref3[_i];
        o.scope.parameter(param.asReference(o));
      }
      _ref4 = this.params;
      for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
        param = _ref4[_j];
        if (!param.splat) {
          continue;
        }
        _ref5 = this.params;
        for (_k = 0, _len2 = _ref5.length; _k < _len2; _k++) {
          p = _ref5[_k].name;
          if (p["this"]) {
            p = p.properties[0].name;
          }
          if (p.value) {
            o.scope.add(p.value, 'var', true);
          }
        }
        splats = new Assign(new Value(new Arr(function () {
          var _l, _len3, _ref6, _results;
          _ref6 = this.params;
          _results = [];
          for (_l = 0, _len3 = _ref6.length; _l < _len3; _l++) {
            p = _ref6[_l];
            _results.push(p.asReference(o));
          }
          return _results;
        }.call(this))), new Value(new Literal('arguments')));
        break;
      }
      _ref6 = this.params;
      for (_l = 0, _len3 = _ref6.length; _l < _len3; _l++) {
        param = _ref6[_l];
        if (param.isComplex()) {
          val = ref = param.asReference(o);
          if (param.value) {
            val = new Op('?', ref, param.value);
          }
          exprs.push(new Assign(new Value(param.name), val, '=', {
            param: true
          }));
        } else {
          ref = param;
          if (param.value) {
            lit = new Literal(ref.name.value + ' == null');
            val = new Assign(new Value(param.name), param.value, '=');
            exprs.push(new If(lit, val));
          }
        }
        if (!splats) {
          params.push(ref);
        }
      }
      wasEmpty = this.body.isEmpty();
      if (splats) {
        exprs.unshift(splats);
      }
      if (exprs.length) {
        (_ref7 = this.body.expressions).unshift.apply(_ref7, exprs);
      }
      for (i = _m = 0, _len4 = params.length; _m < _len4; i = ++_m) {
        p = params[i];
        params[i] = p.compileToFragments(o);
        o.scope.parameter(fragmentsToText(params[i]));
      }
      uniqs = [];
      this.eachParamName(function (name, node) {
        if (__indexOf.call(uniqs, name) >= 0) {
          node.error("multiple parameters named '" + name + "'");
        }
        return uniqs.push(name);
      });
      if (!(wasEmpty || this.noReturn)) {
        this.body.makeReturn();
      }
      code = 'function';
      if (this.ctor) {
        code += ' ' + this.name;
      }
      code += '(';
      answer = [this.makeCode(code)];
      for (i = _n = 0, _len5 = params.length; _n < _len5; i = ++_n) {
        p = params[i];
        if (i) {
          answer.push(this.makeCode(", "));
        }
        answer.push.apply(answer, p);
      }
      answer.push(this.makeCode(') {'));
      if (!this.body.isEmpty()) {
        answer = answer.concat(this.makeCode("\n"), this.body.compileWithDeclarations(o), this.makeCode("\n" + this.tab));
      }
      answer.push(this.makeCode('}'));
      if (this.ctor) {
        return [this.makeCode(this.tab)].concat(__slice.call(answer));
      }
      if (this.front || o.level >= LEVEL_ACCESS) {
        return this.wrapInBraces(answer);
      } else {
        return answer;
      }
    };

    Code.prototype.eachParamName = function (iterator) {
      var param, _i, _len, _ref2, _results;
      _ref2 = this.params;
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        param = _ref2[_i];
        _results.push(param.eachName(iterator));
      }
      return _results;
    };

    Code.prototype.traverseChildren = function (crossScope, func) {
      if (crossScope) {
        return Code.__super__.traverseChildren.call(this, crossScope, func);
      }
    };

    return Code;
  }(Base);

  exports.Param = Param = function (_super) {
    __extends(Param, _super);

    function Param(name, value, splat) {
      var _ref2;
      this.name = name;
      this.value = value;
      this.splat = splat;
      if (_ref2 = name = this.name.unwrapAll().value, __indexOf.call(STRICT_PROSCRIBED, _ref2) >= 0) {
        this.name.error("parameter name \"" + name + "\" is not allowed");
      }
    }

    Param.prototype.children = ['name', 'value'];

    Param.prototype.compileToFragments = function (o) {
      return this.name.compileToFragments(o, LEVEL_LIST);
    };

    Param.prototype.asReference = function (o) {
      var node;
      if (this.reference) {
        return this.reference;
      }
      node = this.name;
      if (node["this"]) {
        node = node.properties[0].name;
        if (node.value.reserved) {
          node = new Literal(o.scope.freeVariable(node.value));
        }
      } else if (node.isComplex()) {
        node = new Literal(o.scope.freeVariable('arg'));
      }
      node = new Value(node);
      if (this.splat) {
        node = new Splat(node);
      }
      node.updateLocationDataIfMissing(this.locationData);
      return this.reference = node;
    };

    Param.prototype.isComplex = function () {
      return this.name.isComplex();
    };

    Param.prototype.eachName = function (iterator, name) {
      var atParam, node, obj, _i, _len, _ref2;
      if (name == null) {
        name = this.name;
      }
      atParam = function atParam(obj) {
        var node;
        node = obj.properties[0].name;
        if (!node.value.reserved) {
          return iterator(node.value, node);
        }
      };
      if (name instanceof Literal) {
        return iterator(name.value, name);
      }
      if (name instanceof Value) {
        return atParam(name);
      }
      _ref2 = name.objects;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        obj = _ref2[_i];
        if (obj instanceof Assign) {
          this.eachName(iterator, obj.value.unwrap());
        } else if (obj instanceof Splat) {
          node = obj.name.unwrap();
          iterator(node.value, node);
        } else if (obj instanceof Value) {
          if (obj.isArray() || obj.isObject()) {
            this.eachName(iterator, obj.base);
          } else if (obj["this"]) {
            atParam(obj);
          } else {
            iterator(obj.base.value, obj.base);
          }
        } else {
          obj.error("illegal parameter " + obj.compile());
        }
      }
    };

    return Param;
  }(Base);

  exports.Splat = Splat = function (_super) {
    __extends(Splat, _super);

    Splat.prototype.children = ['name'];

    Splat.prototype.isAssignable = YES;

    function Splat(name) {
      this.name = name.compile ? name : new Literal(name);
    }

    Splat.prototype.assigns = function (name) {
      return this.name.assigns(name);
    };

    Splat.prototype.compileToFragments = function (o) {
      return this.name.compileToFragments(o);
    };

    Splat.prototype.unwrap = function () {
      return this.name;
    };

    Splat.compileSplattedArray = function (o, list, apply) {
      var args, base, compiledNode, concatPart, fragments, i, index, node, _i, _len;
      index = -1;
      while ((node = list[++index]) && !(node instanceof Splat)) {
        continue;
      }
      if (index >= list.length) {
        return [];
      }
      if (list.length === 1) {
        node = list[0];
        fragments = node.compileToFragments(o, LEVEL_LIST);
        if (apply) {
          return fragments;
        }
        return [].concat(node.makeCode("" + utility('slice') + ".call("), fragments, node.makeCode(")"));
      }
      args = list.slice(index);
      for (i = _i = 0, _len = args.length; _i < _len; i = ++_i) {
        node = args[i];
        compiledNode = node.compileToFragments(o, LEVEL_LIST);
        args[i] = node instanceof Splat ? [].concat(node.makeCode("" + utility('slice') + ".call("), compiledNode, node.makeCode(")")) : [].concat(node.makeCode("["), compiledNode, node.makeCode("]"));
      }
      if (index === 0) {
        node = list[0];
        concatPart = node.joinFragmentArrays(args.slice(1), ', ');
        return args[0].concat(node.makeCode(".concat("), concatPart, node.makeCode(")"));
      }
      base = function () {
        var _j, _len1, _ref2, _results;
        _ref2 = list.slice(0, index);
        _results = [];
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          node = _ref2[_j];
          _results.push(node.compileToFragments(o, LEVEL_LIST));
        }
        return _results;
      }();
      base = list[0].joinFragmentArrays(base, ', ');
      concatPart = list[index].joinFragmentArrays(args, ', ');
      return [].concat(list[0].makeCode("["), base, list[index].makeCode("].concat("), concatPart, last(list).makeCode(")"));
    };

    return Splat;
  }(Base);

  exports.While = While = function (_super) {
    __extends(While, _super);

    function While(condition, options) {
      this.condition = (options != null ? options.invert : void 0) ? condition.invert() : condition;
      this.guard = options != null ? options.guard : void 0;
    }

    While.prototype.children = ['condition', 'guard', 'body'];

    While.prototype.isStatement = YES;

    While.prototype.makeReturn = function (res) {
      if (res) {
        return While.__super__.makeReturn.apply(this, arguments);
      } else {
        this.returns = !this.jumps({
          loop: true
        });
        return this;
      }
    };

    While.prototype.addBody = function (body) {
      this.body = body;
      return this;
    };

    While.prototype.jumps = function () {
      var expressions, jumpNode, node, _i, _len;
      expressions = this.body.expressions;
      if (!expressions.length) {
        return false;
      }
      for (_i = 0, _len = expressions.length; _i < _len; _i++) {
        node = expressions[_i];
        if (jumpNode = node.jumps({
          loop: true
        })) {
          return jumpNode;
        }
      }
      return false;
    };

    While.prototype.compileNode = function (o) {
      var answer, body, rvar, set;
      o.indent += TAB;
      set = '';
      body = this.body;
      if (body.isEmpty()) {
        body = this.makeCode('');
      } else {
        if (this.returns) {
          body.makeReturn(rvar = o.scope.freeVariable('results'));
          set = "" + this.tab + rvar + " = [];\n";
        }
        if (this.guard) {
          if (body.expressions.length > 1) {
            body.expressions.unshift(new If(new Parens(this.guard).invert(), new Literal("continue")));
          } else {
            if (this.guard) {
              body = Block.wrap([new If(this.guard, body)]);
            }
          }
        }
        body = [].concat(this.makeCode("\n"), body.compileToFragments(o, LEVEL_TOP), this.makeCode("\n" + this.tab));
      }
      answer = [].concat(this.makeCode(set + this.tab + "while ("), this.condition.compileToFragments(o, LEVEL_PAREN), this.makeCode(") {"), body, this.makeCode("}"));
      if (this.returns) {
        answer.push(this.makeCode("\n" + this.tab + "return " + rvar + ";"));
      }
      return answer;
    };

    return While;
  }(Base);

  exports.Op = Op = function (_super) {
    var CONVERSIONS, INVERSIONS;

    __extends(Op, _super);

    function Op(op, first, second, flip) {
      if (op === 'in') {
        return new In(first, second);
      }
      if (op === 'do') {
        return this.generateDo(first);
      }
      if (op === 'new') {
        if (first instanceof Call && !first["do"] && !first.isNew) {
          return first.newInstance();
        }
        if (first instanceof Code && first.bound || first["do"]) {
          first = new Parens(first);
        }
      }
      this.operator = CONVERSIONS[op] || op;
      this.first = first;
      this.second = second;
      this.flip = !!flip;
      return this;
    }

    CONVERSIONS = {
      '==': '===',
      '!=': '!==',
      'of': 'in'
    };

    INVERSIONS = {
      '!==': '===',
      '===': '!=='
    };

    Op.prototype.children = ['first', 'second'];

    Op.prototype.isSimpleNumber = NO;

    Op.prototype.isUnary = function () {
      return !this.second;
    };

    Op.prototype.isComplex = function () {
      var _ref2;
      return !(this.isUnary() && ((_ref2 = this.operator) === '+' || _ref2 === '-')) || this.first.isComplex();
    };

    Op.prototype.isChainable = function () {
      var _ref2;
      return (_ref2 = this.operator) === '<' || _ref2 === '>' || _ref2 === '>=' || _ref2 === '<=' || _ref2 === '===' || _ref2 === '!==';
    };

    Op.prototype.invert = function () {
      var allInvertable, curr, fst, op, _ref2;
      if (this.isChainable() && this.first.isChainable()) {
        allInvertable = true;
        curr = this;
        while (curr && curr.operator) {
          allInvertable && (allInvertable = curr.operator in INVERSIONS);
          curr = curr.first;
        }
        if (!allInvertable) {
          return new Parens(this).invert();
        }
        curr = this;
        while (curr && curr.operator) {
          curr.invert = !curr.invert;
          curr.operator = INVERSIONS[curr.operator];
          curr = curr.first;
        }
        return this;
      } else if (op = INVERSIONS[this.operator]) {
        this.operator = op;
        if (this.first.unwrap() instanceof Op) {
          this.first.invert();
        }
        return this;
      } else if (this.second) {
        return new Parens(this).invert();
      } else if (this.operator === '!' && (fst = this.first.unwrap()) instanceof Op && ((_ref2 = fst.operator) === '!' || _ref2 === 'in' || _ref2 === 'instanceof')) {
        return fst;
      } else {
        return new Op('!', this);
      }
    };

    Op.prototype.unfoldSoak = function (o) {
      var _ref2;
      return ((_ref2 = this.operator) === '++' || _ref2 === '--' || _ref2 === 'delete') && unfoldSoak(o, this, 'first');
    };

    Op.prototype.generateDo = function (exp) {
      var call, func, param, passedParams, ref, _i, _len, _ref2;
      passedParams = [];
      func = exp instanceof Assign && (ref = exp.value.unwrap()) instanceof Code ? ref : exp;
      _ref2 = func.params || [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        param = _ref2[_i];
        if (param.value) {
          passedParams.push(param.value);
          delete param.value;
        } else {
          passedParams.push(param);
        }
      }
      call = new Call(exp, passedParams);
      call["do"] = true;
      return call;
    };

    Op.prototype.compileNode = function (o) {
      var answer, isChain, _ref2, _ref3;
      isChain = this.isChainable() && this.first.isChainable();
      if (!isChain) {
        this.first.front = this.front;
      }
      if (this.operator === 'delete' && o.scope.check(this.first.unwrapAll().value)) {
        this.error('delete operand may not be argument or var');
      }
      if (((_ref2 = this.operator) === '--' || _ref2 === '++') && (_ref3 = this.first.unwrapAll().value, __indexOf.call(STRICT_PROSCRIBED, _ref3) >= 0)) {
        this.error("cannot increment/decrement \"" + this.first.unwrapAll().value + "\"");
      }
      if (this.isUnary()) {
        return this.compileUnary(o);
      }
      if (isChain) {
        return this.compileChain(o);
      }
      if (this.operator === '?') {
        return this.compileExistence(o);
      }
      answer = [].concat(this.first.compileToFragments(o, LEVEL_OP), this.makeCode(' ' + this.operator + ' '), this.second.compileToFragments(o, LEVEL_OP));
      if (o.level <= LEVEL_OP) {
        return answer;
      } else {
        return this.wrapInBraces(answer);
      }
    };

    Op.prototype.compileChain = function (o) {
      var fragments, fst, shared, _ref2;
      _ref2 = this.first.second.cache(o), this.first.second = _ref2[0], shared = _ref2[1];
      fst = this.first.compileToFragments(o, LEVEL_OP);
      fragments = fst.concat(this.makeCode(" " + (this.invert ? '&&' : '||') + " "), shared.compileToFragments(o), this.makeCode(" " + this.operator + " "), this.second.compileToFragments(o, LEVEL_OP));
      return this.wrapInBraces(fragments);
    };

    Op.prototype.compileExistence = function (o) {
      var fst, ref;
      if (this.first.isComplex()) {
        ref = new Literal(o.scope.freeVariable('ref'));
        fst = new Parens(new Assign(ref, this.first));
      } else {
        fst = this.first;
        ref = fst;
      }
      return new If(new Existence(fst), ref, {
        type: 'if'
      }).addElse(this.second).compileToFragments(o);
    };

    Op.prototype.compileUnary = function (o) {
      var op, parts, plusMinus;
      parts = [];
      op = this.operator;
      parts.push([this.makeCode(op)]);
      if (op === '!' && this.first instanceof Existence) {
        this.first.negated = !this.first.negated;
        return this.first.compileToFragments(o);
      }
      if (o.level >= LEVEL_ACCESS) {
        return new Parens(this).compileToFragments(o);
      }
      plusMinus = op === '+' || op === '-';
      if (op === 'new' || op === 'typeof' || op === 'delete' || plusMinus && this.first instanceof Op && this.first.operator === op) {
        parts.push([this.makeCode(' ')]);
      }
      if (plusMinus && this.first instanceof Op || op === 'new' && this.first.isStatement(o)) {
        this.first = new Parens(this.first);
      }
      parts.push(this.first.compileToFragments(o, LEVEL_OP));
      if (this.flip) {
        parts.reverse();
      }
      return this.joinFragmentArrays(parts, '');
    };

    Op.prototype.toString = function (idt) {
      return Op.__super__.toString.call(this, idt, this.constructor.name + ' ' + this.operator);
    };

    return Op;
  }(Base);

  exports.In = In = function (_super) {
    __extends(In, _super);

    function In(object, array) {
      this.object = object;
      this.array = array;
    }

    In.prototype.children = ['object', 'array'];

    In.prototype.invert = NEGATE;

    In.prototype.compileNode = function (o) {
      var hasSplat, obj, _i, _len, _ref2;
      if (this.array instanceof Value && this.array.isArray()) {
        _ref2 = this.array.base.objects;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          obj = _ref2[_i];
          if (!(obj instanceof Splat)) {
            continue;
          }
          hasSplat = true;
          break;
        }
        if (!hasSplat) {
          return this.compileOrTest(o);
        }
      }
      return this.compileLoopTest(o);
    };

    In.prototype.compileOrTest = function (o) {
      var cmp, cnj, i, item, ref, sub, tests, _i, _len, _ref2, _ref3, _ref4;
      if (this.array.base.objects.length === 0) {
        return [this.makeCode("" + !!this.negated)];
      }
      _ref2 = this.object.cache(o, LEVEL_OP), sub = _ref2[0], ref = _ref2[1];
      _ref3 = this.negated ? [' !== ', ' && '] : [' === ', ' || '], cmp = _ref3[0], cnj = _ref3[1];
      tests = [];
      _ref4 = this.array.base.objects;
      for (i = _i = 0, _len = _ref4.length; _i < _len; i = ++_i) {
        item = _ref4[i];
        if (i) {
          tests.push(this.makeCode(cnj));
        }
        tests = tests.concat(i ? ref : sub, this.makeCode(cmp), item.compileToFragments(o, LEVEL_ACCESS));
      }
      if (o.level < LEVEL_OP) {
        return tests;
      } else {
        return this.wrapInBraces(tests);
      }
    };

    In.prototype.compileLoopTest = function (o) {
      var fragments, ref, sub, _ref2;
      _ref2 = this.object.cache(o, LEVEL_LIST), sub = _ref2[0], ref = _ref2[1];
      fragments = [].concat(this.makeCode(utility('indexOf') + ".call("), this.array.compileToFragments(o, LEVEL_LIST), this.makeCode(", "), ref, this.makeCode(") " + (this.negated ? '< 0' : '>= 0')));
      if (fragmentsToText(sub) === fragmentsToText(ref)) {
        return fragments;
      }
      fragments = sub.concat(this.makeCode(', '), fragments);
      if (o.level < LEVEL_LIST) {
        return fragments;
      } else {
        return this.wrapInBraces(fragments);
      }
    };

    In.prototype.toString = function (idt) {
      return In.__super__.toString.call(this, idt, this.constructor.name + (this.negated ? '!' : ''));
    };

    return In;
  }(Base);

  exports.Try = Try = function (_super) {
    __extends(Try, _super);

    function Try(attempt, errorVariable, recovery, ensure) {
      this.attempt = attempt;
      this.errorVariable = errorVariable;
      this.recovery = recovery;
      this.ensure = ensure;
    }

    Try.prototype.children = ['attempt', 'recovery', 'ensure'];

    Try.prototype.isStatement = YES;

    Try.prototype.jumps = function (o) {
      var _ref2;
      return this.attempt.jumps(o) || ((_ref2 = this.recovery) != null ? _ref2.jumps(o) : void 0);
    };

    Try.prototype.makeReturn = function (res) {
      if (this.attempt) {
        this.attempt = this.attempt.makeReturn(res);
      }
      if (this.recovery) {
        this.recovery = this.recovery.makeReturn(res);
      }
      return this;
    };

    Try.prototype.compileNode = function (o) {
      var catchPart, ensurePart, placeholder, tryPart;
      o.indent += TAB;
      tryPart = this.attempt.compileToFragments(o, LEVEL_TOP);
      catchPart = this.recovery ? (placeholder = new Literal('_error'), this.errorVariable ? this.recovery.unshift(new Assign(this.errorVariable, placeholder)) : void 0, [].concat(this.makeCode(" catch ("), placeholder.compileToFragments(o), this.makeCode(") {\n"), this.recovery.compileToFragments(o, LEVEL_TOP), this.makeCode("\n" + this.tab + "}"))) : !(this.ensure || this.recovery) ? [this.makeCode(' catch (_error) {}')] : [];
      ensurePart = this.ensure ? [].concat(this.makeCode(" finally {\n"), this.ensure.compileToFragments(o, LEVEL_TOP), this.makeCode("\n" + this.tab + "}")) : [];
      return [].concat(this.makeCode("" + this.tab + "try {\n"), tryPart, this.makeCode("\n" + this.tab + "}"), catchPart, ensurePart);
    };

    return Try;
  }(Base);

  exports.Throw = Throw = function (_super) {
    __extends(Throw, _super);

    function Throw(expression) {
      this.expression = expression;
    }

    Throw.prototype.children = ['expression'];

    Throw.prototype.isStatement = YES;

    Throw.prototype.jumps = NO;

    Throw.prototype.makeReturn = THIS;

    Throw.prototype.compileNode = function (o) {
      return [].concat(this.makeCode(this.tab + "throw "), this.expression.compileToFragments(o), this.makeCode(";"));
    };

    return Throw;
  }(Base);

  exports.Existence = Existence = function (_super) {
    __extends(Existence, _super);

    function Existence(expression) {
      this.expression = expression;
    }

    Existence.prototype.children = ['expression'];

    Existence.prototype.invert = NEGATE;

    Existence.prototype.compileNode = function (o) {
      var cmp, cnj, code, _ref2;
      this.expression.front = this.front;
      code = this.expression.compile(o, LEVEL_OP);
      if (IDENTIFIER.test(code) && !o.scope.check(code)) {
        _ref2 = this.negated ? ['===', '||'] : ['!==', '&&'], cmp = _ref2[0], cnj = _ref2[1];
        code = "typeof " + code + " " + cmp + " \"undefined\" " + cnj + " " + code + " " + cmp + " null";
      } else {
        code = "" + code + " " + (this.negated ? '==' : '!=') + " null";
      }
      return [this.makeCode(o.level <= LEVEL_COND ? code : "(" + code + ")")];
    };

    return Existence;
  }(Base);

  exports.Parens = Parens = function (_super) {
    __extends(Parens, _super);

    function Parens(body) {
      this.body = body;
    }

    Parens.prototype.children = ['body'];

    Parens.prototype.unwrap = function () {
      return this.body;
    };

    Parens.prototype.isComplex = function () {
      return this.body.isComplex();
    };

    Parens.prototype.compileNode = function (o) {
      var bare, expr, fragments;
      expr = this.body.unwrap();
      if (expr instanceof Value && expr.isAtomic()) {
        expr.front = this.front;
        return expr.compileToFragments(o);
      }
      fragments = expr.compileToFragments(o, LEVEL_PAREN);
      bare = o.level < LEVEL_OP && (expr instanceof Op || expr instanceof Call || expr instanceof For && expr.returns);
      if (bare) {
        return fragments;
      } else {
        return this.wrapInBraces(fragments);
      }
    };

    return Parens;
  }(Base);

  exports.For = For = function (_super) {
    __extends(For, _super);

    function For(body, source) {
      var _ref2;
      this.source = source.source, this.guard = source.guard, this.step = source.step, this.name = source.name, this.index = source.index;
      this.body = Block.wrap([body]);
      this.own = !!source.own;
      this.object = !!source.object;
      if (this.object) {
        _ref2 = [this.index, this.name], this.name = _ref2[0], this.index = _ref2[1];
      }
      if (this.index instanceof Value) {
        this.index.error('index cannot be a pattern matching expression');
      }
      this.range = this.source instanceof Value && this.source.base instanceof Range && !this.source.properties.length;
      this.pattern = this.name instanceof Value;
      if (this.range && this.index) {
        this.index.error('indexes do not apply to range loops');
      }
      if (this.range && this.pattern) {
        this.name.error('cannot pattern match over range loops');
      }
      if (this.own && !this.object) {
        this.name.error('cannot use own with for-in');
      }
      this.returns = false;
    }

    For.prototype.children = ['body', 'source', 'guard', 'step'];

    For.prototype.compileNode = function (o) {
      var body, bodyFragments, compare, compareDown, declare, declareDown, defPart, defPartFragments, down, forPartFragments, guardPart, idt1, increment, index, ivar, kvar, kvarAssign, lastJumps, lvar, name, namePart, ref, resultPart, returnResult, rvar, scope, source, step, stepNum, stepVar, svar, varPart, _ref2, _ref3;
      body = Block.wrap([this.body]);
      lastJumps = (_ref2 = last(body.expressions)) != null ? _ref2.jumps() : void 0;
      if (lastJumps && lastJumps instanceof Return) {
        this.returns = false;
      }
      source = this.range ? this.source.base : this.source;
      scope = o.scope;
      name = this.name && this.name.compile(o, LEVEL_LIST);
      index = this.index && this.index.compile(o, LEVEL_LIST);
      if (name && !this.pattern) {
        scope.find(name);
      }
      if (index) {
        scope.find(index);
      }
      if (this.returns) {
        rvar = scope.freeVariable('results');
      }
      ivar = this.object && index || scope.freeVariable('i');
      kvar = this.range && name || index || ivar;
      kvarAssign = kvar !== ivar ? "" + kvar + " = " : "";
      if (this.step && !this.range) {
        _ref3 = this.cacheToCodeFragments(this.step.cache(o, LEVEL_LIST)), step = _ref3[0], stepVar = _ref3[1];
        stepNum = stepVar.match(NUMBER);
      }
      if (this.pattern) {
        name = ivar;
      }
      varPart = '';
      guardPart = '';
      defPart = '';
      idt1 = this.tab + TAB;
      if (this.range) {
        forPartFragments = source.compileToFragments(merge(o, {
          index: ivar,
          name: name,
          step: this.step
        }));
      } else {
        svar = this.source.compile(o, LEVEL_LIST);
        if ((name || this.own) && !IDENTIFIER.test(svar)) {
          defPart += "" + this.tab + (ref = scope.freeVariable('ref')) + " = " + svar + ";\n";
          svar = ref;
        }
        if (name && !this.pattern) {
          namePart = "" + name + " = " + svar + "[" + kvar + "]";
        }
        if (!this.object) {
          if (step !== stepVar) {
            defPart += "" + this.tab + step + ";\n";
          }
          if (!(this.step && stepNum && (down = parseNum(stepNum[0]) < 0))) {
            lvar = scope.freeVariable('len');
          }
          declare = "" + kvarAssign + ivar + " = 0, " + lvar + " = " + svar + ".length";
          declareDown = "" + kvarAssign + ivar + " = " + svar + ".length - 1";
          compare = "" + ivar + " < " + lvar;
          compareDown = "" + ivar + " >= 0";
          if (this.step) {
            if (stepNum) {
              if (down) {
                compare = compareDown;
                declare = declareDown;
              }
            } else {
              compare = "" + stepVar + " > 0 ? " + compare + " : " + compareDown;
              declare = "(" + stepVar + " > 0 ? (" + declare + ") : " + declareDown + ")";
            }
            increment = "" + ivar + " += " + stepVar;
          } else {
            increment = "" + (kvar !== ivar ? "++" + ivar : "" + ivar + "++");
          }
          forPartFragments = [this.makeCode("" + declare + "; " + compare + "; " + kvarAssign + increment)];
        }
      }
      if (this.returns) {
        resultPart = "" + this.tab + rvar + " = [];\n";
        returnResult = "\n" + this.tab + "return " + rvar + ";";
        body.makeReturn(rvar);
      }
      if (this.guard) {
        if (body.expressions.length > 1) {
          body.expressions.unshift(new If(new Parens(this.guard).invert(), new Literal("continue")));
        } else {
          if (this.guard) {
            body = Block.wrap([new If(this.guard, body)]);
          }
        }
      }
      if (this.pattern) {
        body.expressions.unshift(new Assign(this.name, new Literal("" + svar + "[" + kvar + "]")));
      }
      defPartFragments = [].concat(this.makeCode(defPart), this.pluckDirectCall(o, body));
      if (namePart) {
        varPart = "\n" + idt1 + namePart + ";";
      }
      if (this.object) {
        forPartFragments = [this.makeCode("" + kvar + " in " + svar)];
        if (this.own) {
          guardPart = "\n" + idt1 + "if (!" + utility('hasProp') + ".call(" + svar + ", " + kvar + ")) continue;";
        }
      }
      bodyFragments = body.compileToFragments(merge(o, {
        indent: idt1
      }), LEVEL_TOP);
      if (bodyFragments && bodyFragments.length > 0) {
        bodyFragments = [].concat(this.makeCode("\n"), bodyFragments, this.makeCode("\n"));
      }
      return [].concat(defPartFragments, this.makeCode("" + (resultPart || '') + this.tab + "for ("), forPartFragments, this.makeCode(") {" + guardPart + varPart), bodyFragments, this.makeCode("" + this.tab + "}" + (returnResult || '')));
    };

    For.prototype.pluckDirectCall = function (o, body) {
      var base, defs, expr, fn, idx, ref, val, _i, _len, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
      defs = [];
      _ref2 = body.expressions;
      for (idx = _i = 0, _len = _ref2.length; _i < _len; idx = ++_i) {
        expr = _ref2[idx];
        expr = expr.unwrapAll();
        if (!(expr instanceof Call)) {
          continue;
        }
        val = (_ref3 = expr.variable) != null ? _ref3.unwrapAll() : void 0;
        if (!(val instanceof Code || val instanceof Value && ((_ref4 = val.base) != null ? _ref4.unwrapAll() : void 0) instanceof Code && val.properties.length === 1 && ((_ref5 = (_ref6 = val.properties[0].name) != null ? _ref6.value : void 0) === 'call' || _ref5 === 'apply'))) {
          continue;
        }
        fn = ((_ref7 = val.base) != null ? _ref7.unwrapAll() : void 0) || val;
        ref = new Literal(o.scope.freeVariable('fn'));
        base = new Value(ref);
        if (val.base) {
          _ref8 = [base, val], val.base = _ref8[0], base = _ref8[1];
        }
        body.expressions[idx] = new Call(base, expr.args);
        defs = defs.concat(this.makeCode(this.tab), new Assign(ref, fn).compileToFragments(o, LEVEL_TOP), this.makeCode(';\n'));
      }
      return defs;
    };

    return For;
  }(While);

  exports.Switch = Switch = function (_super) {
    __extends(Switch, _super);

    function Switch(subject, cases, otherwise) {
      this.subject = subject;
      this.cases = cases;
      this.otherwise = otherwise;
    }

    Switch.prototype.children = ['subject', 'cases', 'otherwise'];

    Switch.prototype.isStatement = YES;

    Switch.prototype.jumps = function (o) {
      var block, conds, jumpNode, _i, _len, _ref2, _ref3, _ref4;
      if (o == null) {
        o = {
          block: true
        };
      }
      _ref2 = this.cases;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        _ref3 = _ref2[_i], conds = _ref3[0], block = _ref3[1];
        if (jumpNode = block.jumps(o)) {
          return jumpNode;
        }
      }
      return (_ref4 = this.otherwise) != null ? _ref4.jumps(o) : void 0;
    };

    Switch.prototype.makeReturn = function (res) {
      var pair, _i, _len, _ref2, _ref3;
      _ref2 = this.cases;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        pair = _ref2[_i];
        pair[1].makeReturn(res);
      }
      if (res) {
        this.otherwise || (this.otherwise = new Block([new Literal('void 0')]));
      }
      if ((_ref3 = this.otherwise) != null) {
        _ref3.makeReturn(res);
      }
      return this;
    };

    Switch.prototype.compileNode = function (o) {
      var block, body, cond, conditions, expr, fragments, i, idt1, idt2, _i, _j, _len, _len1, _ref2, _ref3, _ref4;
      idt1 = o.indent + TAB;
      idt2 = o.indent = idt1 + TAB;
      fragments = [].concat(this.makeCode(this.tab + "switch ("), this.subject ? this.subject.compileToFragments(o, LEVEL_PAREN) : this.makeCode("false"), this.makeCode(") {\n"));
      _ref2 = this.cases;
      for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
        _ref3 = _ref2[i], conditions = _ref3[0], block = _ref3[1];
        _ref4 = flatten([conditions]);
        for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
          cond = _ref4[_j];
          if (!this.subject) {
            cond = cond.invert();
          }
          fragments = fragments.concat(this.makeCode(idt1 + "case "), cond.compileToFragments(o, LEVEL_PAREN), this.makeCode(":\n"));
        }
        if ((body = block.compileToFragments(o, LEVEL_TOP)).length > 0) {
          fragments = fragments.concat(body, this.makeCode('\n'));
        }
        if (i === this.cases.length - 1 && !this.otherwise) {
          break;
        }
        expr = this.lastNonComment(block.expressions);
        if (expr instanceof Return || expr instanceof Literal && expr.jumps() && expr.value !== 'debugger') {
          continue;
        }
        fragments.push(cond.makeCode(idt2 + 'break;\n'));
      }
      if (this.otherwise && this.otherwise.expressions.length) {
        fragments.push.apply(fragments, [this.makeCode(idt1 + "default:\n")].concat(__slice.call(this.otherwise.compileToFragments(o, LEVEL_TOP)), [this.makeCode("\n")]));
      }
      fragments.push(this.makeCode(this.tab + '}'));
      return fragments;
    };

    return Switch;
  }(Base);

  exports.If = If = function (_super) {
    __extends(If, _super);

    function If(condition, body, options) {
      this.body = body;
      if (options == null) {
        options = {};
      }
      this.condition = options.type === 'unless' ? condition.invert() : condition;
      this.elseBody = null;
      this.isChain = false;
      this.soak = options.soak;
    }

    If.prototype.children = ['condition', 'body', 'elseBody'];

    If.prototype.bodyNode = function () {
      var _ref2;
      return (_ref2 = this.body) != null ? _ref2.unwrap() : void 0;
    };

    If.prototype.elseBodyNode = function () {
      var _ref2;
      return (_ref2 = this.elseBody) != null ? _ref2.unwrap() : void 0;
    };

    If.prototype.addElse = function (elseBody) {
      if (this.isChain) {
        this.elseBodyNode().addElse(elseBody);
      } else {
        this.isChain = elseBody instanceof If;
        this.elseBody = this.ensureBlock(elseBody);
        this.elseBody.updateLocationDataIfMissing(elseBody.locationData);
      }
      return this;
    };

    If.prototype.isStatement = function (o) {
      var _ref2;
      return (o != null ? o.level : void 0) === LEVEL_TOP || this.bodyNode().isStatement(o) || ((_ref2 = this.elseBodyNode()) != null ? _ref2.isStatement(o) : void 0);
    };

    If.prototype.jumps = function (o) {
      var _ref2;
      return this.body.jumps(o) || ((_ref2 = this.elseBody) != null ? _ref2.jumps(o) : void 0);
    };

    If.prototype.compileNode = function (o) {
      if (this.isStatement(o)) {
        return this.compileStatement(o);
      } else {
        return this.compileExpression(o);
      }
    };

    If.prototype.makeReturn = function (res) {
      if (res) {
        this.elseBody || (this.elseBody = new Block([new Literal('void 0')]));
      }
      this.body && (this.body = new Block([this.body.makeReturn(res)]));
      this.elseBody && (this.elseBody = new Block([this.elseBody.makeReturn(res)]));
      return this;
    };

    If.prototype.ensureBlock = function (node) {
      if (node instanceof Block) {
        return node;
      } else {
        return new Block([node]);
      }
    };

    If.prototype.compileStatement = function (o) {
      var answer, body, child, cond, exeq, ifPart, indent;
      child = del(o, 'chainChild');
      exeq = del(o, 'isExistentialEquals');
      if (exeq) {
        return new If(this.condition.invert(), this.elseBodyNode(), {
          type: 'if'
        }).compileToFragments(o);
      }
      indent = o.indent + TAB;
      cond = this.condition.compileToFragments(o, LEVEL_PAREN);
      body = this.ensureBlock(this.body).compileToFragments(merge(o, {
        indent: indent
      }));
      ifPart = [].concat(this.makeCode("if ("), cond, this.makeCode(") {\n"), body, this.makeCode("\n" + this.tab + "}"));
      if (!child) {
        ifPart.unshift(this.makeCode(this.tab));
      }
      if (!this.elseBody) {
        return ifPart;
      }
      answer = ifPart.concat(this.makeCode(' else '));
      if (this.isChain) {
        o.chainChild = true;
        answer = answer.concat(this.elseBody.unwrap().compileToFragments(o, LEVEL_TOP));
      } else {
        answer = answer.concat(this.makeCode("{\n"), this.elseBody.compileToFragments(merge(o, {
          indent: indent
        }), LEVEL_TOP), this.makeCode("\n" + this.tab + "}"));
      }
      return answer;
    };

    If.prototype.compileExpression = function (o) {
      var alt, body, cond, fragments;
      cond = this.condition.compileToFragments(o, LEVEL_COND);
      body = this.bodyNode().compileToFragments(o, LEVEL_LIST);
      alt = this.elseBodyNode() ? this.elseBodyNode().compileToFragments(o, LEVEL_LIST) : [this.makeCode('void 0')];
      fragments = cond.concat(this.makeCode(" ? "), body, this.makeCode(" : "), alt);
      if (o.level >= LEVEL_COND) {
        return this.wrapInBraces(fragments);
      } else {
        return fragments;
      }
    };

    If.prototype.unfoldSoak = function () {
      return this.soak && this;
    };

    return If;
  }(Base);

  UTILITIES = {
    "extends": function _extends() {
      return "function(child, parent) { for (var key in parent) { if (" + utility('hasProp') + ".call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; }";
    },
    bind: function bind() {
      return 'function(fn, me){ return function(){ return fn.apply(me, arguments); }; }';
    },
    indexOf: function indexOf() {
      return "[].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; }";
    },
    hasProp: function hasProp() {
      return '{}.hasOwnProperty';
    },
    slice: function slice() {
      return '[].slice';
    }
  };

  LEVEL_TOP = 1;

  LEVEL_PAREN = 2;

  LEVEL_LIST = 3;

  LEVEL_COND = 4;

  LEVEL_OP = 5;

  LEVEL_ACCESS = 6;

  TAB = '  ';

  IDENTIFIER_STR = "[$A-Za-z_\\x7f-\\uffff][$\\w\\x7f-\\uffff]*";

  IDENTIFIER = RegExp("^" + IDENTIFIER_STR + "$");

  SIMPLENUM = /^[+-]?\d+$/;

  HEXNUM = /^[+-]?0x[\da-f]+/i;

  NUMBER = /^[+-]?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)$/i;

  METHOD_DEF = RegExp("^(" + IDENTIFIER_STR + ")(\\.prototype)?(?:\\.(" + IDENTIFIER_STR + ")|\\[(\"(?:[^\\\\\"\\r\\n]|\\\\.)*\"|'(?:[^\\\\'\\r\\n]|\\\\.)*')\\]|\\[(0x[\\da-fA-F]+|\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\])$");

  IS_STRING = /^['"]/;

  IS_REGEX = /^\//;

  utility = function utility(name) {
    var ref;
    ref = "__" + name;
    Scope.root.assign(ref, UTILITIES[name]());
    return ref;
  };

  multident = function multident(code, tab) {
    code = code.replace(/\n/g, '$&' + tab);
    return code.replace(/\s+$/, '');
  };

  parseNum = function parseNum(x) {
    if (x == null) {
      return 0;
    } else if (x.match(HEXNUM)) {
      return parseInt(x, 16);
    } else {
      return parseFloat(x);
    }
  };

  isLiteralArguments = function isLiteralArguments(node) {
    return node instanceof Literal && node.value === 'arguments' && !node.asKey;
  };

  isLiteralThis = function isLiteralThis(node) {
    return node instanceof Literal && node.value === 'this' && !node.asKey || node instanceof Code && node.bound || node instanceof Call && node.isSuper;
  };

  unfoldSoak = function unfoldSoak(o, parent, name) {
    var ifn;
    if (!(ifn = parent[name].unfoldSoak(o))) {
      return;
    }
    parent[name] = ifn.body;
    ifn.body = new Value(parent);
    return ifn;
  };
});

ace.define("ace/mode/coffee/coffee-script", ["require", "exports", "module", "ace/mode/coffee/lexer", "ace/mode/coffee/parser", "ace/mode/coffee/nodes"], function (require, exports, module) {

  var Lexer = require("./lexer").Lexer;
  var parser = require("./parser");

  var lexer = new Lexer();
  parser.lexer = {
    lex: function lex() {
      var tag, token;
      token = this.tokens[this.pos++];
      if (token) {
        tag = token[0], this.yytext = token[1], this.yylloc = token[2];
        this.yylineno = this.yylloc.first_line;
      } else {
        tag = '';
      }
      return tag;
    },
    setInput: function setInput(tokens) {
      this.tokens = tokens;
      return this.pos = 0;
    },
    upcomingInput: function upcomingInput() {
      return "";
    }
  };
  parser.yy = require('./nodes');

  exports.parse = function (code) {
    return parser.parse(lexer.tokenize(code));
  };
});

ace.define("ace/mode/coffee_worker", ["require", "exports", "module", "ace/lib/oop", "ace/worker/mirror", "ace/mode/coffee/coffee-script"], function (require, exports, module) {
  "use strict";

  var oop = require("../lib/oop");
  var Mirror = require("../worker/mirror").Mirror;
  var coffee = require("../mode/coffee/coffee-script");

  window.addEventListener = function () {};

  var Worker = exports.Worker = function (sender) {
    Mirror.call(this, sender);
    this.setTimeout(250);
  };

  oop.inherits(Worker, Mirror);

  (function () {

    this.onUpdate = function () {
      var value = this.doc.getValue();

      try {
        coffee.parse(value).compile();
      } catch (e) {
        var loc = e.location;
        if (loc) {
          this.sender.emit("error", {
            row: loc.first_line,
            column: loc.first_column,
            endRow: loc.last_line,
            endColumn: loc.last_column,
            text: e.message,
            type: "error"
          });
        }
        return;
      }
      this.sender.emit("ok");
    };
  }).call(Worker.prototype);
});

ace.define("ace/lib/es5-shim", ["require", "exports", "module"], function (require, exports, module) {

  function Empty() {}

  if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that) {
      // .length is 1
      var target = this;
      if (typeof target != "function") {
        throw new TypeError("Function.prototype.bind called on incompatible " + target);
      }
      var args = slice.call(arguments, 1); // for normal call
      var bound = function bound() {

        if (this instanceof bound) {

          var result = target.apply(this, args.concat(slice.call(arguments)));
          if (Object(result) === result) {
            return result;
          }
          return this;
        } else {
          return target.apply(that, args.concat(slice.call(arguments)));
        }
      };
      if (target.prototype) {
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
      }
      return bound;
    };
  }
  var call = Function.prototype.call;
  var prototypeOfArray = Array.prototype;
  var prototypeOfObject = Object.prototype;
  var slice = prototypeOfArray.slice;
  var _toString = call.bind(prototypeOfObject.toString);
  var owns = call.bind(prototypeOfObject.hasOwnProperty);
  var defineGetter;
  var defineSetter;
  var lookupGetter;
  var lookupSetter;
  var supportsAccessors;
  if (supportsAccessors = owns(prototypeOfObject, "__defineGetter__")) {
    defineGetter = call.bind(prototypeOfObject.__defineGetter__);
    defineSetter = call.bind(prototypeOfObject.__defineSetter__);
    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);
    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);
  }
  if ([1, 2].splice(0).length != 2) {
    if (function () {
      // test IE < 9 to splice bug - see issue #138
      function makeArray(l) {
        var a = new Array(l + 2);
        a[0] = a[1] = 0;
        return a;
      }
      var array = [],
          lengthBefore;

      array.splice.apply(array, makeArray(20));
      array.splice.apply(array, makeArray(26));

      lengthBefore = array.length; //46
      array.splice(5, 0, "XXX"); // add one element

      lengthBefore + 1 == array.length;

      if (lengthBefore + 1 == array.length) {
        return true; // has right splice implementation without bugs
      }
    }()) {
      //IE 6/7
      var array_splice = Array.prototype.splice;
      Array.prototype.splice = function (start, deleteCount) {
        if (!arguments.length) {
          return [];
        } else {
          return array_splice.apply(this, [start === void 0 ? 0 : start, deleteCount === void 0 ? this.length - start : deleteCount].concat(slice.call(arguments, 2)));
        }
      };
    } else {
      //IE8
      Array.prototype.splice = function (pos, removeCount) {
        var length = this.length;
        if (pos > 0) {
          if (pos > length) pos = length;
        } else if (pos == void 0) {
          pos = 0;
        } else if (pos < 0) {
          pos = Math.max(length + pos, 0);
        }

        if (!(pos + removeCount < length)) removeCount = length - pos;

        var removed = this.slice(pos, pos + removeCount);
        var insert = slice.call(arguments, 2);
        var add = insert.length;
        if (pos === length) {
          if (add) {
            this.push.apply(this, insert);
          }
        } else {
          var remove = Math.min(removeCount, length - pos);
          var tailOldPos = pos + remove;
          var tailNewPos = tailOldPos + add - remove;
          var tailCount = length - tailOldPos;
          var lengthAfterRemove = length - remove;

          if (tailNewPos < tailOldPos) {
            // case A
            for (var i = 0; i < tailCount; ++i) {
              this[tailNewPos + i] = this[tailOldPos + i];
            }
          } else if (tailNewPos > tailOldPos) {
            // case B
            for (i = tailCount; i--;) {
              this[tailNewPos + i] = this[tailOldPos + i];
            }
          } // else, add == remove (nothing to do)

          if (add && pos === lengthAfterRemove) {
            this.length = lengthAfterRemove; // truncate array
            this.push.apply(this, insert);
          } else {
            this.length = lengthAfterRemove + add; // reserves space
            for (i = 0; i < add; ++i) {
              this[pos + i] = insert[i];
            }
          }
        }
        return removed;
      };
    }
  }
  if (!Array.isArray) {
    Array.isArray = function isArray(obj) {
      return _toString(obj) == "[object Array]";
    };
  }
  var boxedString = Object("a"),
      splitString = boxedString[0] != "a" || !(0 in boxedString);

  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(fun /*, thisp*/) {
      var object = toObject(this),
          self = splitString && _toString(this) == "[object String]" ? this.split("") : object,
          thisp = arguments[1],
          i = -1,
          length = self.length >>> 0;
      if (_toString(fun) != "[object Function]") {
        throw new TypeError(); // TODO message
      }

      while (++i < length) {
        if (i in self) {
          fun.call(thisp, self[i], i, object);
        }
      }
    };
  }
  if (!Array.prototype.map) {
    Array.prototype.map = function map(fun /*, thisp*/) {
      var object = toObject(this),
          self = splitString && _toString(this) == "[object String]" ? this.split("") : object,
          length = self.length >>> 0,
          result = Array(length),
          thisp = arguments[1];
      if (_toString(fun) != "[object Function]") {
        throw new TypeError(fun + " is not a function");
      }

      for (var i = 0; i < length; i++) {
        if (i in self) result[i] = fun.call(thisp, self[i], i, object);
      }
      return result;
    };
  }
  if (!Array.prototype.filter) {
    Array.prototype.filter = function filter(fun /*, thisp */) {
      var object = toObject(this),
          self = splitString && _toString(this) == "[object String]" ? this.split("") : object,
          length = self.length >>> 0,
          result = [],
          value,
          thisp = arguments[1];
      if (_toString(fun) != "[object Function]") {
        throw new TypeError(fun + " is not a function");
      }

      for (var i = 0; i < length; i++) {
        if (i in self) {
          value = self[i];
          if (fun.call(thisp, value, i, object)) {
            result.push(value);
          }
        }
      }
      return result;
    };
  }
  if (!Array.prototype.every) {
    Array.prototype.every = function every(fun /*, thisp */) {
      var object = toObject(this),
          self = splitString && _toString(this) == "[object String]" ? this.split("") : object,
          length = self.length >>> 0,
          thisp = arguments[1];
      if (_toString(fun) != "[object Function]") {
        throw new TypeError(fun + " is not a function");
      }

      for (var i = 0; i < length; i++) {
        if (i in self && !fun.call(thisp, self[i], i, object)) {
          return false;
        }
      }
      return true;
    };
  }
  if (!Array.prototype.some) {
    Array.prototype.some = function some(fun /*, thisp */) {
      var object = toObject(this),
          self = splitString && _toString(this) == "[object String]" ? this.split("") : object,
          length = self.length >>> 0,
          thisp = arguments[1];
      if (_toString(fun) != "[object Function]") {
        throw new TypeError(fun + " is not a function");
      }

      for (var i = 0; i < length; i++) {
        if (i in self && fun.call(thisp, self[i], i, object)) {
          return true;
        }
      }
      return false;
    };
  }
  if (!Array.prototype.reduce) {
    Array.prototype.reduce = function reduce(fun /*, initial*/) {
      var object = toObject(this),
          self = splitString && _toString(this) == "[object String]" ? this.split("") : object,
          length = self.length >>> 0;
      if (_toString(fun) != "[object Function]") {
        throw new TypeError(fun + " is not a function");
      }
      if (!length && arguments.length == 1) {
        throw new TypeError("reduce of empty array with no initial value");
      }

      var i = 0;
      var result;
      if (arguments.length >= 2) {
        result = arguments[1];
      } else {
        do {
          if (i in self) {
            result = self[i++];
            break;
          }
          if (++i >= length) {
            throw new TypeError("reduce of empty array with no initial value");
          }
        } while (true);
      }

      for (; i < length; i++) {
        if (i in self) {
          result = fun.call(void 0, result, self[i], i, object);
        }
      }

      return result;
    };
  }
  if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {
      var object = toObject(this),
          self = splitString && _toString(this) == "[object String]" ? this.split("") : object,
          length = self.length >>> 0;
      if (_toString(fun) != "[object Function]") {
        throw new TypeError(fun + " is not a function");
      }
      if (!length && arguments.length == 1) {
        throw new TypeError("reduceRight of empty array with no initial value");
      }

      var result,
          i = length - 1;
      if (arguments.length >= 2) {
        result = arguments[1];
      } else {
        do {
          if (i in self) {
            result = self[i--];
            break;
          }
          if (--i < 0) {
            throw new TypeError("reduceRight of empty array with no initial value");
          }
        } while (true);
      }

      do {
        if (i in this) {
          result = fun.call(void 0, result, self[i], i, object);
        }
      } while (i--);

      return result;
    };
  }
  if (!Array.prototype.indexOf || [0, 1].indexOf(1, 2) != -1) {
    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */) {
      var self = splitString && _toString(this) == "[object String]" ? this.split("") : toObject(this),
          length = self.length >>> 0;

      if (!length) {
        return -1;
      }

      var i = 0;
      if (arguments.length > 1) {
        i = toInteger(arguments[1]);
      }
      i = i >= 0 ? i : Math.max(0, length + i);
      for (; i < length; i++) {
        if (i in self && self[i] === sought) {
          return i;
        }
      }
      return -1;
    };
  }
  if (!Array.prototype.lastIndexOf || [0, 1].lastIndexOf(0, -3) != -1) {
    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {
      var self = splitString && _toString(this) == "[object String]" ? this.split("") : toObject(this),
          length = self.length >>> 0;

      if (!length) {
        return -1;
      }
      var i = length - 1;
      if (arguments.length > 1) {
        i = Math.min(i, toInteger(arguments[1]));
      }
      i = i >= 0 ? i : length - Math.abs(i);
      for (; i >= 0; i--) {
        if (i in self && sought === self[i]) {
          return i;
        }
      }
      return -1;
    };
  }
  if (!Object.getPrototypeOf) {
    Object.getPrototypeOf = function getPrototypeOf(object) {
      return object.__proto__ || (object.constructor ? object.constructor.prototype : prototypeOfObject);
    };
  }
  if (!Object.getOwnPropertyDescriptor) {
    var ERR_NON_OBJECT = "Object.getOwnPropertyDescriptor called on a " + "non-object: ";
    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {
      if ((typeof object === "undefined" ? "undefined" : _typeof(object)) != "object" && typeof object != "function" || object === null) throw new TypeError(ERR_NON_OBJECT + object);
      if (!owns(object, property)) return;

      var descriptor, getter, setter;
      descriptor = { enumerable: true, configurable: true };
      if (supportsAccessors) {
        var prototype = object.__proto__;
        object.__proto__ = prototypeOfObject;

        var getter = lookupGetter(object, property);
        var setter = lookupSetter(object, property);
        object.__proto__ = prototype;

        if (getter || setter) {
          if (getter) descriptor.get = getter;
          if (setter) descriptor.set = setter;
          return descriptor;
        }
      }
      descriptor.value = object[property];
      return descriptor;
    };
  }
  if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {
      return Object.keys(object);
    };
  }
  if (!Object.create) {
    var createEmpty;
    if (Object.prototype.__proto__ === null) {
      createEmpty = function createEmpty() {
        return { "__proto__": null };
      };
    } else {
      createEmpty = function createEmpty() {
        var empty = {};
        for (var i in empty) {
          empty[i] = null;
        }empty.constructor = empty.hasOwnProperty = empty.propertyIsEnumerable = empty.isPrototypeOf = empty.toLocaleString = empty.toString = empty.valueOf = empty.__proto__ = null;
        return empty;
      };
    }

    Object.create = function create(prototype, properties) {
      var object;
      if (prototype === null) {
        object = createEmpty();
      } else {
        if ((typeof prototype === "undefined" ? "undefined" : _typeof(prototype)) != "object") throw new TypeError("typeof prototype[" + (typeof prototype === "undefined" ? "undefined" : _typeof(prototype)) + "] != 'object'");
        var Type = function Type() {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
      }
      if (properties !== void 0) Object.defineProperties(object, properties);
      return object;
    };
  }

  function doesDefinePropertyWork(object) {
    try {
      Object.defineProperty(object, "sentinel", {});
      return "sentinel" in object;
    } catch (exception) {}
  }
  if (Object.defineProperty) {
    var definePropertyWorksOnObject = doesDefinePropertyWork({});
    var definePropertyWorksOnDom = typeof document == "undefined" || doesDefinePropertyWork(document.createElement("div"));
    if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {
      var definePropertyFallback = Object.defineProperty;
    }
  }

  if (!Object.defineProperty || definePropertyFallback) {
    var ERR_NON_OBJECT_DESCRIPTOR = "Property description must be an object: ";
    var ERR_NON_OBJECT_TARGET = "Object.defineProperty called on non-object: ";
    var ERR_ACCESSORS_NOT_SUPPORTED = "getters & setters can not be defined " + "on this javascript engine";

    Object.defineProperty = function defineProperty(object, property, descriptor) {
      if ((typeof object === "undefined" ? "undefined" : _typeof(object)) != "object" && typeof object != "function" || object === null) throw new TypeError(ERR_NON_OBJECT_TARGET + object);
      if ((typeof descriptor === "undefined" ? "undefined" : _typeof(descriptor)) != "object" && typeof descriptor != "function" || descriptor === null) throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);
      if (definePropertyFallback) {
        try {
          return definePropertyFallback.call(Object, object, property, descriptor);
        } catch (exception) {}
      }
      if (owns(descriptor, "value")) {

        if (supportsAccessors && (lookupGetter(object, property) || lookupSetter(object, property))) {
          var prototype = object.__proto__;
          object.__proto__ = prototypeOfObject;
          delete object[property];
          object[property] = descriptor.value;
          object.__proto__ = prototype;
        } else {
          object[property] = descriptor.value;
        }
      } else {
        if (!supportsAccessors) throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);
        if (owns(descriptor, "get")) defineGetter(object, property, descriptor.get);
        if (owns(descriptor, "set")) defineSetter(object, property, descriptor.set);
      }

      return object;
    };
  }
  if (!Object.defineProperties) {
    Object.defineProperties = function defineProperties(object, properties) {
      for (var property in properties) {
        if (owns(properties, property)) Object.defineProperty(object, property, properties[property]);
      }
      return object;
    };
  }
  if (!Object.seal) {
    Object.seal = function seal(object) {
      return object;
    };
  }
  if (!Object.freeze) {
    Object.freeze = function freeze(object) {
      return object;
    };
  }
  try {
    Object.freeze(function () {});
  } catch (exception) {
    Object.freeze = function freeze(freezeObject) {
      return function freeze(object) {
        if (typeof object == "function") {
          return object;
        } else {
          return freezeObject(object);
        }
      };
    }(Object.freeze);
  }
  if (!Object.preventExtensions) {
    Object.preventExtensions = function preventExtensions(object) {
      return object;
    };
  }
  if (!Object.isSealed) {
    Object.isSealed = function isSealed(object) {
      return false;
    };
  }
  if (!Object.isFrozen) {
    Object.isFrozen = function isFrozen(object) {
      return false;
    };
  }
  if (!Object.isExtensible) {
    Object.isExtensible = function isExtensible(object) {
      if (Object(object) === object) {
        throw new TypeError(); // TODO message
      }
      var name = '';
      while (owns(object, name)) {
        name += '?';
      }
      object[name] = true;
      var returnValue = owns(object, name);
      delete object[name];
      return returnValue;
    };
  }
  if (!Object.keys) {
    var hasDontEnumBug = true,
        dontEnums = ["toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor"],
        dontEnumsLength = dontEnums.length;

    for (var key in { "toString": null }) {
      hasDontEnumBug = false;
    }

    Object.keys = function keys(object) {

      if ((typeof object === "undefined" ? "undefined" : _typeof(object)) != "object" && typeof object != "function" || object === null) {
        throw new TypeError("Object.keys called on a non-object");
      }

      var keys = [];
      for (var name in object) {
        if (owns(object, name)) {
          keys.push(name);
        }
      }

      if (hasDontEnumBug) {
        for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
          var dontEnum = dontEnums[i];
          if (owns(object, dontEnum)) {
            keys.push(dontEnum);
          }
        }
      }
      return keys;
    };
  }
  if (!Date.now) {
    Date.now = function now() {
      return new Date().getTime();
    };
  }
  var ws = "\t\n\x0B\f\r \xA0\u1680\u180E\u2000\u2001\u2002\u2003" + "\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028" + "\u2029\uFEFF";
  if (!String.prototype.trim || ws.trim()) {
    ws = "[" + ws + "]";
    var trimBeginRegexp = new RegExp("^" + ws + ws + "*"),
        trimEndRegexp = new RegExp(ws + ws + "*$");
    String.prototype.trim = function trim() {
      return String(this).replace(trimBeginRegexp, "").replace(trimEndRegexp, "");
    };
  }

  function toInteger(n) {
    n = +n;
    if (n !== n) {
      // isNaN
      n = 0;
    } else if (n !== 0 && n !== 1 / 0 && n !== -(1 / 0)) {
      n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }
    return n;
  }

  function isPrimitive(input) {
    var type = typeof input === "undefined" ? "undefined" : _typeof(input);
    return input === null || type === "undefined" || type === "boolean" || type === "number" || type === "string";
  }

  function toPrimitive(input) {
    var val, valueOf, toString;
    if (isPrimitive(input)) {
      return input;
    }
    valueOf = input.valueOf;
    if (typeof valueOf === "function") {
      val = valueOf.call(input);
      if (isPrimitive(val)) {
        return val;
      }
    }
    toString = input.toString;
    if (typeof toString === "function") {
      val = toString.call(input);
      if (isPrimitive(val)) {
        return val;
      }
    }
    throw new TypeError();
  }
  var toObject = function toObject(o) {
    if (o == null) {
      // this matches both null and undefined
      throw new TypeError("can't convert " + o + " to object");
    }
    return Object(o);
  };
});