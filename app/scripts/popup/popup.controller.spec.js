import chrome from 'sinon-chrome';
import app from '../popup';

describe('app/scripts/popup/popup.controller.js', () => {

    beforeAll(() => {
        global.chrome = chrome;
    });

    beforeEach(angular.mock.module(app));

    let $controller;
    let $rootScope;
  
    beforeEach(inject(function(_$controller_, _$rootScope_){
        $controller = _$controller_;
        $rootScope = _$rootScope_;
    }));

    describe('gaTrack()', function() {

        it('tracks history-click events', function() {

            let controller = $controller('popupController', {
                $scope: $rootScope.$new()
            });
            spyOn(_gaq, 'push');

            controller.gaTrack('history-click');
            expect(_gaq.push.calls.count()).toEqual(1);
        });

        it('tracks visit-mcl events', function() {

            let controller = $controller('popupController', {
                $scope: $rootScope.$new()
            });
            spyOn(_gaq, 'push');
        
            controller.gaTrack('visit-mcl');
            expect(_gaq.push.calls.count()).toEqual(1);
        });

        it('tracks view-details events', function() {

            let controller = $controller('popupController', {
                $scope: $rootScope.$new()
            });
            spyOn(_gaq, 'push');
        
            controller.gaTrack('view-details');
            expect(_gaq.push.calls.count()).toEqual(1);
        });

    });
});