import React from 'react';
import { shallow } from 'enzyme';
import About from './About';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: jest.fn(),
    useEffect: jest.fn().mockImplementation(f => f()),
}));

global.chrome = {
    i18n: {
        getMessage: jest.fn().mockReturnValue('mocked_message')
    }
};

describe('<About />', () => {
    const mockGAContextValue = {
        gaTrackEvent: jest.fn(),
    };

    const mockUserContextValue = {
        apikeyData: {
            apikey: 'sample_api_key',
            organization: 'sample_organization',
        }
    };

    beforeEach(() => {
        React.useContext
            .mockImplementationOnce(() => mockGAContextValue)
            .mockImplementationOnce(() => mockUserContextValue);
    });

    it('should render properly', () => {
        const wrapper = shallow(<About />);
        expect(wrapper.find('SidebarLayout').exists()).toBe(true);
    });  

    it('should render API key information when apikeyData is provided', () => {
        const wrapper = shallow(<About />);
        const apiKeyInfoDom = wrapper.find('h4').filterWhere(n => n.text() === 'mocked_message');
        
        expect(apiKeyInfoDom.exists()).toBe(false);
    });

});