'use strict';

import 'chromereload/devonly';
import CoreClient from './../common/core-client';

settingsController.$inject = ['$scope', '$timeout', 'browserTranslate', 'browserExtension', 'browserNotification', 'settings', 'apikeyInfo', 'CONFIG', 'EVENT'];

/* @ngInject */
function settingsController($scope, $timeout, browserTranslate, browserExtension, browserNotification, settings, apikeyInfo, CONFIG, EVENT){

    let vm = this; // use vm instead of $scope
    vm.title = 'settingsController';
    vm.isAllowedFileAccess = false;
    vm.extensionUrl = '';
    vm.__MSG = browserTranslate;
    vm.CONFIG = CONFIG;

    vm.apikeyInfo = apikeyInfo;
    vm.settings = settings;
    vm.coreSettings = {
        useCore: false,
        apikey: {
            value: '',
            valid: undefined,
            groupClass: {},
            iconClass: {},
        },
        url: {
            value: '',
            valid: undefined,
            groupClass: {},
            iconClass: {},
        },
        rule: {
            value: ''
        },
        scanRules: [],
    };
    
    vm.settingsChanged = settingsChanged;
    vm.openExtensionSettings = openExtensionSettings;
    vm.validateCoreSettings = validateCoreSettings;

    CoreClient.configure({
        pollingIncrementor: CONFIG.scanResults.incrementor,
        pollingMaxInterval: CONFIG.scanResults.maxInterval,
    });

    activate();

    ////////////////
    async function activate() {
        _gaq.push(['_trackPageview', '/extension/settings']);

        vm.extensionUrl = 'chrome://extensions/?id=' + chrome.runtime.id.toString();

        $scope.$emit(EVENT.TAB_CHANGED, 'settings');
        $scope.$on(EVENT.APIKEY_UPDATED, refreshSettings);

        await vm.apikeyInfo.init();
        await vm.settings.init();

        vm.coreSettings.useCore = vm.settings.useCore;
        vm.coreSettings.apikey.value = vm.settings.coreApikey || '';
        vm.coreSettings.url.value = vm.settings.coreUrl || '';
        vm.coreSettings.rule.value = vm.settings.coreRule || '';

        vm.isAllowedFileAccess = await browserExtension.isAllowedFileSchemeAccess();
        if (!vm.isAllowedFileAccess) {
            settingsChanged('scanDownloads');
        }

        if (vm.coreSettings.useCore) {
            vm.validateCoreSettings();
        }

        $timeout(() => {  
            initDropdowns(); 
            $scope.$apply(); 
        });
    }

    function initDropdowns() {
        vm.coreSettings.rule.value = vm.settings.coreRule || vm.coreSettings.scanRules[0];
    }

    async function settingsChanged(key) {
        if (key === 'coreSettings') {
            $scope.coreSettingsForm.$setPristine();
            vm.settings.coreApikey = vm.coreSettings.apikey.value;
            vm.settings.coreUrl = vm.coreSettings.url.value;
            if (await vm.validateCoreSettings()) {
                vm.settings.useCore = vm.coreSettings.useCore;
                vm.settings.coreRule = vm.coreSettings.rule.value;
                browserNotification.create(browserTranslate.getMessage('coreSettingsSavedNotification'), 'info');
            }
            else {
                vm.settings.useCore = false;
                browserNotification.create(browserTranslate.getMessage('coreSettingsInvalidNotification'), 'info');
            }
            await vm.settings.save();
            $timeout(() => { $scope.$apply(); });
            return;
        }

        if (key === 'useCore') {
            vm.coreSettings.useCore = !vm.coreSettings.useCore;
            if (!vm.coreSettings.useCore || await vm.validateCoreSettings()) {
                vm.settings.useCore = vm.coreSettings.useCore;
            }
        }
        else if (key === 'scanDownloads' && !vm.settings[key]) {
            vm.isAllowedFileAccess = await browserExtension.isAllowedFileSchemeAccess();
            vm.settings[key] = vm.isAllowedFileAccess;
        }
        else {
            vm.settings[key] = !vm.settings[key];
        }

        await vm.settings.save();
        $timeout(() => { $scope.$apply(); });

        _gaq.push(['_trackEvent', MCL.config.gaEventCategory.name, MCL.config.gaEventCategory.action.settingsChanged, key, (vm.settings[key] ? 'enabled' : 'disabled')]);
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

    /**
     * // settings.coreApikey;
     * // settings.coreUrl;
     * // settings.coreWorkflow;
     * 
     * vm.settings.coreApikey
     */
    async function validateCoreSettings() {
        if (!vm.coreSettings.apikey.value || !vm.coreSettings.url.value) {
            return;
        }

        CoreClient.configure({
            apikey: vm.coreSettings.apikey.value,
            endpoint: vm.coreSettings.url.value,
        });

        try {
            let result = await CoreClient.version();
            result = await CoreClient.rules('');
            vm.coreSettings.scanRules = result.map(r => r.name);

            setInputState(vm.coreSettings.apikey, 'success');
            setInputState(vm.coreSettings.url, 'success');

            $timeout(() => { $scope.$apply(); });
            return true;
        } catch (error) {
            if (error.statusCode === 403) {
                setInputState(vm.coreSettings.apikey, 'error');
                $timeout(() => { $scope.$apply(); });
                return false;
            }
            setInputState(vm.coreSettings.url, 'error');
            $timeout(() => { $scope.$apply(); });
            return false;
        }
    }
}

export default settingsController;

/**
 * 
 * @param {*} element 
 * @param {string} state input state: 'success' | 'error' | undefined
 */
function setInputState(element, state) {
    switch (state) {
        case 'success': {
            element.valid = true;
            element.groupClass = {'has-success': true};
            element.iconClass = {'icon-ok': true};
            break;
        }
        case 'error': {
            element.valid = false;
            element.groupClass = {'has-error': true};
            element.iconClass = {'icon-cancel': true};
            break;
        }
        default: {
            element.valid = undefined;
            element.groupClass = {};
            element.iconClass = {};
        }
    }
}

