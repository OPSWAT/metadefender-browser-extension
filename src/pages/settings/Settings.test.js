import { mount } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import Checkbox from '../../components/common/checkbox/Checkbox';
import MCL from '../../config/config';
import * as Background from '../../providers/UserProvider';
import browserExtension from '../../services/common/browser/browser-extension';
import { apikeyInfo } from '../../services/common/persistent/apikey-info';
import { settings } from '../../services/common/persistent/settings';
import Settings from './Settings';

const waitForComponentToPaint = async (wrapper) => {
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        wrapper.update();
    });
};

describe('Settings', () => {
    const useBackgroundContextSpy = jest.spyOn(Background, 'useBackgroundContext');
    const isAllowedFileSchemeAccessSpy = jest.spyOn(browserExtension, 'isAllowedFileSchemeAccess');

    const initSpy = jest.spyOn(settings, 'init');
    const saveSpy = jest.spyOn(settings, 'save');
    const loadSpy = jest.spyOn(settings, 'load');

    const apikeyInfoInitSave = jest.spyOn(apikeyInfo, 'init');

    const mockDefaultSettings = {
        scanDownloads: false,
        shareResults: true,
        showNotifications: true,
        saveCleanFiles: false,
        safeUrl: false,
        useCore: false
    };

    it('should render with correct props', (done) => {
        loadSpy.mockImplementation(() => ({ settings: mockDefaultSettings }));

        useBackgroundContextSpy.mockImplementation(() => ({
            gaTrackEvent: () => null,
            MCL
        }));

        const SettingsWarpper = mount(<Settings />);

        waitForComponentToPaint(SettingsWarpper);

        setTimeout(() => {
            expect(apikeyInfoInitSave).toHaveBeenCalled();
            expect(initSpy).toHaveBeenCalled();
            expect(isAllowedFileSchemeAccessSpy).toHaveBeenCalled();
            expect(saveSpy).toHaveBeenCalled();
            expect(loadSpy).toHaveBeenCalled();

            // check checkboxes state
            expect(SettingsWarpper.find(Checkbox)).toHaveLength(6);

            expect(SettingsWarpper.find(Checkbox).at(0).props().isDisabled).toEqual(true);
            expect(SettingsWarpper.find(Checkbox).at(0).props().isChecked).toEqual(false);

            expect(SettingsWarpper.find(Checkbox).at(1).props().isDisabled).toEqual(true);
            expect(SettingsWarpper.find(Checkbox).at(1).props().isChecked).toEqual(true);

            expect(SettingsWarpper.find(Checkbox).at(2).props().isDisabled).toEqual(false);
            expect(SettingsWarpper.find(Checkbox).at(2).props().isChecked).toEqual(true);

            expect(SettingsWarpper.find(Checkbox).at(3).props().isDisabled).toEqual(false);
            expect(SettingsWarpper.find(Checkbox).at(3).props().isChecked).toEqual(false);

            expect(SettingsWarpper.find(Checkbox).at(4).props().isDisabled).toEqual(false);
            expect(SettingsWarpper.find(Checkbox).at(4).props().isChecked).toEqual(false);

            expect(SettingsWarpper.find(Checkbox).at(5).props().isDisabled).toEqual(false);
            expect(SettingsWarpper.find(Checkbox).at(5).props().isChecked).toEqual(false);

            done();
        }, 0);
    });
});

