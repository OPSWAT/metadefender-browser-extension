import 'chromereload/devonly';

import './common/config';
import './common/ga-tracking';

import 'angular';
import 'angular-sanitize';
import 'angular-route';

import './common/angular/browser.module';
import './common/angular/persistent.module';

import decodeFileName from './common/angular/decodeuri.filter';

import mclCheckbox from './common/angular/checkbox.directive';

import extensionController from './extension/extension.controller';
import historyController from './extension/history.controller';
import settingsController from './extension/settings.controller';
import aboutController from './extension/about.controller';

(function () {
    'use strict';

    angular
        .module('mcl.ext.extension', ['ngSanitize', 'ngRoute', 'mcl.ext.persistent', 'mcl.ext.browser'])

        .constant('EVENT', {
            TAB_CHANGED: 'tabChanged',
            UPDATE_APIKEY: 'updateApiKey',
            APIKEY_UPDATED: 'apikeyUpdated'
        })
        .constant('CONFIG', MCL.config)

        .directive('mclCheckbox', mclCheckbox)

        .controller('extensionController', extensionController)
        .controller('historyController', historyController)
        .controller('settingsController', settingsController)
        .controller('aboutController', aboutController)

        .filter('decodeFileNameFilter', () => decodeFileName)

        .config(['$routeProvider', '$locationProvider', '$compileProvider',
            ($routeProvider, $locationProvider, $compileProvider) => {
                $locationProvider.hashPrefix('!');
                $routeProvider
                    .when('/history', {
                        templateUrl: 'extension/history.html',
                        controller: 'historyController',
                        controllerAs: 'vm'
                    })
                    .when('/settings', {
                        templateUrl: 'extension/settings.html',
                        controller: 'settingsController',
                        controllerAs: 'vm'
                    })
                    .when('/about', {
                        templateUrl: 'extension/about.html',
                        controller: 'aboutController',
                        controllerAs: 'vm'
                    })
                    .otherwise('/about');

                $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome):/);
            }]);
            
    angular.bootstrap(document, ['mcl.ext.extension']);
})();
