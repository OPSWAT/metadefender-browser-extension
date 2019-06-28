
import { scanHistory } from './../persistent/scan-history';
import { apikeyInfo } from './../persistent/apikey-info';
import { settings } from './../persistent/settings';

(function () {
    'use strict';

    angular
        .module('mcl.ext.persistent', [])

        .factory('scanHistory', () => { return scanHistory; })
        .factory('apikeyInfo', () => { return apikeyInfo; })
        .factory('settings', () => { return settings; });

})();