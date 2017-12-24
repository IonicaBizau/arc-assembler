'use strict';

/*
 * # Semantic - Visit
 * http://github.com/semantic-org/semantic-ui/
 *
 *
 * Copyright 2014 Contributor
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 */

;(function ($, window, document, undefined) {

  $.visit = $.fn.visit = function (parameters) {
    var $allModules = $.isFunction(this) ? $(window) : $(this),
        moduleSelector = $allModules.selector || '',
        time = new Date().getTime(),
        performance = [],
        query = arguments[0],
        methodInvoked = typeof query == 'string',
        queryArguments = [].slice.call(arguments, 1),
        returnedValue;
    $allModules.each(function () {
      var settings = $.extend(true, {}, $.fn.visit.settings, parameters),
          error = settings.error,
          namespace = settings.namespace,
          eventNamespace = '.' + namespace,
          moduleNamespace = namespace + '-module',
          $module = $(this),
          $displays = $(),
          element = this,
          instance = $module.data(moduleNamespace),
          module;
      module = {

        initialize: function initialize() {
          if (settings.count) {
            module.store(settings.key.count, settings.count);
          } else if (settings.id) {
            module.add.id(settings.id);
          } else if (settings.increment && methodInvoked !== 'increment') {
            module.increment();
          }
          module.add.display($module);
          module.instantiate();
        },

        instantiate: function instantiate() {
          module.verbose('Storing instance of visit module', module);
          instance = module;
          $module.data(moduleNamespace, module);
        },

        destroy: function destroy() {
          module.verbose('Destroying instance');
          $module.removeData(moduleNamespace);
        },

        increment: function increment(id) {
          var currentValue = module.get.count(),
              newValue = +currentValue + 1;
          if (id) {
            module.add.id(id);
          } else {
            if (newValue > settings.limit && !settings.surpass) {
              newValue = settings.limit;
            }
            module.debug('Incrementing visits', newValue);
            module.store(settings.key.count, newValue);
          }
        },

        decrement: function decrement(id) {
          var currentValue = module.get.count(),
              newValue = +currentValue - 1;
          if (id) {
            module.remove.id(id);
          } else {
            module.debug('Removing visit');
            module.store(settings.key.count, newValue);
          }
        },

        get: {
          count: function count() {
            return +module.retrieve(settings.key.count) || 0;
          },
          idCount: function idCount(ids) {
            ids = ids || module.get.ids();
            return ids.length;
          },
          ids: function ids(delimitedIDs) {
            var idArray = [];
            delimitedIDs = delimitedIDs || module.retrieve(settings.key.ids);
            if (typeof delimitedIDs === 'string') {
              idArray = delimitedIDs.split(settings.delimiter);
            }
            module.verbose('Found visited ID list', idArray);
            return idArray;
          },
          storageOptions: function storageOptions(data) {
            var options = {};
            if (settings.expires) {
              options.expires = settings.expires;
            }
            if (settings.domain) {
              options.domain = settings.domain;
            }
            if (settings.path) {
              options.path = settings.path;
            }
            return options;
          }
        },

        has: {
          visited: function visited(id, ids) {
            var visited = false;
            ids = ids || module.get.ids();
            if (id !== undefined && ids) {
              $.each(ids, function (index, value) {
                if (value == id) {
                  visited = true;
                }
              });
            }
            return visited;
          }
        },

        set: {
          count: function count(value) {
            module.store(settings.key.count, value);
          },
          ids: function ids(value) {
            module.store(settings.key.ids, value);
          }
        },

        reset: function reset() {
          module.store(settings.key.count, 0);
          module.store(settings.key.ids, null);
        },

        add: {
          id: function id(_id) {
            var currentIDs = module.retrieve(settings.key.ids),
                newIDs = currentIDs === undefined || currentIDs === '' ? _id : currentIDs + settings.delimiter + _id;
            if (module.has.visited(_id)) {
              module.debug('Unique content already visited, not adding visit', _id, currentIDs);
            } else if (_id === undefined) {
              module.debug('ID is not defined');
            } else {
              module.debug('Adding visit to unique content', _id);
              module.store(settings.key.ids, newIDs);
            }
            module.set.count(module.get.idCount());
          },
          display: function display(selector) {
            var $element = $(selector);
            if ($element.size() > 0 && !$.isWindow($element[0])) {
              module.debug('Updating visit count for element', $element);
              $displays = $displays.size() > 0 ? $displays.add($element) : $element;
            }
          }
        },

        remove: {
          id: function id(_id2) {
            var currentIDs = module.get.ids(),
                newIDs = [];
            if (_id2 !== undefined && currentIDs !== undefined) {
              module.debug('Removing visit to unique content', _id2, currentIDs);
              $.each(currentIDs, function (index, value) {
                if (value !== _id2) {
                  newIDs.push(value);
                }
              });
              newIDs = newIDs.join(settings.delimiter);
              module.store(settings.key.ids, newIDs);
            }
            module.set.count(module.get.idCount());
          }
        },

        check: {
          limit: function limit(value) {
            value = value || module.get.count();
            if (settings.limit) {
              if (value >= settings.limit) {
                module.debug('Pages viewed exceeded limit, firing callback', value, settings.limit);
                $.proxy(settings.onLimit, this)(value);
              }
              module.debug('Limit not reached', value, settings.limit);
              $.proxy(settings.onChange, this)(value);
            }
            module.update.display(value);
          }
        },

        update: {
          display: function display(value) {
            value = value || module.get.count();
            if ($displays.size() > 0) {
              module.debug('Updating displayed view count', $displays);
              $displays.html(value);
            }
          }
        },

        store: function store(key, value) {
          var options = module.get.storageOptions(value);
          if (settings.storageMethod == 'localstorage' && window.localStorage !== undefined) {
            window.localStorage.setItem(key, value);
            module.debug('Value stored using local storage', key, value);
          } else if ($.cookie !== undefined) {
            $.cookie(key, value, options);
            module.debug('Value stored using cookie', key, value, options);
          } else {
            module.error(error.noCookieStorage);
            return;
          }
          if (key == settings.key.count) {
            module.check.limit(value);
          }
        },
        retrieve: function retrieve(key, value) {
          var storedValue;
          if (settings.storageMethod == 'localstorage' && window.localStorage !== undefined) {
            storedValue = window.localStorage.getItem(key);
          }
          // get by cookie
          else if ($.cookie !== undefined) {
              storedValue = $.cookie(key);
            } else {
              module.error(error.noCookieStorage);
            }
          if (storedValue == 'undefined' || storedValue == 'null' || storedValue === undefined || storedValue === null) {
            storedValue = undefined;
          }
          return storedValue;
        },

        setting: function setting(name, value) {
          if ($.isPlainObject(name)) {
            $.extend(true, settings, name);
          } else if (value !== undefined) {
            settings[name] = value;
          } else {
            return settings[name];
          }
        },
        internal: function internal(name, value) {
          module.debug('Changing internal', name, value);
          if (value !== undefined) {
            if ($.isPlainObject(name)) {
              $.extend(true, module, name);
            } else {
              module[name] = value;
            }
          } else {
            return module[name];
          }
        },
        debug: function debug() {
          if (settings.debug) {
            if (settings.performance) {
              module.performance.log(arguments);
            } else {
              module.debug = Function.prototype.bind.call(console.info, console, settings.name + ':');
              module.debug.apply(console, arguments);
            }
          }
        },
        verbose: function verbose() {
          if (settings.verbose && settings.debug) {
            if (settings.performance) {
              module.performance.log(arguments);
            } else {
              module.verbose = Function.prototype.bind.call(console.info, console, settings.name + ':');
              module.verbose.apply(console, arguments);
            }
          }
        },
        error: function error() {
          module.error = Function.prototype.bind.call(console.error, console, settings.name + ':');
          module.error.apply(console, arguments);
        },
        performance: {
          log: function log(message) {
            var currentTime, executionTime, previousTime;
            if (settings.performance) {
              currentTime = new Date().getTime();
              previousTime = time || currentTime;
              executionTime = currentTime - previousTime;
              time = currentTime;
              performance.push({
                'Name': message[0],
                'Arguments': [].slice.call(message, 1) || '',
                'Element': element,
                'Execution Time': executionTime
              });
            }
            clearTimeout(module.performance.timer);
            module.performance.timer = setTimeout(module.performance.display, 100);
          },
          display: function display() {
            var title = settings.name + ':',
                totalTime = 0;
            time = false;
            clearTimeout(module.performance.timer);
            $.each(performance, function (index, data) {
              totalTime += data['Execution Time'];
            });
            title += ' ' + totalTime + 'ms';
            if (moduleSelector) {
              title += ' \'' + moduleSelector + '\'';
            }
            if ($allModules.size() > 1) {
              title += ' ' + '(' + $allModules.size() + ')';
            }
            if ((console.group !== undefined || console.table !== undefined) && performance.length > 0) {
              console.groupCollapsed(title);
              if (console.table) {
                console.table(performance);
              } else {
                $.each(performance, function (index, data) {
                  console.log(data['Name'] + ': ' + data['Execution Time'] + 'ms');
                });
              }
              console.groupEnd();
            }
            performance = [];
          }
        },
        invoke: function invoke(query, passedArguments, context) {
          var object = instance,
              maxDepth,
              found,
              response;
          passedArguments = passedArguments || queryArguments;
          context = element || context;
          if (typeof query == 'string' && object !== undefined) {
            query = query.split(/[\. ]/);
            maxDepth = query.length - 1;
            $.each(query, function (depth, value) {
              var camelCaseValue = depth != maxDepth ? value + query[depth + 1].charAt(0).toUpperCase() + query[depth + 1].slice(1) : query;
              if ($.isPlainObject(object[camelCaseValue]) && depth != maxDepth) {
                object = object[camelCaseValue];
              } else if (object[camelCaseValue] !== undefined) {
                found = object[camelCaseValue];
                return false;
              } else if ($.isPlainObject(object[value]) && depth != maxDepth) {
                object = object[value];
              } else if (object[value] !== undefined) {
                found = object[value];
                return false;
              } else {
                return false;
              }
            });
          }
          if ($.isFunction(found)) {
            response = found.apply(context, passedArguments);
          } else if (found !== undefined) {
            response = found;
          }
          if ($.isArray(returnedValue)) {
            returnedValue.push(response);
          } else if (returnedValue !== undefined) {
            returnedValue = [returnedValue, response];
          } else if (response !== undefined) {
            returnedValue = response;
          }
          return found;
        }
      };
      if (methodInvoked) {
        if (instance === undefined) {
          module.initialize();
        }
        module.invoke(query);
      } else {
        if (instance !== undefined) {
          module.destroy();
        }
        module.initialize();
      }
    });
    return returnedValue !== undefined ? returnedValue : this;
  };

  $.fn.visit.settings = {

    name: 'Visit',

    debug: false,
    verbose: true,
    performance: true,

    namespace: 'visit',

    increment: false,
    surpass: false,
    count: false,
    limit: false,

    delimiter: '&',
    storageMethod: 'localstorage',

    key: {
      count: 'visit-count',
      ids: 'visit-ids'
    },

    expires: 30,
    domain: false,
    path: '/',

    onLimit: function onLimit() {},
    onChange: function onChange() {},

    error: {
      method: 'The method you called is not defined',
      missingPersist: 'Using the persist setting requires the inclusion of PersistJS',
      noCookieStorage: 'The default storage cookie requires $.cookie to be included.'
    }

  };
})(jQuery, window, document);