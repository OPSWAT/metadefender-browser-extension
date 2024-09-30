import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useState, useContext } from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';

import ConfigContext from '../../../providers/ConfigProvider';
import UserContext from '../../../providers/UserProvider';


import './Header.scss';


const Header = () => {
    const config = useContext(ConfigContext);
    const { apikeyData } = useContext(UserContext);
    const [isUserLoggedIn, setIsUserLoggedin] = useState(apikeyData?.loggedIn || false);

    useEffect(() => {
        setIsUserLoggedin(apikeyData?.loggedIn || false);
    }, [apikeyData]);

    const handleLogin = () => {
        _gaq.push(['_trackEvent', config.gaEventCategory.name, config.gaEventCategory.action.buttonClickd, config.gaEventCategory.label.loginButton, config.gaEventCategory.value.loginButton]);
        const url = `${config.mclDomain}/login?extension`;
        const windowName = 'Login';
        const windowFeatures = 'menubar=no,location=no,resizable=no,scrollbars=yes,status=yes,width=960,height=550';

        if (window) {
            window.open(url, windowName, windowFeatures);
        }
    };

    const signInButtonDom = useMemo(() => {
        if (isUserLoggedIn) {
            return;
        }

        return <Nav.Link className="btn btn-primary text-uppercase border-0" onClick={handleLogin}>
            <span className="text-14">Sign In</span>
        </Nav.Link>;
    }, [isUserLoggedIn]);

    return <header className="header">
        <Container>
            <Navbar className="align-items-center pl-0 pr-0 main justify-content-between">
                <Navbar.Brand>
                    <span className="metadefender-logo"></span>
                </Navbar.Brand>

                {signInButtonDom}
            </Navbar>
        </Container>
    </header>;
};

Header.propTypes = {
    isUserLoggedIn: PropTypes.bool,
    handleLogin: PropTypes.func
};

export default Header;
