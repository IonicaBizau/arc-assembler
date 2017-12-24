"use strict";

// Allow for console.log to not break IE
if (typeof window.console == "undefined" || typeof window.console.log == "undefined") {
  window.console = {
    log: function log() {},
    info: function info() {},
    warn: function warn() {}
  };
}
if (typeof window.console.group == 'undefined' || typeof window.console.groupEnd == 'undefined' || typeof window.console.groupCollapsed == 'undefined') {
  window.console.group = function () {};
  window.console.groupEnd = function () {};
  window.console.groupCollapsed = function () {};
}
if (typeof window.console.markTimeline == 'undefined') {
  window.console.markTimeline = function () {};
}
window.console.clear = function () {};