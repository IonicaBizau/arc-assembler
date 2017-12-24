'use strict';

/*
 * # Semantic - Checkbox
 * http://github.com/semantic-org/semantic-ui/
 *
 *
 * Copyright 2014 Contributor
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 */

;(function ($, window, document, undefined) {

  "use strict";

  $.fn.checkbox = function (parameters) {
    var $allModules = $(this),
        moduleSelector = $allModules.selector || '',
        time = new Date().getTime(),
        performance = [],
        query = arguments[0],
        methodInvoked = typeof query == 'string',
        queryArguments = [].slice.call(arguments, 1),
        returnedValue;

    $allModules.each(function () {
      var settings = $.extend(true, {}, $.fn.checkbox.settings, parameters),
          className = settings.className,
          namespace = settings.namespace,
          selector = settings.selector,
          error = settings.error,
          eventNamespace = '.' + namespace,
          moduleNamespace = 'module-' + namespace,
          $module = $(this),
          $label = $(this).next(selector.label).first(),
          $input = $(this).find(selector.input),
          instance = $module.data(moduleNamespace),
          observer,
          element = this,
          module;

      module = {

        initialize: function initialize() {
          module.verbose('Initializing checkbox', settings);
          $module.on('click' + eventNamespace, module.toggle).on('keydown' + eventNamespace, selector.input, module.event.keydown);
          if (module.is.checked()) {
            module.set.checked();
            if (settings.fireOnInit) {
              $.proxy(settings.onChecked, $input.get())();
            }
          } else {
            module.remove.checked();
            if (settings.fireOnInit) {
              $.proxy(settings.onUnchecked, $input.get())();
            }
          }
          module.observeChanges();

          module.instantiate();
        },

        instantiate: function instantiate() {
          module.verbose('Storing instance of module', module);
          instance = module;
          $module.data(moduleNamespace, module);
        },

        destroy: function destroy() {
          module.verbose('Destroying previous module');
          $module.off(eventNamespace).removeData(moduleNamespace);
          $input.off(eventNamespace, module.event.keydown);
          $label.off(eventNamespace);
        },

        refresh: function refresh() {
          $module = $(this);
          $label = $(this).next(selector.label).first();
          $input = $(this).find(selector.input);
        },

        observeChanges: function observeChanges() {
          if ('MutationObserver' in window) {
            observer = new MutationObserver(function (mutations) {
              module.debug('DOM tree modified, updating selector cache');
              module.refresh();
            });
            observer.observe(element, {
              childList: true,
              subtree: true
            });
            module.debug('Setting up mutation observer', observer);
          }
        },

        attachEvents: function attachEvents(selector, event) {
          var $toggle = $(selector);
          event = $.isFunction(module[event]) ? module[event] : module.toggle;
          if ($toggle.size() > 0) {
            module.debug('Attaching checkbox events to element', selector, event);
            $toggle.on('click' + eventNamespace, event);
          } else {
            module.error(error.notFound);
          }
        },

        event: {
          keydown: function keydown(event) {
            var key = event.which,
                keyCode = {
              enter: 13,
              escape: 27
            };
            if (key == keyCode.escape) {
              module.verbose('Escape key pressed blurring field');
              $module.blur();
            }
            if (!event.ctrlKey && key == keyCode.enter) {
              module.verbose('Enter key pressed, toggling checkbox');
              $.proxy(module.toggle, this)();
              event.preventDefault();
            }
          }
        },

        is: {
          radio: function radio() {
            return $module.hasClass(className.radio);
          },
          checked: function checked() {
            return $input.prop('checked') !== undefined && $input.prop('checked');
          },
          unchecked: function unchecked() {
            return !module.is.checked();
          }
        },

        can: {
          change: function change() {
            return !($module.hasClass(className.disabled) || $module.hasClass(className.readOnly) || $input.prop('disabled'));
          },
          uncheck: function uncheck() {
            return typeof settings.uncheckable === 'boolean' ? settings.uncheckable : !module.is.radio();
          }
        },

        set: {
          checked: function checked() {
            $module.addClass(className.checked);
          },
          tab: function tab() {
            if ($input.attr('tabindex') === undefined) {
              $input.attr('tabindex', 0);
            }
          }
        },

        remove: {
          checked: function checked() {
            $module.removeClass(className.checked);
          }
        },

        enable: function enable() {
          module.debug('Enabling checkbox functionality');
          $module.removeClass(className.disabled);
          $input.prop('disabled', false);
          $.proxy(settings.onEnabled, $input.get())();
        },

        disable: function disable() {
          module.debug('Disabling checkbox functionality');
          $module.addClass(className.disabled);
          $input.prop('disabled', 'disabled');
          $.proxy(settings.onDisabled, $input.get())();
        },

        check: function check() {
          module.debug('Enabling checkbox', $input);
          $input.prop('checked', true).trigger('change');
          module.set.checked();
          $.proxy(settings.onChange, $input.get())();
          $.proxy(settings.onChecked, $input.get())();
        },

        uncheck: function uncheck() {
          module.debug('Disabling checkbox');
          $input.prop('checked', false).trigger('change');
          module.remove.checked();
          $.proxy(settings.onChange, $input.get())();
          $.proxy(settings.onUnchecked, $input.get())();
        },

        toggle: function toggle(event) {
          if (!module.can.change()) {
            console.log(module.can.change());
            module.debug('Checkbox is read-only or disabled, ignoring toggle');
            return;
          }
          module.verbose('Determining new checkbox state');
          if (module.is.unchecked()) {
            module.check();
          } else if (module.is.checked() && module.can.uncheck()) {
            module.uncheck();
          }
        },
        setting: function setting(name, value) {
          module.debug('Changing setting', name, value);
          if ($.isPlainObject(name)) {
            $.extend(true, settings, name);
          } else if (value !== undefined) {
            settings[name] = value;
          } else {
            return settings[name];
          }
        },
        internal: function internal(name, value) {
          if ($.isPlainObject(name)) {
            $.extend(true, module, name);
          } else if (value !== undefined) {
            module[name] = value;
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

  $.fn.checkbox.settings = {

    name: 'Checkbox',
    namespace: 'checkbox',

    debug: false,
    verbose: true,
    performance: true,

    // delegated event context
    uncheckable: 'auto',
    fireOnInit: true,

    onChange: function onChange() {},
    onChecked: function onChecked() {},
    onUnchecked: function onUnchecked() {},
    onEnabled: function onEnabled() {},
    onDisabled: function onDisabled() {},

    className: {
      checked: 'checked',
      disabled: 'disabled',
      radio: 'radio',
      readOnly: 'read-only'
    },

    error: {
      method: 'The method you called is not defined.'
    },

    selector: {
      input: 'input[type=checkbox], input[type=radio]',
      label: 'label'
    }

  };
})(jQuery, window, document);