"use strict";

module.exports = {
  created: function created(file) {
    return "Created: " + file;
  },
  modified: function modified(file) {
    return "Modified: " + file;
  }
};