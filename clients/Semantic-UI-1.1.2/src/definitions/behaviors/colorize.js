'use strict';

/*
 * # Semantic - Colorize
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

  $.fn.colorize = function (parameters) {
    var settings = $.extend(true, {}, $.fn.colorize.settings, parameters),

    // hoist arguments
    moduleArguments = arguments || false;
    $(this).each(function (instanceIndex) {

      var $module = $(this),
          mainCanvas = $('<canvas />')[0],
          imageCanvas = $('<canvas />')[0],
          overlayCanvas = $('<canvas />')[0],
          backgroundImage = new Image(),


      // defs
      mainContext,
          imageContext,
          overlayContext,
          _image,
          imageName,
          width,
          height,


      // shortucts
      _colors = settings.colors,
          paths = settings.paths,
          namespace = settings.namespace,
          error = settings.error,


      // boilerplate
      instance = $module.data('module-' + namespace),
          module;

      module = {

        checkPreconditions: function checkPreconditions() {
          module.debug('Checking pre-conditions');

          if (!$.isPlainObject(_colors) || $.isEmptyObject(_colors)) {
            module.error(error.undefinedColors);
            return false;
          }
          return true;
        },

        async: function async(callback) {
          if (settings.async) {
            setTimeout(callback, 0);
          } else {
            callback();
          }
        },

        getMetadata: function getMetadata() {
          module.debug('Grabbing metadata');
          _image = $module.data('image') || settings.image || undefined;
          imageName = $module.data('name') || settings.name || instanceIndex;
          width = settings.width || $module.width();
          height = settings.height || $module.height();
          if (width === 0 || height === 0) {
            module.error(error.undefinedSize);
          }
        },

        initialize: function initialize() {
          module.debug('Initializing with colors', _colors);
          if (module.checkPreconditions()) {

            module.async(function () {
              module.getMetadata();
              module.canvas.create();

              module.draw.image(function () {
                module.draw.colors();
                module.canvas.merge();
              });
              $module.data('module-' + namespace, module);
            });
          }
        },

        redraw: function redraw() {
          module.debug('Redrawing image');
          module.async(function () {
            module.canvas.clear();
            module.draw.colors();
            module.canvas.merge();
          });
        },

        change: {
          color: function color(colorName, _color) {
            module.debug('Changing color', colorName);
            if (_colors[colorName] === undefined) {
              module.error(error.missingColor);
              return false;
            }
            _colors[colorName] = _color;
            module.redraw();
          }
        },

        canvas: {
          create: function create() {
            module.debug('Creating canvases');

            mainCanvas.width = width;
            mainCanvas.height = height;
            imageCanvas.width = width;
            imageCanvas.height = height;
            overlayCanvas.width = width;
            overlayCanvas.height = height;

            mainContext = mainCanvas.getContext('2d');
            imageContext = imageCanvas.getContext('2d');
            overlayContext = overlayCanvas.getContext('2d');

            $module.append(mainCanvas);
            mainContext = $module.children('canvas')[0].getContext('2d');
          },
          clear: function clear(context) {
            module.debug('Clearing canvas');
            overlayContext.fillStyle = '#FFFFFF';
            overlayContext.fillRect(0, 0, width, height);
          },
          merge: function merge() {
            if (!$.isFunction(mainContext.blendOnto)) {
              module.error(error.missingPlugin);
              return;
            }
            mainContext.putImageData(imageContext.getImageData(0, 0, width, height), 0, 0);
            overlayContext.blendOnto(mainContext, 'multiply');
          }
        },

        draw: {

          image: function image(callback) {
            module.debug('Drawing image');
            callback = callback || function () {};
            if (_image) {
              backgroundImage.src = _image;
              backgroundImage.onload = function () {
                imageContext.drawImage(backgroundImage, 0, 0);
                callback();
              };
            } else {
              module.error(error.noImage);
              callback();
            }
          },

          colors: function colors() {
            module.debug('Drawing color overlays', _colors);
            $.each(_colors, function (colorName, color) {
              settings.onDraw(overlayContext, imageName, colorName, color);
            });
          }

        },

        debug: function debug(message, variableName) {
          if (settings.debug) {
            if (variableName !== undefined) {
              console.info(settings.name + ': ' + message, variableName);
            } else {
              console.info(settings.name + ': ' + message);
            }
          }
        },
        error: function error(errorMessage) {
          console.warn(settings.name + ': ' + errorMessage);
        },
        invoke: function invoke(methodName, context, methodArguments) {
          var method;
          methodArguments = methodArguments || Array.prototype.slice.call(arguments, 2);

          if (typeof methodName == 'string' && instance !== undefined) {
            methodName = methodName.split('.');
            $.each(methodName, function (index, name) {
              if ($.isPlainObject(instance[name])) {
                instance = instance[name];
                return true;
              } else if ($.isFunction(instance[name])) {
                method = instance[name];
                return true;
              }
              module.error(settings.error.method);
              return false;
            });
          }
          return $.isFunction(method) ? method.apply(context, methodArguments) : false;
        }

      };
      if (instance !== undefined && moduleArguments) {
        // simpler than invoke realizing to invoke itself (and losing scope due prototype.call()
        if (moduleArguments[0] == 'invoke') {
          moduleArguments = Array.prototype.slice.call(moduleArguments, 1);
        }
        return module.invoke(moduleArguments[0], this, Array.prototype.slice.call(moduleArguments, 1));
      }
      // initializing
      module.initialize();
    });
    return this;
  };

  $.fn.colorize.settings = {
    name: 'Image Colorizer',
    debug: true,
    namespace: 'colorize',

    onDraw: function onDraw(overlayContext, imageName, colorName, color) {},

    // whether to block execution while updating canvas
    async: true,
    // object containing names and default values of color regions
    colors: {},

    metadata: {
      image: 'image',
      name: 'name'
    },

    error: {
      noImage: 'No tracing image specified',
      undefinedColors: 'No default colors specified.',
      missingColor: 'Attempted to change color that does not exist',
      missingPlugin: 'Blend onto plug-in must be included',
      undefinedHeight: 'The width or height of image canvas could not be automatically determined. Please specify a height.'
    }

  };
})(jQuery, window, document);