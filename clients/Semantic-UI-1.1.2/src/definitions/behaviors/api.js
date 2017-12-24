'use strict';

/*
 * # Semantic - API
 * http://github.com/semantic-org/semantic-ui/
 *
 *
 * Copyright 2014 Contributor
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 */

;(function ($, window, document, undefined) {

  $.api = $.fn.api = function (parameters) {

    var
    // use window context if none specified
    $allModules = $.isFunction(this) ? $(window) : $(this),
        moduleSelector = $allModules.selector || '',
        time = new Date().getTime(),
        performance = [],
        query = arguments[0],
        methodInvoked = typeof query == 'string',
        queryArguments = [].slice.call(arguments, 1),
        returnedValue;

    $allModules.each(function () {
      var _settings = $.isPlainObject(parameters) ? $.extend(true, {}, $.fn.api.settings, parameters) : $.extend({}, $.fn.api.settings),


      // internal aliases
      namespace = _settings.namespace,
          metadata = _settings.metadata,
          selector = _settings.selector,
          _error = _settings.error,
          className = _settings.className,


      // define namespaces for modules
      eventNamespace = '.' + namespace,
          moduleNamespace = 'module-' + namespace,


      // element that creates request
      $module = $(this),
          $form = $module.closest(selector.form),


      // context used for state
      $context = _settings.stateContext ? $(_settings.stateContext) : $module,


      // request details
      ajaxSettings,
          requestSettings,
          url,
          data,


      // standard module
      element = this,
          context = $context.get(),
          instance = $module.data(moduleNamespace),
          module;

      module = {

        initialize: function initialize() {
          var triggerEvent = module.get.event();
          // bind events
          if (!methodInvoked) {
            if (triggerEvent) {
              module.debug('Attaching API events to element', triggerEvent);
              $module.on(triggerEvent + eventNamespace, module.event.trigger);
            } else {
              module.query();
            }
          }
          module.instantiate();
        },

        instantiate: function instantiate() {
          module.verbose('Storing instance of module', module);
          instance = module;
          $module.data(moduleNamespace, instance);
        },

        destroy: function destroy() {
          module.verbose('Destroying previous module for', element);
          $module.removeData(moduleNamespace).off(eventNamespace);
        },

        query: function query() {

          if (module.is.disabled()) {
            module.debug('Element is disabled API request aborted');
            return;
          }
          // determine if an api event already occurred
          if (module.is.loading() && _settings.throttle === 0) {
            module.debug('Cancelling request, previous request is still pending');
            return;
          }

          // pass element metadata to url (value, text)
          if (_settings.defaultData) {
            $.extend(true, _settings.urlData, module.get.defaultData());
          }

          // Add form content
          if (_settings.serializeForm !== false || $context.is('form')) {
            if (_settings.serializeForm == 'json') {
              $.extend(true, _settings.data, module.get.formData());
            } else {
              _settings.data = module.get.formData();
            }
          }

          // call beforesend and get any settings changes
          requestSettings = module.get.settings();

          // check if beforesend cancelled request
          if (requestSettings === false) {
            module.error(_error.beforeSend);
            return;
          }

          if (_settings.url) {
            // override with url if specified
            module.debug('Using specified url', url);
            url = module.add.urlData(_settings.url);
          } else {
            // otherwise find url from api endpoints
            url = module.add.urlData(module.get.templateURL());
            module.debug('Added URL Data to url', url);
          }

          // exit conditions reached, missing url parameters
          if (!url) {
            if ($module.is('form')) {
              module.debug('No url or action specified, defaulting to form action');
              url = $module.attr('action');
            } else {
              module.error(_error.missingURL, _settings.action);
              return;
            }
          }

          // add loading state
          module.set.loading();

          // look for jQuery ajax parameters in settings
          ajaxSettings = $.extend(true, {}, _settings, {
            type: _settings.method || _settings.type,
            data: data,
            url: _settings.base + url,
            beforeSend: _settings.beforeXHR,
            success: function success() {},
            failure: function failure() {},
            complete: function complete() {}
          });

          module.verbose('Creating AJAX request with settings', ajaxSettings);

          if (!module.is.loading()) {
            module.request = module.create.request();
            module.xhr = module.create.xhr();
          } else {
            // throttle additional requests
            module.timer = setTimeout(function () {
              module.request = module.create.request();
              module.xhr = module.create.xhr();
            }, _settings.throttle);
          }
        },

        is: {
          disabled: function disabled() {
            return $module.filter(_settings.filter).size() > 0;
          },
          loading: function loading() {
            return module.request && module.request.state() == 'pending';
          }
        },

        was: {
          succesful: function succesful() {
            return module.request && module.request.state() == 'resolved';
          },
          failure: function failure() {
            return module.request && module.request.state() == 'rejected';
          },
          complete: function complete() {
            return module.request && (module.request.state() == 'resolved' || module.request.state() == 'rejected');
          }
        },

        add: {
          urlData: function urlData(url, _urlData) {
            var requiredVariables, optionalVariables;
            if (url) {
              requiredVariables = url.match(_settings.regExp.required);
              optionalVariables = url.match(_settings.regExp.optional);
              _urlData = _urlData || _settings.urlData;
              if (requiredVariables) {
                module.debug('Looking for required URL variables', requiredVariables);
                $.each(requiredVariables, function (index, templatedString) {
                  var
                  // allow legacy {$var} style
                  variable = templatedString.indexOf('$') !== -1 ? templatedString.substr(2, templatedString.length - 3) : templatedString.substr(1, templatedString.length - 2),
                      value = $.isPlainObject(_urlData) && _urlData[variable] !== undefined ? _urlData[variable] : $module.data(variable) !== undefined ? $module.data(variable) : $context.data(variable) !== undefined ? $context.data(variable) : _urlData[variable];
                  // remove value
                  if (value === undefined) {
                    module.error(_error.requiredParameter, variable, url);
                    url = false;
                    return false;
                  } else {
                    module.verbose('Found required variable', variable, value);
                    url = url.replace(templatedString, value);
                  }
                });
              }
              if (optionalVariables) {
                module.debug('Looking for optional URL variables', requiredVariables);
                $.each(optionalVariables, function (index, templatedString) {
                  var
                  // allow legacy {/$var} style
                  variable = templatedString.indexOf('$') !== -1 ? templatedString.substr(3, templatedString.length - 4) : templatedString.substr(2, templatedString.length - 3),
                      value = $.isPlainObject(_urlData) && _urlData[variable] !== undefined ? _urlData[variable] : $module.data(variable) !== undefined ? $module.data(variable) : $context.data(variable) !== undefined ? $context.data(variable) : _urlData[variable];
                  // optional replacement
                  if (value !== undefined) {
                    module.verbose('Optional variable Found', variable, value);
                    url = url.replace(templatedString, value);
                  } else {
                    module.verbose('Optional variable not found', variable);
                    // remove preceding slash if set
                    if (url.indexOf('/' + templatedString) !== -1) {
                      url = url.replace('/' + templatedString, '');
                    } else {
                      url = url.replace(templatedString, '');
                    }
                  }
                });
              }
            }
            return url;
          }
        },

        event: {
          trigger: function trigger(event) {
            module.query();
            if (event.type == 'submit' || event.type == 'click') {
              event.preventDefault();
            }
          },
          xhr: {
            always: function always() {
              // calculate if loading time was below minimum threshold
            },
            done: function done(response) {
              var context = this,
                  elapsedTime = new Date().getTime() - time,
                  timeLeft = _settings.loadingDuration - elapsedTime;
              timeLeft = timeLeft > 0 ? timeLeft : 0;
              setTimeout(function () {
                module.request.resolveWith(context, [response]);
              }, timeLeft);
            },
            fail: function fail(xhr, status, httpMessage) {
              var context = this,
                  elapsedTime = new Date().getTime() - time,
                  timeLeft = _settings.loadingDuration - elapsedTime;
              timeLeft = timeLeft > 0 ? timeLeft : 0;
              // page triggers abort on navigation, dont show error
              setTimeout(function () {
                if (status !== 'abort') {
                  module.request.rejectWith(context, [xhr, status, httpMessage]);
                } else {
                  module.reset();
                }
              }, timeLeft);
            }
          },
          request: {
            complete: function complete(response) {
              module.remove.loading();
              $.proxy(_settings.onComplete, context)(response, $module);
            },
            done: function done(response) {
              module.debug('API Response Received', response);
              if (_settings.dataType == 'json') {
                if ($.isFunction(_settings.successTest)) {
                  module.debug('Checking JSON returned success', _settings.successTest, response);
                  if (_settings.successTest(response)) {
                    $.proxy(_settings.onSuccess, context)(response, $module);
                  } else {
                    module.debug('JSON test specified by user and response failed', response);
                    $.proxy(_settings.onFailure, context)(response, $module);
                  }
                } else {
                  $.proxy(_settings.onSuccess, context)(response, $module);
                }
              } else {
                $.proxy(_settings.onSuccess, context)(response, $module);
              }
            },
            error: function error(xhr, status, httpMessage) {
              var errorMessage = _settings.error[status] !== undefined ? _settings.error[status] : httpMessage,
                  response;
              // let em know unless request aborted
              if (xhr !== undefined) {
                // readyState 4 = done, anything less is not really sent
                if (xhr.readyState !== undefined && xhr.readyState == 4) {

                  // if http status code returned and json returned error, look for it
                  if (xhr.status != 200 && httpMessage !== undefined && httpMessage !== '') {
                    module.error(_error.statusMessage + httpMessage);
                  } else {
                    if (status == 'error' && _settings.dataType == 'json') {
                      try {
                        response = $.parseJSON(xhr.responseText);
                        if (response && response.error !== undefined) {
                          errorMessage = response.error;
                        }
                      } catch (e) {
                        module.error(_error.JSONParse);
                      }
                    }
                  }
                  module.remove.loading();
                  module.set.error();
                  // show error state only for duration specified in settings
                  if (_settings.errorDuration) {
                    setTimeout(module.remove.error, _settings.errorDuration);
                  }
                  module.debug('API Request error:', errorMessage);
                  $.proxy(_settings.onError, context)(errorMessage, context);
                } else {
                  $.proxy(_settings.onAbort, context)(errorMessage, context);
                  module.debug('Request Aborted (Most likely caused by page change or CORS Policy)', status, httpMessage);
                }
              }
            }
          }
        },

        create: {
          request: function request() {
            return $.Deferred().always(module.event.request.complete).done(module.event.request.done).fail(module.event.request.error);
          },
          xhr: function xhr() {
            $.ajax(ajaxSettings).always(module.event.xhr.always).done(module.event.xhr.done).fail(module.event.xhr.fail);
          }
        },

        set: {
          error: function error() {
            module.verbose('Adding error state to element', $context);
            $context.addClass(className.error);
          },
          loading: function loading() {
            module.verbose('Adding loading state to element', $context);
            $context.addClass(className.loading);
          }
        },

        remove: {
          error: function error() {
            module.verbose('Removing error state from element', $context);
            $context.removeClass(className.error);
          },
          loading: function loading() {
            module.verbose('Removing loading state from element', $context);
            $context.removeClass(className.loading);
          }
        },

        get: {
          request: function request() {
            return module.request || false;
          },
          xhr: function xhr() {
            return module.xhr || false;
          },
          settings: function settings() {
            var runSettings;
            runSettings = $.proxy(_settings.beforeSend, $module)(_settings);
            if (runSettings) {
              if (runSettings.success !== undefined) {
                module.debug('Legacy success callback detected', runSettings);
                module.error(_error.legacyParameters, runSettings.success);
                runSettings.onSuccess = runSettings.success;
              }
              if (runSettings.failure !== undefined) {
                module.debug('Legacy failure callback detected', runSettings);
                module.error(_error.legacyParameters, runSettings.failure);
                runSettings.onFailure = runSettings.failure;
              }
              if (runSettings.complete !== undefined) {
                module.debug('Legacy complete callback detected', runSettings);
                module.error(_error.legacyParameters, runSettings.complete);
                runSettings.onComplete = runSettings.complete;
              }
            }
            if (runSettings === undefined) {
              module.error(_error.noReturnedValue);
            }
            return runSettings !== undefined ? runSettings : _settings;
          },
          defaultData: function defaultData() {
            var data = {};
            if (!$.isWindow(element)) {
              if ($module.is('input')) {
                data.value = $module.val();
              } else if ($module.is('form')) {} else {
                data.text = $module.text();
              }
            }
            return data;
          },
          event: function event() {
            if ($.isWindow(element) || _settings.on == 'now') {
              module.debug('API called without element, no events attached');
              return false;
            } else if (_settings.on == 'auto') {
              if ($module.is('input')) {
                return element.oninput !== undefined ? 'input' : element.onpropertychange !== undefined ? 'propertychange' : 'keyup';
              } else if ($module.is('form')) {
                return 'submit';
              } else {
                return 'click';
              }
            } else {
              return _settings.on;
            }
          },
          formData: function formData() {
            var formData;
            if ($(this).serializeObject() !== undefined) {
              formData = $form.serializeObject();
            } else {
              module.error(_error.missingSerialize);
              formData = $form.serialize();
            }
            module.debug('Retrieved form data', formData);
            return formData;
          },
          templateURL: function templateURL(action) {
            var url;
            action = action || $module.data(_settings.metadata.action) || _settings.action || false;
            if (action) {
              module.debug('Looking up url for action', action, _settings.api);
              if (_settings.api[action] !== undefined) {
                url = _settings.api[action];
                module.debug('Found template url', url);
              } else {
                module.error(_error.missingAction, _settings.action, _settings.api);
              }
            }
            return url;
          }
        },

        // reset state
        reset: function reset() {
          module.remove.error();
          module.remove.loading();
        },

        setting: function setting(name, value) {
          module.debug('Changing setting', name, value);
          if ($.isPlainObject(name)) {
            $.extend(true, _settings, name);
          } else if (value !== undefined) {
            _settings[name] = value;
          } else {
            return _settings[name];
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
          if (_settings.debug) {
            if (_settings.performance) {
              module.performance.log(arguments);
            } else {
              module.debug = Function.prototype.bind.call(console.info, console, _settings.name + ':');
              module.debug.apply(console, arguments);
            }
          }
        },
        verbose: function verbose() {
          if (_settings.verbose && _settings.debug) {
            if (_settings.performance) {
              module.performance.log(arguments);
            } else {
              module.verbose = Function.prototype.bind.call(console.info, console, _settings.name + ':');
              module.verbose.apply(console, arguments);
            }
          }
        },
        error: function error() {
          module.error = Function.prototype.bind.call(console.error, console, _settings.name + ':');
          module.error.apply(console, arguments);
        },
        performance: {
          log: function log(message) {
            var currentTime, executionTime, previousTime;
            if (_settings.performance) {
              currentTime = new Date().getTime();
              previousTime = time || currentTime;
              executionTime = currentTime - previousTime;
              time = currentTime;
              performance.push({
                'Name': message[0],
                'Arguments': [].slice.call(message, 1) || '',
                //'Element'        : element,
                'Execution Time': executionTime
              });
            }
            clearTimeout(module.performance.timer);
            module.performance.timer = setTimeout(module.performance.display, 100);
          },
          display: function display() {
            var title = _settings.name + ':',
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
                module.error(_error.method, query);
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

  $.api.settings = {

    name: 'API',
    namespace: 'api',

    debug: false,
    verbose: true,
    performance: true,

    // event binding
    on: 'auto',
    filter: '.disabled',
    stateContext: false,

    // state
    loadingDuration: 0,
    errorDuration: 2000,

    // templating
    action: false,
    url: false,
    base: '',

    // data
    urlData: {},

    // ui
    defaultData: true,
    serializeForm: false,
    throttle: 0,

    // jQ ajax
    method: 'get',
    data: {},
    dataType: 'json',

    // callbacks
    beforeSend: function beforeSend(settings) {
      return settings;
    },
    beforeXHR: function beforeXHR(xhr) {},

    onSuccess: function onSuccess(response, $module) {},
    onComplete: function onComplete(response, $module) {},
    onFailure: function onFailure(errorMessage, $module) {},
    onError: function onError(errorMessage, $module) {},
    onAbort: function onAbort(errorMessage, $module) {},

    successTest: false,

    // errors
    error: {
      beforeSend: 'The before send function has aborted the request',
      error: 'There was an error with your request',
      exitConditions: 'API Request Aborted. Exit conditions met',
      JSONParse: 'JSON could not be parsed during error handling',
      legacyParameters: 'You are using legacy API success callback names',
      missingAction: 'API action used but no url was defined',
      missingSerialize: 'Required dependency jquery-serialize-object missing, using basic serialize',
      missingURL: 'No URL specified for api event',
      noReturnedValue: 'The beforeSend callback must return a settings object, beforeSend ignored.',
      parseError: 'There was an error parsing your request',
      requiredParameter: 'Missing a required URL parameter: ',
      statusMessage: 'Server gave an error: ',
      timeout: 'Your request timed out'
    },

    regExp: {
      required: /\{\$*[A-z0-9]+\}/g,
      optional: /\{\/\$*[A-z0-9]+\}/g
    },

    className: {
      loading: 'loading',
      error: 'error'
    },

    selector: {
      form: 'form'
    },

    metadata: {
      action: 'action',
      request: 'request',
      xhr: 'xhr'
    }
  };

  $.api.settings.api = {};
})(jQuery, window, document);