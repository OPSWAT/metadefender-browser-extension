import React from 'react';
import { shallow } from 'enzyme';
import ScanHistory from './ScanHistory';


jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: jest.fn(),
}));

describe('<ScanHistory />', () => {
    const mockGaContextValue = {
        gaTrackEvent: jest.fn(),
    };

    const mockConfigContextValue = {
        mclDomain: 'mockDomain',
    };

    const mockScanHistoryContextValue = {
        files: [{ id: '1', status: 1, fileName: 'testFile.txt' }],
        clearnScanHistory: jest.fn(),
        removeScanHistoryFile: jest.fn(),
    };

    beforeEach(() => {
        React.useContext
            .mockImplementationOnce(() => mockConfigContextValue)
            .mockImplementationOnce(() => mockGaContextValue)
            .mockImplementationOnce(() => mockScanHistoryContextValue);
    });

    it('should render properly', () => {
        const wrapper = shallow(<ScanHistory />);
        
        expect(wrapper.find('SidebarLayout').exists()).toBe(true);
    });   
});