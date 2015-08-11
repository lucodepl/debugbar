/* 
   lucode-debugbar v0.0.1
   git+https://github.com/lucodepl/debugbar.git
   MIT License - Lukasz Wroblewski
 */

/*
 lucode-debugbar v0.0.1
 git+https://github.com/lucodepl/debugbar.git
 MIT License - Lukasz Wroblewski
 */

(function () {
    'use strict';

    var MODULE = angular.module('lucode.debugbar', ['LocalStorageModule']),
        plugins = {},
        forEach = angular.forEach,
        map = function (collection, cb, thisArg) {
            var mapValue = {};
            forEach(collection, function (value, key) {
                mapValue[key] = cb.call(thisArg, value, key);
            });
            return mapValue;
        },
        initPlugin = function (plugin, scope) {
            plugin.setData = plugin.setData || angular.noop;
            plugin.appendData = plugin.appendData || angular.noop;
            plugin.init = plugin.init || angular.noop;
            plugin.template = plugin.template || '';
            plugin.icon = plugin.icon || '';
            plugin.tabTemplate = plugin.tabTemplate || '';
            plugin.isTab = !!plugin.tabTemplate;
            plugin.position = plugin.position || '';
            return plugin.init(scope);
        };

    MODULE.provider('debugService', function () {
        var config = {
            enabled: true
        };

        this.setEnabled = function (enabled) {
            config.enabled = enabled;
            return this;
        };

        this.registerPlugin = function (name, pluginFactory) {
            plugins[name] = pluginFactory;
            return this;
        };

        this.$get = function () {
            return {
                isEnabled: function () {
                    return config.enabled;
                },
                getPlugin: function (name) {
                    return plugins[name] && plugins[name].publicApi;
                }
            };
        };
    });

    MODULE
        .directive('debugPlugins', function ($compile, $injector) {
            return {
                restrict: 'E',
                scope: {
                    plugins: '='
                },
                replace: true,
                require: ['^debug', 'debugPlugins'],
                template: '<div><ul class="debugbar__nav"></ul><div class="debugbar__tabs"></div></div>',
                controller: function () {
                    var debugCtrl;

                    this.init = function (ctrl) {
                        debugCtrl = ctrl;
                    };

                    this.toggleTab = function (plugin) {
                        var active = !plugin.active;
                        forEach(this.plugins, function (plugin) {
                            if (plugin.isTab) {
                                plugin.active = false;
                            }
                        });
                        if (plugin.isTab) {
                            plugin.active = active;
                            debugCtrl.tabVisible = active;
                        }
                    };
                },
                controllerAs: 'debugPlugins',
                link: function (scope, element, attrs, ctrls) {
                    var debug = ctrls[0],
                        debugPlugins = ctrls[1],
                        $tabs = element.find('.debugbar__tabs'),
                        $header = element.find('ul');

                    debugPlugins.init(debug);

                    debugPlugins.plugins = map(scope.plugins, function (pluginFactory) {
                        var plugin = $injector.invoke(pluginFactory),
                            pluginScope = scope.$new(),
                            $pluginNav,
                            $pluginTab;

                        pluginScope.plugin = plugin;
                        pluginFactory.publicApi = initPlugin(plugin, pluginScope);

                        $header.append($pluginNav = angular.element([
                            '<li class="', 'right' === plugin.position ? 'debugbar--right' : '',
                            '" ng-class="{ active: plugin.active }"', plugin.isTab ? ' ng-click="debugPlugins.toggleTab(plugin)"' : '', '>',
                            '<i ng-if="plugin.icon" class="', plugin.icon, '"></i> ', plugin.template, ' </li>'
                        ].join('')));

                        $tabs.append($pluginTab = angular.element([
                            '<div ng-if="plugin.active">', plugin.tabTemplate, '</div>'
                        ].join('')));
                        $compile($pluginTab)(pluginScope);
                        $compile($pluginNav)(pluginScope);

                        return plugin;
                    });
                }
            };
        });

    /**
     * @ngdoc directive
     */
    MODULE.directive('debug', ['debugService', 'localStorageService', function (debugService, localStorageService) {
        var LS_DEBUG_KEY = 'debug_show';
        return {
            restrict: 'E',
            scope: {},
            replace: true,
            controller: function () {
                this.show = 'true' === localStorageService.get(LS_DEBUG_KEY);
                this.plugins = plugins;
                this.tabVisible = false;
                this.toggle = function () {
                    this.show = !this.show;
                    if (!this.show) {
                        this.tabVisible = false;
                    }
                    localStorageService.set(LS_DEBUG_KEY, this.show);
                };
            },
            controllerAs: 'debugCtrl',
            template: [
                '<div class="debugbar" ng-class="{ show: debugCtrl.show, \'show-tab\': debugCtrl.tabVisible }">',
                '<button class="btn btn-primary btn-sm debugbar__btn" ng-click="debugCtrl.toggle()"><i class="fa fa-cog"></i></button>',
                '<debug-plugins plugins="debugCtrl.plugins"></debug-plugins>',
                '</div>'
            ].join(''),
            compile: function ($element) {
                return function () {
                    if (!debugService.isEnabled()) {
                        $element.remove();
                    }
                };
            }
        };
    }]);

    MODULE.config(['debugServiceProvider', function (debugServiceProvider) {
        debugServiceProvider
            .registerPlugin('watches', ['$timeout', '$document', function ($timeout, $document) {
                var countWatches = function (element) {
                    var watchers = 0;
                    if (element.data().hasOwnProperty('$scope')) {
                        forEach(element.data().$scope.$$watchers, function () {
                            watchers += 1;
                        });
                    }

                    forEach(element.children(), function (childElement) {
                        watchers += countWatches(angular.element(childElement));
                    });
                    return watchers;
                };
                return {
                    init: function (scope) {
                        var timer;
                        scope.running = false;
                        scope.watches = 0;
                        scope.runStop = function () {
                            scope.running = !scope.running;
                            if (scope.running) {
                                timer = $timeout(function run() {
                                    scope.watches = countWatches(angular.element($document[0].getElementsByTagName('html')));
                                    timer = $timeout(run, 1000);
                                }, 1000);
                            } else {
                                $timeout.cancel(timer);
                            }
                        };
                    },
                    position: 'right',
                    template: [
                        '<a href="" ng-click="runStop()">',
                        '<i class="fa fa-eye"></i> ',
                        '<i class="fa" ng-class="{\'fa-pause\': running, \'fa-play\': !running }"></i>',
                        '{{ watches }}',
                        '</a>'
                    ].join('')
                };
            }])

            .registerPlugin('listeners', ['$timeout', '$document', function ($timeout, $document) {
                var countListeners = function (element) {
                    var listeners = 0;
                    if (element.data().hasOwnProperty('$scope')) {
                        forEach(element.data().$scope.$$listeners, function () {
                            listeners += 1;
                        });
                    }

                    forEach(element.children(), function (childElement) {
                        listeners += countListeners(angular.element(childElement));
                    });
                    return listeners;
                };
                return {
                    init: function (scope) {
                        var timer;
                        scope.running = false;
                        scope.listeners = 0;
                        scope.runStop = function () {
                            scope.running = !scope.running;
                            if (scope.running) {
                                timer = $timeout(function run() {
                                    scope.listeners = countListeners(angular.element($document[0].getElementsByTagName('html')));
                                    timer = $timeout(run, 1000);
                                }, 1000);
                            } else {
                                $timeout.cancel(timer);
                            }
                        };
                    },
                    position: 'right',
                    template: [
                        '<a href="" ng-click="runStop()">',
                        '<i class="fa fa-headphones"></i> ',
                        '<i class="fa" ng-class="{\'fa-pause\': running, \'fa-play\': !running }"></i> ',
                        '{{ listeners }}',
                        '</a>'
                    ].join('')
                };
            }]);
    }]);
}());
