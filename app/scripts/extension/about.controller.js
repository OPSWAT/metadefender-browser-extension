'use strict';

import 'chromereload/devonly';

aboutController.$inject = ['$scope', '$timeout', 'browserTranslate', 'apikeyInfo', 'CONFIG', 'EVENT'];

/* @ngInject */
function aboutController($scope, $timeout, browserTranslate, apikeyInfo, CONFIG, EVENT){

    let vm = this; // use vm instead of $scope
    vm.title = 'aboutController';
    vm.__MSG = browserTranslate;
    vm.CONFIG = CONFIG;

    vm.apikeyInfo = apikeyInfo;

    activate();

    ////////////////
    async function activate() {
        _gaq.push(['_trackPageview', '/extension/about']);

        $scope.$emit(EVENT.TAB_CHANGED, 'about');
        $scope.$on(EVENT.APIKEY_UPDATED, reloadApiKey);

        await vm.apikeyInfo.init();
    }

    async function reloadApiKey() {
        await vm.apikeyInfo.load();

        $timeout(() => {
            $scope.$apply();
        }, 0);
    }
}

export default aboutController;
