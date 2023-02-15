import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { BackgroundProvider } from './Background';
import { Task } from '../services/background/background-task';
import browserStorage from '../services/common/browser/browser-storage';

const waitForComponentToPaint = async (wrapper) => {
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        wrapper.update();
    });
};

describe('Background', () => {
    const initSpy = jest.spyOn(Task, 'init');
    const getScanHistorySpy = jest.spyOn(Task, 'getScanHistory');
    const getApikeyInfoSpy = jest.spyOn(Task, 'getApikeyInfo');
    const getSettingsSpy = jest.spyOn(Task, 'getSettings');
    const addListenerSpy = jest.spyOn(browserStorage, 'addListener');

    const mockScanLoad = jest.fn();
    const mockApikeyLoad = jest.fn();
    const mockSettingsLoad = jest.fn();

    it('should render correct', (done) => {
        mockApikeyLoad.mockImplementation(() => ({ apikey: 'mock' }));

        getScanHistorySpy.mockImplementation(() => ({ load: mockScanLoad }));
        getApikeyInfoSpy.mockImplementation(() => ({ load: mockApikeyLoad }));
        getSettingsSpy.mockImplementation(() => ({ load: mockSettingsLoad }));


        const BackgroundWrapper = mount(<BackgroundProvider><div /></BackgroundProvider>);
        waitForComponentToPaint(BackgroundWrapper);

        expect(initSpy).toHaveBeenCalled();
        expect(addListenerSpy).toHaveBeenCalled();

        expect(getScanHistorySpy).toHaveBeenCalled();
        expect(getApikeyInfoSpy).toHaveBeenCalled();
        expect(getSettingsSpy).toHaveBeenCalled();


        setTimeout(() => {
            expect(mockScanLoad).toHaveBeenCalled();
            expect(mockApikeyLoad).toHaveBeenCalled();
            expect(mockSettingsLoad).toHaveBeenCalled();

            done();
        }, 0);
    });
});