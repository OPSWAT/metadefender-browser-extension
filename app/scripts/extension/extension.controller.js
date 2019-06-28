'use strict';

import 'chromereload/devonly';

import './../common/config';
import browserMessage from '../common/browser/browser-message';
import { BROWSER_EVENT } from '../common/browser/browser-message-event';

extensionController.$inject = ['$scope', '$window', '$sce', '$timeout', 'browserTranslate', 'apikeyInfo', 'EVENT'];

/* @ngInject */
function extensionController($scope, $window, $sce, $timeout, browserTranslate, apikeyInfo, EVENT) {

    let loginWin = null;

    let vm = this;
    vm.title = chrome.i18n.getMessage('appName');
    vm.__MSG = browserTranslate;
    vm.apikeyInfo = apikeyInfo;

    vm.goToTab = goToTab;
    vm.login = login;

    activate();

    ////////////////
    async function activate() {

        $scope.$on(EVENT.TAB_CHANGED, goToTab);
        $scope.$on(EVENT.UPDATE_APIKEY, refreshApiKey);

        await vm.apikeyInfo.init();
        refreshApiKey();

        browserMessage.addListener(messageListener);

        $window.onbeforeunload = () => {
            if (loginWin) {
                loginWin.close();
            }
        };
    }

    function goToTab(e, tab) {
        if (typeof tab !== 'undefined' && vm.activeTab !== tab || e !== vm.activeTab) {
            vm.activeTab = tab;
        }
    }

    function login() {
        _gaq.push(['_trackEvent', MCL.config.gaEventCategory.name, MCL.config.gaEventCategory.action.buttonClickd, MCL.config.gaEventCategory.label.loginButton, MCL.config.gaEventCategory.value.loginButton]);

        let url = `${MCL.config.mclDomain}/login?extension`;
        let windowName = 'Login';
        let windowFeatures = 'menubar=no,location=no,resizable=no,scrollbars=yes,status=yes,width=960,height=550';

        if (!loginWin || loginWin.closed) {
            loginWin = $window.open(url, windowName, windowFeatures);
        }
    }

    async function refreshApiKey() {
        await vm.apikeyInfo.load();
        $timeout(() => {
            $scope.$apply();
            $scope.$broadcast(EVENT.APIKEY_UPDATED);
        }, 0);
    }

    async function messageListener(message) {
        switch (message.event) {
            case BROWSER_EVENT.APIKEY_UPDATED:
                await refreshApiKey();
                break;
            case BROWSER_EVENT.CLOSE_LOGIN:
                if (loginWin) {
                    loginWin.close();
                }
                break;
        }
    }
}

export default extensionController;
