(function (MODULE) {
    'use strict';

    MODULE.config(['debugServiceProvider', 'RestangularProvider', function (debugServiceProvider, RestangularProvider) {
        debugServiceProvider
            .registerPlugin('symfony2-restangular-requests', [function () {
                return {
                    init: function (scope) {
                        scope.requests = [];

                        RestangularProvider.addResponseInterceptor(function (data, operation, what, url, response) {
                            scope.requests.push({
                                url: url,
                                params: response.config.params,
                                debug: response.headers('X-Debug-Token-Link')
                            });
                            return data;
                        });

                        return {
                            appendData: function (data) {
                                scope.requests.push(data);
                            },
                            clear: function () {
                                scope.requests.length = 0;
                            }
                        };
                    },
                    template: [
                        '<a href="">',
                        'Requests <i class="fa fa-share"></i>',
                        '<span class="debugbar__badge" ng-bind="requests.length"></span>',
                        '</a>'
                    ].join(''),
                    tabTemplate: [
                        '<table class="table table-striped">',
                            '<thead><tr><th>Url</th><th>Params</th><th>Profile</th></tr></thead>',
                            '<tbody>',
                            '<tr ng-repeat="request in requests track by $index">',
                                '<td>{{ request.url }}</td><td>{{ request.params }}</td><td><a target="_blank" ng-href="{{ request.debug }}">see <i class="fa fa-share"></i></a></a></td>',
                            '</tr>',
                            '</tbody> ',
                        '</table>'
                    ].join('')
                };
            }]);
    }]);

}(angular.module('lucode.debugbar')));
