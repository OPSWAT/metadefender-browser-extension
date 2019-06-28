'use strict';

import 'chromereload/devonly';

import 'angular';
import 'angular-sanitize';

import './common/config';
import './common/ga-tracking';
import './common/angular/browser.module';
import './common/angular/persistent.module';

import decodeFileName from './common/angular/decodeuri.filter';
import popupController from './popup/popup.controller';

const MODULE_NAME = 'mcl.ext.popup';

angular
    .module(MODULE_NAME, [
        'ngSanitize', 
        'mcl.ext.persistent', 
        'mcl.ext.browser'
    ])

    .filter('decodeFileNameFilter', () => decodeFileName)
    
    .controller('popupController', popupController);

angular.bootstrap(document, [MODULE_NAME]);

export default MODULE_NAME;