import React from 'react';
import { mount, shallow } from 'enzyme';
import MCL from '../../config/config';
import * as Background from '../../providers/Background';
import * as navigation from '../../services/background/navigation';
import Popup from './Popup';
import browserStorage from '../../services/common/browser/browser-storage';
import { scanHistory } from '../../services/common/persistent/scan-history';
import { act } from 'react-dom/test-utils';

const waitForComponentToPaint = async (wrapper) => {
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        wrapper.update();
    });
};

window.close = jest.fn();

describe('Popup', () => {
    const useBackgroundContextSpy = jest.spyOn(Background, 'useBackgroundContext');
    const addListenerSpy = jest.spyOn(browserStorage, 'addListener');
    const goToTabSpy = jest.spyOn(navigation, 'goToTab');
    const loadSpy = jest.spyOn(scanHistory, 'load');
    const mockGaTrackEvent = jest.fn();

    const mockFiles = [
        { dataId: 0, scanResults: 1, fileName: 'mock_1', status: 1 },
        { dataId: 1, scanResults: 1, fileName: 'mock_2', status: 2 },
        { dataId: 2, scanResults: 1, fileName: 'mock_3', status: 0 },
        { dataId: 2, scanResults: 1, fileName: 'mock_3', status: 3 },
    ];

    it('should render with empty scan list', async () => {
        useBackgroundContextSpy.mockImplementation(() => ({ MCL, gaTrackEvent: mockGaTrackEvent }));
        loadSpy.mockImplementation(() => ({ scanHistory: { files: [] } }));

        const popupWrapper = mount(<Popup />);
        await waitForComponentToPaint(popupWrapper);

        expect(mockGaTrackEvent).toHaveBeenCalled();
        expect(addListenerSpy).toHaveBeenCalled();

        expect(popupWrapper.find('span[dangerouslySetInnerHTML]')).toBeDefined();
    });

    it('should render with 3 elements in list', async () => {
        useBackgroundContextSpy.mockImplementation(() => ({ MCL, gaTrackEvent: mockGaTrackEvent }));
        loadSpy.mockImplementation(() => ({ scanHistory: { files: mockFiles } }));

        const popupWrapper = mount(<Popup />);
        await waitForComponentToPaint(popupWrapper);

        expect(popupWrapper.find('.list-group-item')).toHaveLength(3);
        expect(popupWrapper.find('.icon-ok')).toHaveLength(1);
        expect(popupWrapper.find('.icon-cancel')).toHaveLength(1);
        expect(popupWrapper.find('.icon-spin.animate-spin')).toHaveLength(1);

    });

    it('should open other pages on ling click', () => {
        useBackgroundContextSpy.mockImplementation(() => ({ MCL, gaTrackEvent: mockGaTrackEvent }));
        const popupWrapper = shallow(<Popup />);

        popupWrapper.find('a').at(0).simulate('click');
        expect(goToTabSpy).toHaveBeenCalledWith('settings');

        popupWrapper.find('a').at(1).simulate('click');
        expect(goToTabSpy).toHaveBeenCalledWith('history');
    });
});