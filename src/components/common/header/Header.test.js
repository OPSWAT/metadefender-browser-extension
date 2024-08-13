import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { shallow } from 'enzyme';
import '@testing-library/jest-dom/extend-expect';
import { UserContext } from '../../../providers/UserProvider';
import { ConfigContext } from '../../../providers/ConfigProvider';
import Header from './Header';

const mockConfigValue = {
    gaEventCategory: {
        name: 'testName',
        action: { buttonClickd: 'testButtonClickd' },
        label: { loginButton: 'testLoginButton' },
        value: { loginButton: 'testLoginButtonValue' }
    },
    mclDomain: 'http://testDomain'
};

const mockUserValue = {
    apikeyData: {
        loggedIn: false
    }
};

describe('Header Component', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    test('renders sign in button when user is not logged in', () => {
        render(
            <ConfigContext.Provider value={mockConfigValue}>
                <UserContext.Provider value={mockUserValue}>
                    <Header />
                </UserContext.Provider>
            </ConfigContext.Provider>
        );

        expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    test('does not render sign in button when user is logged in', () => {
        const loggedInUserValue = {
            apikeyData: {
                loggedIn: true
            }
        };

        render(
            <ConfigContext.Provider value={mockConfigValue}>
                <UserContext.Provider value={loggedInUserValue}>
                    <Header />
                </UserContext.Provider>
            </ConfigContext.Provider>
        );

        expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });


    xtest('calls window.open with correct arguments on login button click', () => {
        const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

        render(
            <ConfigContext.Provider value={mockConfigValue}>
                <UserContext.Provider value={mockUserValue}>
                    <Header />
                </UserContext.Provider>
            </ConfigContext.Provider>
        );

        fireEvent.click(screen.getByText('Sign In'));

        expect(windowOpenSpy).toHaveBeenCalledWith(
            `${mockConfigValue.mclDomain}/login?extension`,
            'Login',
            'menubar=no,location=no,resizable=no,scrollbars=yes,status=yes,width=960,height=550'
        );
    });


});
