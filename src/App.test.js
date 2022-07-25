import React from 'react';
import { shallow } from 'enzyme';
import App from './App';
import { Switch } from 'react-router-dom';

describe('App', () => {
    it('should render correct', () => {
        const appWrapper = shallow(<App />);

        expect(appWrapper.find(Switch)).toHaveLength(1);
    });
});