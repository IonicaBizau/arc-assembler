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

ace.define("ace/mode/javascript/jshint", ["require", "exports", "module"], function (require, exports, module) {
  module.exports = function e(t, n, r) {
    function s(o, u) {
      if (!n[o]) {
        if (!t[o]) {
          var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);throw new Error("Cannot find module '" + o + "'");
        }var f = n[o] = { exports: {} };t[o][0].call(f.exports, function (e) {
          var n = t[o][1][e];return s(n ? n : e);
        }, f, f.exports, e, t, n, r);
      }return n[o].exports;
    }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
      s(r[o]);
    }return s;
  }({
    1: [function (_dereq_, module, exports) {
      var identifierStartTable = [];

      for (var i = 0; i < 128; i++) {
        identifierStartTable[i] = i === 36 || // $
        i >= 65 && i <= 90 || // A-Z
        i === 95 || // _
        i >= 97 && i <= 122; // a-z
      }

      var identifierPartTable = [];

      for (var i = 0; i < 128; i++) {
        identifierPartTable[i] = identifierStartTable[i] || // $, _, A-Z, a-z
        i >= 48 && i <= 57; // 0-9
      }

      module.exports = {
        asciiIdentifierStartTable: identifierStartTable,
        asciiIdentifierPartTable: identifierPartTable
      };
    }, {}],
    2: [function (_dereq_, module, exports) {

      (function () {
        var root = this;
        var previousUnderscore = root._;
        var breaker = {};
        var ArrayProto = Array.prototype,
            ObjProto = Object.prototype,
            FuncProto = Function.prototype;
        var push = ArrayProto.push,
            slice = ArrayProto.slice,
            concat = ArrayProto.concat,
            toString = ObjProto.toString,
            hasOwnProperty = ObjProto.hasOwnProperty;
        var nativeForEach = ArrayProto.forEach,
            nativeMap = ArrayProto.map,
            nativeReduce = ArrayProto.reduce,
            nativeReduceRight = ArrayProto.reduceRight,
            nativeFilter = ArrayProto.filter,
            nativeEvery = ArrayProto.every,
            nativeSome = ArrayProto.some,
            nativeIndexOf = ArrayProto.indexOf,
            nativeLastIndexOf = ArrayProto.lastIndexOf,
            nativeIsArray = Array.isArray,
            nativeKeys = Object.keys,
            nativeBind = FuncProto.bind;
        var _ = function _(obj) {
          if (obj instanceof _) return obj;
          if (!(this instanceof _)) return new _(obj);
          this._wrapped = obj;
        };
        if (typeof exports !== 'undefined') {
          if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = _;
          }
          exports._ = _;
        } else {
          root._ = _;
        }
        _.VERSION = '1.6.0';
        var each = _.each = _.forEach = function (obj, iterator, context) {
          if (obj == null) return obj;
          if (nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, context);
          } else if (obj.length === +obj.length) {
            for (var i = 0, length = obj.length; i < length; i++) {
              if (iterator.call(context, obj[i], i, obj) === breaker) return;
            }
          } else {
            var keys = _.keys(obj);
            for (var i = 0, length = keys.length; i < length; i++) {
              if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
            }
          }
          return obj;
        };
        _.map = _.collect = function (obj, iterator, context) {
          var results = [];
          if (obj == null) return results;
          if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
          each(obj, function (value, index, list) {
            results.push(iterator.call(context, value, index, list));
          });
          return results;
        };

        var reduceError = 'Reduce of empty array with no initial value';
        _.reduce = _.foldl = _.inject = function (obj, iterator, memo, context) {
          var initial = arguments.length > 2;
          if (obj == null) obj = [];
          if (nativeReduce && obj.reduce === nativeReduce) {
            if (context) iterator = _.bind(iterator, context);
            return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
          }
          each(obj, function (value, index, list) {
            if (!initial) {
              memo = value;
              initial = true;
            } else {
              memo = iterator.call(context, memo, value, index, list);
            }
          });
          if (!initial) throw new TypeError(reduceError);
          return memo;
        };
        _.reduceRight = _.foldr = function (obj, iterator, memo, context) {
          var initial = arguments.length > 2;
          if (obj == null) obj = [];
          if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
            if (context) iterator = _.bind(iterator, context);
            return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
          }
          var length = obj.length;
          if (length !== +length) {
            var keys = _.keys(obj);
            length = keys.length;
          }
          each(obj, function (value, index, list) {
            index = keys ? keys[--length] : --length;
            if (!initial) {
              memo = obj[index];
              initial = true;
            } else {
              memo = iterator.call(context, memo, obj[index], index, list);
            }
          });
          if (!initial) throw new TypeError(reduceError);
          return memo;
        };
        _.find = _.detect = function (obj, predicate, context) {
          var result;
          any(obj, function (value, index, list) {
            if (predicate.call(context, value, index, list)) {
              result = value;
              return true;
            }
          });
          return result;
        };
        _.filter = _.select = function (obj, predicate, context) {
          var results = [];
          if (obj == null) return results;
          if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
          each(obj, function (value, index, list) {
            if (predicate.call(context, value, index, list)) results.push(value);
          });
          return results;
        };
        _.reject = function (obj, predicate, context) {
          return _.filter(obj, function (value, index, list) {
            return !predicate.call(context, value, index, list);
          }, context);
        };
        _.every = _.all = function (obj, predicate, context) {
          predicate || (predicate = _.identity);
          var result = true;
          if (obj == null) return result;
          if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
          each(obj, function (value, index, list) {
            if (!(result = result && predicate.call(context, value, index, list))) return breaker;
          });
          return !!result;
        };
        var any = _.some = _.any = function (obj, predicate, context) {
          predicate || (predicate = _.identity);
          var result = false;
          if (obj == null) return result;
          if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
          each(obj, function (value, index, list) {
            if (result || (result = predicate.call(context, value, index, list))) return breaker;
          });
          return !!result;
        };
        _.contains = _.include = function (obj, target) {
          if (obj == null) return false;
          if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
          return any(obj, function (value) {
            return value === target;
          });
        };
        _.invoke = function (obj, method) {
          var args = slice.call(arguments, 2);
          var isFunc = _.isFunction(method);
          return _.map(obj, function (value) {
            return (isFunc ? method : value[method]).apply(value, args);
          });
        };
        _.pluck = function (obj, key) {
          return _.map(obj, _.property(key));
        };
        _.where = function (obj, attrs) {
          return _.filter(obj, _.matches(attrs));
        };
        _.findWhere = function (obj, attrs) {
          return _.find(obj, _.matches(attrs));
        };
        _.max = function (obj, iterator, context) {
          if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
            return Math.max.apply(Math, obj);
          }
          var result = -Infinity,
              lastComputed = -Infinity;
          each(obj, function (value, index, list) {
            var computed = iterator ? iterator.call(context, value, index, list) : value;
            if (computed > lastComputed) {
              result = value;
              lastComputed = computed;
            }
          });
          return result;
        };
        _.min = function (obj, iterator, context) {
          if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
            return Math.min.apply(Math, obj);
          }
          var result = Infinity,
              lastComputed = Infinity;
          each(obj, function (value, index, list) {
            var computed = iterator ? iterator.call(context, value, index, list) : value;
            if (computed < lastComputed) {
              result = value;
              lastComputed = computed;
            }
          });
          return result;
        };
        _.shuffle = function (obj) {
          var rand;
          var index = 0;
          var shuffled = [];
          each(obj, function (value) {
            rand = _.random(index++);
            shuffled[index - 1] = shuffled[rand];
            shuffled[rand] = value;
          });
          return shuffled;
        };
        _.sample = function (obj, n, guard) {
          if (n == null || guard) {
            if (obj.length !== +obj.length) obj = _.values(obj);
            return obj[_.random(obj.length - 1)];
          }
          return _.shuffle(obj).slice(0, Math.max(0, n));
        };
        var lookupIterator = function lookupIterator(value) {
          if (value == null) return _.identity;
          if (_.isFunction(value)) return value;
          return _.property(value);
        };
        _.sortBy = function (obj, iterator, context) {
          iterator = lookupIterator(iterator);
          return _.pluck(_.map(obj, function (value, index, list) {
            return {
              value: value,
              index: index,
              criteria: iterator.call(context, value, index, list)
            };
          }).sort(function (left, right) {
            var a = left.criteria;
            var b = right.criteria;
            if (a !== b) {
              if (a > b || a === void 0) return 1;
              if (a < b || b === void 0) return -1;
            }
            return left.index - right.index;
          }), 'value');
        };
        var group = function group(behavior) {
          return function (obj, iterator, context) {
            var result = {};
            iterator = lookupIterator(iterator);
            each(obj, function (value, index) {
              var key = iterator.call(context, value, index, obj);
              behavior(result, key, value);
            });
            return result;
          };
        };
        _.groupBy = group(function (result, key, value) {
          _.has(result, key) ? result[key].push(value) : result[key] = [value];
        });
        _.indexBy = group(function (result, key, value) {
          result[key] = value;
        });
        _.countBy = group(function (result, key) {
          _.has(result, key) ? result[key]++ : result[key] = 1;
        });
        _.sortedIndex = function (array, obj, iterator, context) {
          iterator = lookupIterator(iterator);
          var value = iterator.call(context, obj);
          var low = 0,
              high = array.length;
          while (low < high) {
            var mid = low + high >>> 1;
            iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
          }
          return low;
        };
        _.toArray = function (obj) {
          if (!obj) return [];
          if (_.isArray(obj)) return slice.call(obj);
          if (obj.length === +obj.length) return _.map(obj, _.identity);
          return _.values(obj);
        };
        _.size = function (obj) {
          if (obj == null) return 0;
          return obj.length === +obj.length ? obj.length : _.keys(obj).length;
        };
        _.first = _.head = _.take = function (array, n, guard) {
          if (array == null) return void 0;
          if (n == null || guard) return array[0];
          if (n < 0) return [];
          return slice.call(array, 0, n);
        };
        _.initial = function (array, n, guard) {
          return slice.call(array, 0, array.length - (n == null || guard ? 1 : n));
        };
        _.last = function (array, n, guard) {
          if (array == null) return void 0;
          if (n == null || guard) return array[array.length - 1];
          return slice.call(array, Math.max(array.length - n, 0));
        };
        _.rest = _.tail = _.drop = function (array, n, guard) {
          return slice.call(array, n == null || guard ? 1 : n);
        };
        _.compact = function (array) {
          return _.filter(array, _.identity);
        };
        var flatten = function flatten(input, shallow, output) {
          if (shallow && _.every(input, _.isArray)) {
            return concat.apply(output, input);
          }
          each(input, function (value) {
            if (_.isArray(value) || _.isArguments(value)) {
              shallow ? push.apply(output, value) : flatten(value, shallow, output);
            } else {
              output.push(value);
            }
          });
          return output;
        };
        _.flatten = function (array, shallow) {
          return flatten(array, shallow, []);
        };
        _.without = function (array) {
          return _.difference(array, slice.call(arguments, 1));
        };
        _.partition = function (array, predicate) {
          var pass = [],
              fail = [];
          each(array, function (elem) {
            (predicate(elem) ? pass : fail).push(elem);
          });
          return [pass, fail];
        };
        _.uniq = _.unique = function (array, isSorted, iterator, context) {
          if (_.isFunction(isSorted)) {
            context = iterator;
            iterator = isSorted;
            isSorted = false;
          }
          var initial = iterator ? _.map(array, iterator, context) : array;
          var results = [];
          var seen = [];
          each(initial, function (value, index) {
            if (isSorted ? !index || seen[seen.length - 1] !== value : !_.contains(seen, value)) {
              seen.push(value);
              results.push(array[index]);
            }
          });
          return results;
        };
        _.union = function () {
          return _.uniq(_.flatten(arguments, true));
        };
        _.intersection = function (array) {
          var rest = slice.call(arguments, 1);
          return _.filter(_.uniq(array), function (item) {
            return _.every(rest, function (other) {
              return _.contains(other, item);
            });
          });
        };
        _.difference = function (array) {
          var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
          return _.filter(array, function (value) {
            return !_.contains(rest, value);
          });
        };
        _.zip = function () {
          var length = _.max(_.pluck(arguments, 'length').concat(0));
          var results = new Array(length);
          for (var i = 0; i < length; i++) {
            results[i] = _.pluck(arguments, '' + i);
          }
          return results;
        };
        _.object = function (list, values) {
          if (list == null) return {};
          var result = {};
          for (var i = 0, length = list.length; i < length; i++) {
            if (values) {
              result[list[i]] = values[i];
            } else {
              result[list[i][0]] = list[i][1];
            }
          }
          return result;
        };
        _.indexOf = function (array, item, isSorted) {
          if (array == null) return -1;
          var i = 0,
              length = array.length;
          if (isSorted) {
            if (typeof isSorted == 'number') {
              i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
            } else {
              i = _.sortedIndex(array, item);
              return array[i] === item ? i : -1;
            }
          }
          if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
          for (; i < length; i++) {
            if (array[i] === item) return i;
          }return -1;
        };
        _.lastIndexOf = function (array, item, from) {
          if (array == null) return -1;
          var hasIndex = from != null;
          if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
            return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
          }
          var i = hasIndex ? from : array.length;
          while (i--) {
            if (array[i] === item) return i;
          }return -1;
        };
        _.range = function (start, stop, step) {
          if (arguments.length <= 1) {
            stop = start || 0;
            start = 0;
          }
          step = arguments[2] || 1;

          var length = Math.max(Math.ceil((stop - start) / step), 0);
          var idx = 0;
          var range = new Array(length);

          while (idx < length) {
            range[idx++] = start;
            start += step;
          }

          return range;
        };
        var ctor = function ctor() {};
        _.bind = function (func, context) {
          var args, _bound;
          if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
          if (!_.isFunction(func)) throw new TypeError();
          args = slice.call(arguments, 2);
          return _bound = function bound() {
            if (!(this instanceof _bound)) return func.apply(context, args.concat(slice.call(arguments)));
            ctor.prototype = func.prototype;
            var self = new ctor();
            ctor.prototype = null;
            var result = func.apply(self, args.concat(slice.call(arguments)));
            if (Object(result) === result) return result;
            return self;
          };
        };
        _.partial = function (func) {
          var boundArgs = slice.call(arguments, 1);
          return function () {
            var position = 0;
            var args = boundArgs.slice();
            for (var i = 0, length = args.length; i < length; i++) {
              if (args[i] === _) args[i] = arguments[position++];
            }
            while (position < arguments.length) {
              args.push(arguments[position++]);
            }return func.apply(this, args);
          };
        };
        _.bindAll = function (obj) {
          var funcs = slice.call(arguments, 1);
          if (funcs.length === 0) throw new Error('bindAll must be passed function names');
          each(funcs, function (f) {
            obj[f] = _.bind(obj[f], obj);
          });
          return obj;
        };
        _.memoize = function (func, hasher) {
          var memo = {};
          hasher || (hasher = _.identity);
          return function () {
            var key = hasher.apply(this, arguments);
            return _.has(memo, key) ? memo[key] : memo[key] = func.apply(this, arguments);
          };
        };
        _.delay = function (func, wait) {
          var args = slice.call(arguments, 2);
          return setTimeout(function () {
            return func.apply(null, args);
          }, wait);
        };
        _.defer = function (func) {
          return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
        };
        _.throttle = function (func, wait, options) {
          var context, args, result;
          var timeout = null;
          var previous = 0;
          options || (options = {});
          var later = function later() {
            previous = options.leading === false ? 0 : _.now();
            timeout = null;
            result = func.apply(context, args);
            context = args = null;
          };
          return function () {
            var now = _.now();
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0) {
              clearTimeout(timeout);
              timeout = null;
              previous = now;
              result = func.apply(context, args);
              context = args = null;
            } else if (!timeout && options.trailing !== false) {
              timeout = setTimeout(later, remaining);
            }
            return result;
          };
        };
        _.debounce = function (func, wait, immediate) {
          var timeout, args, context, timestamp, result;

          var later = function later() {
            var last = _.now() - timestamp;
            if (last < wait) {
              timeout = setTimeout(later, wait - last);
            } else {
              timeout = null;
              if (!immediate) {
                result = func.apply(context, args);
                context = args = null;
              }
            }
          };

          return function () {
            context = this;
            args = arguments;
            timestamp = _.now();
            var callNow = immediate && !timeout;
            if (!timeout) {
              timeout = setTimeout(later, wait);
            }
            if (callNow) {
              result = func.apply(context, args);
              context = args = null;
            }

            return result;
          };
        };
        _.once = function (func) {
          var ran = false,
              memo;
          return function () {
            if (ran) return memo;
            ran = true;
            memo = func.apply(this, arguments);
            func = null;
            return memo;
          };
        };
        _.wrap = function (func, wrapper) {
          return _.partial(wrapper, func);
        };
        _.compose = function () {
          var funcs = arguments;
          return function () {
            var args = arguments;
            for (var i = funcs.length - 1; i >= 0; i--) {
              args = [funcs[i].apply(this, args)];
            }
            return args[0];
          };
        };
        _.after = function (times, func) {
          return function () {
            if (--times < 1) {
              return func.apply(this, arguments);
            }
          };
        };
        _.keys = function (obj) {
          if (!_.isObject(obj)) return [];
          if (nativeKeys) return nativeKeys(obj);
          var keys = [];
          for (var key in obj) {
            if (_.has(obj, key)) keys.push(key);
          }return keys;
        };
        _.values = function (obj) {
          var keys = _.keys(obj);
          var length = keys.length;
          var values = new Array(length);
          for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
          }
          return values;
        };
        _.pairs = function (obj) {
          var keys = _.keys(obj);
          var length = keys.length;
          var pairs = new Array(length);
          for (var i = 0; i < length; i++) {
            pairs[i] = [keys[i], obj[keys[i]]];
          }
          return pairs;
        };
        _.invert = function (obj) {
          var result = {};
          var keys = _.keys(obj);
          for (var i = 0, length = keys.length; i < length; i++) {
            result[obj[keys[i]]] = keys[i];
          }
          return result;
        };
        _.functions = _.methods = function (obj) {
          var names = [];
          for (var key in obj) {
            if (_.isFunction(obj[key])) names.push(key);
          }
          return names.sort();
        };
        _.extend = function (obj) {
          each(slice.call(arguments, 1), function (source) {
            if (source) {
              for (var prop in source) {
                obj[prop] = source[prop];
              }
            }
          });
          return obj;
        };
        _.pick = function (obj) {
          var copy = {};
          var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
          each(keys, function (key) {
            if (key in obj) copy[key] = obj[key];
          });
          return copy;
        };
        _.omit = function (obj) {
          var copy = {};
          var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
          for (var key in obj) {
            if (!_.contains(keys, key)) copy[key] = obj[key];
          }
          return copy;
        };
        _.defaults = function (obj) {
          each(slice.call(arguments, 1), function (source) {
            if (source) {
              for (var prop in source) {
                if (obj[prop] === void 0) obj[prop] = source[prop];
              }
            }
          });
          return obj;
        };
        _.clone = function (obj) {
          if (!_.isObject(obj)) return obj;
          return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
        };
        _.tap = function (obj, interceptor) {
          interceptor(obj);
          return obj;
        };
        var eq = function eq(a, b, aStack, bStack) {
          if (a === b) return a !== 0 || 1 / a == 1 / b;
          if (a == null || b == null) return a === b;
          if (a instanceof _) a = a._wrapped;
          if (b instanceof _) b = b._wrapped;
          var className = toString.call(a);
          if (className != toString.call(b)) return false;
          switch (className) {
            case '[object String]':
              return a == String(b);
            case '[object Number]':
              return a != +a ? b != +b : a == 0 ? 1 / a == 1 / b : a == +b;
            case '[object Date]':
            case '[object Boolean]':
              return +a == +b;
            case '[object RegExp]':
              return a.source == b.source && a.global == b.global && a.multiline == b.multiline && a.ignoreCase == b.ignoreCase;
          }
          if ((typeof a === "undefined" ? "undefined" : _typeof(a)) != 'object' || (typeof b === "undefined" ? "undefined" : _typeof(b)) != 'object') return false;
          var length = aStack.length;
          while (length--) {
            if (aStack[length] == a) return bStack[length] == b;
          }
          var aCtor = a.constructor,
              bCtor = b.constructor;
          if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor && _.isFunction(bCtor) && bCtor instanceof bCtor) && 'constructor' in a && 'constructor' in b) {
            return false;
          }
          aStack.push(a);
          bStack.push(b);
          var size = 0,
              result = true;
          if (className == '[object Array]') {
            size = a.length;
            result = size == b.length;
            if (result) {
              while (size--) {
                if (!(result = eq(a[size], b[size], aStack, bStack))) break;
              }
            }
          } else {
            for (var key in a) {
              if (_.has(a, key)) {
                size++;
                if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
              }
            }
            if (result) {
              for (key in b) {
                if (_.has(b, key) && !size--) break;
              }
              result = !size;
            }
          }
          aStack.pop();
          bStack.pop();
          return result;
        };
        _.isEqual = function (a, b) {
          return eq(a, b, [], []);
        };
        _.isEmpty = function (obj) {
          if (obj == null) return true;
          if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
          for (var key in obj) {
            if (_.has(obj, key)) return false;
          }return true;
        };
        _.isElement = function (obj) {
          return !!(obj && obj.nodeType === 1);
        };
        _.isArray = nativeIsArray || function (obj) {
          return toString.call(obj) == '[object Array]';
        };
        _.isObject = function (obj) {
          return obj === Object(obj);
        };
        each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function (name) {
          _['is' + name] = function (obj) {
            return toString.call(obj) == '[object ' + name + ']';
          };
        });
        if (!_.isArguments(arguments)) {
          _.isArguments = function (obj) {
            return !!(obj && _.has(obj, 'callee'));
          };
        }
        if (typeof /./ !== 'function') {
          _.isFunction = function (obj) {
            return typeof obj === 'function';
          };
        }
        _.isFinite = function (obj) {
          return isFinite(obj) && !isNaN(parseFloat(obj));
        };
        _.isNaN = function (obj) {
          return _.isNumber(obj) && obj != +obj;
        };
        _.isBoolean = function (obj) {
          return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
        };
        _.isNull = function (obj) {
          return obj === null;
        };
        _.isUndefined = function (obj) {
          return obj === void 0;
        };
        _.has = function (obj, key) {
          return hasOwnProperty.call(obj, key);
        };
        _.noConflict = function () {
          root._ = previousUnderscore;
          return this;
        };
        _.identity = function (value) {
          return value;
        };

        _.constant = function (value) {
          return function () {
            return value;
          };
        };

        _.property = function (key) {
          return function (obj) {
            return obj[key];
          };
        };
        _.matches = function (attrs) {
          return function (obj) {
            if (obj === attrs) return true; //avoid comparing an object to itself.
            for (var key in attrs) {
              if (attrs[key] !== obj[key]) return false;
            }
            return true;
          };
        };
        _.times = function (n, iterator, context) {
          var accum = Array(Math.max(0, n));
          for (var i = 0; i < n; i++) {
            accum[i] = iterator.call(context, i);
          }return accum;
        };
        _.random = function (min, max) {
          if (max == null) {
            max = min;
            min = 0;
          }
          return min + Math.floor(Math.random() * (max - min + 1));
        };
        _.now = Date.now || function () {
          return new Date().getTime();
        };
        var entityMap = {
          escape: {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;'
          }
        };
        entityMap.unescape = _.invert(entityMap.escape);
        var entityRegexes = {
          escape: new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
          unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
        };
        _.each(['escape', 'unescape'], function (method) {
          _[method] = function (string) {
            if (string == null) return '';
            return ('' + string).replace(entityRegexes[method], function (match) {
              return entityMap[method][match];
            });
          };
        });
        _.result = function (object, property) {
          if (object == null) return void 0;
          var value = object[property];
          return _.isFunction(value) ? value.call(object) : value;
        };
        _.mixin = function (obj) {
          each(_.functions(obj), function (name) {
            var func = _[name] = obj[name];
            _.prototype[name] = function () {
              var args = [this._wrapped];
              push.apply(args, arguments);
              return result.call(this, func.apply(_, args));
            };
          });
        };
        var idCounter = 0;
        _.uniqueId = function (prefix) {
          var id = ++idCounter + '';
          return prefix ? prefix + id : id;
        };
        _.templateSettings = {
          evaluate: /<%([\s\S]+?)%>/g,
          interpolate: /<%=([\s\S]+?)%>/g,
          escape: /<%-([\s\S]+?)%>/g
        };
        var noMatch = /(.)^/;
        var escapes = {
          "'": "'",
          '\\': '\\',
          '\r': 'r',
          '\n': 'n',
          '\t': 't',
          "\u2028": 'u2028',
          "\u2029": 'u2029'
        };

        var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
        _.template = function (text, data, settings) {
          var render;
          settings = _.defaults({}, settings, _.templateSettings);
          var matcher = new RegExp([(settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source].join('|') + '|$', 'g');
          var index = 0;
          var source = "__p+='";
          text.replace(matcher, function (match, escape, interpolate, evaluate, offset) {
            source += text.slice(index, offset).replace(escaper, function (match) {
              return '\\' + escapes[match];
            });

            if (escape) {
              source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
            }
            if (interpolate) {
              source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            }
            if (evaluate) {
              source += "';\n" + evaluate + "\n__p+='";
            }
            index = offset + match.length;
            return match;
          });
          source += "';\n";
          if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

          source = "var __t,__p='',__j=Array.prototype.join," + "print=function(){__p+=__j.call(arguments,'');};\n" + source + "return __p;\n";

          try {
            render = new Function(settings.variable || 'obj', '_', source);
          } catch (e) {
            e.source = source;
            throw e;
          }

          if (data) return render(data, _);
          var template = function template(data) {
            return render.call(this, data, _);
          };
          template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

          return template;
        };
        _.chain = function (obj) {
          return _(obj).chain();
        };
        var result = function result(obj) {
          return this._chain ? _(obj).chain() : obj;
        };
        _.mixin(_);
        each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function (name) {
          var method = ArrayProto[name];
          _.prototype[name] = function () {
            var obj = this._wrapped;
            method.apply(obj, arguments);
            if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
            return result.call(this, obj);
          };
        });
        each(['concat', 'join', 'slice'], function (name) {
          var method = ArrayProto[name];
          _.prototype[name] = function () {
            return result.call(this, method.apply(this._wrapped, arguments));
          };
        });

        _.extend(_.prototype, {
          chain: function chain() {
            this._chain = true;
            return this;
          },
          value: function value() {
            return this._wrapped;
          }

        });
        if (typeof define === 'function' && define.amd) {
          ace.define('underscore', [], function () {
            return _;
          });
        }
      }).call(this);
    }, {}],
    3: [function (_dereq_, module, exports) {

      var _ = _dereq_("underscore");
      var events = _dereq_("events");
      var vars = _dereq_("./vars.js");
      var messages = _dereq_("./messages.js");
      var Lexer = _dereq_("./lex.js").Lexer;
      var reg = _dereq_("./reg.js");
      var state = _dereq_("./state.js").state;
      var style = _dereq_("./style.js");

      var JSHINT = function () {
        "use strict";

        var anonname,
            // The guessed name for anonymous functions.
        api,
            // Extension API
        bang = {
          "<": true,
          "<=": true,
          "==": true,
          "===": true,
          "!==": true,
          "!=": true,
          ">": true,
          ">=": true,
          "+": true,
          "-": true,
          "*": true,
          "/": true,
          "%": true
        },
            boolOptions = {
          asi: true, // if automatic semicolon insertion should be tolerated
          bitwise: true, // if bitwise operators should not be allowed
          boss: true, // if advanced usage of assignments should be allowed
          browser: true, // if the standard browser globals should be predefined
          camelcase: true, // if identifiers should be required in camel case
          couch: true, // if CouchDB globals should be predefined
          curly: true, // if curly braces around all blocks should be required
          debug: true, // if debugger statements should be allowed
          devel: true, // if logging globals should be predefined (console, alert, etc.)
          dojo: true, // if Dojo Toolkit globals should be predefined
          eqeqeq: true, // if === should be required
          eqnull: true, // if == null comparisons should be tolerated
          notypeof: true, // if should report typos in typeof comparisons
          es3: true, // if ES3 syntax should be allowed
          es5: true, // if ES5 syntax should be allowed (is now set per default)
          esnext: true, // if es.next specific syntax should be allowed
          moz: true, // if mozilla specific syntax should be allowed
          evil: true, // if eval should be allowed
          expr: true, // if ExpressionStatement should be allowed as Programs
          forin: true, // if for in statements must filter
          funcscope: true, // if only function scope should be used for scope tests
          globalstrict: true, // if global "use strict"; should be allowed (also enables 'strict')
          immed: true, // if immediate invocations must be wrapped in parens
          iterator: true, // if the `__iterator__` property should be allowed
          jasmine: true, // Jasmine functions should be predefined
          jquery: true, // if jQuery globals should be predefined
          lastsemic: true, // if semicolons may be ommitted for the trailing
          laxbreak: true, // if line breaks should not be checked
          laxcomma: true, // if line breaks should not be checked around commas
          loopfunc: true, // if functions should be allowed to be defined within
          mootools: true, // if MooTools globals should be predefined
          multistr: true, // allow multiline strings
          freeze: true, // if modifying native object prototypes should be disallowed
          newcap: true, // if constructor names must be capitalized
          noarg: true, // if arguments.caller and arguments.callee should be
          node: true, // if the Node.js environment globals should be
          noempty: true, // if empty blocks should be disallowed
          nonbsp: true, // if non-breaking spaces should be disallowed
          nonew: true, // if using `new` for side-effects should be disallowed
          nonstandard: true, // if non-standard (but widely adopted) globals should
          phantom: true, // if PhantomJS symbols should be allowed
          plusplus: true, // if increment/decrement should not be allowed
          proto: true, // if the `__proto__` property should be allowed
          prototypejs: true, // if Prototype and Scriptaculous globals should be
          qunit: true, // if the QUnit environment globals should be predefined
          rhino: true, // if the Rhino environment globals should be predefined
          shelljs: true, // if ShellJS globals should be predefined
          typed: true, // if typed array globals should be predefined
          undef: true, // if variables should be declared before used
          scripturl: true, // if script-targeted URLs should be tolerated
          strict: true, // require the "use strict"; pragma
          sub: true, // if all forms of subscript notation are tolerated
          supernew: true, // if `new function () { ... };` and `new Object;`
          validthis: true, // if 'this' inside a non-constructor function is valid.
          withstmt: true, // if with statements should be allowed
          worker: true, // if Web Worker script symbols should be allowed
          wsh: true, // if the Windows Scripting Host environment globals
          yui: true, // YUI variables should be predefined
          mocha: true, // Mocha functions should be predefined
          noyield: true, // allow generators without a yield
          onecase: true, // if one case switch statements should be allowed
          regexp: true, // if the . should not be allowed in regexp literals
          regexdash: true // if unescaped first/last dash (-) inside brackets
        },
            valOptions = {
          maxlen: false,
          indent: false,
          maxerr: false,
          predef: false, // predef is deprecated and being replaced by globals
          globals: false,
          quotmark: false, // 'single'|'double'|true
          scope: false,
          maxstatements: false, // {int} max statements per function
          maxdepth: false, // {int} max nested block depth per function
          maxparams: false, // {int} max params per function
          maxcomplexity: false, // {int} max cyclomatic complexity per function
          shadow: false, // if variable shadowing should be tolerated
          unused: true, // warn if variables are unused. Available options:
          latedef: false, // warn if the variable is used before its definition
          ignore: false // start/end ignoring lines of code, bypassing the lexer
        },
            invertedOptions = {
          bitwise: true,
          forin: true,
          newcap: true,
          plusplus: true,
          regexp: true,
          undef: true,
          eqeqeq: true,
          strict: true
        },
            renamedOptions = {
          eqeq: "eqeqeq",
          windows: "wsh",
          sloppy: "strict"
        },
            removedOptions = {
          nomen: true,
          onevar: true,
          passfail: true,
          white: true,
          gcl: true,
          smarttabs: true,
          trailing: true
        },
            declared,
            // Globals that were declared using /*global ... */ syntax.
        exported,
            // Variables that are used outside of the current file.

        functionicity = ["closure", "exception", "global", "label", "outer", "unused", "var"],
            funct,
            // The current function
        functions,
            // All of the functions

        global,
            // The global scope
        implied,
            // Implied globals
        inblock,
            indent,
            lookahead,
            lex,
            member,
            membersOnly,
            noreach,
            predefined,
            // Global variables defined by option

        scope,
            // The current scope
        stack,
            unuseds,
            urls,
            extraModules = [],
            emitter = new events.EventEmitter();

        function checkOption(name, t) {
          name = name.trim();

          if (/^[+-]W\d{3}$/g.test(name)) {
            return true;
          }

          if (valOptions[name] === undefined && boolOptions[name] === undefined) {
            if (t.type !== "jslint" && !removedOptions[name]) {
              error("E001", t, name);
              return false;
            }
          }

          return true;
        }

        function isString(obj) {
          return Object.prototype.toString.call(obj) === "[object String]";
        }

        function isIdentifier(tkn, value) {
          if (!tkn) return false;

          if (!tkn.identifier || tkn.value !== value) return false;

          return true;
        }

        function isReserved(token) {
          if (!token.reserved) {
            return false;
          }
          var meta = token.meta;

          if (meta && meta.isFutureReservedWord && state.option.inES5()) {
            if (!meta.es5) {
              return false;
            }
            if (meta.strictOnly) {
              if (!state.option.strict && !state.directive["use strict"]) {
                return false;
              }
            }

            if (token.isProperty) {
              return false;
            }
          }

          return true;
        }

        function supplant(str, data) {
          return str.replace(/\{([^{}]*)\}/g, function (a, b) {
            var r = data[b];
            return typeof r === "string" || typeof r === "number" ? r : a;
          });
        }

        function combine(dest, src) {
          Object.keys(src).forEach(function (name) {
            if (_.has(JSHINT.blacklist, name)) return;
            dest[name] = src[name];
          });
        }

        function assume() {
          if (state.option.esnext) {
            combine(predefined, vars.newEcmaIdentifiers);
          }

          if (state.option.couch) {
            combine(predefined, vars.couch);
          }

          if (state.option.qunit) {
            combine(predefined, vars.qunit);
          }

          if (state.option.rhino) {
            combine(predefined, vars.rhino);
          }

          if (state.option.shelljs) {
            combine(predefined, vars.shelljs);
            combine(predefined, vars.node);
          }
          if (state.option.typed) {
            combine(predefined, vars.typed);
          }

          if (state.option.phantom) {
            combine(predefined, vars.phantom);
          }

          if (state.option.prototypejs) {
            combine(predefined, vars.prototypejs);
          }

          if (state.option.node) {
            combine(predefined, vars.node);
            combine(predefined, vars.typed);
          }

          if (state.option.devel) {
            combine(predefined, vars.devel);
          }

          if (state.option.dojo) {
            combine(predefined, vars.dojo);
          }

          if (state.option.browser) {
            combine(predefined, vars.browser);
            combine(predefined, vars.typed);
          }

          if (state.option.nonstandard) {
            combine(predefined, vars.nonstandard);
          }

          if (state.option.jasmine) {
            combine(predefined, vars.jasmine);
          }

          if (state.option.jquery) {
            combine(predefined, vars.jquery);
          }

          if (state.option.mootools) {
            combine(predefined, vars.mootools);
          }

          if (state.option.worker) {
            combine(predefined, vars.worker);
          }

          if (state.option.wsh) {
            combine(predefined, vars.wsh);
          }

          if (state.option.globalstrict && state.option.strict !== false) {
            state.option.strict = true;
          }

          if (state.option.yui) {
            combine(predefined, vars.yui);
          }

          if (state.option.mocha) {
            combine(predefined, vars.mocha);
          }

          state.option.inMoz = function (strict) {
            return state.option.moz;
          };

          state.option.inESNext = function (strict) {
            return state.option.moz || state.option.esnext;
          };

          state.option.inES5 = function () /* strict */{
            return !state.option.es3;
          };

          state.option.inES3 = function (strict) {
            if (strict) {
              return !state.option.moz && !state.option.esnext && state.option.es3;
            }
            return state.option.es3;
          };
        }
        function quit(code, line, chr) {
          var percentage = Math.floor(line / state.lines.length * 100);
          var message = messages.errors[code].desc;

          throw {
            name: "JSHintError",
            line: line,
            character: chr,
            message: message + " (" + percentage + "% scanned).",
            raw: message,
            code: code
          };
        }

        function isundef(scope, code, token, a) {
          return JSHINT.undefs.push([scope, code, token, a]);
        }

        function removeIgnoredMessages() {
          var ignored = state.ignoredLines;

          if (_.isEmpty(ignored)) return;
          JSHINT.errors = _.reject(JSHINT.errors, function (err) {
            return ignored[err.line];
          });
        }

        function warning(code, t, a, b, c, d) {
          var ch, l, w, msg;

          if (/^W\d{3}$/.test(code)) {
            if (state.ignored[code]) return;

            msg = messages.warnings[code];
          } else if (/E\d{3}/.test(code)) {
            msg = messages.errors[code];
          } else if (/I\d{3}/.test(code)) {
            msg = messages.info[code];
          }

          t = t || state.tokens.next;
          if (t.id === "(end)") {
            // `~
            t = state.tokens.curr;
          }

          l = t.line || 0;
          ch = t.from || 0;

          w = {
            id: "(error)",
            raw: msg.desc,
            code: msg.code,
            evidence: state.lines[l - 1] || "",
            line: l,
            character: ch,
            scope: JSHINT.scope,
            a: a,
            b: b,
            c: c,
            d: d
          };

          w.reason = supplant(msg.desc, w);
          JSHINT.errors.push(w);

          removeIgnoredMessages();

          if (JSHINT.errors.length >= state.option.maxerr) quit("E043", l, ch);

          return w;
        }

        function warningAt(m, l, ch, a, b, c, d) {
          return warning(m, {
            line: l,
            from: ch
          }, a, b, c, d);
        }

        function error(m, t, a, b, c, d) {
          warning(m, t, a, b, c, d);
        }

        function errorAt(m, l, ch, a, b, c, d) {
          return error(m, {
            line: l,
            from: ch
          }, a, b, c, d);
        }
        function addInternalSrc(elem, src) {
          var i;
          i = {
            id: "(internal)",
            elem: elem,
            value: src
          };
          JSHINT.internals.push(i);
          return i;
        }
        function addlabel(name, opts) {
          opts = opts || {};

          var type = opts.type;
          var token = opts.token;
          var islet = opts.islet;
          if (type === "exception") {
            if (_.has(funct["(context)"], name)) {
              if (funct[name] !== true && !state.option.node) {
                warning("W002", state.tokens.next, name);
              }
            }
          }

          if (_.has(funct, name) && !funct["(global)"]) {
            if (funct[name] === true) {
              if (state.option.latedef) {
                if (state.option.latedef === true && _.contains([funct[name], type], "unction") || !_.contains([funct[name], type], "unction")) {
                  warning("W003", state.tokens.next, name);
                }
              }
            } else {
              if ((!state.option.shadow || _.contains(["inner", "outer"], state.option.shadow)) && type !== "exception" || funct["(blockscope)"].getlabel(name)) {
                warning("W004", state.tokens.next, name);
              }
            }
          }

          if (funct["(context)"] && _.has(funct["(context)"], name) && type !== "function") {
            if (state.option.shadow === "outer") {
              warning("W123", state.tokens.next, name);
            }
          }
          if (islet) {
            funct["(blockscope)"].current.add(name, type, state.tokens.curr);
          } else {
            funct["(blockscope)"].shadow(name);
            funct[name] = type;

            if (token) {
              funct["(tokens)"][name] = token;
            }

            setprop(funct, name, { unused: opts.unused || false });

            if (funct["(global)"]) {
              global[name] = funct;
              if (_.has(implied, name)) {
                if (state.option.latedef) {
                  if (state.option.latedef === true && _.contains([funct[name], type], "unction") || !_.contains([funct[name], type], "unction")) {
                    warning("W003", state.tokens.next, name);
                  }
                }

                delete implied[name];
              }
            } else {
              scope[name] = funct;
            }
          }
        }

        function doOption() {
          var nt = state.tokens.next;
          var body = nt.body.match(/(-\s+)?[^\s,:]+(?:\s*:\s*(-\s+)?[^\s,]+)?/g) || [];
          var predef = {};

          if (nt.type === "globals") {
            body.forEach(function (g) {
              g = g.split(":");
              var key = (g[0] || "").trim();
              var val = (g[1] || "").trim();

              if (key.charAt(0) === "-") {
                key = key.slice(1);
                val = false;

                JSHINT.blacklist[key] = key;
                delete predefined[key];
              } else {
                predef[key] = val === "true";
              }
            });

            combine(predefined, predef);

            for (var key in predef) {
              if (_.has(predef, key)) {
                declared[key] = nt;
              }
            }
          }

          if (nt.type === "exported") {
            body.forEach(function (e) {
              exported[e] = true;
            });
          }

          if (nt.type === "members") {
            membersOnly = membersOnly || {};

            body.forEach(function (m) {
              var ch1 = m.charAt(0);
              var ch2 = m.charAt(m.length - 1);

              if (ch1 === ch2 && (ch1 === "\"" || ch1 === "'")) {
                m = m.substr(1, m.length - 2).replace("\\\"", "\"");
              }

              membersOnly[m] = false;
            });
          }

          var numvals = ["maxstatements", "maxparams", "maxdepth", "maxcomplexity", "maxerr", "maxlen", "indent"];

          if (nt.type === "jshint" || nt.type === "jslint") {
            body.forEach(function (g) {
              g = g.split(":");
              var key = (g[0] || "").trim();
              var val = (g[1] || "").trim();

              if (!checkOption(key, nt)) {
                return;
              }

              if (numvals.indexOf(key) >= 0) {
                if (val !== "false") {
                  val = +val;

                  if (typeof val !== "number" || !isFinite(val) || val <= 0 || Math.floor(val) !== val) {
                    error("E032", nt, g[1].trim());
                    return;
                  }

                  state.option[key] = val;
                } else {
                  state.option[key] = key === "indent" ? 4 : false;
                }

                return;
              }

              if (key === "validthis") {

                if (funct["(global)"]) return void error("E009");

                if (val !== "true" && val !== "false") return void error("E002", nt);

                state.option.validthis = val === "true";
                return;
              }

              if (key === "quotmark") {
                switch (val) {
                  case "true":
                  case "false":
                    state.option.quotmark = val === "true";
                    break;
                  case "double":
                  case "single":
                    state.option.quotmark = val;
                    break;
                  default:
                    error("E002", nt);
                }
                return;
              }

              if (key === "shadow") {
                switch (val) {
                  case "true":
                    state.option.shadow = true;
                    break;
                  case "outer":
                    state.option.shadow = "outer";
                    break;
                  case "false":
                  case "inner":
                    state.option.shadow = "inner";
                    break;
                  default:
                    error("E002", nt);
                }
                return;
              }

              if (key === "unused") {
                switch (val) {
                  case "true":
                    state.option.unused = true;
                    break;
                  case "false":
                    state.option.unused = false;
                    break;
                  case "vars":
                  case "strict":
                    state.option.unused = val;
                    break;
                  default:
                    error("E002", nt);
                }
                return;
              }

              if (key === "latedef") {
                switch (val) {
                  case "true":
                    state.option.latedef = true;
                    break;
                  case "false":
                    state.option.latedef = false;
                    break;
                  case "nofunc":
                    state.option.latedef = "nofunc";
                    break;
                  default:
                    error("E002", nt);
                }
                return;
              }

              if (key === "ignore") {
                switch (val) {
                  case "start":
                    state.ignoreLinterErrors = true;
                    break;
                  case "end":
                    state.ignoreLinterErrors = false;
                    break;
                  case "line":
                    state.ignoredLines[nt.line] = true;
                    removeIgnoredMessages();
                    break;
                  default:
                    error("E002", nt);
                }
                return;
              }

              var match = /^([+-])(W\d{3})$/g.exec(key);
              if (match) {
                state.ignored[match[2]] = match[1] === "-";
                return;
              }

              var tn;
              if (val === "true" || val === "false") {
                if (nt.type === "jslint") {
                  tn = renamedOptions[key] || key;
                  state.option[tn] = val === "true";

                  if (invertedOptions[tn] !== undefined) {
                    state.option[tn] = !state.option[tn];
                  }
                } else {
                  state.option[key] = val === "true";
                }

                if (key === "newcap") {
                  state.option["(explicitNewcap)"] = true;
                }
                return;
              }

              error("E002", nt);
            });

            assume();
          }
        }

        function peek(p) {
          var i = p || 0,
              j = 0,
              t;

          while (j <= i) {
            t = lookahead[j];
            if (!t) {
              t = lookahead[j] = lex.token();
            }
            j += 1;
          }
          return t;
        }

        function advance(id, t) {
          switch (state.tokens.curr.id) {
            case "(number)":
              if (state.tokens.next.id === ".") {
                warning("W005", state.tokens.curr);
              }
              break;
            case "-":
              if (state.tokens.next.id === "-" || state.tokens.next.id === "--") {
                warning("W006");
              }
              break;
            case "+":
              if (state.tokens.next.id === "+" || state.tokens.next.id === "++") {
                warning("W007");
              }
              break;
          }

          if (state.tokens.curr.type === "(string)" || state.tokens.curr.identifier) {
            anonname = state.tokens.curr.value;
          }

          if (id && state.tokens.next.id !== id) {
            if (t) {
              if (state.tokens.next.id === "(end)") {
                error("E019", t, t.id);
              } else {
                error("E020", state.tokens.next, id, t.id, t.line, state.tokens.next.value);
              }
            } else if (state.tokens.next.type !== "(identifier)" || state.tokens.next.value !== id) {
              warning("W116", state.tokens.next, id, state.tokens.next.value);
            }
          }

          state.tokens.prev = state.tokens.curr;
          state.tokens.curr = state.tokens.next;
          for (;;) {
            state.tokens.next = lookahead.shift() || lex.token();

            if (!state.tokens.next) {
              // No more tokens left, give up
              quit("E041", state.tokens.curr.line);
            }

            if (state.tokens.next.id === "(end)" || state.tokens.next.id === "(error)") {
              return;
            }

            if (state.tokens.next.check) {
              state.tokens.next.check();
            }

            if (state.tokens.next.isSpecial) {
              doOption();
            } else {
              if (state.tokens.next.id !== "(endline)") {
                break;
              }
            }
          }
        }

        function isInfix(token) {
          return token.infix || !token.identifier && !!token.led;
        }

        function isEndOfExpr() {
          var curr = state.tokens.curr;
          var next = state.tokens.next;
          if (next.id === ";" || next.id === "}" || next.id === ":") {
            return true;
          }
          if (isInfix(next) === isInfix(curr) || curr.id === "yield" && state.option.inMoz(true)) {
            return curr.line !== next.line;
          }
          return false;
        }

        function expression(rbp, initial) {
          var left,
              isArray = false,
              isObject = false,
              isLetExpr = false;
          if (!initial && state.tokens.next.value === "let" && peek(0).value === "(") {
            if (!state.option.inMoz(true)) {
              warning("W118", state.tokens.next, "let expressions");
            }
            isLetExpr = true;
            funct["(blockscope)"].stack();
            advance("let");
            advance("(");
            state.syntax["let"].fud.call(state.syntax["let"].fud, false);
            advance(")");
          }

          if (state.tokens.next.id === "(end)") error("E006", state.tokens.curr);

          var isDangerous = state.option.asi && state.tokens.prev.line < state.tokens.curr.line && _.contains(["]", ")"], state.tokens.prev.id) && _.contains(["[", "("], state.tokens.curr.id);

          if (isDangerous) warning("W014", state.tokens.curr, state.tokens.curr.id);

          advance();

          if (initial) {
            anonname = "anonymous";
            funct["(verb)"] = state.tokens.curr.value;
          }

          if (initial === true && state.tokens.curr.fud) {
            left = state.tokens.curr.fud();
          } else {
            if (state.tokens.curr.nud) {
              left = state.tokens.curr.nud();
            } else {
              error("E030", state.tokens.curr, state.tokens.curr.id);
            }

            while (rbp < state.tokens.next.lbp && !isEndOfExpr()) {
              isArray = state.tokens.curr.value === "Array";
              isObject = state.tokens.curr.value === "Object";
              if (left && (left.value || left.first && left.first.value)) {
                if (left.value !== "new" || left.first && left.first.value && left.first.value === ".") {
                  isArray = false;
                  if (left.value !== state.tokens.curr.value) {
                    isObject = false;
                  }
                }
              }

              advance();

              if (isArray && state.tokens.curr.id === "(" && state.tokens.next.id === ")") {
                warning("W009", state.tokens.curr);
              }

              if (isObject && state.tokens.curr.id === "(" && state.tokens.next.id === ")") {
                warning("W010", state.tokens.curr);
              }

              if (left && state.tokens.curr.led) {
                left = state.tokens.curr.led(left);
              } else {
                error("E033", state.tokens.curr, state.tokens.curr.id);
              }
            }
          }
          if (isLetExpr) {
            funct["(blockscope)"].unstack();
          }
          return left;
        }

        function nobreaknonadjacent(left, right) {
          left = left || state.tokens.curr;
          right = right || state.tokens.next;
          if (!state.option.laxbreak && left.line !== right.line) {
            warning("W014", right, right.value);
          }
        }

        function nolinebreak(t) {
          t = t || state.tokens.curr;
          if (t.line !== state.tokens.next.line) {
            warning("E022", t, t.value);
          }
        }

        function nobreakcomma(left, right) {
          if (left.line !== right.line) {
            if (!state.option.laxcomma) {
              if (comma.first) {
                warning("I001");
                comma.first = false;
              }
              warning("W014", left, right.value);
            }
          }
        }

        function comma(opts) {
          opts = opts || {};

          if (!opts.peek) {
            nobreakcomma(state.tokens.curr, state.tokens.next);
            advance(",");
          } else {
            nobreakcomma(state.tokens.prev, state.tokens.curr);
          }

          if (state.tokens.next.identifier && !(opts.property && state.option.inES5())) {
            switch (state.tokens.next.value) {
              case "break":
              case "case":
              case "catch":
              case "continue":
              case "default":
              case "do":
              case "else":
              case "finally":
              case "for":
              case "if":
              case "in":
              case "instanceof":
              case "return":
              case "switch":
              case "throw":
              case "try":
              case "var":
              case "let":
              case "while":
              case "with":
                error("E024", state.tokens.next, state.tokens.next.value);
                return false;
            }
          }

          if (state.tokens.next.type === "(punctuator)") {
            switch (state.tokens.next.value) {
              case "}":
              case "]":
              case ",":
                if (opts.allowTrailing) {
                  return true;
                }
              case ")":
                error("E024", state.tokens.next, state.tokens.next.value);
                return false;
            }
          }
          return true;
        }

        function symbol(s, p) {
          var x = state.syntax[s];
          if (!x || (typeof x === "undefined" ? "undefined" : _typeof(x)) !== "object") {
            state.syntax[s] = x = {
              id: s,
              lbp: p,
              value: s
            };
          }
          return x;
        }

        function delim(s) {
          return symbol(s, 0);
        }

        function stmt(s, f) {
          var x = delim(s);
          x.identifier = x.reserved = true;
          x.fud = f;
          return x;
        }

        function blockstmt(s, f) {
          var x = stmt(s, f);
          x.block = true;
          return x;
        }

        function reserveName(x) {
          var c = x.id.charAt(0);
          if (c >= "a" && c <= "z" || c >= "A" && c <= "Z") {
            x.identifier = x.reserved = true;
          }
          return x;
        }

        function prefix(s, f) {
          var x = symbol(s, 150);
          reserveName(x);

          x.nud = typeof f === "function" ? f : function () {
            this.right = expression(150);
            this.arity = "unary";

            if (this.id === "++" || this.id === "--") {
              if (state.option.plusplus) {
                warning("W016", this, this.id);
              } else if (this.right && (!this.right.identifier || isReserved(this.right)) && this.right.id !== "." && this.right.id !== "[") {
                warning("W017", this);
              }
            }

            return this;
          };

          return x;
        }

        function type(s, f) {
          var x = delim(s);
          x.type = s;
          x.nud = f;
          return x;
        }

        function reserve(name, func) {
          var x = type(name, func);
          x.identifier = true;
          x.reserved = true;
          return x;
        }

        function FutureReservedWord(name, meta) {
          var x = type(name, meta && meta.nud || function () {
            return this;
          });

          meta = meta || {};
          meta.isFutureReservedWord = true;

          x.value = name;
          x.identifier = true;
          x.reserved = true;
          x.meta = meta;

          return x;
        }

        function reservevar(s, v) {
          return reserve(s, function () {
            if (typeof v === "function") {
              v(this);
            }
            return this;
          });
        }

        function infix(s, f, p, w) {
          var x = symbol(s, p);
          reserveName(x);
          x.infix = true;
          x.led = function (left) {
            if (!w) {
              nobreaknonadjacent(state.tokens.prev, state.tokens.curr);
            }
            if (s === "in" && left.id === "!") {
              warning("W018", left, "!");
            }
            if (typeof f === "function") {
              return f(left, this);
            } else {
              this.left = left;
              this.right = expression(p);
              return this;
            }
          };
          return x;
        }

        function application(s) {
          var x = symbol(s, 42);

          x.led = function (left) {
            if (!state.option.inESNext()) {
              warning("W104", state.tokens.curr, "arrow function syntax (=>)");
            }

            nobreaknonadjacent(state.tokens.prev, state.tokens.curr);

            this.left = left;
            this.right = doFunction(undefined, undefined, false, left);
            return this;
          };
          return x;
        }

        function relation(s, f) {
          var x = symbol(s, 100);

          x.led = function (left) {
            nobreaknonadjacent(state.tokens.prev, state.tokens.curr);
            var right = expression(100);

            if (isIdentifier(left, "NaN") || isIdentifier(right, "NaN")) {
              warning("W019", this);
            } else if (f) {
              f.apply(this, [left, right]);
            }

            if (!left || !right) {
              quit("E041", state.tokens.curr.line);
            }

            if (left.id === "!") {
              warning("W018", left, "!");
            }

            if (right.id === "!") {
              warning("W018", right, "!");
            }

            this.left = left;
            this.right = right;
            return this;
          };
          return x;
        }

        function isPoorRelation(node) {
          return node && (node.type === "(number)" && +node.value === 0 || node.type === "(string)" && node.value === "" || node.type === "null" && !state.option.eqnull || node.type === "true" || node.type === "false" || node.type === "undefined");
        }

        function isTypoTypeof(left, right) {
          if (state.option.notypeof) return false;

          if (!left || !right) return false;

          var values = ["undefined", "object", "boolean", "number", "string", "function", "xml", "object", "unknown"];

          if (right.type === "(identifier)" && right.value === "typeof" && left.type === "(string)") return !_.contains(values, left.value);

          return false;
        }

        function findNativePrototype(left) {
          var natives = ["Array", "ArrayBuffer", "Boolean", "Collator", "DataView", "Date", "DateTimeFormat", "Error", "EvalError", "Float32Array", "Float64Array", "Function", "Infinity", "Intl", "Int16Array", "Int32Array", "Int8Array", "Iterator", "Number", "NumberFormat", "Object", "RangeError", "ReferenceError", "RegExp", "StopIteration", "String", "SyntaxError", "TypeError", "Uint16Array", "Uint32Array", "Uint8Array", "Uint8ClampedArray", "URIError"];

          function walkPrototype(obj) {
            if ((typeof obj === "undefined" ? "undefined" : _typeof(obj)) !== "object") return;
            return obj.right === "prototype" ? obj : walkPrototype(obj.left);
          }

          function walkNative(obj) {
            while (!obj.identifier && _typeof(obj.left) === "object") {
              obj = obj.left;
            }if (obj.identifier && natives.indexOf(obj.value) >= 0) return obj.value;
          }

          var prototype = walkPrototype(left);
          if (prototype) return walkNative(prototype);
        }

        function assignop(s, f, p) {
          var x = infix(s, typeof f === "function" ? f : function (left, that) {
            that.left = left;

            if (left) {
              if (state.option.freeze) {
                var nativeObject = findNativePrototype(left);
                if (nativeObject) warning("W121", left, nativeObject);
              }

              if (predefined[left.value] === false && scope[left.value]["(global)"] === true) {
                warning("W020", left);
              } else if (left["function"]) {
                warning("W021", left, left.value);
              }

              if (funct[left.value] === "const") {
                error("E013", left, left.value);
              }

              if (left.id === ".") {
                if (!left.left) {
                  warning("E031", that);
                } else if (left.left.value === "arguments" && !state.directive["use strict"]) {
                  warning("E031", that);
                }

                that.right = expression(10);
                return that;
              } else if (left.id === "[") {
                if (state.tokens.curr.left.first) {
                  state.tokens.curr.left.first.forEach(function (t) {
                    if (t && funct[t.value] === "const") {
                      error("E013", t, t.value);
                    }
                  });
                } else if (!left.left) {
                  warning("E031", that);
                } else if (left.left.value === "arguments" && !state.directive["use strict"]) {
                  warning("E031", that);
                }
                that.right = expression(10);
                return that;
              } else if (left.identifier && !isReserved(left)) {
                if (funct[left.value] === "exception") {
                  warning("W022", left);
                }
                that.right = expression(10);
                return that;
              }

              if (left === state.syntax["function"]) {
                warning("W023", state.tokens.curr);
              }
            }

            error("E031", that);
          }, p);

          x.exps = true;
          x.assign = true;
          return x;
        }

        function bitwise(s, f, p) {
          var x = symbol(s, p);
          reserveName(x);
          x.led = typeof f === "function" ? f : function (left) {
            if (state.option.bitwise) {
              warning("W016", this, this.id);
            }
            this.left = left;
            this.right = expression(p);
            return this;
          };
          return x;
        }

        function bitwiseassignop(s) {
          return assignop(s, function (left, that) {
            if (state.option.bitwise) {
              warning("W016", that, that.id);
            }

            if (left) {
              if (left.id === "." || left.id === "[" || left.identifier && !isReserved(left)) {
                expression(10);
                return that;
              }
              if (left === state.syntax["function"]) {
                warning("W023", state.tokens.curr);
              }
              return that;
            }
            error("E031", that);
          }, 20);
        }

        function suffix(s) {
          var x = symbol(s, 150);

          x.led = function (left) {
            if (state.option.plusplus) {
              warning("W016", this, this.id);
            } else if ((!left.identifier || isReserved(left)) && left.id !== "." && left.id !== "[") {
              warning("W017", this);
            }

            this.left = left;
            return this;
          };
          return x;
        }

        function optionalidentifier(fnparam, prop) {
          if (!state.tokens.next.identifier) {
            return;
          }

          advance();

          var curr = state.tokens.curr;
          var val = state.tokens.curr.value;

          if (!isReserved(curr)) {
            return val;
          }

          if (prop) {
            if (state.option.inES5()) {
              return val;
            }
          }

          if (fnparam && val === "undefined") {
            return val;
          }

          warning("W024", state.tokens.curr, state.tokens.curr.id);
          return val;
        }
        function identifier(fnparam, prop) {
          var i = optionalidentifier(fnparam, prop);
          if (i) {
            return i;
          }
          if (state.tokens.curr.id === "function" && state.tokens.next.id === "(") {
            warning("W025");
          } else {
            error("E030", state.tokens.next, state.tokens.next.value);
          }
        }

        function reachable(s) {
          var i = 0,
              t;
          if (state.tokens.next.id !== ";" || noreach) {
            return;
          }
          for (;;) {
            do {
              t = peek(i);
              i += 1;
            } while (t.id != "(end)" && t.id === "(comment)");

            if (t.reach) {
              return;
            }
            if (t.id !== "(endline)") {
              if (t.id === "function") {
                if (state.option.latedef === true) {
                  warning("W026", t);
                }
                break;
              }

              warning("W027", t, t.value, s);
              break;
            }
          }
        }

        function parseFinalSemicolon() {
          if (state.tokens.next.id !== ";") {
            if (!state.option.asi) {
              if (!state.option.lastsemic || state.tokens.next.id !== "}" || state.tokens.next.line !== state.tokens.curr.line) {
                warningAt("W033", state.tokens.curr.line, state.tokens.curr.character);
              }
            }
          } else {
            advance(";");
          }
        }

        function statement() {
          var values;
          var i = indent,
              r,
              s = scope,
              t = state.tokens.next;

          if (t.id === ";") {
            advance(";");
            return;
          }
          var res = isReserved(t);

          if (res && t.meta && t.meta.isFutureReservedWord && peek().id === ":") {
            warning("W024", t, t.id);
            res = false;
          }
          if (t.value === "module" && t.type === "(identifier)") {
            if (peek().type === "(identifier)") {
              if (!state.option.inESNext()) {
                warning("W119", state.tokens.curr, "module");
              }

              advance("module");
              var name = identifier();
              addlabel(name, { type: "unused", token: state.tokens.curr });
              advance("from");
              advance("(string)");
              parseFinalSemicolon();
              return;
            }
          }
          if (_.has(["[", "{"], t.value)) {
            if (lookupBlockType().isDestAssign) {
              if (!state.option.inESNext()) {
                warning("W104", state.tokens.curr, "destructuring expression");
              }
              values = destructuringExpression();
              values.forEach(function (tok) {
                isundef(funct, "W117", tok.token, tok.id);
              });
              advance("=");
              destructuringExpressionMatch(values, expression(10, true));
              advance(";");
              return;
            }
          }
          if (t.identifier && !res && peek().id === ":") {
            advance();
            advance(":");
            scope = Object.create(s);
            addlabel(t.value, { type: "label" });

            if (!state.tokens.next.labelled && state.tokens.next.value !== "{") {
              warning("W028", state.tokens.next, t.value, state.tokens.next.value);
            }

            state.tokens.next.label = t.value;
            t = state.tokens.next;
          }

          if (t.id === "{") {
            var iscase = funct["(verb)"] === "case" && state.tokens.curr.value === ":";
            block(true, true, false, false, iscase);
            return;
          }

          r = expression(0, true);

          if (r && (!r.identifier || r.value !== "function") && r.type !== "(punctuator)") {
            if (!state.directive["use strict"] && state.option.globalstrict && state.option.strict) {
              warning("E007");
            }
          }

          if (!t.block) {
            if (!state.option.expr && (!r || !r.exps)) {
              warning("W030", state.tokens.curr);
            } else if (state.option.nonew && r && r.left && r.id === "(" && r.left.id === "new") {
              warning("W031", t);
            }
            parseFinalSemicolon();
          }

          indent = i;
          scope = s;
          return r;
        }

        function statements(startLine) {
          var a = [],
              p;

          while (!state.tokens.next.reach && state.tokens.next.id !== "(end)") {
            if (state.tokens.next.id === ";") {
              p = peek();

              if (!p || p.id !== "(" && p.id !== "[") {
                warning("W032");
              }

              advance(";");
            } else {
              a.push(statement(startLine === state.tokens.next.line));
            }
          }
          return a;
        }
        function directives() {
          var i, p, pn;

          for (;;) {
            if (state.tokens.next.id === "(string)") {
              p = peek(0);
              if (p.id === "(endline)") {
                i = 1;
                do {
                  pn = peek(i);
                  i = i + 1;
                } while (pn.id === "(endline)");

                if (pn.id !== ";") {
                  if (pn.id !== "(string)" && pn.id !== "(number)" && pn.id !== "(regexp)" && pn.identifier !== true && pn.id !== "}") {
                    break;
                  }
                  warning("W033", state.tokens.next);
                } else {
                  p = pn;
                }
              } else if (p.id === "}") {
                warning("W033", p);
              } else if (p.id !== ";") {
                break;
              }

              advance();
              if (state.directive[state.tokens.curr.value]) {
                warning("W034", state.tokens.curr, state.tokens.curr.value);
              }

              if (state.tokens.curr.value === "use strict") {
                if (!state.option["(explicitNewcap)"]) state.option.newcap = true;
                state.option.undef = true;
              }
              state.directive[state.tokens.curr.value] = true;

              if (p.id === ";") {
                advance(";");
              }
              continue;
            }
            break;
          }
        }
        function block(ordinary, stmt, isfunc, isfatarrow, iscase) {
          var a,
              b = inblock,
              old_indent = indent,
              m,
              s = scope,
              t,
              line,
              d;

          inblock = ordinary;

          if (!ordinary || !state.option.funcscope) scope = Object.create(scope);

          t = state.tokens.next;

          var metrics = funct["(metrics)"];
          metrics.nestedBlockDepth += 1;
          metrics.verifyMaxNestedBlockDepthPerFunction();

          if (state.tokens.next.id === "{") {
            advance("{");
            funct["(blockscope)"].stack();

            line = state.tokens.curr.line;
            if (state.tokens.next.id !== "}") {
              indent += state.option.indent;
              while (!ordinary && state.tokens.next.from > indent) {
                indent += state.option.indent;
              }

              if (isfunc) {
                m = {};
                for (d in state.directive) {
                  if (_.has(state.directive, d)) {
                    m[d] = state.directive[d];
                  }
                }
                directives();

                if (state.option.strict && funct["(context)"]["(global)"]) {
                  if (!m["use strict"] && !state.directive["use strict"]) {
                    warning("E007");
                  }
                }
              }

              a = statements(line);

              metrics.statementCount += a.length;

              if (isfunc) {
                state.directive = m;
              }

              indent -= state.option.indent;
            }

            advance("}", t);

            funct["(blockscope)"].unstack();

            indent = old_indent;
          } else if (!ordinary) {
            if (isfunc) {
              m = {};
              if (stmt && !isfatarrow && !state.option.inMoz(true)) {
                error("W118", state.tokens.curr, "function closure expressions");
              }

              if (!stmt) {
                for (d in state.directive) {
                  if (_.has(state.directive, d)) {
                    m[d] = state.directive[d];
                  }
                }
              }
              expression(10);

              if (state.option.strict && funct["(context)"]["(global)"]) {
                if (!m["use strict"] && !state.directive["use strict"]) {
                  warning("E007");
                }
              }
            } else {
              error("E021", state.tokens.next, "{", state.tokens.next.value);
            }
          } else {
            funct["(nolet)"] = true;

            if (!stmt || state.option.curly) {
              warning("W116", state.tokens.next, "{", state.tokens.next.value);
            }

            noreach = true;
            indent += state.option.indent;
            a = [statement()];
            indent -= state.option.indent;
            noreach = false;

            delete funct["(nolet)"];
          }
          switch (funct["(verb)"]) {
            case "break":
            case "continue":
            case "return":
            case "throw":
              if (iscase) {
                break;
              }
            default:
              funct["(verb)"] = null;
          }

          if (!ordinary || !state.option.funcscope) scope = s;
          inblock = b;
          if (ordinary && state.option.noempty && (!a || a.length === 0)) {
            warning("W035");
          }
          metrics.nestedBlockDepth -= 1;
          return a;
        }

        function countMember(m) {
          if (membersOnly && typeof membersOnly[m] !== "boolean") {
            warning("W036", state.tokens.curr, m);
          }
          if (typeof member[m] === "number") {
            member[m] += 1;
          } else {
            member[m] = 1;
          }
        }

        function note_implied(tkn) {
          var name = tkn.value;
          var desc = Object.getOwnPropertyDescriptor(implied, name);

          if (!desc) implied[name] = [tkn.line];else desc.value.push(tkn.line);
        }

        type("(number)", function () {
          return this;
        });

        type("(string)", function () {
          return this;
        });

        type("(template)", function () {
          return this;
        });

        state.syntax["(identifier)"] = {
          type: "(identifier)",
          lbp: 0,
          identifier: true,

          nud: function nud() {
            var v = this.value;
            var s = scope[v];
            var f;
            var block;

            if (typeof s === "function") {
              s = undefined;
            } else if (!funct["(blockscope)"].current.has(v) && typeof s === "boolean") {
              f = funct;
              funct = functions[0];
              addlabel(v, { type: "var" });
              s = funct;
              funct = f;
            }

            block = funct["(blockscope)"].getlabel(v);
            if (funct === s || block) {
              switch (block ? block[v]["(type)"] : funct[v]) {
                case "unused":
                  if (block) block[v]["(type)"] = "var";else funct[v] = "var";
                  break;
                case "unction":
                  if (block) block[v]["(type)"] = "function";else funct[v] = "function";
                  this["function"] = true;
                  break;
                case "const":
                  setprop(funct, v, { unused: false });
                  break;
                case "function":
                  this["function"] = true;
                  break;
                case "label":
                  warning("W037", state.tokens.curr, v);
                  break;
              }
            } else if (funct["(global)"]) {

              if (typeof predefined[v] !== "boolean") {
                if (!(anonname === "typeof" || anonname === "delete") || state.tokens.next && (state.tokens.next.value === "." || state.tokens.next.value === "[")) {

                  if (!funct["(comparray)"].check(v)) {
                    isundef(funct, "W117", state.tokens.curr, v);
                  }
                }
              }

              note_implied(state.tokens.curr);
            } else {

              switch (funct[v]) {
                case "closure":
                case "function":
                case "var":
                case "unused":
                  warning("W038", state.tokens.curr, v);
                  break;
                case "label":
                  warning("W037", state.tokens.curr, v);
                  break;
                case "outer":
                case "global":
                  break;
                default:
                  if (s === true) {
                    funct[v] = true;
                  } else if (s === null) {
                    warning("W039", state.tokens.curr, v);
                    note_implied(state.tokens.curr);
                  } else if ((typeof s === "undefined" ? "undefined" : _typeof(s)) !== "object") {
                    if (!(anonname === "typeof" || anonname === "delete") || state.tokens.next && (state.tokens.next.value === "." || state.tokens.next.value === "[")) {

                      isundef(funct, "W117", state.tokens.curr, v);
                    }
                    funct[v] = true;
                    note_implied(state.tokens.curr);
                  } else {
                    switch (s[v]) {
                      case "function":
                      case "unction":
                        this["function"] = true;
                        s[v] = "closure";
                        funct[v] = s["(global)"] ? "global" : "outer";
                        break;
                      case "var":
                      case "unused":
                        s[v] = "closure";
                        funct[v] = s["(global)"] ? "global" : "outer";
                        break;
                      case "const":
                        setprop(s, v, { unused: false });
                        break;
                      case "closure":
                        funct[v] = s["(global)"] ? "global" : "outer";
                        break;
                      case "label":
                        warning("W037", state.tokens.curr, v);
                    }
                  }
              }
            }
            return this;
          },

          led: function led() {
            error("E033", state.tokens.next, state.tokens.next.value);
          }
        };

        type("(regexp)", function () {
          return this;
        });

        delim("(endline)");
        delim("(begin)");
        delim("(end)").reach = true;
        delim("(error)").reach = true;
        delim("}").reach = true;
        delim(")");
        delim("]");
        delim("\"").reach = true;
        delim("'").reach = true;
        delim(";");
        delim(":").reach = true;
        delim("#");

        reserve("else");
        reserve("case").reach = true;
        reserve("catch");
        reserve("default").reach = true;
        reserve("finally");
        reservevar("arguments", function (x) {
          if (state.directive["use strict"] && funct["(global)"]) {
            warning("E008", x);
          }
        });
        reservevar("eval");
        reservevar("false");
        reservevar("Infinity");
        reservevar("null");
        reservevar("this", function (x) {
          if (state.directive["use strict"] && !state.option.validthis && (funct["(statement)"] && funct["(name)"].charAt(0) > "Z" || funct["(global)"])) {
            warning("W040", x);
          }
        });
        reservevar("true");
        reservevar("undefined");

        assignop("=", "assign", 20);
        assignop("+=", "assignadd", 20);
        assignop("-=", "assignsub", 20);
        assignop("*=", "assignmult", 20);
        assignop("/=", "assigndiv", 20).nud = function () {
          error("E014");
        };
        assignop("%=", "assignmod", 20);

        bitwiseassignop("&=", "assignbitand", 20);
        bitwiseassignop("|=", "assignbitor", 20);
        bitwiseassignop("^=", "assignbitxor", 20);
        bitwiseassignop("<<=", "assignshiftleft", 20);
        bitwiseassignop(">>=", "assignshiftright", 20);
        bitwiseassignop(">>>=", "assignshiftrightunsigned", 20);
        infix(",", function (left, that) {
          var expr;
          that.exprs = [left];
          if (!comma({ peek: true })) {
            return that;
          }
          while (true) {
            if (!(expr = expression(10))) {
              break;
            }
            that.exprs.push(expr);
            if (state.tokens.next.value !== "," || !comma()) {
              break;
            }
          }
          return that;
        }, 10, true);

        infix("?", function (left, that) {
          increaseComplexityCount();
          that.left = left;
          that.right = expression(10);
          advance(":");
          that["else"] = expression(10);
          return that;
        }, 30);

        var orPrecendence = 40;
        infix("||", function (left, that) {
          increaseComplexityCount();
          that.left = left;
          that.right = expression(orPrecendence);
          return that;
        }, orPrecendence);
        infix("&&", "and", 50);
        bitwise("|", "bitor", 70);
        bitwise("^", "bitxor", 80);
        bitwise("&", "bitand", 90);
        relation("==", function (left, right) {
          var eqnull = state.option.eqnull && (left.value === "null" || right.value === "null");

          switch (true) {
            case !eqnull && state.option.eqeqeq:
              this.from = this.character;
              warning("W116", this, "===", "==");
              break;
            case isPoorRelation(left):
              warning("W041", this, "===", left.value);
              break;
            case isPoorRelation(right):
              warning("W041", this, "===", right.value);
              break;
            case isTypoTypeof(right, left):
              warning("W122", this, right.value);
              break;
            case isTypoTypeof(left, right):
              warning("W122", this, left.value);
              break;
          }

          return this;
        });
        relation("===", function (left, right) {
          if (isTypoTypeof(right, left)) {
            warning("W122", this, right.value);
          } else if (isTypoTypeof(left, right)) {
            warning("W122", this, left.value);
          }
          return this;
        });
        relation("!=", function (left, right) {
          var eqnull = state.option.eqnull && (left.value === "null" || right.value === "null");

          if (!eqnull && state.option.eqeqeq) {
            this.from = this.character;
            warning("W116", this, "!==", "!=");
          } else if (isPoorRelation(left)) {
            warning("W041", this, "!==", left.value);
          } else if (isPoorRelation(right)) {
            warning("W041", this, "!==", right.value);
          } else if (isTypoTypeof(right, left)) {
            warning("W122", this, right.value);
          } else if (isTypoTypeof(left, right)) {
            warning("W122", this, left.value);
          }
          return this;
        });
        relation("!==", function (left, right) {
          if (isTypoTypeof(right, left)) {
            warning("W122", this, right.value);
          } else if (isTypoTypeof(left, right)) {
            warning("W122", this, left.value);
          }
          return this;
        });
        relation("<");
        relation(">");
        relation("<=");
        relation(">=");
        bitwise("<<", "shiftleft", 120);
        bitwise(">>", "shiftright", 120);
        bitwise(">>>", "shiftrightunsigned", 120);
        infix("in", "in", 120);
        infix("instanceof", "instanceof", 120);
        infix("+", function (left, that) {
          var right = expression(130);
          if (left && right && left.id === "(string)" && right.id === "(string)") {
            left.value += right.value;
            left.character = right.character;
            if (!state.option.scripturl && reg.javascriptURL.test(left.value)) {
              warning("W050", left);
            }
            return left;
          }
          that.left = left;
          that.right = right;
          return that;
        }, 130);
        prefix("+", "num");
        prefix("+++", function () {
          warning("W007");
          this.right = expression(150);
          this.arity = "unary";
          return this;
        });
        infix("+++", function (left) {
          warning("W007");
          this.left = left;
          this.right = expression(130);
          return this;
        }, 130);
        infix("-", "sub", 130);
        prefix("-", "neg");
        prefix("---", function () {
          warning("W006");
          this.right = expression(150);
          this.arity = "unary";
          return this;
        });
        infix("---", function (left) {
          warning("W006");
          this.left = left;
          this.right = expression(130);
          return this;
        }, 130);
        infix("*", "mult", 140);
        infix("/", "div", 140);
        infix("%", "mod", 140);

        suffix("++", "postinc");
        prefix("++", "preinc");
        state.syntax["++"].exps = true;

        suffix("--", "postdec");
        prefix("--", "predec");
        state.syntax["--"].exps = true;
        prefix("delete", function () {
          var p = expression(10);
          if (!p || p.id !== "." && p.id !== "[") {
            warning("W051");
          }
          this.first = p;
          return this;
        }).exps = true;

        prefix("~", function () {
          if (state.option.bitwise) {
            warning("W052", this, "~");
          }
          expression(150);
          return this;
        });

        prefix("...", function () {
          if (!state.option.inESNext()) {
            warning("W104", this, "spread/rest operator");
          }
          if (!state.tokens.next.identifier) {
            error("E030", state.tokens.next, state.tokens.next.value);
          }
          expression(150);
          return this;
        });

        prefix("!", function () {
          this.right = expression(150);
          this.arity = "unary";

          if (!this.right) {
            // '!' followed by nothing? Give up.
            quit("E041", this.line || 0);
          }

          if (bang[this.right.id] === true) {
            warning("W018", this, "!");
          }
          return this;
        });

        prefix("typeof", "typeof");
        prefix("new", function () {
          var c = expression(155),
              i;
          if (c && c.id !== "function") {
            if (c.identifier) {
              c["new"] = true;
              switch (c.value) {
                case "Number":
                case "String":
                case "Boolean":
                case "Math":
                case "JSON":
                  warning("W053", state.tokens.prev, c.value);
                  break;
                case "Function":
                  if (!state.option.evil) {
                    warning("W054");
                  }
                  break;
                case "Date":
                case "RegExp":
                case "this":
                  break;
                default:
                  if (c.id !== "function") {
                    i = c.value.substr(0, 1);
                    if (state.option.newcap && (i < "A" || i > "Z") && !_.has(global, c.value)) {
                      warning("W055", state.tokens.curr);
                    }
                  }
              }
            } else {
              if (c.id !== "." && c.id !== "[" && c.id !== "(") {
                warning("W056", state.tokens.curr);
              }
            }
          } else {
            if (!state.option.supernew) warning("W057", this);
          }
          if (state.tokens.next.id !== "(" && !state.option.supernew) {
            warning("W058", state.tokens.curr, state.tokens.curr.value);
          }
          this.first = c;
          return this;
        });
        state.syntax["new"].exps = true;

        prefix("void").exps = true;

        infix(".", function (left, that) {
          var m = identifier(false, true);

          if (typeof m === "string") {
            countMember(m);
          }

          that.left = left;
          that.right = m;

          if (m && m === "hasOwnProperty" && state.tokens.next.value === "=") {
            warning("W001");
          }

          if (left && left.value === "arguments" && (m === "callee" || m === "caller")) {
            if (state.option.noarg) warning("W059", left, m);else if (state.directive["use strict"]) error("E008");
          } else if (!state.option.evil && left && left.value === "document" && (m === "write" || m === "writeln")) {
            warning("W060", left);
          }

          if (!state.option.evil && (m === "eval" || m === "execScript")) {
            warning("W061");
          }

          return that;
        }, 160, true);

        infix("(", function (left, that) {
          if (state.option.immed && left && !left.immed && left.id === "function") {
            warning("W062");
          }

          var n = 0;
          var p = [];

          if (left) {
            if (left.type === "(identifier)") {
              if (left.value.match(/^[A-Z]([A-Z0-9_$]*[a-z][A-Za-z0-9_$]*)?$/)) {
                if ("Number String Boolean Date Object Error".indexOf(left.value) === -1) {
                  if (left.value === "Math") {
                    warning("W063", left);
                  } else if (state.option.newcap) {
                    warning("W064", left);
                  }
                }
              }
            }
          }

          if (state.tokens.next.id !== ")") {
            for (;;) {
              p[p.length] = expression(10);
              n += 1;
              if (state.tokens.next.id !== ",") {
                break;
              }
              comma();
            }
          }

          advance(")");

          if ((typeof left === "undefined" ? "undefined" : _typeof(left)) === "object") {
            if (state.option.inES3() && left.value === "parseInt" && n === 1) {
              warning("W065", state.tokens.curr);
            }
            if (!state.option.evil) {
              if (left.value === "eval" || left.value === "Function" || left.value === "execScript") {
                warning("W061", left);

                if (p[0] && [0].id === "(string)") {
                  addInternalSrc(left, p[0].value);
                }
              } else if (p[0] && p[0].id === "(string)" && (left.value === "setTimeout" || left.value === "setInterval")) {
                warning("W066", left);
                addInternalSrc(left, p[0].value);
              } else if (p[0] && p[0].id === "(string)" && left.value === "." && left.left.value === "window" && (left.right === "setTimeout" || left.right === "setInterval")) {
                warning("W066", left);
                addInternalSrc(left, p[0].value);
              }
            }
            if (!left.identifier && left.id !== "." && left.id !== "[" && left.id !== "(" && left.id !== "&&" && left.id !== "||" && left.id !== "?") {
              warning("W067", left);
            }
          }

          that.left = left;
          return that;
        }, 155, true).exps = true;

        prefix("(", function () {
          var bracket,
              brackets = [];
          var pn,
              pn1,
              i = 0;
          var ret;
          var parens = 1;

          do {
            pn = peek(i);

            if (pn.value === "(") {
              parens += 1;
            } else if (pn.value === ")") {
              parens -= 1;
            }

            i += 1;
            pn1 = peek(i);
          } while (!(parens === 0 && pn.value === ")") && pn1.value !== "=>" && pn1.value !== ";" && pn1.type !== "(end)");

          if (state.tokens.next.id === "function") {
            state.tokens.next.immed = true;
          }

          var exprs = [];

          if (state.tokens.next.id !== ")") {
            for (;;) {
              if (pn1.value === "=>" && _.contains(["{", "["], state.tokens.next.value)) {
                bracket = state.tokens.next;
                bracket.left = destructuringExpression();
                brackets.push(bracket);
                for (var t in bracket.left) {
                  exprs.push(bracket.left[t].token);
                }
              } else {
                exprs.push(expression(10));
              }
              if (state.tokens.next.id !== ",") {
                break;
              }
              comma();
            }
          }

          advance(")", this);
          if (state.option.immed && exprs[0] && exprs[0].id === "function") {
            if (state.tokens.next.id !== "(" && (state.tokens.next.id !== "." || peek().value !== "call" && peek().value !== "apply")) {
              warning("W068", this);
            }
          }

          if (state.tokens.next.value === "=>") {
            return exprs;
          }
          if (!exprs.length) {
            return;
          }
          if (exprs.length > 1) {
            ret = Object.create(state.syntax[","]);
            ret.exprs = exprs;
          } else {
            ret = exprs[0];
          }
          if (ret) {
            ret.paren = true;
          }
          return ret;
        });

        application("=>");

        infix("[", function (left, that) {
          var e = expression(10),
              s;
          if (e && e.type === "(string)") {
            if (!state.option.evil && (e.value === "eval" || e.value === "execScript")) {
              warning("W061", that);
            }

            countMember(e.value);
            if (!state.option.sub && reg.identifier.test(e.value)) {
              s = state.syntax[e.value];
              if (!s || !isReserved(s)) {
                warning("W069", state.tokens.prev, e.value);
              }
            }
          }
          advance("]", that);

          if (e && e.value === "hasOwnProperty" && state.tokens.next.value === "=") {
            warning("W001");
          }

          that.left = left;
          that.right = e;
          return that;
        }, 160, true);

        function comprehensiveArrayExpression() {
          var res = {};
          res.exps = true;
          funct["(comparray)"].stack();
          var reversed = false;
          if (state.tokens.next.value !== "for") {
            reversed = true;
            if (!state.option.inMoz(true)) {
              warning("W116", state.tokens.next, "for", state.tokens.next.value);
            }
            funct["(comparray)"].setState("use");
            res.right = expression(10);
          }

          advance("for");
          if (state.tokens.next.value === "each") {
            advance("each");
            if (!state.option.inMoz(true)) {
              warning("W118", state.tokens.curr, "for each");
            }
          }
          advance("(");
          funct["(comparray)"].setState("define");
          res.left = expression(130);
          if (_.contains(["in", "of"], state.tokens.next.value)) {
            advance();
          } else {
            error("E045", state.tokens.curr);
          }
          funct["(comparray)"].setState("generate");
          expression(10);

          advance(")");
          if (state.tokens.next.value === "if") {
            advance("if");
            advance("(");
            funct["(comparray)"].setState("filter");
            res.filter = expression(10);
            advance(")");
          }

          if (!reversed) {
            funct["(comparray)"].setState("use");
            res.right = expression(10);
          }

          advance("]");
          funct["(comparray)"].unstack();
          return res;
        }

        prefix("[", function () {
          var blocktype = lookupBlockType(true);
          if (blocktype.isCompArray) {
            if (!state.option.inESNext()) {
              warning("W119", state.tokens.curr, "array comprehension");
            }
            return comprehensiveArrayExpression();
          } else if (blocktype.isDestAssign && !state.option.inESNext()) {
            warning("W104", state.tokens.curr, "destructuring assignment");
          }
          var b = state.tokens.curr.line !== state.tokens.next.line;
          this.first = [];
          if (b) {
            indent += state.option.indent;
            if (state.tokens.next.from === indent + state.option.indent) {
              indent += state.option.indent;
            }
          }
          while (state.tokens.next.id !== "(end)") {
            while (state.tokens.next.id === ",") {
              if (!state.option.inES5()) warning("W070");
              advance(",");
            }

            if (state.tokens.next.id === "]") {
              break;
            }

            this.first.push(expression(10));
            if (state.tokens.next.id === ",") {
              comma({ allowTrailing: true });
              if (state.tokens.next.id === "]" && !state.option.inES5(true)) {
                warning("W070", state.tokens.curr);
                break;
              }
            } else {
              break;
            }
          }
          if (b) {
            indent -= state.option.indent;
          }
          advance("]", this);
          return this;
        }, 160);

        function property_name() {
          var id = optionalidentifier(false, true);

          if (!id) {
            if (state.tokens.next.id === "(string)") {
              id = state.tokens.next.value;
              advance();
            } else if (state.tokens.next.id === "(number)") {
              id = state.tokens.next.value.toString();
              advance();
            }
          }

          if (id === "hasOwnProperty") {
            warning("W001");
          }

          return id;
        }

        function functionparams(parsed) {
          var curr, next;
          var params = [];
          var ident;
          var tokens = [];
          var t;
          var pastDefault = false;

          if (parsed) {
            if (Array.isArray(parsed)) {
              for (var i in parsed) {
                curr = parsed[i];
                if (curr.value === "...") {
                  if (!state.option.inESNext()) {
                    warning("W104", curr, "spread/rest operator");
                  }
                  continue;
                } else if (curr.value !== ",") {
                  params.push(curr.value);
                  addlabel(curr.value, { type: "unused", token: curr });
                }
              }
              return params;
            } else {
              if (parsed.identifier === true) {
                addlabel(parsed.value, { type: "unused", token: parsed });
                return [parsed];
              }
            }
          }

          next = state.tokens.next;

          advance("(");

          if (state.tokens.next.id === ")") {
            advance(")");
            return;
          }

          for (;;) {
            if (_.contains(["{", "["], state.tokens.next.id)) {
              tokens = destructuringExpression();
              for (t in tokens) {
                t = tokens[t];
                if (t.id) {
                  params.push(t.id);
                  addlabel(t.id, { type: "unused", token: t.token });
                }
              }
            } else if (state.tokens.next.value === "...") {
              if (!state.option.inESNext()) {
                warning("W104", state.tokens.next, "spread/rest operator");
              }
              advance("...");
              ident = identifier(true);
              params.push(ident);
              addlabel(ident, { type: "unused", token: state.tokens.curr });
            } else {
              ident = identifier(true);
              params.push(ident);
              addlabel(ident, { type: "unused", token: state.tokens.curr });
            }
            if (pastDefault) {
              if (state.tokens.next.id !== "=") {
                error("E051", state.tokens.current);
              }
            }
            if (state.tokens.next.id === "=") {
              if (!state.option.inESNext()) {
                warning("W119", state.tokens.next, "default parameters");
              }
              advance("=");
              pastDefault = true;
              expression(10);
            }
            if (state.tokens.next.id === ",") {
              comma();
            } else {
              advance(")", next);
              return params;
            }
          }
        }

        function setprop(funct, name, values) {
          if (!funct["(properties)"][name]) {
            funct["(properties)"][name] = { unused: false };
          }

          _.extend(funct["(properties)"][name], values);
        }

        function getprop(funct, name, prop) {
          if (!funct["(properties)"][name]) return null;

          return funct["(properties)"][name][prop] || null;
        }

        function functor(name, token, scope, overwrites) {
          var funct = {
            "(name)": name,
            "(breakage)": 0,
            "(loopage)": 0,
            "(scope)": scope,
            "(tokens)": {},
            "(properties)": {},

            "(catch)": false,
            "(global)": false,

            "(line)": null,
            "(character)": null,
            "(metrics)": null,
            "(statement)": null,
            "(context)": null,
            "(blockscope)": null,
            "(comparray)": null,
            "(generator)": null,
            "(params)": null
          };

          if (token) {
            _.extend(funct, {
              "(line)": token.line,
              "(character)": token.character,
              "(metrics)": createMetrics(token)
            });
          }

          _.extend(funct, overwrites);

          if (funct["(context)"]) {
            funct["(blockscope)"] = funct["(context)"]["(blockscope)"];
            funct["(comparray)"] = funct["(context)"]["(comparray)"];
          }

          return funct;
        }

        function doFunction(name, statement, generator, fatarrowparams) {
          var f;
          var oldOption = state.option;
          var oldIgnored = state.ignored;
          var oldScope = scope;

          state.option = Object.create(state.option);
          state.ignored = Object.create(state.ignored);
          scope = Object.create(scope);

          funct = functor(name || "\"" + anonname + "\"", state.tokens.next, scope, {
            "(statement)": statement,
            "(context)": funct,
            "(generator)": generator ? true : null
          });

          f = funct;
          state.tokens.curr.funct = funct;

          functions.push(funct);

          if (name) {
            addlabel(name, { type: "function" });
          }

          funct["(params)"] = functionparams(fatarrowparams);
          funct["(metrics)"].verifyMaxParametersPerFunction(funct["(params)"]);

          JSHINT.undefs = _.filter(JSHINT.undefs, function (item) {
            return !_.contains(_.union(fatarrowparams), item[2]);
          });

          block(false, true, true, fatarrowparams ? true : false);

          if (!state.option.noyield && generator && funct["(generator)"] !== "yielded") {
            warning("W124", state.tokens.curr);
          }

          funct["(metrics)"].verifyMaxStatementsPerFunction();
          funct["(metrics)"].verifyMaxComplexityPerFunction();
          funct["(unusedOption)"] = state.option.unused;

          scope = oldScope;
          state.option = oldOption;
          state.ignored = oldIgnored;
          funct["(last)"] = state.tokens.curr.line;
          funct["(lastcharacter)"] = state.tokens.curr.character;

          _.map(Object.keys(funct), function (key) {
            if (key[0] === "(") return;
            funct["(blockscope)"].unshadow(key);
          });

          funct = funct["(context)"];

          return f;
        }

        function createMetrics(functionStartToken) {
          return {
            statementCount: 0,
            nestedBlockDepth: -1,
            ComplexityCount: 1,

            verifyMaxStatementsPerFunction: function verifyMaxStatementsPerFunction() {
              if (state.option.maxstatements && this.statementCount > state.option.maxstatements) {
                warning("W071", functionStartToken, this.statementCount);
              }
            },

            verifyMaxParametersPerFunction: function verifyMaxParametersPerFunction(params) {
              params = params || [];

              if (state.option.maxparams && params.length > state.option.maxparams) {
                warning("W072", functionStartToken, params.length);
              }
            },

            verifyMaxNestedBlockDepthPerFunction: function verifyMaxNestedBlockDepthPerFunction() {
              if (state.option.maxdepth && this.nestedBlockDepth > 0 && this.nestedBlockDepth === state.option.maxdepth + 1) {
                warning("W073", null, this.nestedBlockDepth);
              }
            },

            verifyMaxComplexityPerFunction: function verifyMaxComplexityPerFunction() {
              var max = state.option.maxcomplexity;
              var cc = this.ComplexityCount;
              if (max && cc > max) {
                warning("W074", functionStartToken, cc);
              }
            }
          };
        }

        function increaseComplexityCount() {
          funct["(metrics)"].ComplexityCount += 1;
        }

        function checkCondAssignment(expr) {
          var id, paren;
          if (expr) {
            id = expr.id;
            paren = expr.paren;
            if (id === "," && (expr = expr.exprs[expr.exprs.length - 1])) {
              id = expr.id;
              paren = paren || expr.paren;
            }
          }
          switch (id) {
            case "=":
            case "+=":
            case "-=":
            case "*=":
            case "%=":
            case "&=":
            case "|=":
            case "^=":
            case "/=":
              if (!paren && !state.option.boss) {
                warning("W084");
              }
          }
        }

        (function (x) {
          x.nud = function (isclassdef) {
            var b, f, i, p, t, g;
            var props = {}; // All properties, including accessors
            var tag = "";

            function saveProperty(name, tkn) {
              if (props[name] && _.has(props, name)) warning("W075", state.tokens.next, i);else props[name] = {};

              props[name].basic = true;
              props[name].basictkn = tkn;
            }

            function saveSetter(name, tkn) {
              if (props[name] && _.has(props, name)) {
                if (props[name].basic || props[name].setter) warning("W075", state.tokens.next, i);
              } else {
                props[name] = {};
              }

              props[name].setter = true;
              props[name].setterToken = tkn;
            }

            function saveGetter(name) {
              if (props[name] && _.has(props, name)) {
                if (props[name].basic || props[name].getter) warning("W075", state.tokens.next, i);
              } else {
                props[name] = {};
              }

              props[name].getter = true;
              props[name].getterToken = state.tokens.curr;
            }

            b = state.tokens.curr.line !== state.tokens.next.line;
            if (b) {
              indent += state.option.indent;
              if (state.tokens.next.from === indent + state.option.indent) {
                indent += state.option.indent;
              }
            }

            for (;;) {
              if (state.tokens.next.id === "}") {
                break;
              }

              if (isclassdef && state.tokens.next.value === "static") {
                advance("static");
                tag = "static ";
              }

              if (state.tokens.next.value === "get" && peek().id !== ":") {
                advance("get");

                if (!state.option.inES5(!isclassdef)) {
                  error("E034");
                }

                i = property_name();
                if (!i && !state.option.inESNext()) {
                  error("E035");
                }
                if (isclassdef && i === "constructor") {
                  error("E049", state.tokens.next, "class getter method", i);
                }
                if (i) {
                  saveGetter(tag + i);
                }

                t = state.tokens.next;
                f = doFunction();
                p = f["(params)"];
                if (i && p) {
                  warning("W076", t, p[0], i);
                }
              } else if (state.tokens.next.value === "set" && peek().id !== ":") {
                advance("set");

                if (!state.option.inES5(!isclassdef)) {
                  error("E034");
                }

                i = property_name();
                if (!i && !state.option.inESNext()) {
                  error("E035");
                }
                if (isclassdef && i === "constructor") {
                  error("E049", state.tokens.next, "class setter method", i);
                }
                if (i) {
                  saveSetter(tag + i, state.tokens.next);
                }

                t = state.tokens.next;
                f = doFunction();
                p = f["(params)"];
                if (i && (!p || p.length !== 1)) {
                  warning("W077", t, i);
                }
              } else {
                g = false;
                if (state.tokens.next.value === "*" && state.tokens.next.type === "(punctuator)") {
                  if (!state.option.inESNext()) {
                    warning("W104", state.tokens.next, "generator functions");
                  }
                  advance("*");
                  g = true;
                }
                i = property_name();
                saveProperty(tag + i, state.tokens.next);

                if (typeof i !== "string") {
                  break;
                }

                if (state.tokens.next.value === "(") {
                  if (!state.option.inESNext()) {
                    warning("W104", state.tokens.curr, "concise methods");
                  }
                  doFunction(i, undefined, g);
                } else if (!isclassdef) {
                  advance(":");
                  expression(10);
                }
              }
              if (isclassdef && i === "prototype") {
                error("E049", state.tokens.next, "class method", i);
              }

              countMember(i);
              if (isclassdef) {
                tag = "";
                continue;
              }
              if (state.tokens.next.id === ",") {
                comma({ allowTrailing: true, property: true });
                if (state.tokens.next.id === ",") {
                  warning("W070", state.tokens.curr);
                } else if (state.tokens.next.id === "}" && !state.option.inES5(true)) {
                  warning("W070", state.tokens.curr);
                }
              } else {
                break;
              }
            }
            if (b) {
              indent -= state.option.indent;
            }
            advance("}", this);
            if (state.option.inES5()) {
              for (var name in props) {
                if (_.has(props, name) && props[name].setter && !props[name].getter) {
                  warning("W078", props[name].setterToken);
                }
              }
            }
            return this;
          };
          x.fud = function () {
            error("E036", state.tokens.curr);
          };
        })(delim("{"));

        function destructuringExpression() {
          var id, ids;
          var identifiers = [];
          if (!state.option.inESNext()) {
            warning("W104", state.tokens.curr, "destructuring expression");
          }
          var nextInnerDE = function nextInnerDE() {
            var ident;
            if (_.contains(["[", "{"], state.tokens.next.value)) {
              ids = destructuringExpression();
              for (var id in ids) {
                id = ids[id];
                identifiers.push({ id: id.id, token: id.token });
              }
            } else if (state.tokens.next.value === ",") {
              identifiers.push({ id: null, token: state.tokens.curr });
            } else if (state.tokens.next.value === "(") {
              advance("(");
              nextInnerDE();
              advance(")");
            } else {
              ident = identifier();
              if (ident) identifiers.push({ id: ident, token: state.tokens.curr });
            }
          };
          if (state.tokens.next.value === "[") {
            advance("[");
            nextInnerDE();
            while (state.tokens.next.value !== "]") {
              advance(",");
              nextInnerDE();
            }
            advance("]");
          } else if (state.tokens.next.value === "{") {
            advance("{");
            id = identifier();
            if (state.tokens.next.value === ":") {
              advance(":");
              nextInnerDE();
            } else {
              identifiers.push({ id: id, token: state.tokens.curr });
            }
            while (state.tokens.next.value !== "}") {
              advance(",");
              id = identifier();
              if (state.tokens.next.value === ":") {
                advance(":");
                nextInnerDE();
              } else {
                identifiers.push({ id: id, token: state.tokens.curr });
              }
            }
            advance("}");
          }
          return identifiers;
        }

        function destructuringExpressionMatch(tokens, value) {
          var first = value.first;

          if (!first) return;

          _.zip(tokens, Array.isArray(first) ? first : [first]).forEach(function (val) {
            var token = val[0];
            var value = val[1];

            if (token && value) token.first = value;else if (token && token.first && !value) warning("W080", token.first, token.first.value);
          });
        }

        var conststatement = stmt("const", function (prefix) {
          var tokens;
          var value;
          var lone; // State variable to know if it is a lone identifier, or a destructuring statement.

          if (!state.option.inESNext()) warning("W104", state.tokens.curr, "const");

          this.first = [];
          for (;;) {
            var names = [];
            if (_.contains(["{", "["], state.tokens.next.value)) {
              tokens = destructuringExpression();
              lone = false;
            } else {
              tokens = [{ id: identifier(), token: state.tokens.curr }];
              lone = true;
            }
            for (var t in tokens) {
              if (tokens.hasOwnProperty(t)) {
                t = tokens[t];
                if (funct[t.id] === "const") {
                  warning("E011", null, t.id);
                }
                if (funct["(global)"] && predefined[t.id] === false) {
                  warning("W079", t.token, t.id);
                }
                if (t.id) {
                  addlabel(t.id, { token: t.token, type: "const", unused: true });
                  names.push(t.token);
                }
              }
            }
            if (prefix) {
              break;
            }

            this.first = this.first.concat(names);

            if (state.tokens.next.id !== "=") {
              warning("E012", state.tokens.curr, state.tokens.curr.value);
            }

            if (state.tokens.next.id === "=") {
              advance("=");
              if (state.tokens.next.id === "undefined") {
                warning("W080", state.tokens.prev, state.tokens.prev.value);
              }
              if (peek(0).id === "=" && state.tokens.next.identifier) {
                warning("W120", state.tokens.next, state.tokens.next.value);
              }
              value = expression(10);
              if (lone) {
                tokens[0].first = value;
              } else {
                destructuringExpressionMatch(names, value);
              }
            }

            if (state.tokens.next.id !== ",") {
              break;
            }
            comma();
          }
          return this;
        });

        conststatement.exps = true;
        var varstatement = stmt("var", function (prefix) {
          var tokens, lone, value;

          this.first = [];
          for (;;) {
            var names = [];
            if (_.contains(["{", "["], state.tokens.next.value)) {
              tokens = destructuringExpression();
              lone = false;
            } else {
              tokens = [{ id: identifier(), token: state.tokens.curr }];
              lone = true;
            }
            for (var t in tokens) {
              if (tokens.hasOwnProperty(t)) {
                t = tokens[t];
                if (state.option.inESNext() && funct[t.id] === "const") {
                  warning("E011", null, t.id);
                }
                if (funct["(global)"] && predefined[t.id] === false) {
                  warning("W079", t.token, t.id);
                }
                if (t.id) {
                  addlabel(t.id, { type: "unused", token: t.token });
                  names.push(t.token);
                }
              }
            }
            if (prefix) {
              break;
            }

            this.first = this.first.concat(names);

            if (state.tokens.next.id === "=") {
              advance("=");
              if (state.tokens.next.id === "undefined") {
                warning("W080", state.tokens.prev, state.tokens.prev.value);
              }
              if (peek(0).id === "=" && state.tokens.next.identifier) {
                warning("W120", state.tokens.next, state.tokens.next.value);
              }
              value = expression(10);
              if (lone) {
                tokens[0].first = value;
              } else {
                destructuringExpressionMatch(names, value);
              }
            }

            if (state.tokens.next.id !== ",") {
              break;
            }
            comma();
          }
          return this;
        });
        varstatement.exps = true;

        var letstatement = stmt("let", function (prefix) {
          var tokens, lone, value, letblock;

          if (!state.option.inESNext()) {
            warning("W104", state.tokens.curr, "let");
          }

          if (state.tokens.next.value === "(") {
            if (!state.option.inMoz(true)) {
              warning("W118", state.tokens.next, "let block");
            }
            advance("(");
            funct["(blockscope)"].stack();
            letblock = true;
          } else if (funct["(nolet)"]) {
            error("E048", state.tokens.curr);
          }

          this.first = [];
          for (;;) {
            var names = [];
            if (_.contains(["{", "["], state.tokens.next.value)) {
              tokens = destructuringExpression();
              lone = false;
            } else {
              tokens = [{ id: identifier(), token: state.tokens.curr.value }];
              lone = true;
            }
            for (var t in tokens) {
              if (tokens.hasOwnProperty(t)) {
                t = tokens[t];
                if (state.option.inESNext() && funct[t.id] === "const") {
                  warning("E011", null, t.id);
                }
                if (funct["(global)"] && predefined[t.id] === false) {
                  warning("W079", t.token, t.id);
                }
                if (t.id && !funct["(nolet)"]) {
                  addlabel(t.id, { type: "unused", token: t.token, islet: true });
                  names.push(t.token);
                }
              }
            }
            if (prefix) {
              break;
            }

            this.first = this.first.concat(names);

            if (state.tokens.next.id === "=") {
              advance("=");
              if (state.tokens.next.id === "undefined") {
                warning("W080", state.tokens.prev, state.tokens.prev.value);
              }
              if (peek(0).id === "=" && state.tokens.next.identifier) {
                warning("W120", state.tokens.next, state.tokens.next.value);
              }
              value = expression(10);
              if (lone) {
                tokens[0].first = value;
              } else {
                destructuringExpressionMatch(names, value);
              }
            }

            if (state.tokens.next.id !== ",") {
              break;
            }
            comma();
          }
          if (letblock) {
            advance(")");
            block(true, true);
            this.block = true;
            funct["(blockscope)"].unstack();
          }

          return this;
        });
        letstatement.exps = true;

        blockstmt("class", function () {
          return classdef.call(this, true);
        });

        function classdef(stmt) {
          if (!state.option.inESNext()) {
            warning("W104", state.tokens.curr, "class");
          }
          if (stmt) {
            this.name = identifier();
            addlabel(this.name, { type: "unused", token: state.tokens.curr });
          } else if (state.tokens.next.identifier && state.tokens.next.value !== "extends") {
            this.name = identifier();
          }
          classtail(this);
          return this;
        }

        function classtail(c) {
          var strictness = state.directive["use strict"];
          if (state.tokens.next.value === "extends") {
            advance("extends");
            c.heritage = expression(10);
          }
          state.directive["use strict"] = true;
          advance("{");
          c.body = state.syntax["{"].nud(true);
          state.directive["use strict"] = strictness;
        }

        blockstmt("function", function () {
          var generator = false;
          if (state.tokens.next.value === "*") {
            advance("*");
            if (state.option.inESNext(true)) {
              generator = true;
            } else {
              warning("W119", state.tokens.curr, "function*");
            }
          }
          if (inblock) {
            warning("W082", state.tokens.curr);
          }
          var i = identifier();
          if (funct[i] === "const") {
            warning("E011", null, i);
          }
          addlabel(i, { type: "unction", token: state.tokens.curr });

          doFunction(i, { statement: true }, generator);
          if (state.tokens.next.id === "(" && state.tokens.next.line === state.tokens.curr.line) {
            error("E039");
          }
          return this;
        });

        prefix("function", function () {
          var generator = false;
          if (state.tokens.next.value === "*") {
            if (!state.option.inESNext()) {
              warning("W119", state.tokens.curr, "function*");
            }
            advance("*");
            generator = true;
          }
          var i = optionalidentifier();
          doFunction(i, undefined, generator);
          if (!state.option.loopfunc && funct["(loopage)"]) {
            warning("W083");
          }
          return this;
        });

        blockstmt("if", function () {
          var t = state.tokens.next;
          increaseComplexityCount();
          state.condition = true;
          advance("(");
          checkCondAssignment(expression(0));
          advance(")", t);
          state.condition = false;
          block(true, true);
          if (state.tokens.next.id === "else") {
            advance("else");
            if (state.tokens.next.id === "if" || state.tokens.next.id === "switch") {
              statement(true);
            } else {
              block(true, true);
            }
          }
          return this;
        });

        blockstmt("try", function () {
          var b;

          function doCatch() {
            var oldScope = scope;
            var e;

            advance("catch");
            advance("(");

            scope = Object.create(oldScope);

            e = state.tokens.next.value;
            if (state.tokens.next.type !== "(identifier)") {
              e = null;
              warning("E030", state.tokens.next, e);
            }

            advance();

            funct = functor("(catch)", state.tokens.next, scope, {
              "(context)": funct,
              "(breakage)": funct["(breakage)"],
              "(loopage)": funct["(loopage)"],
              "(statement)": false,
              "(catch)": true
            });

            if (e) {
              addlabel(e, { type: "exception" });
            }

            if (state.tokens.next.value === "if") {
              if (!state.option.inMoz(true)) {
                warning("W118", state.tokens.curr, "catch filter");
              }
              advance("if");
              expression(0);
            }

            advance(")");

            state.tokens.curr.funct = funct;
            functions.push(funct);

            block(false);

            scope = oldScope;

            funct["(last)"] = state.tokens.curr.line;
            funct["(lastcharacter)"] = state.tokens.curr.character;
            funct = funct["(context)"];
          }

          block(true);

          while (state.tokens.next.id === "catch") {
            increaseComplexityCount();
            if (b && !state.option.inMoz(true)) {
              warning("W118", state.tokens.next, "multiple catch blocks");
            }
            doCatch();
            b = true;
          }

          if (state.tokens.next.id === "finally") {
            advance("finally");
            block(true);
            return;
          }

          if (!b) {
            error("E021", state.tokens.next, "catch", state.tokens.next.value);
          }

          return this;
        });

        blockstmt("while", function () {
          var t = state.tokens.next;
          funct["(breakage)"] += 1;
          funct["(loopage)"] += 1;
          increaseComplexityCount();
          advance("(");
          checkCondAssignment(expression(0));
          advance(")", t);
          block(true, true);
          funct["(breakage)"] -= 1;
          funct["(loopage)"] -= 1;
          return this;
        }).labelled = true;

        blockstmt("with", function () {
          var t = state.tokens.next;
          if (state.directive["use strict"]) {
            error("E010", state.tokens.curr);
          } else if (!state.option.withstmt) {
            warning("W085", state.tokens.curr);
          }

          advance("(");
          expression(0);
          advance(")", t);
          block(true, true);

          return this;
        });

        blockstmt("switch", function () {
          var t = state.tokens.next;
          var g = false;
          var noindent = false;

          funct["(breakage)"] += 1;
          advance("(");
          checkCondAssignment(expression(0));
          advance(")", t);
          t = state.tokens.next;
          advance("{");

          if (state.tokens.next.from === indent) noindent = true;

          if (!noindent) indent += state.option.indent;

          this.cases = [];

          for (;;) {
            switch (state.tokens.next.id) {
              case "case":
                switch (funct["(verb)"]) {
                  case "yield":
                  case "break":
                  case "case":
                  case "continue":
                  case "return":
                  case "switch":
                  case "throw":
                    break;
                  default:
                    if (!reg.fallsThrough.test(state.lines[state.tokens.next.line - 2])) {
                      warning("W086", state.tokens.curr, "case");
                    }
                }

                advance("case");
                this.cases.push(expression(0));
                increaseComplexityCount();
                g = true;
                advance(":");
                funct["(verb)"] = "case";
                break;
              case "default":
                switch (funct["(verb)"]) {
                  case "yield":
                  case "break":
                  case "continue":
                  case "return":
                  case "throw":
                    break;
                  default:
                    if (this.cases.length) {
                      if (!reg.fallsThrough.test(state.lines[state.tokens.next.line - 2])) {
                        warning("W086", state.tokens.curr, "default");
                      }
                    }
                }

                advance("default");
                g = true;
                advance(":");
                break;
              case "}":
                if (!noindent) indent -= state.option.indent;

                advance("}", t);
                funct["(breakage)"] -= 1;
                funct["(verb)"] = undefined;
                return;
              case "(end)":
                error("E023", state.tokens.next, "}");
                return;
              default:
                indent += state.option.indent;
                if (g) {
                  switch (state.tokens.curr.id) {
                    case ",":
                      error("E040");
                      return;
                    case ":":
                      g = false;
                      statements();
                      break;
                    default:
                      error("E025", state.tokens.curr);
                      return;
                  }
                } else {
                  if (state.tokens.curr.id === ":") {
                    advance(":");
                    error("E024", state.tokens.curr, ":");
                    statements();
                  } else {
                    error("E021", state.tokens.next, "case", state.tokens.next.value);
                    return;
                  }
                }
                indent -= state.option.indent;
            }
          }
        }).labelled = true;

        stmt("debugger", function () {
          if (!state.option.debug) {
            warning("W087", this);
          }
          return this;
        }).exps = true;

        (function () {
          var x = stmt("do", function () {
            funct["(breakage)"] += 1;
            funct["(loopage)"] += 1;
            increaseComplexityCount();

            this.first = block(true, true);
            advance("while");
            var t = state.tokens.next;
            advance("(");
            checkCondAssignment(expression(0));
            advance(")", t);
            funct["(breakage)"] -= 1;
            funct["(loopage)"] -= 1;
            return this;
          });
          x.labelled = true;
          x.exps = true;
        })();

        blockstmt("for", function () {
          var s,
              t = state.tokens.next;
          var letscope = false;
          var foreachtok = null;

          if (t.value === "each") {
            foreachtok = t;
            advance("each");
            if (!state.option.inMoz(true)) {
              warning("W118", state.tokens.curr, "for each");
            }
          }

          funct["(breakage)"] += 1;
          funct["(loopage)"] += 1;
          increaseComplexityCount();
          advance("(");
          var nextop; // contains the token of the "in" or "of" operator
          var i = 0;
          var inof = ["in", "of"];
          do {
            nextop = peek(i);
            ++i;
          } while (!_.contains(inof, nextop.value) && nextop.value !== ";" && nextop.type !== "(end)");
          if (_.contains(inof, nextop.value)) {
            if (!state.option.inESNext() && nextop.value === "of") {
              error("W104", nextop, "for of");
            }

            if (state.tokens.next.id === "var") {
              advance("var");
              state.syntax["var"].fud.call(state.syntax["var"].fud, true);
            } else if (state.tokens.next.id === "let") {
              advance("let");
              letscope = true;
              funct["(blockscope)"].stack();
              state.syntax["let"].fud.call(state.syntax["let"].fud, true);
            } else if (!state.tokens.next.identifier) {
              error("E030", state.tokens.next, state.tokens.next.type);
              advance();
            } else {
              switch (funct[state.tokens.next.value]) {
                case "unused":
                  funct[state.tokens.next.value] = "var";
                  break;
                case "var":
                  break;
                default:
                  if (!funct["(blockscope)"].getlabel(state.tokens.next.value)) warning("W088", state.tokens.next, state.tokens.next.value);
              }
              advance();
            }
            advance(nextop.value);
            expression(20);
            advance(")", t);
            s = block(true, true);
            if (state.option.forin && s && (s.length > 1 || _typeof(s[0]) !== "object" || s[0].value !== "if")) {
              warning("W089", this);
            }
            funct["(breakage)"] -= 1;
            funct["(loopage)"] -= 1;
          } else {
            if (foreachtok) {
              error("E045", foreachtok);
            }
            if (state.tokens.next.id !== ";") {
              if (state.tokens.next.id === "var") {
                advance("var");
                state.syntax["var"].fud.call(state.syntax["var"].fud);
              } else if (state.tokens.next.id === "let") {
                advance("let");
                letscope = true;
                funct["(blockscope)"].stack();
                state.syntax["let"].fud.call(state.syntax["let"].fud);
              } else {
                for (;;) {
                  expression(0, "for");
                  if (state.tokens.next.id !== ",") {
                    break;
                  }
                  comma();
                }
              }
            }
            nolinebreak(state.tokens.curr);
            advance(";");
            if (state.tokens.next.id !== ";") {
              checkCondAssignment(expression(0));
            }
            nolinebreak(state.tokens.curr);
            advance(";");
            if (state.tokens.next.id === ";") {
              error("E021", state.tokens.next, ")", ";");
            }
            if (state.tokens.next.id !== ")") {
              for (;;) {
                expression(0, "for");
                if (state.tokens.next.id !== ",") {
                  break;
                }
                comma();
              }
            }
            advance(")", t);
            block(true, true);
            funct["(breakage)"] -= 1;
            funct["(loopage)"] -= 1;
          }
          if (letscope) {
            funct["(blockscope)"].unstack();
          }
          return this;
        }).labelled = true;

        stmt("break", function () {
          var v = state.tokens.next.value;

          if (funct["(breakage)"] === 0) warning("W052", state.tokens.next, this.value);

          if (!state.option.asi) nolinebreak(this);

          if (state.tokens.next.id !== ";" && !state.tokens.next.reach) {
            if (state.tokens.curr.line === state.tokens.next.line) {
              if (funct[v] !== "label") {
                warning("W090", state.tokens.next, v);
              } else if (scope[v] !== funct) {
                warning("W091", state.tokens.next, v);
              }
              this.first = state.tokens.next;
              advance();
            }
          }
          reachable("break");
          return this;
        }).exps = true;

        stmt("continue", function () {
          var v = state.tokens.next.value;

          if (funct["(breakage)"] === 0) warning("W052", state.tokens.next, this.value);

          if (!state.option.asi) nolinebreak(this);

          if (state.tokens.next.id !== ";" && !state.tokens.next.reach) {
            if (state.tokens.curr.line === state.tokens.next.line) {
              if (funct[v] !== "label") {
                warning("W090", state.tokens.next, v);
              } else if (scope[v] !== funct) {
                warning("W091", state.tokens.next, v);
              }
              this.first = state.tokens.next;
              advance();
            }
          } else if (!funct["(loopage)"]) {
            warning("W052", state.tokens.next, this.value);
          }
          reachable("continue");
          return this;
        }).exps = true;

        stmt("return", function () {
          if (this.line === state.tokens.next.line) {
            if (state.tokens.next.id !== ";" && !state.tokens.next.reach) {
              this.first = expression(0);

              if (this.first && this.first.type === "(punctuator)" && this.first.value === "=" && !this.first.paren && !state.option.boss) {
                warningAt("W093", this.first.line, this.first.character);
              }
            }
          } else {
            if (state.tokens.next.type === "(punctuator)" && ["[", "{", "+", "-"].indexOf(state.tokens.next.value) > -1) {
              nolinebreak(this); // always warn (Line breaking error)
            }
          }
          reachable("return");
          return this;
        }).exps = true;

        (function (x) {
          x.exps = true;
          x.lbp = 25;
        })(prefix("yield", function () {
          var prev = state.tokens.prev;
          if (state.option.inESNext(true) && !funct["(generator)"]) {
            if (!("(catch)" === funct["(name)"] && funct["(context)"]["(generator)"])) {
              error("E046", state.tokens.curr, "yield");
            }
          } else if (!state.option.inESNext()) {
            warning("W104", state.tokens.curr, "yield");
          }
          funct["(generator)"] = "yielded";
          if (this.line === state.tokens.next.line || !state.option.inMoz(true)) {
            if (state.tokens.next.id !== ";" && !state.tokens.next.reach && state.tokens.next.nud) {
              nobreaknonadjacent(state.tokens.curr, state.tokens.next);
              this.first = expression(10);

              if (this.first.type === "(punctuator)" && this.first.value === "=" && !this.first.paren && !state.option.boss) {
                warningAt("W093", this.first.line, this.first.character);
              }
            }

            if (state.option.inMoz(true) && state.tokens.next.id !== ")" && (prev.lbp > 30 || !prev.assign && !isEndOfExpr() || prev.id === "yield")) {
              error("E050", this);
            }
          } else if (!state.option.asi) {
            nolinebreak(this); // always warn (Line breaking error)
          }
          return this;
        }));

        stmt("throw", function () {
          nolinebreak(this);
          this.first = expression(20);
          reachable("throw");
          return this;
        }).exps = true;

        stmt("import", function () {
          if (!state.option.inESNext()) {
            warning("W119", state.tokens.curr, "import");
          }

          if (state.tokens.next.type === "(string)") {
            advance("(string)");
            return this;
          }
          if (state.tokens.next.identifier) {
            this.name = identifier();
            addlabel(this.name, { type: "unused", token: state.tokens.curr });
          } else {
            advance("{");
            for (;;) {
              if (state.tokens.next.value === "}") {
                advance("}");
                break;
              }
              var importName;
              if (state.tokens.next.type === "default") {
                importName = "default";
                advance("default");
              } else {
                importName = identifier();
              }
              if (state.tokens.next.value === "as") {
                advance("as");
                importName = identifier();
              }
              addlabel(importName, { type: "unused", token: state.tokens.curr });

              if (state.tokens.next.value === ",") {
                advance(",");
              } else if (state.tokens.next.value === "}") {
                advance("}");
                break;
              } else {
                error("E024", state.tokens.next, state.tokens.next.value);
                break;
              }
            }
          }

          advance("from");
          advance("(string)");
          return this;
        }).exps = true;

        stmt("export", function () {
          if (!state.option.inESNext()) {
            warning("W119", state.tokens.curr, "export");
          }

          if (state.tokens.next.type === "default") {
            advance("default");
            if (state.tokens.next.id === "function" || state.tokens.next.id === "class") {
              this.block = true;
            }
            this.exportee = expression(10);

            return this;
          }

          if (state.tokens.next.value === "{") {
            advance("{");
            for (;;) {
              exported[identifier()] = true;

              if (state.tokens.next.value === ",") {
                advance(",");
              } else if (state.tokens.next.value === "}") {
                advance("}");
                break;
              } else {
                error("E024", state.tokens.next, state.tokens.next.value);
                break;
              }
            }
            return this;
          }

          if (state.tokens.next.id === "var") {
            advance("var");
            exported[state.tokens.next.value] = true;
            state.syntax["var"].fud.call(state.syntax["var"].fud);
          } else if (state.tokens.next.id === "let") {
            advance("let");
            exported[state.tokens.next.value] = true;
            state.syntax["let"].fud.call(state.syntax["let"].fud);
          } else if (state.tokens.next.id === "const") {
            advance("const");
            exported[state.tokens.next.value] = true;
            state.syntax["const"].fud.call(state.syntax["const"].fud);
          } else if (state.tokens.next.id === "function") {
            this.block = true;
            advance("function");
            exported[state.tokens.next.value] = true;
            state.syntax["function"].fud();
          } else if (state.tokens.next.id === "class") {
            this.block = true;
            advance("class");
            exported[state.tokens.next.value] = true;
            state.syntax["class"].fud();
          } else {
            error("E024", state.tokens.next, state.tokens.next.value);
          }

          return this;
        }).exps = true;

        FutureReservedWord("abstract");
        FutureReservedWord("boolean");
        FutureReservedWord("byte");
        FutureReservedWord("char");
        FutureReservedWord("class", { es5: true, nud: classdef });
        FutureReservedWord("double");
        FutureReservedWord("enum", { es5: true });
        FutureReservedWord("export", { es5: true });
        FutureReservedWord("extends", { es5: true });
        FutureReservedWord("final");
        FutureReservedWord("float");
        FutureReservedWord("goto");
        FutureReservedWord("implements", { es5: true, strictOnly: true });
        FutureReservedWord("import", { es5: true });
        FutureReservedWord("int");
        FutureReservedWord("interface", { es5: true, strictOnly: true });
        FutureReservedWord("long");
        FutureReservedWord("native");
        FutureReservedWord("package", { es5: true, strictOnly: true });
        FutureReservedWord("private", { es5: true, strictOnly: true });
        FutureReservedWord("protected", { es5: true, strictOnly: true });
        FutureReservedWord("public", { es5: true, strictOnly: true });
        FutureReservedWord("short");
        FutureReservedWord("static", { es5: true, strictOnly: true });
        FutureReservedWord("super", { es5: true });
        FutureReservedWord("synchronized");
        FutureReservedWord("transient");
        FutureReservedWord("volatile");

        var lookupBlockType = function lookupBlockType() {
          var pn, pn1;
          var i = -1;
          var bracketStack = 0;
          var ret = {};
          if (_.contains(["[", "{"], state.tokens.curr.value)) bracketStack += 1;
          do {
            pn = i === -1 ? state.tokens.next : peek(i);
            pn1 = peek(i + 1);
            i = i + 1;
            if (_.contains(["[", "{"], pn.value)) {
              bracketStack += 1;
            } else if (_.contains(["]", "}"], pn.value)) {
              bracketStack -= 1;
            }
            if (pn.identifier && pn.value === "for" && bracketStack === 1) {
              ret.isCompArray = true;
              ret.notJson = true;
              break;
            }
            if (_.contains(["}", "]"], pn.value) && pn1.value === "=" && bracketStack === 0) {
              ret.isDestAssign = true;
              ret.notJson = true;
              break;
            }
            if (pn.value === ";") {
              ret.isBlock = true;
              ret.notJson = true;
            }
          } while (bracketStack > 0 && pn.id !== "(end)" && i < 15);
          return ret;
        };
        function destructuringAssignOrJsonValue() {

          var block = lookupBlockType();
          if (block.notJson) {
            if (!state.option.inESNext() && block.isDestAssign) {
              warning("W104", state.tokens.curr, "destructuring assignment");
            }
            statements();
          } else {
            state.option.laxbreak = true;
            state.jsonMode = true;
            jsonValue();
          }
        }

        var arrayComprehension = function arrayComprehension() {
          var CompArray = function CompArray() {
            this.mode = "use";
            this.variables = [];
          };
          var _carrays = [];
          var _current;
          function declare(v) {
            var l = _current.variables.filter(function (elt) {
              if (elt.value === v) {
                elt.undef = false;
                return v;
              }
            }).length;
            return l !== 0;
          }
          function use(v) {
            var l = _current.variables.filter(function (elt) {
              if (elt.value === v && !elt.undef) {
                if (elt.unused === true) {
                  elt.unused = false;
                }
                return v;
              }
            }).length;
            return l === 0;
          }
          return { stack: function stack() {
              _current = new CompArray();
              _carrays.push(_current);
            },
            unstack: function unstack() {
              _current.variables.filter(function (v) {
                if (v.unused) warning("W098", v.token, v.value);
                if (v.undef) isundef(v.funct, "W117", v.token, v.value);
              });
              _carrays.splice(-1, 1);
              _current = _carrays[_carrays.length - 1];
            },
            setState: function setState(s) {
              if (_.contains(["use", "define", "generate", "filter"], s)) _current.mode = s;
            },
            check: function check(v) {
              if (!_current) {
                return;
              }
              if (_current && _current.mode === "use") {
                if (use(v)) {
                  _current.variables.push({
                    funct: funct,
                    token: state.tokens.curr,
                    value: v,
                    undef: true,
                    unused: false
                  });
                }
                return true;
              } else if (_current && _current.mode === "define") {
                if (!declare(v)) {
                  _current.variables.push({
                    funct: funct,
                    token: state.tokens.curr,
                    value: v,
                    undef: false,
                    unused: true
                  });
                }
                return true;
              } else if (_current && _current.mode === "generate") {
                isundef(funct, "W117", state.tokens.curr, v);
                return true;
              } else if (_current && _current.mode === "filter") {
                if (use(v)) {
                  isundef(funct, "W117", state.tokens.curr, v);
                }
                return true;
              }
              return false;
            }
          };
        };

        function jsonValue() {
          function jsonObject() {
            var o = {},
                t = state.tokens.next;
            advance("{");
            if (state.tokens.next.id !== "}") {
              for (;;) {
                if (state.tokens.next.id === "(end)") {
                  error("E026", state.tokens.next, t.line);
                } else if (state.tokens.next.id === "}") {
                  warning("W094", state.tokens.curr);
                  break;
                } else if (state.tokens.next.id === ",") {
                  error("E028", state.tokens.next);
                } else if (state.tokens.next.id !== "(string)") {
                  warning("W095", state.tokens.next, state.tokens.next.value);
                }
                if (o[state.tokens.next.value] === true) {
                  warning("W075", state.tokens.next, state.tokens.next.value);
                } else if (state.tokens.next.value === "__proto__" && !state.option.proto || state.tokens.next.value === "__iterator__" && !state.option.iterator) {
                  warning("W096", state.tokens.next, state.tokens.next.value);
                } else {
                  o[state.tokens.next.value] = true;
                }
                advance();
                advance(":");
                jsonValue();
                if (state.tokens.next.id !== ",") {
                  break;
                }
                advance(",");
              }
            }
            advance("}");
          }

          function jsonArray() {
            var t = state.tokens.next;
            advance("[");
            if (state.tokens.next.id !== "]") {
              for (;;) {
                if (state.tokens.next.id === "(end)") {
                  error("E027", state.tokens.next, t.line);
                } else if (state.tokens.next.id === "]") {
                  warning("W094", state.tokens.curr);
                  break;
                } else if (state.tokens.next.id === ",") {
                  error("E028", state.tokens.next);
                }
                jsonValue();
                if (state.tokens.next.id !== ",") {
                  break;
                }
                advance(",");
              }
            }
            advance("]");
          }

          switch (state.tokens.next.id) {
            case "{":
              jsonObject();
              break;
            case "[":
              jsonArray();
              break;
            case "true":
            case "false":
            case "null":
            case "(number)":
            case "(string)":
              advance();
              break;
            case "-":
              advance("-");
              advance("(number)");
              break;
            default:
              error("E003", state.tokens.next);
          }
        }

        var blockScope = function blockScope() {
          var _current = {};
          var _variables = [_current];

          function _checkBlockLabels() {
            for (var t in _current) {
              if (_current[t]["(type)"] === "unused") {
                if (state.option.unused) {
                  var tkn = _current[t]["(token)"];
                  var line = tkn.line;
                  var chr = tkn.character;
                  warningAt("W098", line, chr, t);
                }
              }
            }
          }

          return {
            stack: function stack() {
              _current = {};
              _variables.push(_current);
            },

            unstack: function unstack() {
              _checkBlockLabels();
              _variables.splice(_variables.length - 1, 1);
              _current = _.last(_variables);
            },

            getlabel: function getlabel(l) {
              for (var i = _variables.length - 1; i >= 0; --i) {
                if (_.has(_variables[i], l) && !_variables[i][l]["(shadowed)"]) {
                  return _variables[i];
                }
              }
            },

            shadow: function shadow(name) {
              for (var i = _variables.length - 1; i >= 0; i--) {
                if (_.has(_variables[i], name)) {
                  _variables[i][name]["(shadowed)"] = true;
                }
              }
            },

            unshadow: function unshadow(name) {
              for (var i = _variables.length - 1; i >= 0; i--) {
                if (_.has(_variables[i], name)) {
                  _variables[i][name]["(shadowed)"] = false;
                }
              }
            },

            current: {
              has: function has(t) {
                return _.has(_current, t);
              },

              add: function add(t, type, tok) {
                _current[t] = { "(type)": type, "(token)": tok, "(shadowed)": false };
              }
            }
          };
        };
        var itself = function itself(s, o, g) {
          var i, k, x;
          var optionKeys;
          var newOptionObj = {};
          var newIgnoredObj = {};

          o = _.clone(o);
          state.reset();

          if (o && o.scope) {
            JSHINT.scope = o.scope;
          } else {
            JSHINT.errors = [];
            JSHINT.undefs = [];
            JSHINT.internals = [];
            JSHINT.blacklist = {};
            JSHINT.scope = "(main)";
          }

          predefined = Object.create(null);
          combine(predefined, vars.ecmaIdentifiers);
          combine(predefined, vars.reservedVars);

          combine(predefined, g || {});

          declared = Object.create(null);
          exported = Object.create(null);

          function each(obj, cb) {
            if (!obj) return;

            if (!Array.isArray(obj) && (typeof obj === "undefined" ? "undefined" : _typeof(obj)) === "object") obj = Object.keys(obj);

            obj.forEach(cb);
          }

          if (o) {
            each(o.predef || null, function (item) {
              var slice, prop;

              if (item[0] === "-") {
                slice = item.slice(1);
                JSHINT.blacklist[slice] = slice;
              } else {
                prop = Object.getOwnPropertyDescriptor(o.predef, item);
                predefined[item] = prop ? prop.value : false;
              }
            });

            each(o.exported || null, function (item) {
              exported[item] = true;
            });

            delete o.predef;
            delete o.exported;

            optionKeys = Object.keys(o);
            for (x = 0; x < optionKeys.length; x++) {
              if (/^-W\d{3}$/g.test(optionKeys[x])) {
                newIgnoredObj[optionKeys[x].slice(1)] = true;
              } else {
                newOptionObj[optionKeys[x]] = o[optionKeys[x]];

                if (optionKeys[x] === "newcap" && o[optionKeys[x]] === false) newOptionObj["(explicitNewcap)"] = true;
              }
            }
          }

          state.option = newOptionObj;
          state.ignored = newIgnoredObj;

          state.option.indent = state.option.indent || 4;
          state.option.maxerr = state.option.maxerr || 50;

          indent = 1;
          global = Object.create(predefined);
          scope = global;

          funct = functor("(global)", null, scope, {
            "(global)": true,
            "(blockscope)": blockScope(),
            "(comparray)": arrayComprehension(),
            "(metrics)": createMetrics(state.tokens.next)
          });

          functions = [funct];
          urls = [];
          stack = null;
          member = {};
          membersOnly = null;
          implied = {};
          inblock = false;
          lookahead = [];
          unuseds = [];

          if (!isString(s) && !Array.isArray(s)) {
            errorAt("E004", 0);
            return false;
          }

          api = {
            get isJSON() {
              return state.jsonMode;
            },

            getOption: function getOption(name) {
              return state.option[name] || null;
            },

            getCache: function getCache(name) {
              return state.cache[name];
            },

            setCache: function setCache(name, value) {
              state.cache[name] = value;
            },

            warn: function warn(code, data) {
              warningAt.apply(null, [code, data.line, data.char].concat(data.data));
            },

            on: function on(names, listener) {
              names.split(" ").forEach(function (name) {
                emitter.on(name, listener);
              }.bind(this));
            }
          };

          emitter.removeAllListeners();
          (extraModules || []).forEach(function (func) {
            func(api);
          });

          state.tokens.prev = state.tokens.curr = state.tokens.next = state.syntax["(begin)"];

          lex = new Lexer(s);

          lex.on("warning", function (ev) {
            warningAt.apply(null, [ev.code, ev.line, ev.character].concat(ev.data));
          });

          lex.on("error", function (ev) {
            errorAt.apply(null, [ev.code, ev.line, ev.character].concat(ev.data));
          });

          lex.on("fatal", function (ev) {
            quit("E041", ev.line, ev.from);
          });

          lex.on("Identifier", function (ev) {
            emitter.emit("Identifier", ev);
          });

          lex.on("String", function (ev) {
            emitter.emit("String", ev);
          });

          lex.on("Number", function (ev) {
            emitter.emit("Number", ev);
          });

          lex.start();
          for (var name in o) {
            if (_.has(o, name)) {
              checkOption(name, state.tokens.curr);
            }
          }

          assume();
          combine(predefined, g || {});
          comma.first = true;

          try {
            advance();
            switch (state.tokens.next.id) {
              case "{":
              case "[":
                destructuringAssignOrJsonValue();
                break;
              default:
                directives();

                if (state.directive["use strict"]) {
                  if (!state.option.globalstrict && !(state.option.node || state.option.phantom)) {
                    warning("W097", state.tokens.prev);
                  }
                }

                statements();
            }
            advance(state.tokens.next && state.tokens.next.value !== "." ? "(end)" : undefined);
            funct["(blockscope)"].unstack();

            var markDefined = function markDefined(name, context) {
              do {
                if (typeof context[name] === "string") {

                  if (context[name] === "unused") context[name] = "var";else if (context[name] === "unction") context[name] = "closure";

                  return true;
                }

                context = context["(context)"];
              } while (context);

              return false;
            };

            var clearImplied = function clearImplied(name, line) {
              if (!implied[name]) return;

              var newImplied = [];
              for (var i = 0; i < implied[name].length; i += 1) {
                if (implied[name][i] !== line) newImplied.push(implied[name][i]);
              }

              if (newImplied.length === 0) delete implied[name];else implied[name] = newImplied;
            };

            var warnUnused = function warnUnused(name, tkn, type, unused_opt) {
              var line = tkn.line;
              var chr = tkn.character;

              if (unused_opt === undefined) {
                unused_opt = state.option.unused;
              }

              if (unused_opt === true) {
                unused_opt = "last-param";
              }

              var warnable_types = {
                "vars": ["var"],
                "last-param": ["var", "param"],
                "strict": ["var", "param", "last-param"]
              };

              if (unused_opt) {
                if (warnable_types[unused_opt] && warnable_types[unused_opt].indexOf(type) !== -1) {
                  warningAt("W098", line, chr, name);
                }
              }

              unuseds.push({
                name: name,
                line: line,
                character: chr
              });
            };

            var checkUnused = function checkUnused(func, key) {
              var type = func[key];
              var tkn = func["(tokens)"][key];

              if (key.charAt(0) === "(") return;

              if (type !== "unused" && type !== "unction" && type !== "const") return;
              if (func["(params)"] && func["(params)"].indexOf(key) !== -1) return;
              if (func["(global)"] && _.has(exported, key)) return;
              if (type === "const" && !getprop(func, key, "unused")) return;

              warnUnused(key, tkn, "var");
            };
            for (i = 0; i < JSHINT.undefs.length; i += 1) {
              k = JSHINT.undefs[i].slice(0);

              if (markDefined(k[2].value, k[0])) {
                clearImplied(k[2].value, k[2].line);
              } else if (state.option.undef) {
                warning.apply(warning, k.slice(1));
              }
            }

            functions.forEach(function (func) {
              if (func["(unusedOption)"] === false) {
                return;
              }

              for (var key in func) {
                if (_.has(func, key)) {
                  checkUnused(func, key);
                }
              }

              if (!func["(params)"]) return;

              var params = func["(params)"].slice();
              var param = params.pop();
              var type, unused_opt;

              while (param) {
                type = func[param];
                unused_opt = func["(unusedOption)"] || state.option.unused;
                unused_opt = unused_opt === true ? "last-param" : unused_opt;

                if (param === "undefined") return;

                if (type === "unused" || type === "unction") {
                  warnUnused(param, func["(tokens)"][param], "param", func["(unusedOption)"]);
                } else if (unused_opt === "last-param") {
                  return;
                }

                param = params.pop();
              }
            });

            for (var key in declared) {
              if (_.has(declared, key) && !_.has(global, key) && !_.has(exported, key)) {
                warnUnused(key, declared[key], "var");
              }
            }
          } catch (err) {
            if (err && err.name === "JSHintError") {
              var nt = state.tokens.next || {};
              JSHINT.errors.push({
                scope: "(main)",
                raw: err.raw,
                code: err.code,
                reason: err.message,
                line: err.line || nt.line,
                character: err.character || nt.from
              }, null);
            } else {
              throw err;
            }
          }

          if (JSHINT.scope === "(main)") {
            o = o || {};

            for (i = 0; i < JSHINT.internals.length; i += 1) {
              k = JSHINT.internals[i];
              o.scope = k.elem;
              itself(k.value, o, g);
            }
          }

          return JSHINT.errors.length === 0;
        };
        itself.addModule = function (func) {
          extraModules.push(func);
        };

        itself.addModule(style.register);
        itself.data = function () {
          var data = {
            functions: [],
            options: state.option
          };

          var implieds = [];
          var members = [];
          var fu, f, i, j, n, globals;

          if (itself.errors.length) {
            data.errors = itself.errors;
          }

          if (state.jsonMode) {
            data.json = true;
          }

          for (n in implied) {
            if (_.has(implied, n)) {
              implieds.push({
                name: n,
                line: implied[n]
              });
            }
          }

          if (implieds.length > 0) {
            data.implieds = implieds;
          }

          if (urls.length > 0) {
            data.urls = urls;
          }

          globals = Object.keys(scope);
          if (globals.length > 0) {
            data.globals = globals;
          }

          for (i = 1; i < functions.length; i += 1) {
            f = functions[i];
            fu = {};

            for (j = 0; j < functionicity.length; j += 1) {
              fu[functionicity[j]] = [];
            }

            for (j = 0; j < functionicity.length; j += 1) {
              if (fu[functionicity[j]].length === 0) {
                delete fu[functionicity[j]];
              }
            }

            fu.name = f["(name)"];
            fu.param = f["(params)"];
            fu.line = f["(line)"];
            fu.character = f["(character)"];
            fu.last = f["(last)"];
            fu.lastcharacter = f["(lastcharacter)"];

            fu.metrics = {
              complexity: f["(metrics)"].ComplexityCount,
              parameters: (f["(params)"] || []).length,
              statements: f["(metrics)"].statementCount
            };

            data.functions.push(fu);
          }

          if (unuseds.length > 0) {
            data.unused = unuseds;
          }

          members = [];
          for (n in member) {
            if (typeof member[n] === "number") {
              data.member = member;
              break;
            }
          }

          return data;
        };

        itself.jshint = itself;

        return itself;
      }();
      if ((typeof exports === "undefined" ? "undefined" : _typeof(exports)) === "object" && exports) {
        exports.JSHINT = JSHINT;
      }
    }, { "./lex.js": 4, "./messages.js": 5, "./reg.js": 6, "./state.js": 7, "./style.js": 8, "./vars.js": 9, "events": 10, "underscore": 2 }],
    4: [function (_dereq_, module, exports) {

      "use strict";

      var _ = _dereq_("underscore");
      var events = _dereq_("events");
      var reg = _dereq_("./reg.js");
      var state = _dereq_("./state.js").state;

      var unicodeData = _dereq_("../data/ascii-identifier-data.js");
      var asciiIdentifierStartTable = unicodeData.asciiIdentifierStartTable;
      var asciiIdentifierPartTable = unicodeData.asciiIdentifierPartTable;

      var Token = {
        Identifier: 1,
        Punctuator: 2,
        NumericLiteral: 3,
        StringLiteral: 4,
        Comment: 5,
        Keyword: 6,
        NullLiteral: 7,
        BooleanLiteral: 8,
        RegExp: 9,
        TemplateLiteral: 10
      };

      function asyncTrigger() {
        var _checks = [];

        return {
          push: function push(fn) {
            _checks.push(fn);
          },

          check: function check() {
            for (var check = 0; check < _checks.length; ++check) {
              _checks[check]();
            }

            _checks.splice(0, _checks.length);
          }
        };
      }
      function Lexer(source) {
        var lines = source;

        if (typeof lines === "string") {
          lines = lines.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
        }

        if (lines[0] && lines[0].substr(0, 2) === "#!") {
          if (lines[0].indexOf("node") !== -1) {
            state.option.node = true;
          }
          lines[0] = "";
        }

        this.emitter = new events.EventEmitter();
        this.source = source;
        this.setLines(lines);
        this.prereg = true;

        this.line = 0;
        this.char = 1;
        this.from = 1;
        this.input = "";
        this.inComment = false;

        for (var i = 0; i < state.option.indent; i += 1) {
          state.tab += " ";
        }
      }

      Lexer.prototype = {
        _lines: [],

        getLines: function getLines() {
          this._lines = state.lines;
          return this._lines;
        },

        setLines: function setLines(val) {
          this._lines = val;
          state.lines = this._lines;
        },
        peek: function peek(i) {
          return this.input.charAt(i || 0);
        },
        skip: function skip(i) {
          i = i || 1;
          this.char += i;
          this.input = this.input.slice(i);
        },
        on: function on(names, listener) {
          names.split(" ").forEach(function (name) {
            this.emitter.on(name, listener);
          }.bind(this));
        },
        trigger: function trigger() {
          this.emitter.emit.apply(this.emitter, Array.prototype.slice.call(arguments));
        },
        triggerAsync: function triggerAsync(type, args, checks, fn) {
          checks.push(function () {
            if (fn()) {
              this.trigger(type, args);
            }
          }.bind(this));
        },
        scanPunctuator: function scanPunctuator() {
          var ch1 = this.peek();
          var ch2, ch3, ch4;

          switch (ch1) {
            case ".":
              if (/^[0-9]$/.test(this.peek(1))) {
                return null;
              }
              if (this.peek(1) === "." && this.peek(2) === ".") {
                return {
                  type: Token.Punctuator,
                  value: "..."
                };
              }
            case "(":
            case ")":
            case ";":
            case ",":
            case "{":
            case "}":
            case "[":
            case "]":
            case ":":
            case "~":
            case "?":
              return {
                type: Token.Punctuator,
                value: ch1
              };
            case "#":
              return {
                type: Token.Punctuator,
                value: ch1
              };
            case "":
              return null;
          }

          ch2 = this.peek(1);
          ch3 = this.peek(2);
          ch4 = this.peek(3);

          if (ch1 === ">" && ch2 === ">" && ch3 === ">" && ch4 === "=") {
            return {
              type: Token.Punctuator,
              value: ">>>="
            };
          }

          if (ch1 === "=" && ch2 === "=" && ch3 === "=") {
            return {
              type: Token.Punctuator,
              value: "==="
            };
          }

          if (ch1 === "!" && ch2 === "=" && ch3 === "=") {
            return {
              type: Token.Punctuator,
              value: "!=="
            };
          }

          if (ch1 === ">" && ch2 === ">" && ch3 === ">") {
            return {
              type: Token.Punctuator,
              value: ">>>"
            };
          }

          if (ch1 === "<" && ch2 === "<" && ch3 === "=") {
            return {
              type: Token.Punctuator,
              value: "<<="
            };
          }

          if (ch1 === ">" && ch2 === ">" && ch3 === "=") {
            return {
              type: Token.Punctuator,
              value: ">>="
            };
          }
          if (ch1 === "=" && ch2 === ">") {
            return {
              type: Token.Punctuator,
              value: ch1 + ch2
            };
          }
          if (ch1 === ch2 && "+-<>&|".indexOf(ch1) >= 0) {
            return {
              type: Token.Punctuator,
              value: ch1 + ch2
            };
          }

          if ("<>=!+-*%&|^".indexOf(ch1) >= 0) {
            if (ch2 === "=") {
              return {
                type: Token.Punctuator,
                value: ch1 + ch2
              };
            }

            return {
              type: Token.Punctuator,
              value: ch1
            };
          }

          if (ch1 === "/") {
            if (ch2 === "=" && /\/=(?!(\S*\/[gim]?))/.test(this.input)) {
              return {
                type: Token.Punctuator,
                value: "/="
              };
            }

            return {
              type: Token.Punctuator,
              value: "/"
            };
          }

          return null;
        },
        scanComments: function scanComments() {
          var ch1 = this.peek();
          var ch2 = this.peek(1);
          var rest = this.input.substr(2);
          var startLine = this.line;
          var startChar = this.char;

          function commentToken(label, body, opt) {
            var special = ["jshint", "jslint", "members", "member", "globals", "global", "exported"];
            var isSpecial = false;
            var value = label + body;
            var commentType = "plain";
            opt = opt || {};

            if (opt.isMultiline) {
              value += "*/";
            }

            special.forEach(function (str) {
              if (isSpecial) {
                return;
              }
              if (label === "//" && str !== "jshint") {
                return;
              }

              if (body.substr(0, str.length) === str) {
                isSpecial = true;
                label = label + str;
                body = body.substr(str.length);
              }

              if (!isSpecial && body.charAt(0) === " " && body.substr(1, str.length) === str) {
                isSpecial = true;
                label = label + " " + str;
                body = body.substr(str.length + 1);
              }

              if (!isSpecial) {
                return;
              }

              switch (str) {
                case "member":
                  commentType = "members";
                  break;
                case "global":
                  commentType = "globals";
                  break;
                default:
                  commentType = str;
              }
            });

            return {
              type: Token.Comment,
              commentType: commentType,
              value: value,
              body: body,
              isSpecial: isSpecial,
              isMultiline: opt.isMultiline || false,
              isMalformed: opt.isMalformed || false
            };
          }
          if (ch1 === "*" && ch2 === "/") {
            this.trigger("error", {
              code: "E018",
              line: startLine,
              character: startChar
            });

            this.skip(2);
            return null;
          }
          if (ch1 !== "/" || ch2 !== "*" && ch2 !== "/") {
            return null;
          }
          if (ch2 === "/") {
            this.skip(this.input.length); // Skip to the EOL.
            return commentToken("//", rest);
          }

          var body = "";
          if (ch2 === "*") {
            this.inComment = true;
            this.skip(2);

            while (this.peek() !== "*" || this.peek(1) !== "/") {
              if (this.peek() === "") {
                // End of Line
                body += "\n";
                if (!this.nextLine()) {
                  this.trigger("error", {
                    code: "E017",
                    line: startLine,
                    character: startChar
                  });

                  this.inComment = false;
                  return commentToken("/*", body, {
                    isMultiline: true,
                    isMalformed: true
                  });
                }
              } else {
                body += this.peek();
                this.skip();
              }
            }

            this.skip(2);
            this.inComment = false;
            return commentToken("/*", body, { isMultiline: true });
          }
        },
        scanKeyword: function scanKeyword() {
          var result = /^[a-zA-Z_$][a-zA-Z0-9_$]*/.exec(this.input);
          var keywords = ["if", "in", "do", "var", "for", "new", "try", "let", "this", "else", "case", "void", "with", "enum", "while", "break", "catch", "throw", "const", "yield", "class", "super", "return", "typeof", "delete", "switch", "export", "import", "default", "finally", "extends", "function", "continue", "debugger", "instanceof"];

          if (result && keywords.indexOf(result[0]) >= 0) {
            return {
              type: Token.Keyword,
              value: result[0]
            };
          }

          return null;
        },
        scanIdentifier: function scanIdentifier() {
          var id = "";
          var index = 0;
          var type, char;

          function isNonAsciiIdentifierStart(code) {
            return code > 256;
          }

          function isNonAsciiIdentifierPart(code) {
            return code > 256;
          }

          function isHexDigit(str) {
            return (/^[0-9a-fA-F]$/.test(str)
            );
          }

          var readUnicodeEscapeSequence = function () {
            index += 1;

            if (this.peek(index) !== "u") {
              return null;
            }

            var ch1 = this.peek(index + 1);
            var ch2 = this.peek(index + 2);
            var ch3 = this.peek(index + 3);
            var ch4 = this.peek(index + 4);
            var code;

            if (isHexDigit(ch1) && isHexDigit(ch2) && isHexDigit(ch3) && isHexDigit(ch4)) {
              code = parseInt(ch1 + ch2 + ch3 + ch4, 16);

              if (asciiIdentifierPartTable[code] || isNonAsciiIdentifierPart(code)) {
                index += 5;
                return "\\u" + ch1 + ch2 + ch3 + ch4;
              }

              return null;
            }

            return null;
          }.bind(this);

          var getIdentifierStart = function () {
            var chr = this.peek(index);
            var code = chr.charCodeAt(0);

            if (code === 92) {
              return readUnicodeEscapeSequence();
            }

            if (code < 128) {
              if (asciiIdentifierStartTable[code]) {
                index += 1;
                return chr;
              }

              return null;
            }

            if (isNonAsciiIdentifierStart(code)) {
              index += 1;
              return chr;
            }

            return null;
          }.bind(this);

          var getIdentifierPart = function () {
            var chr = this.peek(index);
            var code = chr.charCodeAt(0);

            if (code === 92) {
              return readUnicodeEscapeSequence();
            }

            if (code < 128) {
              if (asciiIdentifierPartTable[code]) {
                index += 1;
                return chr;
              }

              return null;
            }

            if (isNonAsciiIdentifierPart(code)) {
              index += 1;
              return chr;
            }

            return null;
          }.bind(this);

          char = getIdentifierStart();
          if (char === null) {
            return null;
          }

          id = char;
          for (;;) {
            char = getIdentifierPart();

            if (char === null) {
              break;
            }

            id += char;
          }

          switch (id) {
            case "true":
            case "false":
              type = Token.BooleanLiteral;
              break;
            case "null":
              type = Token.NullLiteral;
              break;
            default:
              type = Token.Identifier;
          }

          return {
            type: type,
            value: id
          };
        },
        scanNumericLiteral: function scanNumericLiteral() {
          var index = 0;
          var value = "";
          var length = this.input.length;
          var char = this.peek(index);
          var bad;

          function isDecimalDigit(str) {
            return (/^[0-9]$/.test(str)
            );
          }

          function isOctalDigit(str) {
            return (/^[0-7]$/.test(str)
            );
          }

          function isHexDigit(str) {
            return (/^[0-9a-fA-F]$/.test(str)
            );
          }

          function isIdentifierStart(ch) {
            return ch === "$" || ch === "_" || ch === "\\" || ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z";
          }

          if (char !== "." && !isDecimalDigit(char)) {
            return null;
          }

          if (char !== ".") {
            value = this.peek(index);
            index += 1;
            char = this.peek(index);

            if (value === "0") {
              if (char === "x" || char === "X") {
                index += 1;
                value += char;

                while (index < length) {
                  char = this.peek(index);
                  if (!isHexDigit(char)) {
                    break;
                  }
                  value += char;
                  index += 1;
                }

                if (value.length <= 2) {
                  // 0x
                  return {
                    type: Token.NumericLiteral,
                    value: value,
                    isMalformed: true
                  };
                }

                if (index < length) {
                  char = this.peek(index);
                  if (isIdentifierStart(char)) {
                    return null;
                  }
                }

                return {
                  type: Token.NumericLiteral,
                  value: value,
                  base: 16,
                  isMalformed: false
                };
              }
              if (isOctalDigit(char)) {
                index += 1;
                value += char;
                bad = false;

                while (index < length) {
                  char = this.peek(index);

                  if (isDecimalDigit(char)) {
                    bad = true;
                  } else if (!isOctalDigit(char)) {
                    break;
                  }
                  value += char;
                  index += 1;
                }

                if (index < length) {
                  char = this.peek(index);
                  if (isIdentifierStart(char)) {
                    return null;
                  }
                }

                return {
                  type: Token.NumericLiteral,
                  value: value,
                  base: 8,
                  isMalformed: false
                };
              }

              if (isDecimalDigit(char)) {
                index += 1;
                value += char;
              }
            }

            while (index < length) {
              char = this.peek(index);
              if (!isDecimalDigit(char)) {
                break;
              }
              value += char;
              index += 1;
            }
          }

          if (char === ".") {
            value += char;
            index += 1;

            while (index < length) {
              char = this.peek(index);
              if (!isDecimalDigit(char)) {
                break;
              }
              value += char;
              index += 1;
            }
          }

          if (char === "e" || char === "E") {
            value += char;
            index += 1;
            char = this.peek(index);

            if (char === "+" || char === "-") {
              value += this.peek(index);
              index += 1;
            }

            char = this.peek(index);
            if (isDecimalDigit(char)) {
              value += char;
              index += 1;

              while (index < length) {
                char = this.peek(index);
                if (!isDecimalDigit(char)) {
                  break;
                }
                value += char;
                index += 1;
              }
            } else {
              return null;
            }
          }

          if (index < length) {
            char = this.peek(index);
            if (isIdentifierStart(char)) {
              return null;
            }
          }

          return {
            type: Token.NumericLiteral,
            value: value,
            base: 10,
            isMalformed: !isFinite(value)
          };
        },
        scanTemplateLiteral: function scanTemplateLiteral() {
          if (!state.option.esnext || this.peek() !== "`") {
            return null;
          }

          var startLine = this.line;
          var startChar = this.char;
          var jump = 1;
          var value = "";
          this.skip();

          while (this.peek() !== "`") {
            while (this.peek() === "") {
              if (!this.nextLine()) {
                this.trigger("error", {
                  code: "E052",
                  line: startLine,
                  character: startChar
                });

                return {
                  type: Token.TemplateLiteral,
                  value: value,
                  isUnclosed: true
                };
              }
              value += "\n";
            }
            var char = this.peek();
            this.skip(jump);
            value += char;
          }

          this.skip();
          return {
            type: Token.TemplateLiteral,
            value: value,
            isUnclosed: false
          };
        },
        scanStringLiteral: function scanStringLiteral(checks) {
          var quote = this.peek();
          if (quote !== "\"" && quote !== "'") {
            return null;
          }
          this.triggerAsync("warning", {
            code: "W108",
            line: this.line,
            character: this.char // +1?
          }, checks, function () {
            return state.jsonMode && quote !== "\"";
          });

          var value = "";
          var startLine = this.line;
          var startChar = this.char;
          var allowNewLine = false;

          this.skip();

          outer: while (this.peek() !== quote) {
            while (this.peek() === "") {
              // End Of Line

              if (!allowNewLine) {
                this.trigger("warning", {
                  code: "W112",
                  line: this.line,
                  character: this.char
                });
              } else {
                allowNewLine = false;

                this.triggerAsync("warning", {
                  code: "W043",
                  line: this.line,
                  character: this.char
                }, checks, function () {
                  return !state.option.multistr;
                });

                this.triggerAsync("warning", {
                  code: "W042",
                  line: this.line,
                  character: this.char
                }, checks, function () {
                  return state.jsonMode && state.option.multistr;
                });
              }

              if (!this.nextLine()) {
                this.trigger("error", {
                  code: "E029",
                  line: startLine,
                  character: startChar
                });

                return {
                  type: Token.StringLiteral,
                  value: value,
                  isUnclosed: true,
                  quote: quote
                };
              }

              if (this.peek() == quote) break outer;
            }

            allowNewLine = false;
            var char = this.peek();
            var jump = 1; // A length of a jump, after we're done

            if (char < " ") {
              this.trigger("warning", {
                code: "W113",
                line: this.line,
                character: this.char,
                data: ["<non-printable>"]
              });
            }

            if (char === "\\") {
              this.skip();
              char = this.peek();

              switch (char) {
                case "'":
                  this.triggerAsync("warning", {
                    code: "W114",
                    line: this.line,
                    character: this.char,
                    data: ["\\'"]
                  }, checks, function () {
                    return state.jsonMode;
                  });
                  break;
                case "b":
                  char = "\\b";
                  break;
                case "f":
                  char = "\\f";
                  break;
                case "n":
                  char = "\\n";
                  break;
                case "r":
                  char = "\\r";
                  break;
                case "t":
                  char = "\\t";
                  break;
                case "0":
                  char = "\\0";
                  var n = parseInt(this.peek(1), 10);
                  this.triggerAsync("warning", {
                    code: "W115",
                    line: this.line,
                    character: this.char
                  }, checks, function () {
                    return n >= 0 && n <= 7 && state.directive["use strict"];
                  });
                  break;
                case "u":
                  char = String.fromCharCode(parseInt(this.input.substr(1, 4), 16));
                  jump = 5;
                  break;
                case "v":
                  this.triggerAsync("warning", {
                    code: "W114",
                    line: this.line,
                    character: this.char,
                    data: ["\\v"]
                  }, checks, function () {
                    return state.jsonMode;
                  });

                  char = "\v";
                  break;
                case "x":
                  var x = parseInt(this.input.substr(1, 2), 16);

                  this.triggerAsync("warning", {
                    code: "W114",
                    line: this.line,
                    character: this.char,
                    data: ["\\x-"]
                  }, checks, function () {
                    return state.jsonMode;
                  });

                  char = String.fromCharCode(x);
                  jump = 3;
                  break;
                case "\\":
                  char = "\\\\";
                  break;
                case "\"":
                  char = "\\\"";
                  break;
                case "/":
                  break;
                case "":
                  allowNewLine = true;
                  char = "";
                  break;
                case "!":
                  if (value.slice(value.length - 2) === "<") {
                    break;
                  }
                default:
                  this.trigger("warning", {
                    code: "W044",
                    line: this.line,
                    character: this.char
                  });
              }
            }

            value += char;
            this.skip(jump);
          }

          this.skip();
          return {
            type: Token.StringLiteral,
            value: value,
            isUnclosed: false,
            quote: quote
          };
        },
        scanRegExp: function scanRegExp() {
          var index = 0;
          var length = this.input.length;
          var char = this.peek();
          var value = char;
          var body = "";
          var flags = [];
          var malformed = false;
          var isCharSet = false;
          var terminated;

          var scanUnexpectedChars = function () {
            if (char < " ") {
              malformed = true;
              this.trigger("warning", {
                code: "W048",
                line: this.line,
                character: this.char
              });
            }
            if (char === "<") {
              malformed = true;
              this.trigger("warning", {
                code: "W049",
                line: this.line,
                character: this.char,
                data: [char]
              });
            }
          }.bind(this);
          if (!this.prereg || char !== "/") {
            return null;
          }

          index += 1;
          terminated = false;

          while (index < length) {
            char = this.peek(index);
            value += char;
            body += char;

            if (isCharSet) {
              if (char === "]") {
                if (this.peek(index - 1) !== "\\" || this.peek(index - 2) === "\\") {
                  isCharSet = false;
                }
              }

              if (char === "\\") {
                index += 1;
                char = this.peek(index);
                body += char;
                value += char;

                scanUnexpectedChars();
              }

              index += 1;
              continue;
            }

            if (char === "\\") {
              index += 1;
              char = this.peek(index);
              body += char;
              value += char;

              scanUnexpectedChars();

              if (char === "/") {
                index += 1;
                continue;
              }

              if (char === "[") {
                index += 1;
                continue;
              }
            }

            if (char === "[") {
              isCharSet = true;
              index += 1;
              continue;
            }

            if (char === "/") {
              body = body.substr(0, body.length - 1);
              terminated = true;
              index += 1;
              break;
            }

            index += 1;
          }

          if (!terminated) {
            this.trigger("error", {
              code: "E015",
              line: this.line,
              character: this.from
            });

            return void this.trigger("fatal", {
              line: this.line,
              from: this.from
            });
          }

          while (index < length) {
            char = this.peek(index);
            if (!/[gim]/.test(char)) {
              break;
            }
            flags.push(char);
            value += char;
            index += 1;
          }

          try {
            new RegExp(body, flags.join(""));
          } catch (err) {
            malformed = true;
            this.trigger("error", {
              code: "E016",
              line: this.line,
              character: this.char,
              data: [err.message] // Platform dependent!
            });
          }

          return {
            type: Token.RegExp,
            value: value,
            flags: flags,
            isMalformed: malformed
          };
        },
        scanNonBreakingSpaces: function scanNonBreakingSpaces() {
          return state.option.nonbsp ? this.input.search(/(\u00A0)/) : -1;
        },
        scanUnsafeChars: function scanUnsafeChars() {
          return this.input.search(reg.unsafeChars);
        },
        next: function next(checks) {
          this.from = this.char;
          var start;
          if (/\s/.test(this.peek())) {
            start = this.char;

            while (/\s/.test(this.peek())) {
              this.from += 1;
              this.skip();
            }
          }

          var match = this.scanComments() || this.scanStringLiteral(checks) || this.scanTemplateLiteral();

          if (match) {
            return match;
          }

          match = this.scanRegExp() || this.scanPunctuator() || this.scanKeyword() || this.scanIdentifier() || this.scanNumericLiteral();

          if (match) {
            this.skip(match.value.length);
            return match;
          }

          return null;
        },
        nextLine: function nextLine() {
          var char;

          if (this.line >= this.getLines().length) {
            return false;
          }

          this.input = this.getLines()[this.line];
          this.line += 1;
          this.char = 1;
          this.from = 1;

          var inputTrimmed = this.input.trim();

          var startsWith = function startsWith() {
            return _.some(arguments, function (prefix) {
              return inputTrimmed.indexOf(prefix) === 0;
            });
          };

          var endsWith = function endsWith() {
            return _.some(arguments, function (suffix) {
              return inputTrimmed.indexOf(suffix, inputTrimmed.length - suffix.length) !== -1;
            });
          };
          if (state.ignoreLinterErrors === true) {
            if (!startsWith("/*", "//") && !endsWith("*/")) {
              this.input = "";
            }
          }

          char = this.scanNonBreakingSpaces();
          if (char >= 0) {
            this.trigger("warning", { code: "W125", line: this.line, character: char + 1 });
          }

          this.input = this.input.replace(/\t/g, state.tab);
          char = this.scanUnsafeChars();

          if (char >= 0) {
            this.trigger("warning", { code: "W100", line: this.line, character: char });
          }

          if (state.option.maxlen && state.option.maxlen < this.input.length) {
            var inComment = this.inComment || startsWith.call(inputTrimmed, "//") || startsWith.call(inputTrimmed, "/*");

            var shouldTriggerError = !inComment || !reg.maxlenException.test(inputTrimmed);

            if (shouldTriggerError) {
              this.trigger("warning", { code: "W101", line: this.line, character: this.input.length });
            }
          }

          return true;
        },
        start: function start() {
          this.nextLine();
        },
        token: function token() {
          var checks = asyncTrigger();
          var token;

          function isReserved(token, isProperty) {
            if (!token.reserved) {
              return false;
            }
            var meta = token.meta;

            if (meta && meta.isFutureReservedWord && state.option.inES5()) {
              if (!meta.es5) {
                return false;
              }
              if (meta.strictOnly) {
                if (!state.option.strict && !state.directive["use strict"]) {
                  return false;
                }
              }

              if (isProperty) {
                return false;
              }
            }

            return true;
          }
          var create = function (type, value, isProperty) {
            var obj;

            if (type !== "(endline)" && type !== "(end)") {
              this.prereg = false;
            }

            if (type === "(punctuator)") {
              switch (value) {
                case ".":
                case ")":
                case "~":
                case "#":
                case "]":
                  this.prereg = false;
                  break;
                default:
                  this.prereg = true;
              }

              obj = Object.create(state.syntax[value] || state.syntax["(error)"]);
            }

            if (type === "(identifier)") {
              if (value === "return" || value === "case" || value === "typeof") {
                this.prereg = true;
              }

              if (_.has(state.syntax, value)) {
                obj = Object.create(state.syntax[value] || state.syntax["(error)"]);
                if (!isReserved(obj, isProperty && type === "(identifier)")) {
                  obj = null;
                }
              }
            }

            if (!obj) {
              obj = Object.create(state.syntax[type]);
            }

            obj.identifier = type === "(identifier)";
            obj.type = obj.type || type;
            obj.value = value;
            obj.line = this.line;
            obj.character = this.char;
            obj.from = this.from;

            if (isProperty && obj.identifier) {
              obj.isProperty = isProperty;
            }

            obj.check = checks.check;

            return obj;
          }.bind(this);

          for (;;) {
            if (!this.input.length) {
              return create(this.nextLine() ? "(endline)" : "(end)", "");
            }

            token = this.next(checks);

            if (!token) {
              if (this.input.length) {
                this.trigger("error", {
                  code: "E024",
                  line: this.line,
                  character: this.char,
                  data: [this.peek()]
                });

                this.input = "";
              }

              continue;
            }

            switch (token.type) {
              case Token.StringLiteral:
                this.triggerAsync("String", {
                  line: this.line,
                  char: this.char,
                  from: this.from,
                  value: token.value,
                  quote: token.quote
                }, checks, function () {
                  return true;
                });

                return create("(string)", token.value);

              case Token.TemplateLiteral:
                this.trigger("Template", {
                  line: this.line,
                  char: this.char,
                  from: this.from,
                  value: token.value
                });
                return create("(template)", token.value);

              case Token.Identifier:
                this.trigger("Identifier", {
                  line: this.line,
                  char: this.char,
                  from: this.form,
                  name: token.value,
                  isProperty: state.tokens.curr.id === "."
                });
              case Token.Keyword:
              case Token.NullLiteral:
              case Token.BooleanLiteral:
                return create("(identifier)", token.value, state.tokens.curr.id === ".");

              case Token.NumericLiteral:
                if (token.isMalformed) {
                  this.trigger("warning", {
                    code: "W045",
                    line: this.line,
                    character: this.char,
                    data: [token.value]
                  });
                }

                this.triggerAsync("warning", {
                  code: "W114",
                  line: this.line,
                  character: this.char,
                  data: ["0x-"]
                }, checks, function () {
                  return token.base === 16 && state.jsonMode;
                });

                this.triggerAsync("warning", {
                  code: "W115",
                  line: this.line,
                  character: this.char
                }, checks, function () {
                  return state.directive["use strict"] && token.base === 8;
                });

                this.trigger("Number", {
                  line: this.line,
                  char: this.char,
                  from: this.from,
                  value: token.value,
                  base: token.base,
                  isMalformed: token.malformed
                });

                return create("(number)", token.value);

              case Token.RegExp:
                return create("(regexp)", token.value);

              case Token.Comment:
                state.tokens.curr.comment = true;

                if (token.isSpecial) {
                  return {
                    id: '(comment)',
                    value: token.value,
                    body: token.body,
                    type: token.commentType,
                    isSpecial: token.isSpecial,
                    line: this.line,
                    character: this.char,
                    from: this.from
                  };
                }

                break;

              case "":
                break;

              default:
                return create("(punctuator)", token.value);
            }
          }
        }
      };

      exports.Lexer = Lexer;
    }, { "../data/ascii-identifier-data.js": 1, "./reg.js": 6, "./state.js": 7, "events": 10, "underscore": 2 }],
    5: [function (_dereq_, module, exports) {
      "use strict";

      var _ = _dereq_("underscore");

      var errors = {
        E001: "Bad option: '{a}'.",
        E002: "Bad option value.",
        E003: "Expected a JSON value.",
        E004: "Input is neither a string nor an array of strings.",
        E005: "Input is empty.",
        E006: "Unexpected early end of program.",
        E007: "Missing \"use strict\" statement.",
        E008: "Strict violation.",
        E009: "Option 'validthis' can't be used in a global scope.",
        E010: "'with' is not allowed in strict mode.",
        E011: "const '{a}' has already been declared.",
        E012: "const '{a}' is initialized to 'undefined'.",
        E013: "Attempting to override '{a}' which is a constant.",
        E014: "A regular expression literal can be confused with '/='.",
        E015: "Unclosed regular expression.",
        E016: "Invalid regular expression.",
        E017: "Unclosed comment.",
        E018: "Unbegun comment.",
        E019: "Unmatched '{a}'.",
        E020: "Expected '{a}' to match '{b}' from line {c} and instead saw '{d}'.",
        E021: "Expected '{a}' and instead saw '{b}'.",
        E022: "Line breaking error '{a}'.",
        E023: "Missing '{a}'.",
        E024: "Unexpected '{a}'.",
        E025: "Missing ':' on a case clause.",
        E026: "Missing '}' to match '{' from line {a}.",
        E027: "Missing ']' to match '[' from line {a}.",
        E028: "Illegal comma.",
        E029: "Unclosed string.",
        E030: "Expected an identifier and instead saw '{a}'.",
        E031: "Bad assignment.", // FIXME: Rephrase
        E032: "Expected a small integer or 'false' and instead saw '{a}'.",
        E033: "Expected an operator and instead saw '{a}'.",
        E034: "get/set are ES5 features.",
        E035: "Missing property name.",
        E036: "Expected to see a statement and instead saw a block.",
        E037: null,
        E038: null,
        E039: "Function declarations are not invocable. Wrap the whole function invocation in parens.",
        E040: "Each value should have its own case label.",
        E041: "Unrecoverable syntax error.",
        E042: "Stopping.",
        E043: "Too many errors.",
        E044: null,
        E045: "Invalid for each loop.",
        E046: "A yield statement shall be within a generator function (with syntax: `function*`)",
        E047: null, // Vacant
        E048: "Let declaration not directly within block.",
        E049: "A {a} cannot be named '{b}'.",
        E050: "Mozilla requires the yield expression to be parenthesized here.",
        E051: "Regular parameters cannot come after default parameters.",
        E052: "Unclosed template literal."
      };

      var warnings = {
        W001: "'hasOwnProperty' is a really bad name.",
        W002: "Value of '{a}' may be overwritten in IE 8 and earlier.",
        W003: "'{a}' was used before it was defined.",
        W004: "'{a}' is already defined.",
        W005: "A dot following a number can be confused with a decimal point.",
        W006: "Confusing minuses.",
        W007: "Confusing plusses.",
        W008: "A leading decimal point can be confused with a dot: '{a}'.",
        W009: "The array literal notation [] is preferable.",
        W010: "The object literal notation {} is preferable.",
        W011: null,
        W012: null,
        W013: null,
        W014: "Bad line breaking before '{a}'.",
        W015: null,
        W016: "Unexpected use of '{a}'.",
        W017: "Bad operand.",
        W018: "Confusing use of '{a}'.",
        W019: "Use the isNaN function to compare with NaN.",
        W020: "Read only.",
        W021: "'{a}' is a function.",
        W022: "Do not assign to the exception parameter.",
        W023: "Expected an identifier in an assignment and instead saw a function invocation.",
        W024: "Expected an identifier and instead saw '{a}' (a reserved word).",
        W025: "Missing name in function declaration.",
        W026: "Inner functions should be listed at the top of the outer function.",
        W027: "Unreachable '{a}' after '{b}'.",
        W028: "Label '{a}' on {b} statement.",
        W030: "Expected an assignment or function call and instead saw an expression.",
        W031: "Do not use 'new' for side effects.",
        W032: "Unnecessary semicolon.",
        W033: "Missing semicolon.",
        W034: "Unnecessary directive \"{a}\".",
        W035: "Empty block.",
        W036: "Unexpected /*member '{a}'.",
        W037: "'{a}' is a statement label.",
        W038: "'{a}' used out of scope.",
        W039: "'{a}' is not allowed.",
        W040: "Possible strict violation.",
        W041: "Use '{a}' to compare with '{b}'.",
        W042: "Avoid EOL escaping.",
        W043: "Bad escaping of EOL. Use option multistr if needed.",
        W044: "Bad or unnecessary escaping.",
        W045: "Bad number '{a}'.",
        W046: "Don't use extra leading zeros '{a}'.",
        W047: "A trailing decimal point can be confused with a dot: '{a}'.",
        W048: "Unexpected control character in regular expression.",
        W049: "Unexpected escaped character '{a}' in regular expression.",
        W050: "JavaScript URL.",
        W051: "Variables should not be deleted.",
        W052: "Unexpected '{a}'.",
        W053: "Do not use {a} as a constructor.",
        W054: "The Function constructor is a form of eval.",
        W055: "A constructor name should start with an uppercase letter.",
        W056: "Bad constructor.",
        W057: "Weird construction. Is 'new' necessary?",
        W058: "Missing '()' invoking a constructor.",
        W059: "Avoid arguments.{a}.",
        W060: "document.write can be a form of eval.",
        W061: "eval can be harmful.",
        W062: "Wrap an immediate function invocation in parens " + "to assist the reader in understanding that the expression " + "is the result of a function, and not the function itself.",
        W063: "Math is not a function.",
        W064: "Missing 'new' prefix when invoking a constructor.",
        W065: "Missing radix parameter.",
        W066: "Implied eval. Consider passing a function instead of a string.",
        W067: "Bad invocation.",
        W068: "Wrapping non-IIFE function literals in parens is unnecessary.",
        W069: "['{a}'] is better written in dot notation.",
        W070: "Extra comma. (it breaks older versions of IE)",
        W071: "This function has too many statements. ({a})",
        W072: "This function has too many parameters. ({a})",
        W073: "Blocks are nested too deeply. ({a})",
        W074: "This function's cyclomatic complexity is too high. ({a})",
        W075: "Duplicate key '{a}'.",
        W076: "Unexpected parameter '{a}' in get {b} function.",
        W077: "Expected a single parameter in set {a} function.",
        W078: "Setter is defined without getter.",
        W079: "Redefinition of '{a}'.",
        W080: "It's not necessary to initialize '{a}' to 'undefined'.",
        W081: null,
        W082: "Function declarations should not be placed in blocks. " + "Use a function expression or move the statement to the top of " + "the outer function.",
        W083: "Don't make functions within a loop.",
        W084: "Assignment in conditional expression",
        W085: "Don't use 'with'.",
        W086: "Expected a 'break' statement before '{a}'.",
        W087: "Forgotten 'debugger' statement?",
        W088: "Creating global 'for' variable. Should be 'for (var {a} ...'.",
        W089: "The body of a for in should be wrapped in an if statement to filter " + "unwanted properties from the prototype.",
        W090: "'{a}' is not a statement label.",
        W091: "'{a}' is out of scope.",
        W093: "Did you mean to return a conditional instead of an assignment?",
        W094: "Unexpected comma.",
        W095: "Expected a string and instead saw {a}.",
        W096: "The '{a}' key may produce unexpected results.",
        W097: "Use the function form of \"use strict\".",
        W098: "'{a}' is defined but never used.",
        W099: null,
        W100: "This character may get silently deleted by one or more browsers.",
        W101: "Line is too long.",
        W102: null,
        W103: "The '{a}' property is deprecated.",
        W104: "'{a}' is available in ES6 (use esnext option) or Mozilla JS extensions (use moz).",
        W105: "Unexpected {a} in '{b}'.",
        W106: "Identifier '{a}' is not in camel case.",
        W107: "Script URL.",
        W108: "Strings must use doublequote.",
        W109: "Strings must use singlequote.",
        W110: "Mixed double and single quotes.",
        W112: "Unclosed string.",
        W113: "Control character in string: {a}.",
        W114: "Avoid {a}.",
        W115: "Octal literals are not allowed in strict mode.",
        W116: "Expected '{a}' and instead saw '{b}'.",
        W117: "'{a}' is not defined.",
        W118: "'{a}' is only available in Mozilla JavaScript extensions (use moz option).",
        W119: "'{a}' is only available in ES6 (use esnext option).",
        W120: "You might be leaking a variable ({a}) here.",
        W121: "Extending prototype of native object: '{a}'.",
        W122: "Invalid typeof value '{a}'",
        W123: "'{a}' is already defined in outer scope.",
        W124: "A generator function shall contain a yield statement.",
        W125: "This line contains non-breaking spaces: http://jshint.com/doc/options/#nonbsp"
      };

      var info = {
        I001: "Comma warnings can be turned off with 'laxcomma'.",
        I002: null,
        I003: "ES5 option is now set per default"
      };

      exports.errors = {};
      exports.warnings = {};
      exports.info = {};

      _.each(errors, function (desc, code) {
        exports.errors[code] = { code: code, desc: desc };
      });

      _.each(warnings, function (desc, code) {
        exports.warnings[code] = { code: code, desc: desc };
      });

      _.each(info, function (desc, code) {
        exports.info[code] = { code: code, desc: desc };
      });
    }, { "underscore": 2 }],
    6: [function (_dereq_, module, exports) {

      "use string";

      exports.unsafeString = /@cc|<\/?|script|\]\s*\]|<\s*!|&lt/i;
      exports.unsafeChars = /[\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/;
      exports.needEsc = /[\u0000-\u001f&<"\/\\\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/;

      exports.needEscGlobal = /[\u0000-\u001f&<"\/\\\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
      exports.starSlash = /\*\//;
      exports.identifier = /^([a-zA-Z_$][a-zA-Z0-9_$]*)$/;
      exports.javascriptURL = /^(?:javascript|jscript|ecmascript|vbscript|livescript)\s*:/i;
      exports.fallsThrough = /^\s*\/\*\s*falls?\sthrough\s*\*\/\s*$/;
      exports.maxlenException = /^(?:(?:\/\/|\/\*|\*) ?)?[^ ]+$/;
    }, {}],
    7: [function (_dereq_, module, exports) {
      "use strict";

      var state = {
        syntax: {},

        reset: function reset() {
          this.tokens = {
            prev: null,
            next: null,
            curr: null
          };

          this.option = {};
          this.ignored = {};
          this.directive = {};
          this.jsonMode = false;
          this.jsonWarnings = [];
          this.lines = [];
          this.tab = "";
          this.cache = {}; // Node.JS doesn't have Map. Sniff.
          this.ignoredLines = {};
          this.ignoreLinterErrors = false;
        }
      };

      exports.state = state;
    }, {}],
    8: [function (_dereq_, module, exports) {
      "use strict";

      exports.register = function (linter) {

        linter.on("Identifier", function style_scanProto(data) {
          if (linter.getOption("proto")) {
            return;
          }

          if (data.name === "__proto__") {
            linter.warn("W103", {
              line: data.line,
              char: data.char,
              data: [data.name]
            });
          }
        });

        linter.on("Identifier", function style_scanIterator(data) {
          if (linter.getOption("iterator")) {
            return;
          }

          if (data.name === "__iterator__") {
            linter.warn("W104", {
              line: data.line,
              char: data.char,
              data: [data.name]
            });
          }
        });

        linter.on("Identifier", function style_scanCamelCase(data) {
          if (!linter.getOption("camelcase")) {
            return;
          }

          if (data.name.replace(/^_+|_+$/g, "").indexOf("_") > -1 && !data.name.match(/^[A-Z0-9_]*$/)) {
            linter.warn("W106", {
              line: data.line,
              char: data.from,
              data: [data.name]
            });
          }
        });

        linter.on("String", function style_scanQuotes(data) {
          var quotmark = linter.getOption("quotmark");
          var code;

          if (!quotmark) {
            return;
          }

          if (quotmark === "single" && data.quote !== "'") {
            code = "W109";
          }

          if (quotmark === "double" && data.quote !== "\"") {
            code = "W108";
          }

          if (quotmark === true) {
            if (!linter.getCache("quotmark")) {
              linter.setCache("quotmark", data.quote);
            }

            if (linter.getCache("quotmark") !== data.quote) {
              code = "W110";
            }
          }

          if (code) {
            linter.warn(code, {
              line: data.line,
              char: data.char
            });
          }
        });

        linter.on("Number", function style_scanNumbers(data) {
          if (data.value.charAt(0) === ".") {
            linter.warn("W008", {
              line: data.line,
              char: data.char,
              data: [data.value]
            });
          }

          if (data.value.substr(data.value.length - 1) === ".") {
            linter.warn("W047", {
              line: data.line,
              char: data.char,
              data: [data.value]
            });
          }

          if (/^00+/.test(data.value)) {
            linter.warn("W046", {
              line: data.line,
              char: data.char,
              data: [data.value]
            });
          }
        });

        linter.on("String", function style_scanJavaScriptURLs(data) {
          var re = /^(?:javascript|jscript|ecmascript|vbscript|livescript)\s*:/i;

          if (linter.getOption("scripturl")) {
            return;
          }

          if (re.test(data.value)) {
            linter.warn("W107", {
              line: data.line,
              char: data.char
            });
          }
        });
      };
    }, {}],
    9: [function (_dereq_, module, exports) {

      "use strict";

      exports.reservedVars = {
        arguments: false,
        NaN: false
      };

      exports.ecmaIdentifiers = {
        Array: false,
        Boolean: false,
        Date: false,
        decodeURI: false,
        decodeURIComponent: false,
        encodeURI: false,
        encodeURIComponent: false,
        Error: false,
        "eval": false,
        EvalError: false,
        Function: false,
        hasOwnProperty: false,
        isFinite: false,
        isNaN: false,
        JSON: false,
        Math: false,
        Number: false,
        Object: false,
        parseInt: false,
        parseFloat: false,
        RangeError: false,
        ReferenceError: false,
        RegExp: false,
        String: false,
        SyntaxError: false,
        TypeError: false,
        URIError: false
      };

      exports.newEcmaIdentifiers = {
        Set: false,
        Map: false,
        WeakMap: false,
        WeakSet: false,
        Proxy: false,
        Promise: false
      };

      exports.browser = {
        Audio: false,
        Blob: false,
        addEventListener: false,
        applicationCache: false,
        atob: false,
        blur: false,
        btoa: false,
        CanvasGradient: false,
        CanvasPattern: false,
        CanvasRenderingContext2D: false,
        clearInterval: false,
        clearTimeout: false,
        close: false,
        closed: false,
        CustomEvent: false,
        DOMParser: false,
        defaultStatus: false,
        document: false,
        Element: false,
        ElementTimeControl: false,
        event: false,
        FileReader: false,
        FormData: false,
        focus: false,
        frames: false,
        getComputedStyle: false,
        HTMLElement: false,
        HTMLAnchorElement: false,
        HTMLBaseElement: false,
        HTMLBlockquoteElement: false,
        HTMLBodyElement: false,
        HTMLBRElement: false,
        HTMLButtonElement: false,
        HTMLCanvasElement: false,
        HTMLDirectoryElement: false,
        HTMLDivElement: false,
        HTMLDListElement: false,
        HTMLFieldSetElement: false,
        HTMLFontElement: false,
        HTMLFormElement: false,
        HTMLFrameElement: false,
        HTMLFrameSetElement: false,
        HTMLHeadElement: false,
        HTMLHeadingElement: false,
        HTMLHRElement: false,
        HTMLHtmlElement: false,
        HTMLIFrameElement: false,
        HTMLImageElement: false,
        HTMLInputElement: false,
        HTMLIsIndexElement: false,
        HTMLLabelElement: false,
        HTMLLayerElement: false,
        HTMLLegendElement: false,
        HTMLLIElement: false,
        HTMLLinkElement: false,
        HTMLMapElement: false,
        HTMLMenuElement: false,
        HTMLMetaElement: false,
        HTMLModElement: false,
        HTMLObjectElement: false,
        HTMLOListElement: false,
        HTMLOptGroupElement: false,
        HTMLOptionElement: false,
        HTMLParagraphElement: false,
        HTMLParamElement: false,
        HTMLPreElement: false,
        HTMLQuoteElement: false,
        HTMLScriptElement: false,
        HTMLSelectElement: false,
        HTMLStyleElement: false,
        HTMLTableCaptionElement: false,
        HTMLTableCellElement: false,
        HTMLTableColElement: false,
        HTMLTableElement: false,
        HTMLTableRowElement: false,
        HTMLTableSectionElement: false,
        HTMLTextAreaElement: false,
        HTMLTitleElement: false,
        HTMLUListElement: false,
        HTMLVideoElement: false,
        history: false,
        Image: false,
        length: false,
        localStorage: false,
        location: false,
        matchMedia: false,
        MessageChannel: false,
        MessageEvent: false,
        MessagePort: false,
        MouseEvent: false,
        moveBy: false,
        moveTo: false,
        MutationObserver: false,
        name: false,
        Node: false,
        NodeFilter: false,
        NodeList: false,
        navigator: false,
        onbeforeunload: true,
        onblur: true,
        onerror: true,
        onfocus: true,
        onload: true,
        onresize: true,
        onunload: true,
        open: false,
        openDatabase: false,
        opener: false,
        Option: false,
        parent: false,
        print: false,
        removeEventListener: false,
        resizeBy: false,
        resizeTo: false,
        screen: false,
        scroll: false,
        scrollBy: false,
        scrollTo: false,
        sessionStorage: false,
        setInterval: false,
        setTimeout: false,
        SharedWorker: false,
        status: false,
        SVGAElement: false,
        SVGAltGlyphDefElement: false,
        SVGAltGlyphElement: false,
        SVGAltGlyphItemElement: false,
        SVGAngle: false,
        SVGAnimateColorElement: false,
        SVGAnimateElement: false,
        SVGAnimateMotionElement: false,
        SVGAnimateTransformElement: false,
        SVGAnimatedAngle: false,
        SVGAnimatedBoolean: false,
        SVGAnimatedEnumeration: false,
        SVGAnimatedInteger: false,
        SVGAnimatedLength: false,
        SVGAnimatedLengthList: false,
        SVGAnimatedNumber: false,
        SVGAnimatedNumberList: false,
        SVGAnimatedPathData: false,
        SVGAnimatedPoints: false,
        SVGAnimatedPreserveAspectRatio: false,
        SVGAnimatedRect: false,
        SVGAnimatedString: false,
        SVGAnimatedTransformList: false,
        SVGAnimationElement: false,
        SVGCSSRule: false,
        SVGCircleElement: false,
        SVGClipPathElement: false,
        SVGColor: false,
        SVGColorProfileElement: false,
        SVGColorProfileRule: false,
        SVGComponentTransferFunctionElement: false,
        SVGCursorElement: false,
        SVGDefsElement: false,
        SVGDescElement: false,
        SVGDocument: false,
        SVGElement: false,
        SVGElementInstance: false,
        SVGElementInstanceList: false,
        SVGEllipseElement: false,
        SVGExternalResourcesRequired: false,
        SVGFEBlendElement: false,
        SVGFEColorMatrixElement: false,
        SVGFEComponentTransferElement: false,
        SVGFECompositeElement: false,
        SVGFEConvolveMatrixElement: false,
        SVGFEDiffuseLightingElement: false,
        SVGFEDisplacementMapElement: false,
        SVGFEDistantLightElement: false,
        SVGFEFloodElement: false,
        SVGFEFuncAElement: false,
        SVGFEFuncBElement: false,
        SVGFEFuncGElement: false,
        SVGFEFuncRElement: false,
        SVGFEGaussianBlurElement: false,
        SVGFEImageElement: false,
        SVGFEMergeElement: false,
        SVGFEMergeNodeElement: false,
        SVGFEMorphologyElement: false,
        SVGFEOffsetElement: false,
        SVGFEPointLightElement: false,
        SVGFESpecularLightingElement: false,
        SVGFESpotLightElement: false,
        SVGFETileElement: false,
        SVGFETurbulenceElement: false,
        SVGFilterElement: false,
        SVGFilterPrimitiveStandardAttributes: false,
        SVGFitToViewBox: false,
        SVGFontElement: false,
        SVGFontFaceElement: false,
        SVGFontFaceFormatElement: false,
        SVGFontFaceNameElement: false,
        SVGFontFaceSrcElement: false,
        SVGFontFaceUriElement: false,
        SVGForeignObjectElement: false,
        SVGGElement: false,
        SVGGlyphElement: false,
        SVGGlyphRefElement: false,
        SVGGradientElement: false,
        SVGHKernElement: false,
        SVGICCColor: false,
        SVGImageElement: false,
        SVGLangSpace: false,
        SVGLength: false,
        SVGLengthList: false,
        SVGLineElement: false,
        SVGLinearGradientElement: false,
        SVGLocatable: false,
        SVGMPathElement: false,
        SVGMarkerElement: false,
        SVGMaskElement: false,
        SVGMatrix: false,
        SVGMetadataElement: false,
        SVGMissingGlyphElement: false,
        SVGNumber: false,
        SVGNumberList: false,
        SVGPaint: false,
        SVGPathElement: false,
        SVGPathSeg: false,
        SVGPathSegArcAbs: false,
        SVGPathSegArcRel: false,
        SVGPathSegClosePath: false,
        SVGPathSegCurvetoCubicAbs: false,
        SVGPathSegCurvetoCubicRel: false,
        SVGPathSegCurvetoCubicSmoothAbs: false,
        SVGPathSegCurvetoCubicSmoothRel: false,
        SVGPathSegCurvetoQuadraticAbs: false,
        SVGPathSegCurvetoQuadraticRel: false,
        SVGPathSegCurvetoQuadraticSmoothAbs: false,
        SVGPathSegCurvetoQuadraticSmoothRel: false,
        SVGPathSegLinetoAbs: false,
        SVGPathSegLinetoHorizontalAbs: false,
        SVGPathSegLinetoHorizontalRel: false,
        SVGPathSegLinetoRel: false,
        SVGPathSegLinetoVerticalAbs: false,
        SVGPathSegLinetoVerticalRel: false,
        SVGPathSegList: false,
        SVGPathSegMovetoAbs: false,
        SVGPathSegMovetoRel: false,
        SVGPatternElement: false,
        SVGPoint: false,
        SVGPointList: false,
        SVGPolygonElement: false,
        SVGPolylineElement: false,
        SVGPreserveAspectRatio: false,
        SVGRadialGradientElement: false,
        SVGRect: false,
        SVGRectElement: false,
        SVGRenderingIntent: false,
        SVGSVGElement: false,
        SVGScriptElement: false,
        SVGSetElement: false,
        SVGStopElement: false,
        SVGStringList: false,
        SVGStylable: false,
        SVGStyleElement: false,
        SVGSwitchElement: false,
        SVGSymbolElement: false,
        SVGTRefElement: false,
        SVGTSpanElement: false,
        SVGTests: false,
        SVGTextContentElement: false,
        SVGTextElement: false,
        SVGTextPathElement: false,
        SVGTextPositioningElement: false,
        SVGTitleElement: false,
        SVGTransform: false,
        SVGTransformList: false,
        SVGTransformable: false,
        SVGURIReference: false,
        SVGUnitTypes: false,
        SVGUseElement: false,
        SVGVKernElement: false,
        SVGViewElement: false,
        SVGViewSpec: false,
        SVGZoomAndPan: false,
        TimeEvent: false,
        top: false,
        URL: false,
        WebSocket: false,
        window: false,
        Worker: false,
        XMLHttpRequest: false,
        XMLSerializer: false,
        XPathEvaluator: false,
        XPathException: false,
        XPathExpression: false,
        XPathNamespace: false,
        XPathNSResolver: false,
        XPathResult: false
      };

      exports.devel = {
        alert: false,
        confirm: false,
        console: false,
        Debug: false,
        opera: false,
        prompt: false
      };

      exports.worker = {
        importScripts: true,
        postMessage: true,
        self: true
      };
      exports.nonstandard = {
        escape: false,
        unescape: false
      };

      exports.couch = {
        "require": false,
        respond: false,
        getRow: false,
        emit: false,
        send: false,
        start: false,
        sum: false,
        log: false,
        exports: false,
        module: false,
        provides: false
      };

      exports.node = {
        __filename: false,
        __dirname: false,
        GLOBAL: false,
        global: false,
        module: false,
        require: false,

        Buffer: true,
        console: true,
        exports: true,
        process: true,
        setTimeout: true,
        clearTimeout: true,
        setInterval: true,
        clearInterval: true,
        setImmediate: true, // v0.9.1+
        clearImmediate: true // v0.9.1+
      };

      exports.phantom = {
        phantom: true,
        require: true,
        WebPage: true,
        console: true, // in examples, but undocumented
        exports: true // v1.7+
      };

      exports.qunit = {
        asyncTest: false,
        deepEqual: false,
        equal: false,
        expect: false,
        module: false,
        notDeepEqual: false,
        notEqual: false,
        notPropEqual: false,
        notStrictEqual: false,
        ok: false,
        propEqual: false,
        QUnit: false,
        raises: false,
        start: false,
        stop: false,
        strictEqual: false,
        test: false,
        "throws": false
      };

      exports.rhino = {
        defineClass: false,
        deserialize: false,
        gc: false,
        help: false,
        importClass: false,
        importPackage: false,
        "java": false,
        load: false,
        loadClass: false,
        Packages: false,
        print: false,
        quit: false,
        readFile: false,
        readUrl: false,
        runCommand: false,
        seal: false,
        serialize: false,
        spawn: false,
        sync: false,
        toint32: false,
        version: false
      };

      exports.shelljs = {
        target: false,
        echo: false,
        exit: false,
        cd: false,
        pwd: false,
        ls: false,
        find: false,
        cp: false,
        rm: false,
        mv: false,
        mkdir: false,
        test: false,
        cat: false,
        sed: false,
        grep: false,
        which: false,
        dirs: false,
        pushd: false,
        popd: false,
        env: false,
        exec: false,
        chmod: false,
        config: false,
        error: false,
        tempdir: false
      };

      exports.typed = {
        ArrayBuffer: false,
        ArrayBufferView: false,
        DataView: false,
        Float32Array: false,
        Float64Array: false,
        Int16Array: false,
        Int32Array: false,
        Int8Array: false,
        Uint16Array: false,
        Uint32Array: false,
        Uint8Array: false,
        Uint8ClampedArray: false
      };

      exports.wsh = {
        ActiveXObject: true,
        Enumerator: true,
        GetObject: true,
        ScriptEngine: true,
        ScriptEngineBuildVersion: true,
        ScriptEngineMajorVersion: true,
        ScriptEngineMinorVersion: true,
        VBArray: true,
        WSH: true,
        WScript: true,
        XDomainRequest: true
      };

      exports.dojo = {
        dojo: false,
        dijit: false,
        dojox: false,
        define: false,
        "require": false
      };

      exports.jquery = {
        "$": false,
        jQuery: false
      };

      exports.mootools = {
        "$": false,
        "$$": false,
        Asset: false,
        Browser: false,
        Chain: false,
        Class: false,
        Color: false,
        Cookie: false,
        Core: false,
        Document: false,
        DomReady: false,
        DOMEvent: false,
        DOMReady: false,
        Drag: false,
        Element: false,
        Elements: false,
        Event: false,
        Events: false,
        Fx: false,
        Group: false,
        Hash: false,
        HtmlTable: false,
        IFrame: false,
        IframeShim: false,
        InputValidator: false,
        instanceOf: false,
        Keyboard: false,
        Locale: false,
        Mask: false,
        MooTools: false,
        Native: false,
        Options: false,
        OverText: false,
        Request: false,
        Scroller: false,
        Slick: false,
        Slider: false,
        Sortables: false,
        Spinner: false,
        Swiff: false,
        Tips: false,
        Type: false,
        typeOf: false,
        URI: false,
        Window: false
      };

      exports.prototypejs = {
        "$": false,
        "$$": false,
        "$A": false,
        "$F": false,
        "$H": false,
        "$R": false,
        "$break": false,
        "$continue": false,
        "$w": false,
        Abstract: false,
        Ajax: false,
        Class: false,
        Enumerable: false,
        Element: false,
        Event: false,
        Field: false,
        Form: false,
        Hash: false,
        Insertion: false,
        ObjectRange: false,
        PeriodicalExecuter: false,
        Position: false,
        Prototype: false,
        Selector: false,
        Template: false,
        Toggle: false,
        Try: false,
        Autocompleter: false,
        Builder: false,
        Control: false,
        Draggable: false,
        Draggables: false,
        Droppables: false,
        Effect: false,
        Sortable: false,
        SortableObserver: false,
        Sound: false,
        Scriptaculous: false
      };

      exports.yui = {
        YUI: false,
        Y: false,
        YUI_config: false
      };

      exports.mocha = {
        describe: false,
        it: false,
        before: false,
        after: false,
        beforeEach: false,
        afterEach: false,
        suite: false,
        test: false,
        setup: false,
        teardown: false
      };

      exports.jasmine = {
        jasmine: false,
        describe: false,
        it: false,
        xit: false,
        beforeEach: false,
        afterEach: false,
        setFixtures: false,
        loadFixtures: false,
        spyOn: false,
        expect: false,
        runs: false,
        waitsFor: false,
        waits: false
      };
    }, {}],
    10: [function (_dereq_, module, exports) {

      function EventEmitter() {
        this._events = this._events || {};
        this._maxListeners = this._maxListeners || undefined;
      }
      module.exports = EventEmitter;
      EventEmitter.EventEmitter = EventEmitter;

      EventEmitter.prototype._events = undefined;
      EventEmitter.prototype._maxListeners = undefined;
      EventEmitter.defaultMaxListeners = 10;
      EventEmitter.prototype.setMaxListeners = function (n) {
        if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError('n must be a positive number');
        this._maxListeners = n;
        return this;
      };

      EventEmitter.prototype.emit = function (type) {
        var er, handler, len, args, i, listeners;

        if (!this._events) this._events = {};
        if (type === 'error') {
          if (!this._events.error || isObject(this._events.error) && !this._events.error.length) {
            er = arguments[1];
            if (er instanceof Error) {
              throw er; // Unhandled 'error' event
            } else {
              throw TypeError('Uncaught, unspecified "error" event.');
            }
            return false;
          }
        }

        handler = this._events[type];

        if (isUndefined(handler)) return false;

        if (isFunction(handler)) {
          switch (arguments.length) {
            case 1:
              handler.call(this);
              break;
            case 2:
              handler.call(this, arguments[1]);
              break;
            case 3:
              handler.call(this, arguments[1], arguments[2]);
              break;
            default:
              len = arguments.length;
              args = new Array(len - 1);
              for (i = 1; i < len; i++) {
                args[i - 1] = arguments[i];
              }handler.apply(this, args);
          }
        } else if (isObject(handler)) {
          len = arguments.length;
          args = new Array(len - 1);
          for (i = 1; i < len; i++) {
            args[i - 1] = arguments[i];
          }listeners = handler.slice();
          len = listeners.length;
          for (i = 0; i < len; i++) {
            listeners[i].apply(this, args);
          }
        }

        return true;
      };

      EventEmitter.prototype.addListener = function (type, listener) {
        var m;

        if (!isFunction(listener)) throw TypeError('listener must be a function');

        if (!this._events) this._events = {};
        if (this._events.newListener) this.emit('newListener', type, isFunction(listener.listener) ? listener.listener : listener);

        if (!this._events[type]) this._events[type] = listener;else if (isObject(this._events[type])) this._events[type].push(listener);else this._events[type] = [this._events[type], listener];
        if (isObject(this._events[type]) && !this._events[type].warned) {
          var m;
          if (!isUndefined(this._maxListeners)) {
            m = this._maxListeners;
          } else {
            m = EventEmitter.defaultMaxListeners;
          }

          if (m && m > 0 && this._events[type].length > m) {
            this._events[type].warned = true;
            console.error('(node) warning: possible EventEmitter memory ' + 'leak detected. %d listeners added. ' + 'Use emitter.setMaxListeners() to increase limit.', this._events[type].length);
            console.trace();
          }
        }

        return this;
      };

      EventEmitter.prototype.on = EventEmitter.prototype.addListener;

      EventEmitter.prototype.once = function (type, listener) {
        if (!isFunction(listener)) throw TypeError('listener must be a function');

        var fired = false;

        function g() {
          this.removeListener(type, g);

          if (!fired) {
            fired = true;
            listener.apply(this, arguments);
          }
        }

        g.listener = listener;
        this.on(type, g);

        return this;
      };
      EventEmitter.prototype.removeListener = function (type, listener) {
        var list, position, length, i;

        if (!isFunction(listener)) throw TypeError('listener must be a function');

        if (!this._events || !this._events[type]) return this;

        list = this._events[type];
        length = list.length;
        position = -1;

        if (list === listener || isFunction(list.listener) && list.listener === listener) {
          delete this._events[type];
          if (this._events.removeListener) this.emit('removeListener', type, listener);
        } else if (isObject(list)) {
          for (i = length; i-- > 0;) {
            if (list[i] === listener || list[i].listener && list[i].listener === listener) {
              position = i;
              break;
            }
          }

          if (position < 0) return this;

          if (list.length === 1) {
            list.length = 0;
            delete this._events[type];
          } else {
            list.splice(position, 1);
          }

          if (this._events.removeListener) this.emit('removeListener', type, listener);
        }

        return this;
      };

      EventEmitter.prototype.removeAllListeners = function (type) {
        var key, listeners;

        if (!this._events) return this;
        if (!this._events.removeListener) {
          if (arguments.length === 0) this._events = {};else if (this._events[type]) delete this._events[type];
          return this;
        }
        if (arguments.length === 0) {
          for (key in this._events) {
            if (key === 'removeListener') continue;
            this.removeAllListeners(key);
          }
          this.removeAllListeners('removeListener');
          this._events = {};
          return this;
        }

        listeners = this._events[type];

        if (isFunction(listeners)) {
          this.removeListener(type, listeners);
        } else {
          while (listeners.length) {
            this.removeListener(type, listeners[listeners.length - 1]);
          }
        }
        delete this._events[type];

        return this;
      };

      EventEmitter.prototype.listeners = function (type) {
        var ret;
        if (!this._events || !this._events[type]) ret = [];else if (isFunction(this._events[type])) ret = [this._events[type]];else ret = this._events[type].slice();
        return ret;
      };

      EventEmitter.listenerCount = function (emitter, type) {
        var ret;
        if (!emitter._events || !emitter._events[type]) ret = 0;else if (isFunction(emitter._events[type])) ret = 1;else ret = emitter._events[type].length;
        return ret;
      };

      function isFunction(arg) {
        return typeof arg === 'function';
      }

      function isNumber(arg) {
        return typeof arg === 'number';
      }

      function isObject(arg) {
        return (typeof arg === "undefined" ? "undefined" : _typeof(arg)) === 'object' && arg !== null;
      }

      function isUndefined(arg) {
        return arg === void 0;
      }
    }, {}] }, {}, [3])(3);
});

ace.define("ace/mode/javascript_worker", ["require", "exports", "module", "ace/lib/oop", "ace/worker/mirror", "ace/mode/javascript/jshint"], function (require, exports, module) {
  "use strict";

  var oop = require("../lib/oop");
  var Mirror = require("../worker/mirror").Mirror;
  var lint = require("./javascript/jshint").JSHINT;

  function startRegex(arr) {
    return RegExp("^(" + arr.join("|") + ")");
  }

  var disabledWarningsRe = startRegex(["Bad for in variable '(.+)'.", 'Missing "use strict"']);
  var errorsRe = startRegex(["Unexpected", "Expected ", "Confusing (plus|minus)", "\\{a\\} unterminated regular expression", "Unclosed ", "Unmatched ", "Unbegun comment", "Bad invocation", "Missing space after", "Missing operator at"]);
  var infoRe = startRegex(["Expected an assignment", "Bad escapement of EOL", "Unexpected comma", "Unexpected space", "Missing radix parameter.", "A leading decimal point can", "\\['{a}'\\] is better written in dot notation.", "'{a}' used out of scope"]);

  var JavaScriptWorker = exports.JavaScriptWorker = function (sender) {
    Mirror.call(this, sender);
    this.setTimeout(500);
    this.setOptions();
  };

  oop.inherits(JavaScriptWorker, Mirror);

  (function () {
    this.setOptions = function (options) {
      this.options = options || {
        esnext: true,
        moz: true,
        devel: true,
        browser: true,
        node: true,
        laxcomma: true,
        laxbreak: true,
        lastsemic: true,
        onevar: false,
        passfail: false,
        maxerr: 100,
        expr: true,
        multistr: true,
        globalstrict: true
      };
      this.doc.getValue() && this.deferredUpdate.schedule(100);
    };

    this.changeOptions = function (newOptions) {
      oop.mixin(this.options, newOptions);
      this.doc.getValue() && this.deferredUpdate.schedule(100);
    };

    this.isValidJS = function (str) {
      try {
        eval("throw 0;" + str);
      } catch (e) {
        if (e === 0) return true;
      }
      return false;
    };

    this.onUpdate = function () {
      var value = this.doc.getValue();
      value = value.replace(/^#!.*\n/, "\n");
      if (!value) {
        this.sender.emit("jslint", []);
        return;
      }
      var errors = [];
      var maxErrorLevel = this.isValidJS(value) ? "warning" : "error";
      lint(value, this.options);
      var results = lint.errors;

      var errorAdded = false;
      for (var i = 0; i < results.length; i++) {
        var error = results[i];
        if (!error) continue;
        var raw = error.raw;
        var type = "warning";

        if (raw == "Missing semicolon.") {
          var str = error.evidence.substr(error.character);
          str = str.charAt(str.search(/\S/));
          if (maxErrorLevel == "error" && str && /[\w\d{(['"]/.test(str)) {
            error.reason = 'Missing ";" before statement';
            type = "error";
          } else {
            type = "info";
          }
        } else if (disabledWarningsRe.test(raw)) {
          continue;
        } else if (infoRe.test(raw)) {
          type = "info";
        } else if (errorsRe.test(raw)) {
          errorAdded = true;
          type = maxErrorLevel;
        } else if (raw == "'{a}' is not defined.") {
          type = "warning";
        } else if (raw == "'{a}' is defined but never used.") {
          type = "info";
        }

        errors.push({
          row: error.line - 1,
          column: error.character - 1,
          text: error.reason,
          type: type,
          raw: raw
        });

        if (errorAdded) {}
      }

      this.sender.emit("jslint", errors);
    };
  }).call(JavaScriptWorker.prototype);
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