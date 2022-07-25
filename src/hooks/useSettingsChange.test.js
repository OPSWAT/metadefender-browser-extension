import { shallow } from 'enzyme';
import PropTypes from 'prop-types';
import React from 'react';
import MCL from '../config/config';
import * as Background from '../providers/Background';
import BrowserNotification from '../services/common/browser/browser-notification';
import CoreClient from '../services/common/core-client';
import { settings } from '../services/common/persistent/settings';
import useSettingsChange from './useSettingsChange';


global.chrome = {
    i18n: { getMessage: (msg) => msg }
};
function HookWrapper(props) {
    const hook = props.hook ? props.hook() : undefined;
    return <div hook={hook} />;
}

HookWrapper.propTypes = {
    hook: PropTypes.any
};

describe('useSettingsChange', () => {
    const useBackgroundContextSpy = jest.spyOn(Background, 'useBackgroundContext');
    const configureSpy = jest.spyOn(CoreClient, 'configure');
    const versionSpy = jest.spyOn(CoreClient, 'version');
    const rulesSpy = jest.spyOn(CoreClient, 'rules');
    const createSpy = jest.spyOn(BrowserNotification, 'create');
    const saveSpy = jest.spyOn(settings, 'save');

    beforeEach(() => {
        useBackgroundContextSpy.mockImplementation(() => ({
            gaTrackEvent: () => null,
            MCL,
        }));
    });

    it('should handle correct setting change for coreSettings and validate', (done) => {
        rulesSpy.mockImplementation(() => ([]));

        const mockInitialCoreSettings = {
            useCore: false,
            apikey: {
                value: 'mock',
                valid: undefined,
                groupClass: {},
                iconClass: {}
            },
            url: {
                value: 'mock',
                valid: undefined,
                groupClass: {},
                iconClass: {}
            },
            rule: {
                value: ''
            },
            scanRules: []
        };
        const wrapper = shallow(<HookWrapper hook={() => useSettingsChange(mockInitialCoreSettings)} />);

        const { hook: { onSettingsChanged } } = wrapper.find('div').props();

        onSettingsChanged('coreSettings', { apikey: { value: 'mock' }, url: { value: 'mock' } });

        setTimeout(() => {
            expect(configureSpy).toHaveBeenCalledWith({ apikey: 'mock', endpoint: 'mock' });
            expect(versionSpy).toHaveBeenCalled();
            expect(rulesSpy).toHaveBeenCalled();

            expect(saveSpy).toHaveBeenCalled();
            expect(createSpy).toHaveBeenCalledWith('coreSettingsSavedNotification', 'info');

            done();
        }, 0);
    });
});