'use strict';

import 'chromereload/devonly';

mclCheckbox.$inject = [];

/* @ngInject */
function mclCheckbox () {
    return {
        restrict: 'E',
        scope: {
            value: '=',
            label: '@',
            change: '&',
            enabled: '='
        },
        templateUrl: '/scripts/common/angular/checkbox.directive.html',
        link: function(scope) {
            scope.onClick = function(){
                if (!scope.disabled) {
                    scope.change();
                }
            };

            scope.$watch('enabled', (newVal) => {
                scope.disabled = (typeof newVal == 'undefined') ? false : !newVal;
            });
        }
    };
}

export default mclCheckbox;
