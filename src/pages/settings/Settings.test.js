import React from 'react';
import { shallow } from 'enzyme';
import Settings from './Settings'; 
import CheckboxData from './CheckboxData';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: jest.fn(),
    useEffect: jest.fn().mockImplementation(f => f()),
}));

describe('<Settings />', () => {
    const mockGAContextValue = {
        gaTrackEvent: jest.fn(),
    };

    const mockUserContextValue = {
        apikeyData: {},
    };

    const mockSettingsContextValue = {
        settingsData: {},
        updateSettings: jest.fn(),
        isAllowedFileSchemeAccess: false,
        getScanRules: jest.fn(),
    };

    beforeEach(() => {
        React.useContext
            .mockImplementationOnce(() => mockUserContextValue)
            .mockImplementationOnce(() => mockGAContextValue)
            .mockImplementationOnce(() => mockSettingsContextValue);
    });

    it('should render properly', () => {
        const wrapper = shallow(<Settings />);
        
        expect(wrapper.find('SidebarLayout').exists()).toBe(true);
    });

});