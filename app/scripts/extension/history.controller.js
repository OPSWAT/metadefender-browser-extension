'use strict';

import 'chromereload/devonly';

import moment from 'moment';
import ScanFile from '../common/scan-file';
import { BROWSER_EVENT } from '../common/browser/browser-message-event';

historyController.$inject = ['$scope', 'browserTranslate', 'browserMessage', 'scanHistory', 'EVENT'];

/* @ngInject */
function historyController($scope, browserTranslate, browserMessage, scanHistory, EVENT) {

    let vm = this;
    vm.title = 'historyController';
    vm.__MSG = browserTranslate;

    vm.scanHistory = scanHistory;

    vm.clearScanHistory = clearScanHistory;
    vm.removeFile = removeFile;
    vm.momentFrom = momentFrom;
    vm.ucFirst = ucFirst;
    vm.getStatusIcon = getStatusIcon;
    vm.trackScanDetailsClicks = trackScanDetailsClicks;

    activate();

    ////////////////
    async function activate() {
        _gaq.push(['_trackPageview', '/extension/history']);

        $scope.$emit(EVENT.TAB_CHANGED, 'history');

        refreshScanHistory();

        browserMessage.addListener(messageListener);
    }

    async function refreshScanHistory() {
        await vm.scanHistory.load();
        $scope.$apply();
    }

    async function messageListener(request) {

        switch (request.event) {
            case BROWSER_EVENT.SANITIZED_FILE_READY:
                await vm.scanHistory.updateFileByDataId(request.data.dataId, {
                    sanitizedFileURL: request.data.sanitized.file_path
                });
                refreshScanHistory();
                break;
            case BROWSER_EVENT.SCAN_FILES_UPDATED:
            case BROWSER_EVENT.SCAN_COMPLETE:
                refreshScanHistory();
                break;
        }
    }

    function clearScanHistory() {
        if (confirm(chrome.i18n.getMessage('deleteHistoryConfirmation'))) {
            vm.scanHistory.clear();

            _gaq.push(['_trackEvent', MCL.config.gaEventCategory.name, MCL.config.gaEventCategory.action.buttonClickd, MCL.config.gaEventCategory.label.clearHistoryButton, MCL.config.gaEventCategory.value.clearHistoryButton]);
        }
    }

    function removeFile(file) {
        vm.scanHistory.removeFile(file);

        _gaq.push(['_trackEvent', MCL.config.gaEventCategory.name, MCL.config.gaEventCategory.action.buttonClickd, MCL.config.gaEventCategory.label.clearHistoryButton, MCL.config.gaEventCategory.value.deleteItemButton]);
    }

    function ucFirst(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function momentFrom (time) {
        return moment.unix(time).fromNow();
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

    function trackScanDetailsClicks(){
        _gaq.push(['_trackEvent', MCL.config.gaEventCategory.name, MCL.config.gaEventCategory.action.linkClicked, MCL.config.gaEventCategory.label.scanDetails, MCL.config.gaEventCategory.label.scanDetails]);
    }
}

export default historyController;
