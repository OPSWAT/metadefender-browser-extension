'use strict';

import 'chromereload/devonly';

settingsController.$inject = ['$scope', '$timeout', 'browserTranslate', 'browserExtension', 'settings', 'apikeyInfo', 'CONFIG', 'EVENT'];

/* @ngInject */
function settingsController($scope, $timeout, browserTranslate, browserExtension, settings, apikeyInfo, CONFIG, EVENT){

    let vm = this; // use vm instead of $scope
    vm.title = 'settingsController';
    vm.isAllowedFileAccess = false;
    vm.extensionUrl = '';
    vm.__MSG = browserTranslate;
    vm.CONFIG = CONFIG;

    vm.apikeyInfo = apikeyInfo;
    vm.settings = settings;

    vm.settingsChanged = settingsChanged;
    vm.openExtensionSettings = openExtensionSettings;

    activate();

    ////////////////
    async function activate() {
        _gaq.push(['_trackPageview', '/extension/settings']);

        vm.extensionUrl = 'chrome://extensions/?id=' + chrome.runtime.id.toString();

        $scope.$emit(EVENT.TAB_CHANGED, 'settings');
        $scope.$on(EVENT.APIKEY_UPDATED, refreshSettings);

        await vm.apikeyInfo.init();
        await vm.settings.init();

        vm.isAllowedFileAccess = await browserExtension.isAllowedFileSchemeAccess();
        if (!vm.isAllowedFileAccess) {
            settingsChanged('scanDownloads');
        }

        $scope.$apply();
    }

    async function settingsChanged(property) {
        if (property === 'scanDownloads' && !vm.settings[property]) {
            vm.isAllowedFileAccess = await browserExtension.isAllowedFileSchemeAccess();
            vm.settings[property] = vm.isAllowedFileAccess;
        }
        else {
            vm.settings[property] = !vm.settings[property];
        }

        vm.settings.save();

        _gaq.push(['_trackEvent', MCL.config.gaEventCategory.name, MCL.config.gaEventCategory.action.settingsChanged, property, (vm.settings[property] ? 'enabled' : 'disabled')]);
        $timeout(() => { $scope.$apply(); });
    }

    function refreshSettings() {
        $timeout(async () => {
            await vm.settings.load();
            $scope.$apply();
        }, 0);
    }

    function openExtensionSettings() {
        chrome.tabs.query({url: vm.extensionUrl}, (tabs) => {
            if (tabs.length === 0) {
                chrome.tabs.update({ url: vm.extensionUrl });
            }
            else {
                chrome.tabs.update(tabs[0].id, { active: true });
            }
        });
    }
}

export default settingsController;
