'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
 * # Semantic - Transition
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

  $.fn.transition = function () {
    var $allModules = $(this),
        moduleSelector = $allModules.selector || '',
        time = new Date().getTime(),
        performance = [],
        moduleArguments = arguments,
        query = moduleArguments[0],
        queryArguments = [].slice.call(arguments, 1),
        methodInvoked = typeof query === 'string',
        requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
      setTimeout(callback, 0);
    },
        returnedValue;
    $allModules.each(function () {
      var $module = $(this),
          element = this,


      // set at run time
      settings,
          instance,
          error,
          className,
          metadata,
          animationStart,
          animationEnd,
          animationName,
          namespace,
          moduleNamespace,
          eventNamespace,
          module;

      module = {

        initialize: function initialize() {

          // get full settings
          moduleNamespace = 'module-' + namespace;
          settings = module.get.settings.apply(element, moduleArguments);
          className = settings.className;
          metadata = settings.metadata;

          animationStart = module.get.animationStartEvent();
          animationEnd = module.get.animationEndEvent();
          animationName = module.get.animationName();
          error = settings.error;
          namespace = settings.namespace;
          eventNamespace = '.' + settings.namespace;
          instance = $module.data(moduleNamespace) || module;

          if (methodInvoked) {
            methodInvoked = module.invoke(query);
          }
          // no internal method was found matching query or query not made
          if (methodInvoked === false) {
            module.verbose('Converted arguments into settings object', settings);
            module.animate();
            module.instantiate();
          }
        },

        instantiate: function instantiate() {
          module.verbose('Storing instance of module', module);
          $module.data(moduleNamespace, instance);
        },

        destroy: function destroy() {
          module.verbose('Destroying previous module for', element);
          $module.removeData(moduleNamespace);
        },

        refresh: function refresh() {
          module.verbose('Refreshing display type on next animation');
          delete module.displayType;
        },

        forceRepaint: function forceRepaint() {
          module.verbose('Forcing element repaint');
          var $parentElement = $module.parent(),
              $nextElement = $module.next();
          if ($nextElement.size() === 0) {
            $module.detach().appendTo($parentElement);
          } else {
            $module.detach().insertBefore($nextElement);
          }
        },

        repaint: function repaint() {
          module.verbose('Repainting element');
          var fakeAssignment = element.offsetWidth;
        },

        animate: function animate(overrideSettings) {
          settings = overrideSettings || settings;
          if (!module.is.supported()) {
            module.error(error.support);
            return false;
          }
          module.debug('Preparing animation', settings.animation);
          if (module.is.animating()) {
            if (settings.queue) {
              if (!settings.allowRepeats && module.has.direction() && module.is.occuring() && module.queuing !== true) {
                module.error(error.repeated, settings.animation, $module);
              } else {
                module.queue(settings.animation);
              }
              return false;
            } else {}
          }
          if (module.can.animate()) {
            module.set.animating(settings.animation);
          } else {
            module.error(error.noAnimation, settings.animation);
          }
        },

        reset: function reset() {
          module.debug('Resetting animation to beginning conditions');
          module.remove.animationEndCallback();
          module.restore.conditions();
          module.remove.animating();
        },

        queue: function queue(animation) {
          module.debug('Queueing animation of', animation);
          module.queuing = true;
          $module.one(animationEnd + eventNamespace, function () {
            module.queuing = false;
            module.repaint();
            module.animate.apply(this, settings);
          });
        },

        complete: function complete() {
          module.verbose('CSS animation complete', settings.animation);
          module.remove.animationEndCallback();
          module.remove.failSafe();
          if (!module.is.looping()) {
            if (module.is.outward()) {
              module.verbose('Animation is outward, hiding element');
              module.restore.conditions();
              module.hide();
              $.proxy(settings.onHide, this)();
            } else if (module.is.inward()) {
              module.verbose('Animation is outward, showing element');
              module.restore.conditions();
              module.show();
              module.set.display();
              $.proxy(settings.onShow, this)();
            } else {
              module.restore.conditions();
            }
            module.remove.animation();
            module.remove.animating();
          }
          $.proxy(settings.onComplete, this)();
        },

        has: {
          direction: function direction(animation) {
            animation = animation || settings.animation;
            if (animation.search(className.inward) !== -1 || animation.search(className.outward) !== -1) {
              module.debug('Direction already set in animation');
              return true;
            }
            return false;
          },
          inlineDisplay: function inlineDisplay() {
            var style = $module.attr('style') || '';
            return $.isArray(style.match(/display.*?;/, ''));
          }
        },

        set: {
          animating: function animating(animation) {
            animation = animation || settings.animation;
            if (!module.is.animating()) {
              module.save.conditions();
            }
            module.remove.direction();
            module.remove.animationEndCallback();
            if (module.can.transition() && !module.has.direction()) {
              module.set.direction();
            }
            module.remove.hidden();
            module.set.display();
            $module.addClass(className.animating).addClass(className.transition).addClass(animation).one(animationEnd + '.complete' + eventNamespace, module.complete);
            if (settings.useFailSafe) {
              module.add.failSafe();
            }
            module.set.duration(settings.duration);
            $.proxy(settings.onStart, this)();
            module.debug('Starting tween', animation, $module.attr('class'));
          },
          duration: function duration(animationName, _duration) {
            _duration = _duration || settings.duration;
            _duration = typeof _duration == 'number' ? _duration + 'ms' : _duration;
            module.verbose('Setting animation duration', _duration);
            $module.css({
              '-webkit-animation-duration': _duration,
              '-moz-animation-duration': _duration,
              '-ms-animation-duration': _duration,
              '-o-animation-duration': _duration,
              'animation-duration': _duration
            });
          },
          display: function display() {
            var style = module.get.style(),
                displayType = module.get.displayType(),
                overrideStyle = style + 'display: ' + displayType + ' !important;';
            $module.css('display', '');
            module.refresh();
            if ($module.css('display') !== displayType) {
              module.verbose('Setting inline visibility to', displayType);
              $module.attr('style', overrideStyle);
            }
          },
          direction: function direction() {
            if ($module.is(':visible') && !module.is.hidden()) {
              module.debug('Automatically determining the direction of animation', 'Outward');
              $module.removeClass(className.inward).addClass(className.outward);
            } else {
              module.debug('Automatically determining the direction of animation', 'Inward');
              $module.removeClass(className.outward).addClass(className.inward);
            }
          },
          looping: function looping() {
            module.debug('Transition set to loop');
            $module.addClass(className.looping);
          },
          hidden: function hidden() {
            if (!module.is.hidden()) {
              $module.addClass(className.transition).addClass(className.hidden);
              if ($module.css('display') !== 'none') {
                module.verbose('Overriding default display to hide element');
                $module.css('display', 'none');
              }
            }
          },
          visible: function visible() {
            $module.addClass(className.transition).addClass(className.visible);
          }
        },

        save: {
          displayType: function displayType(_displayType) {
            $module.data(metadata.displayType, _displayType);
          },
          transitionExists: function transitionExists(animation, exists) {
            $.fn.transition.exists[animation] = exists;
            module.verbose('Saving existence of transition', animation, exists);
          },
          conditions: function conditions() {
            var clasName = $module.attr('class') || false,
                style = $module.attr('style') || '';
            $module.removeClass(settings.animation);
            module.remove.direction();
            module.cache = {
              className: $module.attr('class'),
              style: module.get.style()
            };
            module.verbose('Saving original attributes', module.cache);
          }
        },

        restore: {
          conditions: function conditions() {
            if (module.cache === undefined) {
              return false;
            }
            if (module.cache.className) {
              $module.attr('class', module.cache.className);
            } else {
              $module.removeAttr('class');
            }
            if (module.cache.style) {
              module.verbose('Restoring original style attribute', module.cache.style);
              $module.attr('style', module.cache.style);
            }
            if (module.is.looping()) {
              module.remove.looping();
            }
            module.verbose('Restoring original attributes', module.cache);
          }
        },

        add: {
          failSafe: function failSafe() {
            var duration = module.get.duration();
            module.timer = setTimeout(module.complete, duration + 100);
            module.verbose('Adding fail safe timer', module.timer);
          }
        },

        remove: {
          animating: function animating() {
            $module.removeClass(className.animating);
          },
          animation: function animation() {
            $module.css({
              '-webkit-animation': '',
              '-moz-animation': '',
              '-ms-animation': '',
              '-o-animation': '',
              'animation': ''
            });
          },
          animationEndCallback: function animationEndCallback() {
            $module.off('.complete');
          },
          display: function display() {
            $module.css('display', '');
          },
          direction: function direction() {
            $module.removeClass(className.inward).removeClass(className.outward);
          },
          failSafe: function failSafe() {
            module.verbose('Removing fail safe timer', module.timer);
            if (module.timer) {
              clearTimeout(module.timer);
            }
          },
          hidden: function hidden() {
            $module.removeClass(className.hidden);
          },
          visible: function visible() {
            $module.removeClass(className.visible);
          },
          looping: function looping() {
            module.debug('Transitions are no longer looping');
            $module.removeClass(className.looping);
            module.forceRepaint();
          },
          transition: function transition() {
            $module.removeClass(className.visible).removeClass(className.hidden);
          }
        },
        get: {
          settings: function settings(animation, duration, onComplete) {
            // single settings object
            if ((typeof animation === 'undefined' ? 'undefined' : _typeof(animation)) == 'object') {
              return $.extend(true, {}, $.fn.transition.settings, animation);
            }
            // all arguments provided
            else if (typeof onComplete == 'function') {
                return $.extend({}, $.fn.transition.settings, {
                  animation: animation,
                  onComplete: onComplete,
                  duration: duration
                });
              }
              // only duration provided
              else if (typeof duration == 'string' || typeof duration == 'number') {
                  return $.extend({}, $.fn.transition.settings, {
                    animation: animation,
                    duration: duration
                  });
                }
                // duration is actually settings object
                else if ((typeof duration === 'undefined' ? 'undefined' : _typeof(duration)) == 'object') {
                    return $.extend({}, $.fn.transition.settings, duration, {
                      animation: animation
                    });
                  }
                  // duration is actually callback
                  else if (typeof duration == 'function') {
                      return $.extend({}, $.fn.transition.settings, {
                        animation: animation,
                        onComplete: duration
                      });
                    }
                    // only animation provided
                    else {
                        return $.extend({}, $.fn.transition.settings, {
                          animation: animation
                        });
                      }
            return $.fn.transition.settings;
          },
          duration: function duration(_duration2) {
            _duration2 = _duration2 || settings.duration;
            return typeof settings.duration === 'string' ? _duration2.indexOf('ms') > -1 ? parseFloat(_duration2) : parseFloat(_duration2) * 1000 : _duration2;
          },
          displayType: function displayType() {
            if (settings.displayType) {
              return settings.displayType;
            }
            if ($module.data(metadata.displayType) === undefined) {
              // create fake element to determine display state
              module.can.transition(true);
            }
            return $module.data(metadata.displayType);
          },
          style: function style() {
            var style = $module.attr('style') || '';
            return style.replace(/display.*?;/, '');
          },
          transitionExists: function transitionExists(animation) {
            return $.fn.transition.exists[animation];
          },
          animationName: function animationName() {
            var element = document.createElement('div'),
                animations = {
              'animation': 'animationName',
              'OAnimation': 'oAnimationName',
              'MozAnimation': 'mozAnimationName',
              'WebkitAnimation': 'webkitAnimationName'
            },
                animation;
            for (animation in animations) {
              if (element.style[animation] !== undefined) {
                return animations[animation];
              }
            }
            return false;
          },
          animationStartEvent: function animationStartEvent() {
            var element = document.createElement('div'),
                animations = {
              'animation': 'animationstart',
              'OAnimation': 'oAnimationStart',
              'MozAnimation': 'mozAnimationStart',
              'WebkitAnimation': 'webkitAnimationStart'
            },
                animation;
            for (animation in animations) {
              if (element.style[animation] !== undefined) {
                return animations[animation];
              }
            }
            return false;
          },
          animationEndEvent: function animationEndEvent() {
            var element = document.createElement('div'),
                animations = {
              'animation': 'animationend',
              'OAnimation': 'oAnimationEnd',
              'MozAnimation': 'mozAnimationEnd',
              'WebkitAnimation': 'webkitAnimationEnd'
            },
                animation;
            for (animation in animations) {
              if (element.style[animation] !== undefined) {
                return animations[animation];
              }
            }
            return false;
          }

        },

        can: {
          transition: function transition(forced) {
            var elementClass = $module.attr('class'),
                tagName = $module.prop('tagName'),
                animation = settings.animation,
                transitionExists = module.get.transitionExists(animation),
                $clone,
                currentAnimation,
                inAnimation,
                directionExists,
                displayType;
            if (transitionExists === undefined || forced) {
              module.verbose('Determining whether animation exists');
              $clone = $('<' + tagName + ' />').addClass(elementClass).insertAfter($module);
              currentAnimation = $clone.addClass(animation).removeClass(className.inward).removeClass(className.outward).addClass(className.animating).addClass(className.transition).css(animationName);
              inAnimation = $clone.addClass(className.inward).css(animationName);
              displayType = $clone.attr('class', elementClass).removeAttr('style').removeClass(className.hidden).removeClass(className.visible).show().css('display');
              module.verbose('Determining final display state', displayType);
              $clone.remove();
              if (currentAnimation != inAnimation) {
                module.debug('Direction exists for animation', animation);
                directionExists = true;
              } else if (currentAnimation == 'none' || !currentAnimation) {
                module.debug('No animation defined in css', animation);
                return;
              } else {
                module.debug('Static animation found', animation, displayType);
                directionExists = false;
              }
              module.save.displayType(displayType);
              module.save.transitionExists(animation, directionExists);
            }
            return transitionExists !== undefined ? transitionExists : directionExists;
          },
          animate: function animate() {
            // can transition does not return a value if animation does not exist
            return module.can.transition() !== undefined;
          }
        },

        is: {
          animating: function animating() {
            return $module.hasClass(className.animating);
          },
          inward: function inward() {
            return $module.hasClass(className.inward);
          },
          outward: function outward() {
            return $module.hasClass(className.outward);
          },
          looping: function looping() {
            return $module.hasClass(className.looping);
          },
          occuring: function occuring(animation) {
            animation = animation || settings.animation;
            animation = animation.replace(' ', '.');
            return $module.filter(animation).size() > 0;
          },
          visible: function visible() {
            return $module.is(':visible');
          },
          hidden: function hidden() {
            return $module.css('visibility') === 'hidden';
          },
          supported: function supported() {
            return animationName !== false && animationEnd !== false;
          }
        },

        hide: function hide() {
          module.verbose('Hiding element');
          if (module.is.animating()) {
            module.reset();
          }
          module.remove.display();
          module.remove.visible();
          module.set.hidden();
          module.repaint();
        },

        show: function show(display) {
          module.verbose('Showing element', display);
          module.remove.hidden();
          module.set.visible();
          module.repaint();
        },

        start: function start() {
          module.verbose('Starting animation');
          $module.removeClass(className.disabled);
        },

        stop: function stop() {
          module.debug('Stopping animation');
          $module.addClass(className.disabled);
        },

        toggle: function toggle() {
          module.debug('Toggling play status');
          $module.toggleClass(className.disabled);
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
            module.performance.timer = setTimeout(module.performance.display, 600);
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
        // modified for transition to return invoke success
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
          return found !== undefined ? found : false;
        }
      };
      module.initialize();
    });
    return returnedValue !== undefined ? returnedValue : this;
  };

  // Records if CSS transition is available
  $.fn.transition.exists = {};

  $.fn.transition.settings = {

    // module info
    name: 'Transition',

    // debug content outputted to console
    debug: false,

    // verbose debug output
    verbose: true,

    // performance data output
    performance: true,

    // event namespace
    namespace: 'transition',

    // animation complete event
    onStart: function onStart() {},
    onComplete: function onComplete() {},
    onShow: function onShow() {},
    onHide: function onHide() {},

    // whether timeout should be used to ensure callback fires in cases animationend does not
    useFailSafe: false,

    // whether EXACT animation can occur twice in a row
    allowRepeats: false,

    // Override final display type on visible
    displayType: false,

    // animation duration
    animation: 'fade',
    duration: '500ms',

    // new animations will occur after previous ones
    queue: true,

    metadata: {
      displayType: 'display'
    },

    className: {
      animating: 'animating',
      disabled: 'disabled',
      hidden: 'hidden',
      inward: 'in',
      loading: 'loading',
      looping: 'looping',
      outward: 'out',
      transition: 'transition',
      visible: 'visible'
    },

    // possible errors
    error: {
      noAnimation: 'There is no css animation matching the one you specified.',
      repeated: 'That animation is already occurring, cancelling repeated animation',
      method: 'The method you called is not defined',
      support: 'This browser does not support CSS animations'
    }

  };
})(jQuery, window, document);