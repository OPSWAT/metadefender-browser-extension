import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useState } from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { useBackgroundContext } from '../../../providers/Background';
import '../../../services/common/ga-tracking';
import './Header.scss';


const Header = () => {
    const { apikeyData, MCL } = useBackgroundContext();
    const [isUserLoggedIn, setIsUserLoggedin] = useState(apikeyData?.loggedIn || false);

    useEffect(() => {
        setIsUserLoggedin(apikeyData?.loggedIn || false);
    }, [apikeyData]);

    const handleLogin = () => {
        _gaq.push(['_trackEvent', MCL.config.gaEventCategory.name, MCL.config.gaEventCategory.action.buttonClickd, MCL.config.gaEventCategory.label.loginButton, MCL.config.gaEventCategory.value.loginButton]);
        const url = `${MCL.config.mclDomain}/login?extension`;
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
                    <span className="metadefender-chrome-logo"></span>
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