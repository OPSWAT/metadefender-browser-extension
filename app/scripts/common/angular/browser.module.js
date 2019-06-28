
import browserMessage from './../browser/browser-message';
import browserNotification from './../browser/browser-notification';
import browserStorage from './../browser/browser-storage';
import browserTranslate from './../browser/browser-translate';
import browserExtension from './../browser/browser-extension';

(function () {
    'use strict';

    angular
        .module('mcl.ext.browser', [])

        .factory('browserMessage', function() { return browserMessage; })
        .factory('browserNotification', function() { return browserNotification; })
        .factory('browserStorage', function() { return browserStorage; })
        .factory('browserTranslate', function() { return browserTranslate; })
        .factory('browserExtension', function() { return browserExtension; });

})();