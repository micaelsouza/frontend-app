(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _angular = require('angular');

var _angular2 = _interopRequireDefault(_angular);

var _module = require('./src/app/module.js');

var _module2 = _interopRequireDefault(_module);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_angular2.default.bootstrap(document, ['app']);

},{"./src/app/module.js":7,"angular":"angular"}],2:[function(require,module,exports){
(function() {
  'use strict';
  angular.module('ngMask', []);
})();(function() {
  'use strict';
  angular.module('ngMask')
    .directive('mask', ['$log', '$timeout', 'MaskService', function($log, $timeout, MaskService) {
      return {
        restrict: 'A',
        require: 'ngModel',
        compile: function($element, $attrs) { 
         if (!$attrs.mask || !$attrs.ngModel) {
            $log.info('Mask and ng-model attributes are required!');
            return;
          }

          var maskService = MaskService.create();
          var timeout;
          var promise;

          function setSelectionRange(selectionStart){
            if (typeof selectionStart !== 'number') {
              return;
            }

            // using $timeout:
            // it should run after the DOM has been manipulated by Angular
            // and after the browser renders (which may cause flicker in some cases)
            $timeout.cancel(timeout);
            timeout = $timeout(function(){
              var selectionEnd = selectionStart + 1;
              var input = $element[0];

              if (input.setSelectionRange) {
                input.focus();
                input.setSelectionRange(selectionStart, selectionEnd);
              } else if (input.createTextRange) {
                var range = input.createTextRange();

                range.collapse(true);
                range.moveEnd('character', selectionEnd);
                range.moveStart('character', selectionStart);
                range.select();
              }
            });
          }

          return {
            pre: function($scope, $element, $attrs, controller) {
              promise = maskService.generateRegex({
                mask: $attrs.mask,
                // repeat mask expression n times
                repeat: ($attrs.repeat || $attrs.maskRepeat),
                // clean model value - without divisors
                clean: (($attrs.clean || $attrs.maskClean) === 'true'),
                // limit length based on mask length
                limit: (($attrs.limit || $attrs.maskLimit || 'true') === 'true'),
                // how to act with a wrong value
                restrict: ($attrs.restrict || $attrs.maskRestrict || 'select'), //select, reject, accept
                // set validity mask
                validate: (($attrs.validate || $attrs.maskValidate || 'true') === 'true'),
                // default model value
                model: $attrs.ngModel,
                // default input value
                value: $attrs.ngValue
              });
            },
            post: function($scope, $element, $attrs, controller) {
              var timeout;
              var options = maskService.getOptions();

              function parseViewValue(value) {
                var untouchedValue = value;
                options = maskService.getOptions();
                // set default value equal 0
                value = value || '';

                // get view value object
                var viewValue = maskService.getViewValue(value);

                // get mask without question marks
                var maskWithoutOptionals = options['maskWithoutOptionals'] || '';

                // get view values capped
                // used on view
                var viewValueWithDivisors = viewValue.withDivisors(true);
                // used on model
                var viewValueWithoutDivisors = viewValue.withoutDivisors(true);

                try {
                  // get current regex
                  var regex = maskService.getRegex(viewValueWithDivisors.length - 1);
                  var fullRegex = maskService.getRegex(maskWithoutOptionals.length - 1);

                  // current position is valid
                  var validCurrentPosition = regex.test(viewValueWithDivisors) || fullRegex.test(viewValueWithDivisors);

                  // difference means for select option
                  var diffValueAndViewValueLengthIsOne = (value.length - viewValueWithDivisors.length) === 1;
                  var diffMaskAndViewValueIsGreaterThanZero = (maskWithoutOptionals.length - viewValueWithDivisors.length) > 0;

                  if (options.restrict !== 'accept') {
                    if (options.restrict === 'select' && (!validCurrentPosition || diffValueAndViewValueLengthIsOne)) {
                      var lastCharInputed = value[(value.length-1)];
                      var lastCharGenerated = viewValueWithDivisors[(viewValueWithDivisors.length-1)];

                      if ((lastCharInputed !== lastCharGenerated) && diffMaskAndViewValueIsGreaterThanZero) {
                        viewValueWithDivisors = viewValueWithDivisors + lastCharInputed;
                      }

                      var wrongPosition = maskService.getFirstWrongPosition(viewValueWithDivisors);
                      if (angular.isDefined(wrongPosition)) {
                        setSelectionRange(wrongPosition);
                      }
                    } else if (options.restrict === 'reject' && !validCurrentPosition) {
                      viewValue = maskService.removeWrongPositions(viewValueWithDivisors);
                      viewValueWithDivisors = viewValue.withDivisors(true);
                      viewValueWithoutDivisors = viewValue.withoutDivisors(true);

                      // setSelectionRange(viewValueWithDivisors.length);
                    }
                  }

                  if (!options.limit) {
                    viewValueWithDivisors = viewValue.withDivisors(false);
                    viewValueWithoutDivisors = viewValue.withoutDivisors(false);
                  }

                  // Set validity
                  if (options.validate && controller.$dirty) {
                    if (fullRegex.test(viewValueWithDivisors) || controller.$isEmpty(untouchedValue)) {
                      controller.$setValidity('mask', true);
                    } else {
                      controller.$setValidity('mask', false);
                    }
                  }

                  // Update view and model values
                  if(value !== viewValueWithDivisors){
                    controller.$setViewValue(angular.copy(viewValueWithDivisors), 'input');
                    controller.$render();
                  }
                } catch (e) {
                  $log.error('[mask - parseViewValue]');
                  throw e;
                }

                // Update model, can be different of view value
                if (options.clean) {
                  return viewValueWithoutDivisors;
                } else {
                  return viewValueWithDivisors;
                }
              }

              var callParseViewValue = function() {
                parseViewValue();

                controller.$parsers.push(parseViewValue);

                // $evalAsync from a directive
                // it should run after the DOM has been manipulated by Angular
                // but before the browser renders
                if(options.value) {
                  $scope.$evalAsync(function($scope) {
                    controller.$setViewValue(angular.copy(options.value), 'input');
                    controller.$render();
                  });
                }
              }

              $element.on('click input paste keyup', function() {
                timeout = $timeout(function() {
                  // Manual debounce to prevent multiple execution
                  $timeout.cancel(timeout);

                  parseViewValue($element.val());
                  $scope.$apply();
                }, 100);
              });

              // Register the watch to observe remote loading or promised data
              // Deregister calling returned function
              var watcher = $scope.$watch($attrs.ngModel, function (newValue, oldValue) {
                if (angular.isDefined(newValue)) {
                  parseViewValue(newValue);
                  watcher();
                }
              });

              $scope.$watch(function () {
                return [$attrs.mask];
              }, function() {
                promise = maskService.generateRegex({
                  mask: $attrs.mask,
                  // repeat mask expression n times
                  repeat: ($attrs.repeat || $attrs.maskRepeat),
                  // clean model value - without divisors
                  clean: (($attrs.clean || $attrs.maskClean) === 'true'),
                  // limit length based on mask length
                  limit: (($attrs.limit || $attrs.maskLimit || 'true') === 'true'),
                  // how to act with a wrong value
                  restrict: ($attrs.restrict || $attrs.maskRestrict || 'select'), //select, reject, accept
                  // set validity mask
                  validate: (($attrs.validate || $attrs.maskValidate || 'true') === 'true'),
                  // default model value
                  model: $attrs.ngModel,
                  // default input value
                  value: $attrs.ngValue
                }).then(function() {
                  $element.triggerHandler('click');
                });

                promise.then(callParseViewValue);
              }, true);

              promise.then(callParseViewValue);
            }
          }
        }
      }
    }]);
})();
(function() {
  'use strict';
  angular.module('ngMask')
    .factory('MaskService', ['$q', 'OptionalService', 'UtilService', function($q, OptionalService, UtilService) {
      function create() {
        var options;
        var maskWithoutOptionals;
        var maskWithoutOptionalsLength = 0;
        var maskWithoutOptionalsAndDivisorsLength = 0;
        var optionalIndexes = [];
        var optionalDivisors = {};
        var optionalDivisorsCombinations = [];
        var divisors = [];
        var divisorElements = {};
        var regex = [];
        var patterns = {
          '9': /[0-9]/,
          '8': /[0-8]/,
          '7': /[0-7]/,
          '6': /[0-6]/,
          '5': /[0-5]/,
          '4': /[0-4]/,
          '3': /[0-3]/,
          '2': /[0-2]/,
          '1': /[0-1]/,
          '0': /[0]/,
          '*': /./,
          'w': /\w/,
          'W': /\W/,
          'd': /\d/,
          'D': /\D/,
          's': /\s/,
          'S': /\S/,
          'b': /\b/,
          'A': /[A-Z]/,
          'a': /[a-z]/,
          'Z': /[A-ZÇÀÁÂÃÈÉÊẼÌÍÎĨÒÓÔÕÙÚÛŨ]/,
          'z': /[a-zçáàãâéèêẽíìĩîóòôõúùũüû]/,
          '@': /[a-zA-Z]/,
          '#': /[a-zA-ZçáàãâéèêẽíìĩîóòôõúùũüûÇÀÁÂÃÈÉÊẼÌÍÎĨÒÓÔÕÙÚÛŨ]/,
          '%': /[0-9a-zA-ZçáàãâéèêẽíìĩîóòôõúùũüûÇÀÁÂÃÈÉÊẼÌÍÎĨÒÓÔÕÙÚÛŨ]/
        };

        // REGEX

        function generateIntermetiateElementRegex(i, forceOptional) {
          var charRegex;
          try {
            var element = maskWithoutOptionals[i];
            var elementRegex = patterns[element];
            var hasOptional = isOptional(i);

            if (elementRegex) {
              charRegex = '(' + elementRegex.source + ')';
            } else { // is a divisor
              if (!isDivisor(i)) {
                divisors.push(i);
                divisorElements[i] = element;
              }

              charRegex = '(' + '\\' + element + ')';
            }
          } catch (e) {
            throw e;
          }

          if (hasOptional || forceOptional) {
            charRegex += '?';
          }

          return new RegExp(charRegex);
        }

        function generateIntermetiateRegex(i, forceOptional) {


          var elementRegex
          var elementOptionalRegex;
          try {
            var intermetiateElementRegex = generateIntermetiateElementRegex(i, forceOptional);
            elementRegex = intermetiateElementRegex;

            var hasOptional = isOptional(i);
            var currentRegex = intermetiateElementRegex.source;

            if (hasOptional && ((i+1) < maskWithoutOptionalsLength)) {
              var intermetiateRegex = generateIntermetiateRegex((i+1), true).elementOptionalRegex();
              currentRegex += intermetiateRegex.source;
            }

            elementOptionalRegex = new RegExp(currentRegex);
          } catch (e) {
            throw e;
          }
          return {
            elementRegex: function() {
              return elementRegex;
            },
            elementOptionalRegex: function() {
              // from element regex, gets the flow of regex until first not optional
              return elementOptionalRegex;
            }
          };
        }

        function generateRegex(opts) {
          var deferred = $q.defer();
          maskWithoutOptionals = null;
          maskWithoutOptionalsLength = 0;
          maskWithoutOptionalsAndDivisorsLength = 0;
          optionalIndexes = [];
          optionalDivisors = {};
          optionalDivisorsCombinations = [];
          divisors = [];
          divisorElements = {};
          regex = [];
          options = opts;

          try {
            var mask = opts['mask'];
            var repeat = opts['repeat'];

            if (!mask)
              return;

            if (repeat) {
              mask = Array((parseInt(repeat)+1)).join(mask);
            }

            optionalIndexes = OptionalService.getOptionals(mask).fromMaskWithoutOptionals();
            options['maskWithoutOptionals'] = maskWithoutOptionals = OptionalService.removeOptionals(mask);
            maskWithoutOptionalsLength = maskWithoutOptionals.length;

            var cumulativeRegex;
            for (var i=0; i<maskWithoutOptionalsLength; i++) {
              var charRegex = generateIntermetiateRegex(i);
              var elementRegex = charRegex.elementRegex();
              var elementOptionalRegex = charRegex.elementOptionalRegex();

              var newRegex = cumulativeRegex ? cumulativeRegex.source + elementOptionalRegex.source : elementOptionalRegex.source;
              newRegex = new RegExp(newRegex);
              cumulativeRegex = cumulativeRegex ? cumulativeRegex.source + elementRegex.source : elementRegex.source;
              cumulativeRegex = new RegExp(cumulativeRegex);

              regex.push(newRegex);
            }

            generateOptionalDivisors();
            maskWithoutOptionalsAndDivisorsLength = removeDivisors(maskWithoutOptionals).length;

            deferred.resolve({
              options: options,
              divisors: divisors,
              divisorElements: divisorElements,
              optionalIndexes: optionalIndexes,
              optionalDivisors: optionalDivisors,
              optionalDivisorsCombinations: optionalDivisorsCombinations
            });
          } catch (e) {
            deferred.reject(e);
            throw e;
          }

          return deferred.promise;
        }

        function getRegex(index) {
          var currentRegex;

          try {
            currentRegex = regex[index] ? regex[index].source : '';
          } catch (e) {
            throw e;
          }

          return (new RegExp('^' + currentRegex + '$'));
        }

        // DIVISOR

        function isOptional(currentPos) {
          return UtilService.inArray(currentPos, optionalIndexes);
        }

        function isDivisor(currentPos) {
          return UtilService.inArray(currentPos, divisors);
        }

        function generateOptionalDivisors() {
          function sortNumber(a,b) {
              return a - b;
          }

          var sortedDivisors = divisors.sort(sortNumber);
          var sortedOptionals = optionalIndexes.sort(sortNumber);
          for (var i = 0; i<sortedDivisors.length; i++) {
            var divisor = sortedDivisors[i];
            for (var j = 1; j<=sortedOptionals.length; j++) {
              var optional = sortedOptionals[(j-1)];
              if (optional >= divisor) {
                break;
              }

              if (optionalDivisors[divisor]) {
                optionalDivisors[divisor] = optionalDivisors[divisor].concat(divisor-j);
              } else {
                optionalDivisors[divisor] = [(divisor-j)];
              }

              // get the original divisor for alternative divisor
              divisorElements[(divisor-j)] = divisorElements[divisor];
            }
          }
        }

        function removeDivisors(value) {
              value = value.toString();
          try {
            if (divisors.length > 0 && value) {
              var keys = Object.keys(divisorElements);
              var elments = [];

              for (var i = keys.length - 1; i >= 0; i--) {
                var divisor = divisorElements[keys[i]];
                if (divisor) {
                  elments.push(divisor);
                }
              }

              elments = UtilService.uniqueArray(elments);

              // remove if it is not pattern
              var regex = new RegExp(('[' + '\\' + elments.join('\\') + ']'), 'g');
              return value.replace(regex, '');
            } else {
              return value;
            }
          } catch (e) {
            throw e;
          }
        }

        function insertDivisors(array, combination) {
          function insert(array, output) {
            var out = output;
            for (var i=0; i<array.length; i++) {
              var divisor = array[i];
              if (divisor < out.length) {
                out.splice(divisor, 0, divisorElements[divisor]);
              }
            }
            return out;
          }

          var output = array;
          var divs = divisors.filter(function(it) {
            var optionalDivisorsKeys = Object.keys(optionalDivisors).map(function(it){
              return parseInt(it);
            });

            return !UtilService.inArray(it, combination) && !UtilService.inArray(it, optionalDivisorsKeys);
          });

          if (!angular.isArray(array) || !angular.isArray(combination)) {
            return output;
          }

          // insert not optional divisors
          output = insert(divs, output);

          // insert optional divisors
          output = insert(combination, output);

          return output;
        }

        function tryDivisorConfiguration(value) {
          var output = value.split('');
          var defaultDivisors = true;

          // has optional?
          if (optionalIndexes.length > 0) {
            var lazyArguments = [];
            var optionalDivisorsKeys = Object.keys(optionalDivisors);

            // get all optional divisors as array of arrays [[], [], []...]
            for (var i=0; i<optionalDivisorsKeys.length; i++) {
              var val = optionalDivisors[optionalDivisorsKeys[i]];
              lazyArguments.push(val);
            }

            // generate all possible configurations
            if (optionalDivisorsCombinations.length === 0) {
              UtilService.lazyProduct(lazyArguments, function() {
                // convert arguments to array
                optionalDivisorsCombinations.push(Array.prototype.slice.call(arguments));
              });
            }

            for (var i = optionalDivisorsCombinations.length - 1; i >= 0; i--) {
              var outputClone = angular.copy(output);
              outputClone = insertDivisors(outputClone, optionalDivisorsCombinations[i]);

              // try validation
              var viewValueWithDivisors = outputClone.join('');
              var regex = getRegex(maskWithoutOptionals.length - 1);

              if (regex.test(viewValueWithDivisors)) {
                defaultDivisors = false;
                output = outputClone;
                break;
              }
            }
          }

          if (defaultDivisors) {
            output = insertDivisors(output, divisors);
          }

          return output.join('');
        }

        // MASK

        function getOptions() {
          return options;
        }

        function getViewValue(value) {
          try {
            var outputWithoutDivisors = removeDivisors(value);
            var output = tryDivisorConfiguration(outputWithoutDivisors);

            return {
              withDivisors: function(capped) {
                if (capped) {
                  return output.substr(0, maskWithoutOptionalsLength);
                } else {
                  return output;
                }
              },
              withoutDivisors: function(capped) {
                if (capped) {
                  return outputWithoutDivisors.substr(0, maskWithoutOptionalsAndDivisorsLength);
                } else {
                  return outputWithoutDivisors;
                }
              }
            };
          } catch (e) {
            throw e;
          }
        }

        // SELECTOR

        function getWrongPositions(viewValueWithDivisors, onlyFirst) {
          var pos = [];

          if (!viewValueWithDivisors) {
            return 0;
          }

          for (var i=0; i<viewValueWithDivisors.length; i++){
            var pattern = getRegex(i);
            var value = viewValueWithDivisors.substr(0, (i+1));

            if(pattern && !pattern.test(value)){
              pos.push(i);

              if (onlyFirst) {
                break;
              }
            }
          }

          return pos;
        }

        function getFirstWrongPosition(viewValueWithDivisors) {
          return getWrongPositions(viewValueWithDivisors, true)[0];
        }

        function removeWrongPositions(viewValueWithDivisors) {
          var wrongPositions = getWrongPositions(viewValueWithDivisors, false);
          var newViewValue = viewValueWithDivisors;

          for(var i = 0; i < wrongPositions.length; i++){
            var wrongPosition = wrongPositions[i];
            var viewValueArray = viewValueWithDivisors.split('');
            viewValueArray.splice(wrongPosition, 1);
            newViewValue = viewValueArray.join('');
          }

          return getViewValue(newViewValue);
        }

        return {
          getViewValue: getViewValue,
          generateRegex: generateRegex,
          getRegex: getRegex,
          getOptions: getOptions,
          removeDivisors: removeDivisors,
          getFirstWrongPosition: getFirstWrongPosition,
          removeWrongPositions: removeWrongPositions
        }
      }

      return {
        create: create
      }
    }]);
})();
(function() {
  'use strict';
  angular.module('ngMask')
    .factory('OptionalService', [function() {
      function getOptionalsIndexes(mask) {
        var indexes = [];

        try {
          var regexp = /\?/g;
          var match = [];

          while ((match = regexp.exec(mask)) != null) {
            // Save the optional char
            indexes.push((match.index - 1));
          }
        } catch (e) {
          throw e;
        }

        return {
          fromMask: function() {
            return indexes;
          },
          fromMaskWithoutOptionals: function() {
            return getOptionalsRelativeMaskWithoutOptionals(indexes);
          }
        };
      }

      function getOptionalsRelativeMaskWithoutOptionals(optionals) {
        var indexes = [];
        for (var i=0; i<optionals.length; i++) {
          indexes.push(optionals[i]-i);
        }
        return indexes;
      }

      function removeOptionals(mask) {
        var newMask;

        try {
          newMask = mask.replace(/\?/g, '');
        } catch (e) {
          throw e;
        }

        return newMask;
      }

      return {
        removeOptionals: removeOptionals,
        getOptionals: getOptionalsIndexes
      }
    }]);
})();(function() {
  'use strict';
  angular.module('ngMask')
    .factory('UtilService', [function() {

      // sets: an array of arrays
      // f: your callback function
      // context: [optional] the `this` to use for your callback
      // http://phrogz.net/lazy-cartesian-product
      function lazyProduct(sets, f, context){
        if (!context){
          context=this;
        }

        var p = [];
        var max = sets.length-1;
        var lens = [];

        for (var i=sets.length;i--;) {
          lens[i] = sets[i].length;
        }

        function dive(d){
          var a = sets[d];
          var len = lens[d];

          if (d === max) {
            for (var i=0;i<len;++i) {
              p[d] = a[i];
              f.apply(context, p);
            }
          } else {
            for (var i=0;i<len;++i) {
              p[d]=a[i];
              dive(d+1);
            }
          }

          p.pop();
        }

        dive(0);
      }

      function inArray(i, array) {
        var output;

        try {
          output = array.indexOf(i) > -1;
        } catch (e) {
          throw e;
        }

        return output;
      }

      function uniqueArray(array) {
        var u = {};
        var a = [];

        for (var i = 0, l = array.length; i < l; ++i) {
          if(u.hasOwnProperty(array[i])) {
            continue;
          }

          a.push(array[i]);
          u[array[i]] = 1;
        }

        return a;
      }

      return {
        lazyProduct: lazyProduct,
        inArray: inArray,
        uniqueArray: uniqueArray
      }
    }]);
})();
},{}],3:[function(require,module,exports){
module.exports={
  "url": "https://dev.eventosdobem.com/api/",
  "accept": "application/vnd.api.v1+json",
  "contenttype": "application/json",
  "token": "0IphXRqJZe9wkMYQJJBp2X0TsVjQyg"
}
},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = AppConfig;
function AppConfig($httpProvider, $injector, $urlRouterProvider) {
  $httpProvider.interceptors.push('HttpInterceptor');
  $urlRouterProvider.otherwise('/#');
}

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AppController = function AppController($location, $window) {
  // switch($location.path()) {
  //   case '/usuario/cadastro': {
  //     this.background = 'auth-login.jpg'
  //   }
  // }
  // this.brand = 'Eventos do Bem'
  // this.logout = () => {
  //   $window.localStorage.clear()
  //   $state.go('auth-login')
  // }
  // this.user = JSON.parse($window.localStorage.getItem('user'))
  // this.dropDownMenu = [
  //   {
  //     label: 'Perfil',
  //     url: 'user-me'
  //   },
  //   {
  //     label: 'Logout',
  //     url: 'auth-logout'
  //   }
  // ]
  // this.toggleDropdown = function($event) {
  //   $event.preventDefault();
  //   $event.stopPropagation();
  //   this.status.isopen = !this.status.isopen;
  // };

  _classCallCheck(this, AppController);
};

exports.default = AppController;


AppController.$inject = ['$location', '$window'];

},{}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function config(API, $q, $state, $window) {
  return {
    'request': function request(config) {
      config.headers = config.headers || {};
      config['headers']['Accept'] = API.accept;
      config['headers']['Content-Type'] = API.contenttype;
      if ($window.localStorage.getItem('token')) {
        config['headers']['Authorization'] = 'Bearer ' + $window.localStorage.getItem('token');
      }
      return config || $q.when(config);
    },
    'requestError': function requestError(rejection) {
      return $q.reject(rejection);
    },
    'response': function response(_response) {
      return $q.resolve(_response);
    },
    'responseError': function responseError(response) {
      // console.log(response)
      // // if (response.status === 401) $state.go('auth-login')
      return $q.reject(response);
    }
  };
}
exports.default = config;

},{}],7:[function(require,module,exports){
'use strict';

var _angularUiRouter = require('angular-ui-router');

var _angularUiRouter2 = _interopRequireDefault(_angularUiRouter);

var _angularUiBootstrap = require('angular-ui-bootstrap');

var _angularUiBootstrap2 = _interopRequireDefault(_angularUiBootstrap);

var _ngMask = require('ng-mask');

var _ngMask2 = _interopRequireDefault(_ngMask);

var _angularMessages = require('angular-messages');

var _angularMessages2 = _interopRequireDefault(_angularMessages);

var _api = require('./api.json');

var _api2 = _interopRequireDefault(_api);

var _config = require('./config.js');

var _config2 = _interopRequireDefault(_config);

var _interceptor = require('./interceptor.js');

var _interceptor2 = _interopRequireDefault(_interceptor);

var _run = require('./run.js');

var _run2 = _interopRequireDefault(_run);

var _controller = require('./controller.js');

var _controller2 = _interopRequireDefault(_controller);

var _module = require('./../common/module.js');

var _module2 = _interopRequireDefault(_module);

var _module3 = require('./../home/module.js');

var _module4 = _interopRequireDefault(_module3);

var _module5 = require('./../auth/module.js');

var _module6 = _interopRequireDefault(_module5);

var _module7 = require('./../user/module.js');

var _module8 = _interopRequireDefault(_module7);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

angular.module('app', ['ui.bootstrap', 'ngMask', _angularUiRouter2.default, 'ngMessages', 'common', 'home', 'auth', 'user']).config(_config2.default).constant('API', _api2.default).factory('HttpInterceptor', ['API', '$q', '$injector', '$window', _interceptor2.default]).controller('AppController', _controller2.default).run(_run2.default);

},{"./../auth/module.js":12,"./../common/module.js":15,"./../home/module.js":19,"./../user/module.js":25,"./api.json":3,"./config.js":4,"./controller.js":5,"./interceptor.js":6,"./run.js":8,"angular-messages":"angular-messages","angular-ui-bootstrap":"angular-ui-bootstrap","angular-ui-router":"angular-ui-router","ng-mask":2}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = run;
function run($rootScope, $state) {
  $rootScope.$on("$stateChangeSuccess", function (event, toState, toParams, fromState, fromParams) {
    switch (toState.name) {
      case 'user.register':
        $rootScope.background = 'auth-login.jpg';break;
      default:
        $rootScope.background = null;
    }
  });
}

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = AuthConfig;
function AuthConfig($stateProvider) {
  $stateProvider.state('auth', {
    url: '/autenticacao',
    templateUrl: './src/auth/view/auth.html'
  }).state('auth.login', {
    url: '/login',
    templateUrl: './src/auth/view/login.html',
    controller: 'AuthLogin',
    controllerAs: 'ctrl'
  }).state('auth.logout', {
    url: '/logout',
    templateUrl: './src/auth/view/logout.html',
    controller: 'AuthLogout',
    controllerAs: 'ctrl'
  });
}

},{}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AuthLogin = function () {
  function AuthLogin($rootScope, $stateParams, $state, $window, AuthService) {
    _classCallCheck(this, AuthLogin);

    this.service = AuthService;
    this.$window = $window;
    this.$rootScope = $rootScope;
    this.rememberme = true;
  }

  _createClass(AuthLogin, [{
    key: 'login',
    value: function login() {
      var _this = this;

      this.service.login(this.user).then(function (response) {
        return _this.loginSuccess(response);
      }, function (response) {
        return _this.loginError(response);
      });
    }
  }, {
    key: 'loginSuccess',
    value: function loginSuccess(response) {
      this.$window.localStorage.setItem('token', response.data.token);
      var _response$data = response.data;
      var email = _response$data.email;
      var name = _response$data.name;

      this.$window.localStorage.setItem('user', JSON.stringify({ name: name, email: email }));
      this.$rootScope.$broadcast('auth.login');
    }
  }, {
    key: 'loginError',
    value: function loginError(response) {
      this.error = response.data;
    }
  }]);

  return AuthLogin;
}();

exports.default = AuthLogin;


AuthLogin.$inject = ['$rootScope', '$stateParams', '$state', '$window', 'AuthService'];

},{}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AuthLogout = function AuthLogout($rootScope, $stateParams, $state, $window, AuthService) {
  _classCallCheck(this, AuthLogout);

  this.logout = function () {
    AuthService.logout().then(function (response) {
      $window.localStorage.clear();
      $rootScope.$broadcast('auth.logout');
    }, function (error) {
      console.error('error', error);
    });
  };
  this.logout();
};

exports.default = AuthLogout;


AuthLogout.$inject = ['$rootScope', '$stateParams', '$state', '$window', 'AuthService'];

},{}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _config = require('./config.js');

var _config2 = _interopRequireDefault(_config);

var _login = require('./controller/login.js');

var _login2 = _interopRequireDefault(_login);

var _logout = require('./controller/logout.js');

var _logout2 = _interopRequireDefault(_logout);

var _service = require('./service.js');

var _service2 = _interopRequireDefault(_service);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = angular.module('auth', []).config(_config2.default).controller('AuthLogin', _login2.default).controller('AuthLogout', _logout2.default).service('AuthService', _service2.default);

},{"./config.js":9,"./controller/login.js":10,"./controller/logout.js":11,"./service.js":13}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _common = require('./../common/service/common.js');

var _common2 = _interopRequireDefault(_common);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AuthService = function (_CommonService) {
  _inherits(AuthService, _CommonService);

  function AuthService(API, $http) {
    _classCallCheck(this, AuthService);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(AuthService).call(this, API, $http));
  }

  _createClass(AuthService, [{
    key: 'login',
    value: function login(data) {
      data = this.setDataToken(data);
      this.setRoute('auth/login');
      return this.$http.post(this.url + this.route, data);
    }
  }, {
    key: 'logout',
    value: function logout() {
      this.setRoute('auth/logout');
      return this.$http.get(this.url + this.route);
    }
  }, {
    key: 'confirmation',
    value: function confirmation(data) {
      this.setRoute('auth/confirmation');
      return this.$http.get(this.url + this.route);
    }
  }]);

  return AuthService;
}(_common2.default);

exports.default = AuthService;


AuthService.$inject = ['API', '$http'];

},{"./../common/service/common.js":16}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Header = function Header($scope, $state, $window) {
  var _this = this;

  _classCallCheck(this, Header);

  this.brand = 'Eventos do Bem';
  this.user = JSON.parse($window.localStorage.getItem('user'));
  $scope.$on('auth.login', function () {
    _this.user = JSON.parse($window.localStorage.getItem('user'));
    $state.go('user.me');
  });
  $scope.$on('auth.logout', function () {
    _this.user = null;
  });
  this.dropDownMenu = {
    logged: [{
      label: 'Perfil',
      url: 'user.me'
    }, {
      label: 'Logout',
      url: 'auth.logout'
    }],
    nologged: [{
      label: 'Entrar',
      url: 'auth.login'
    }, {
      label: 'Cadastrar',
      url: 'user.register'
    }]
  };
  this.toggleDropdown = function ($event) {
    $event.preventDefault();
    $event.stopPropagation();
    this.status.isopen = !this.status.isopen;
  };
};

exports.default = Header;


Header.$inject = ['$scope', '$state', '$window'];

},{}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _common = require('./service/common.js');

var _common2 = _interopRequireDefault(_common);

var _header = require('./controller/header.js');

var _header2 = _interopRequireDefault(_header);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = angular.module('common', []).service('CommonService', _common2.default).controller('Header', _header2.default);

},{"./controller/header.js":14,"./service/common.js":16}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CommonService = function () {
  function CommonService(API, $http) {
    _classCallCheck(this, CommonService);

    this.url = API.url;
    this.token = API.token;
    this.$http = $http;
  }

  _createClass(CommonService, [{
    key: 'setDataToken',
    value: function setDataToken(data) {
      data['token'] = this.token;
      return data;
    }
  }, {
    key: 'setRoute',
    value: function setRoute(route) {
      this.route = route;
    }
  }, {
    key: 'findAll',
    value: function findAll() {
      return this.$http.get(this.url + this.route);
    }
  }, {
    key: 'findById',
    value: function findById(id) {
      return this.$http.get(this.url + this.route + '/' + id);
    }
  }, {
    key: 'create',
    value: function create(data) {
      return this.$http.post(this.url + this.route, data);
    }
  }, {
    key: 'update',
    value: function update(data) {
      return this.$http.put(this.url + this.route + '/' + data._id, data);
    }
  }, {
    key: 'remove',
    value: function remove(id) {
      return this.$http.delete(this.url + this.route + '/' + id);
    }
  }]);

  return CommonService;
}();

exports.default = CommonService;

},{}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = HomeConfig;
function HomeConfig($stateProvider) {
  $stateProvider.state('home', {
    url: '/',
    templateUrl: './src/home/view/home.html',
    controller: 'Home',
    controllerAs: 'ctrl'
  });
}

},{}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Home = function Home($scope, $stateParams, $state) {
  _classCallCheck(this, Home);
};

exports.default = Home;


Home.$inject = ['$scope', '$stateParams', '$state'];

},{}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _config = require('./config.js');

var _config2 = _interopRequireDefault(_config);

var _home = require('./controller/home.js');

var _home2 = _interopRequireDefault(_home);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import Service      from './service.js'
// import Confirmation from './controller/confirmation.js'
// import Me           from './controller/me.js'
// import Change       from './controller/change.js'

exports.default = angular.module('home', []).config(_config2.default).controller('Home', _home2.default);
// .service('UserService', Service)

},{"./config.js":17,"./controller/home.js":18}],20:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = UserConfig;
function UserConfig($stateProvider) {
  $stateProvider.state('user', {
    url: '/usuario',
    templateUrl: './src/user/view/user.html'
  }).state('user.me', {
    url: '/eu',
    templateUrl: './src/user/view/me.html',
    controller: 'UserMe',
    controllerAs: 'ctrl'
  }).state('user.register', {
    url: '/cadastro',
    templateUrl: './src/user/view/register.html',
    controller: 'UserRegister',
    controllerAs: 'ctrl'
  }).state('user.confirmation', {
    url: '/confirmacao/:uuid/:confirmation_code',
    templateUrl: './src/user/view/confirmation.html',
    controller: 'UserConfirmation',
    controllerAs: 'ctrl'
  }).state('user.change', {
    url: '/eu/alterar',
    templateUrl: './src/user/view/change.html',
    controller: 'UserChange',
    controllerAs: 'ctrl'
  });
}

},{}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UserChange = function UserChange($scope, $stateParams, $state, UserService) {
  var _this = this;

  _classCallCheck(this, UserChange);

  this.me = function () {
    UserService.me().then(function (response) {
      _this.me = response.data;
    }, function (error) {
      console.error('error: ', error);
    });
  };
};

exports.default = UserChange;


UserChange.$inject = ['$scope', '$stateParams', '$state', 'UserService'];

},{}],22:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AuthConfirmation = function AuthConfirmation($rootScope, $stateParams, $state, $window, AuthService) {
  var _this = this;

  _classCallCheck(this, AuthConfirmation);

  this.user = {
    uuid: $stateParams.uuid,
    confirmation_code: $stateParams.confirmation_code
  };
  this.confirmation = function () {
    console.log(_this.user);
    // AuthService.confirmation(this.user)
    //   .then(
    //     response => {
    //       $window.localStorage.setItem('token', response.data.token)
    //       delete response.data.token
    //       $window.localStorage.setItem('user', JSON.stringify(response.data))
    //       $rootScope.$broadcast('auth.login')
    //     },
    //     error => {
    //       this.error = error.data
    //       console.log('error', error)
    //     }
    //   )
  };
};

exports.default = AuthConfirmation;


AuthConfirmation.$inject = ['$rootScope', '$stateParams', '$state', '$window', 'AuthService'];

},{}],23:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UserMe = function UserMe($scope, $stateParams, $state, UserService) {
  var _this = this;

  _classCallCheck(this, UserMe);

  this.me = function () {
    UserService.me().then(function (response) {
      _this.me = response.data;
    }, function (error) {
      console.error('error: ', error);
    });
  };
};

exports.default = UserMe;


UserMe.$inject = ['$scope', '$stateParams', '$state', 'UserService'];

},{}],24:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UserRegister = function () {
  function UserRegister($scope, $stateParams, $state, UserService) {
    _classCallCheck(this, UserRegister);

    this.service = UserService;
    this.state = $state;
    this.user = {
      gender: 'Masculino'
    };
  }

  _createClass(UserRegister, [{
    key: 'register',
    value: function register() {
      var _this = this;

      var user = angular.copy(this.user);
      var birthdate = user.birthdate.split('/');
      user.birthdate = birthdate[2] + '-' + birthdate[1] + '-' + birthdate[0];
      this.service.register(user).then(function (response) {
        return _this.registerSuccess(response);
      }, function (response) {
        return _this.registerError(response);
      });
    }
  }, {
    key: 'registerSuccess',
    value: function registerSuccess(response) {
      console.log(response);
    }
  }, {
    key: 'registerError',
    value: function registerError(response) {
      this.error = response.data;
      console.error(response);
    }
  }]);

  return UserRegister;
}();

exports.default = UserRegister;


UserRegister.$inject = ['$scope', '$stateParams', '$state', 'UserService'];

},{}],25:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _config = require('./config.js');

var _config2 = _interopRequireDefault(_config);

var _service = require('./service.js');

var _service2 = _interopRequireDefault(_service);

var _register = require('./controller/register.js');

var _register2 = _interopRequireDefault(_register);

var _confirmation = require('./controller/confirmation.js');

var _confirmation2 = _interopRequireDefault(_confirmation);

var _me = require('./controller/me.js');

var _me2 = _interopRequireDefault(_me);

var _change = require('./controller/change.js');

var _change2 = _interopRequireDefault(_change);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = angular.module('user', []).config(_config2.default).controller('UserMe', _me2.default).controller('UserChange', _change2.default).controller('UserConfirmation', _confirmation2.default).controller('UserRegister', _register2.default).service('UserService', _service2.default);

},{"./config.js":20,"./controller/change.js":21,"./controller/confirmation.js":22,"./controller/me.js":23,"./controller/register.js":24,"./service.js":26}],26:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _common = require('./../common/service/common.js');

var _common2 = _interopRequireDefault(_common);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var UserService = function (_CommonService) {
  _inherits(UserService, _CommonService);

  function UserService(API, $http) {
    _classCallCheck(this, UserService);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(UserService).call(this, API, $http));
  }

  _createClass(UserService, [{
    key: 'register',
    value: function register(data) {
      data = this.setDataToken(data);
      this.setRoute('users');
      return this.$http.post(this.url + this.route, data);
    }
  }, {
    key: 'me',
    value: function me() {
      this.setRoute('users/me');
      return this.$http.get(this.url + this.route);
    }
  }]);

  return UserService;
}(_common2.default);

exports.default = UserService;


UserService.$inject = ['API', '$http'];

},{"./../common/service/common.js":16}]},{},[1]);
