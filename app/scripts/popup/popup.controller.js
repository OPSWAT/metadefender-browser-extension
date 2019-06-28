'use strict';

import 'chromereload/devonly';

import ScanFile from '../common/scan-file';
import { BROWSER_EVENT } from '../common/browser/browser-message-event';

popupController.$inject = ['$scope', 'browserTranslate', 'browserMessage', 'scanHistory', '$window'];

/* @ngInject */
function popupController($scope, browserTranslate, browserMessage, scanHistory, $window) {

    let vm = this;
    vm.title = chrome.i18n.getMessage('appName');
    vm.__MSG = browserTranslate;
    vm.ScanFile = ScanFile;

    vm.latestScans = [];

    vm.gaTrack = gaTrack;
    vm.getStatusIcon = getStatusIcon;
    vm.goToHistory = goToHistory;
    vm.goToSettings = goToSettings;

    activate();

    ////////////////
    async function activate() {
        _gaq.push(['_trackPageview', '/extension/popup']);

        refreshScanHistory();

        browserMessage.addListener(messageListener);
    }

    async function getLastScans() {
        await scanHistory.load();
        return scanHistory.files.slice(0, 3);
    }

    async function refreshScanHistory() {
        vm.latestScans = await getLastScans();
        $scope.$apply();
    }

    async function messageListener(request) {

        switch (request.event) {
            case BROWSER_EVENT.SCAN_FILES_UPDATED:
            case BROWSER_EVENT.SCAN_COMPLETE:
                refreshScanHistory();
                break;
        }
    }

    function gaTrack(event){
        switch (event) {
            case 'history-click':
                _gaq.push(['_trackEvent', MCL.config.gaEventCategory.name, MCL.config.gaEventCategory.action.linkClicked, MCL.config.gaEventCategory.label.scanHistory, MCL.config.gaEventCategory.label.scanHistory]);
                break;
            case 'visit-mcl':
                _gaq.push(['_trackEvent', MCL.config.gaEventCategory.name, MCL.config.gaEventCategory.action.linkClicked, MCL.config.gaEventCategory.label.metadefender, MCL.config.gaEventCategory.label.metadefender]);
                break;
            case 'view-details':
                _gaq.push(['_trackEvent', MCL.config.gaEventCategory.name, MCL.config.gaEventCategory.action.popupClicked, MCL.config.gaEventCategory.label.scanDetails, MCL.config.gaEventCategory.label.scanDetails]);
                break;
        }
    }

    function getStatusIcon(fileStatus){
        if (fileStatus == ScanFile.STATUS.CLEAN) {
            return 'icon-ok';
        }

        if (fileStatus == ScanFile.STATUS.INFECTED) {
            return 'icon-cancel';
        }

        if (fileStatus == ScanFile.STATUS.SCANNING) {
            return 'icon-spin animate-spin';
        }

        return 'icon-help';
    }

    function goToHistory() {
        gaTrack('history-click');
        browserMessage.send({event: BROWSER_EVENT.GO_TO_HISTORY});
        $window.close();
    }

    function goToSettings() {
        gaTrack('history-click');
        browserMessage.send({event: BROWSER_EVENT.GO_TO_SETTINGS});
        $window.close();
    }
}

export default popupController;
