'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
 * # Semantic - Dimmer
 * http://github.com/semantic-org/semantic-ui/
 *
 *
 * Copyright 2014 Contributor
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 */

;(function ($, window, document, undefined) {

  $.fn.dimmer = function (parameters) {
    var $allModules = $(this),
        time = new Date().getTime(),
        performance = [],
        query = arguments[0],
        methodInvoked = typeof query == 'string',
        queryArguments = [].slice.call(arguments, 1),
        returnedValue;

    $allModules.each(function () {
      var settings = $.isPlainObject(parameters) ? $.extend(true, {}, $.fn.dimmer.settings, parameters) : $.extend({}, $.fn.dimmer.settings),
          selector = settings.selector,
          namespace = settings.namespace,
          className = settings.className,
          error = settings.error,
          eventNamespace = '.' + namespace,
          moduleNamespace = 'module-' + namespace,
          moduleSelector = $allModules.selector || '',
          clickEvent = 'ontouchstart' in document.documentElement ? 'touchstart' : 'click',
          $module = $(this),
          $dimmer,
          $dimmable,
          element = this,
          instance = $module.data(moduleNamespace),
          module;

      module = {

        preinitialize: function preinitialize() {
          if (module.is.dimmer()) {
            $dimmable = $module.parent();
            $dimmer = $module;
          } else {
            $dimmable = $module;
            if (module.has.dimmer()) {
              if (settings.dimmerName) {
                $dimmer = $dimmable.children(selector.dimmer).filter('.' + settings.dimmerName);
              } else {
                $dimmer = $dimmable.children(selector.dimmer);
              }
            } else {
              $dimmer = module.create();
            }
          }
        },

        initialize: function initialize() {
          module.debug('Initializing dimmer', settings);
          if (settings.on == 'hover') {
            $dimmable.on('mouseenter' + eventNamespace, module.show).on('mouseleave' + eventNamespace, module.hide);
          } else if (settings.on == 'click') {
            $dimmable.on(clickEvent + eventNamespace, module.toggle);
          }
          if (module.is.page()) {
            module.debug('Setting as a page dimmer', $dimmable);
            module.set.pageDimmer();
          }

          if (module.is.closable()) {
            module.verbose('Adding dimmer close event', $dimmer);
            $dimmer.on(clickEvent + eventNamespace, module.event.click);
          }
          module.set.dimmable();
          module.instantiate();
        },

        instantiate: function instantiate() {
          module.verbose('Storing instance of module', module);
          instance = module;
          $module.data(moduleNamespace, instance);
        },

        destroy: function destroy() {
          module.verbose('Destroying previous module', $dimmer);
          $module.removeData(moduleNamespace);
          $dimmable.off(eventNamespace);
          $dimmer.off(eventNamespace);
        },

        event: {
          click: function click(event) {
            module.verbose('Determining if event occured on dimmer', event);
            if ($dimmer.find(event.target).size() === 0 || $(event.target).is(selector.content)) {
              module.hide();
              event.stopImmediatePropagation();
            }
          }
        },

        addContent: function addContent(element) {
          var $content = $(element);
          module.debug('Add content to dimmer', $content);
          if ($content.parent()[0] !== $dimmer[0]) {
            $content.detach().appendTo($dimmer);
          }
        },

        create: function create() {
          var $element = $(settings.template.dimmer());
          if (settings.variation) {
            module.debug('Creating dimmer with variation', settings.variation);
            $element.addClass(className.variation);
          }
          if (settings.dimmerName) {
            module.debug('Creating named dimmer', settings.dimmerName);
            $element.addClass(settings.dimmerName);
          }
          $element.appendTo($dimmable);
          return $element;
        },

        show: function show(callback) {
          callback = $.isFunction(callback) ? callback : function () {};
          module.debug('Showing dimmer', $dimmer, settings);
          if ((!module.is.dimmed() || module.is.animating()) && module.is.enabled()) {
            module.animate.show(callback);
            $.proxy(settings.onShow, element)();
            $.proxy(settings.onChange, element)();
          } else {
            module.debug('Dimmer is already shown or disabled');
          }
        },

        hide: function hide(callback) {
          callback = $.isFunction(callback) ? callback : function () {};
          if (module.is.dimmed() || module.is.animating()) {
            module.debug('Hiding dimmer', $dimmer);
            module.animate.hide(callback);
            $.proxy(settings.onHide, element)();
            $.proxy(settings.onChange, element)();
          } else {
            module.debug('Dimmer is not visible');
          }
        },

        toggle: function toggle() {
          module.verbose('Toggling dimmer visibility', $dimmer);
          if (!module.is.dimmed()) {
            module.show();
          } else {
            module.hide();
          }
        },

        animate: {
          show: function show(callback) {
            callback = $.isFunction(callback) ? callback : function () {};
            if (settings.useCSS && $.fn.transition !== undefined && $dimmer.transition('is supported')) {
              $dimmer.transition({
                animation: settings.transition + ' in',
                queue: false,
                duration: module.get.duration(),
                onStart: function onStart() {
                  module.set.dimmed();
                },
                onComplete: function onComplete() {
                  module.set.active();
                  callback();
                }
              });
            } else {
              module.verbose('Showing dimmer animation with javascript');
              module.set.dimmed();
              $dimmer.stop().css({
                opacity: 0,
                width: '100%',
                height: '100%'
              }).fadeTo(module.get.duration(), 1, function () {
                $dimmer.removeAttr('style');
                module.set.active();
                callback();
              });
            }
          },
          hide: function hide(callback) {
            callback = $.isFunction(callback) ? callback : function () {};
            if (settings.useCSS && $.fn.transition !== undefined && $dimmer.transition('is supported')) {
              module.verbose('Hiding dimmer with css');
              $dimmer.transition({
                animation: settings.transition + ' out',
                queue: false,
                duration: module.get.duration(),
                onStart: function onStart() {
                  module.remove.dimmed();
                },
                onComplete: function onComplete() {
                  module.remove.active();
                  callback();
                }
              });
            } else {
              module.verbose('Hiding dimmer with javascript');
              module.remove.dimmed();
              $dimmer.stop().fadeOut(module.get.duration(), function () {
                module.remove.active();
                $dimmer.removeAttr('style');
                callback();
              });
            }
          }
        },

        get: {
          dimmer: function dimmer() {
            return $dimmer;
          },
          duration: function duration() {
            if (_typeof(settings.duration) == 'object') {
              if (module.is.active()) {
                return settings.duration.hide;
              } else {
                return settings.duration.show;
              }
            }
            return settings.duration;
          }
        },

        has: {
          dimmer: function dimmer() {
            if (settings.dimmerName) {
              return $module.children(selector.dimmer).filter('.' + settings.dimmerName).size() > 0;
            } else {
              return $module.children(selector.dimmer).size() > 0;
            }
          }
        },

        is: {
          active: function active() {
            return $dimmer.hasClass(className.active);
          },
          animating: function animating() {
            return $dimmer.is(':animated') || $dimmer.hasClass(className.animating);
          },
          closable: function closable() {
            if (settings.closable == 'auto') {
              if (settings.on == 'hover') {
                return false;
              }
              return true;
            }
            return settings.closable;
          },
          dimmer: function dimmer() {
            return $module.is(selector.dimmer);
          },
          dimmable: function dimmable() {
            return $module.is(selector.dimmable);
          },
          dimmed: function dimmed() {
            return $dimmable.hasClass(className.dimmed);
          },
          disabled: function disabled() {
            return $dimmable.hasClass(className.disabled);
          },
          enabled: function enabled() {
            return !module.is.disabled();
          },
          page: function page() {
            return $dimmable.is('body');
          },
          pageDimmer: function pageDimmer() {
            return $dimmer.hasClass(className.pageDimmer);
          }
        },

        can: {
          show: function show() {
            return !$dimmer.hasClass(className.disabled);
          }
        },

        set: {
          active: function active() {
            $dimmer.addClass(className.active);
          },
          dimmable: function dimmable() {
            $dimmable.addClass(className.dimmable);
          },
          dimmed: function dimmed() {
            $dimmable.addClass(className.dimmed);
          },
          pageDimmer: function pageDimmer() {
            $dimmer.addClass(className.pageDimmer);
          },
          disabled: function disabled() {
            $dimmer.addClass(className.disabled);
          }
        },

        remove: {
          active: function active() {
            $dimmer.removeClass(className.active);
          },
          dimmed: function dimmed() {
            $dimmable.removeClass(className.dimmed);
          },
          disabled: function disabled() {
            $dimmer.removeClass(className.disabled);
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

      module.preinitialize();

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

  $.fn.dimmer.settings = {

    name: 'Dimmer',
    namespace: 'dimmer',

    debug: false,
    verbose: true,
    performance: true,

    dimmerName: false,
    variation: false,
    closable: 'auto',
    transition: 'fade',
    useCSS: true,
    on: false,

    duration: {
      show: 500,
      hide: 500
    },

    onChange: function onChange() {},
    onShow: function onShow() {},
    onHide: function onHide() {},

    error: {
      method: 'The method you called is not defined.'
    },

    selector: {
      dimmable: '.dimmable',
      dimmer: '.ui.dimmer',
      content: '.ui.dimmer > .content, .ui.dimmer > .content > .center'
    },

    template: {
      dimmer: function dimmer() {
        return $('<div />').attr('class', 'ui dimmer');
      }
    },

    className: {
      active: 'active',
      animating: 'animating',
      dimmable: 'dimmable',
      dimmed: 'dimmed',
      disabled: 'disabled',
      hide: 'hide',
      pageDimmer: 'page',
      show: 'show'
    }

  };
})(jQuery, window, document);