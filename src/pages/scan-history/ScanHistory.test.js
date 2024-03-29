import React from 'react';
import { mount } from 'enzyme';
import ScanHistoryTable from '../../components/scan-history-table/ScanHistoryTable';
import MCL from '../../config/config';
import * as Background from '../../providers/Background';
import ScanHistory from './ScanHistory';
import { scanHistory } from '../../services/common/persistent/scan-history';
import { act } from 'react-dom/test-utils';

const waitForComponentToPaint = async (wrapper) => {
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        wrapper.update();
    });
};

describe('ScanHistory', () => {
    const mockGaTrackEvent = jest.fn();

    const useBackgroundContextSpy = jest.spyOn(Background, 'useBackgroundContext');
    const loadSpy = jest.spyOn(scanHistory, 'load');

    const mockFiles = [
        { fileName: 'file_0' },
        { fileName: 'file_1' },
        { fileName: 'mock_2' },
        { fileName: 'mock_3' },
    ];

    it('should render correct', (done) => {
        useBackgroundContextSpy.mockImplementation(() => ({
            gaTrackEvent: mockGaTrackEvent,
            MCL,
            apikeyData: {}
        }));
        loadSpy.mockImplementation(() => ({ scanHistory: { files: mockFiles } }));

        const ScanHistoryWrapper = mount(<ScanHistory />);
        waitForComponentToPaint(ScanHistoryWrapper);

        setTimeout(() => {
            expect(ScanHistoryWrapper.find('.history--search__input')).toHaveLength(2);
            expect(ScanHistoryWrapper.find('.history--scan__info')).toHaveLength(2);
            expect(ScanHistoryWrapper.find(ScanHistoryTable)).toHaveLength(1);

            expect(mockGaTrackEvent).toHaveBeenCalledWith(['_trackPageview', '/extension/history']);

            done();
        }, 0);
    });
});