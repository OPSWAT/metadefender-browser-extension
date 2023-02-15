import { mount } from 'enzyme';
import React from 'react';
import { Nav } from 'react-bootstrap';
import BackgroundContext from '../../../providers/Background';
import Header from './Header';
import MCL from '../../../config/config';

describe('Header', () => {
    const openSpy = jest.spyOn(window, 'open');
    const headerLoggedInWrapper = mount(
        <BackgroundContext.Provider value={{ MCL, apikeyData: { loggedIn: true } }}>
            <Header />
        </BackgroundContext.Provider>
    );

    const headerWrapper = mount(
        <BackgroundContext.Provider value={{ MCL, apikeyData: { loggedIn: false } }}>
            <Header />
        </BackgroundContext.Provider>
    );

    it('should render without sign in button', () => {
        expect(headerLoggedInWrapper.find(Nav.Link)).toHaveLength(0);
    });

    it('should render with sign in button', () => {
        expect(headerWrapper.find(Nav.Link)).toHaveLength(1);
    });

    it('should call handleLogin', () => {
        headerWrapper.find(Nav.Link).simulate('click');

        expect(openSpy).toHaveBeenCalledWith('/* @echo mclDomain *//login?extension', 'Login', 'menubar=no,location=no,resizable=no,scrollbars=yes,status=yes,width=960,height=550');
    });
});
