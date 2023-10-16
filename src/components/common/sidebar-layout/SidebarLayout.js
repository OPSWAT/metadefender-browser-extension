import { Link } from '@reach/router';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Header from '../header/Header';
import './SidebarLayout.scss';


const MENU_ITEMS = [
    {
        label: chrome.i18n.getMessage('menuScanHistory'),
        path: 'index.html#/history',
        page: 'history'
    },
    {
        label: chrome.i18n.getMessage('menuSettings'),
        path: 'index.html#/settings',
        page: 'settings'
    },
    {
        label: chrome.i18n.getMessage('menuAbout'),
        path: 'index.html#/about',
        page: 'about'
    }
];

const SidebarLayout = ({ className, content, currentPage }) => {
    const navigate = useNavigate();

    const handleOnMenuClick = (page) => {
        if (page !== currentPage) {
            navigate(`${page}`);
        }
    };

    const leftMenuDom = useMemo(() => {
        return MENU_ITEMS.map((item, index) => <li key={index} className='list-group-item pl-sm-0'><Link to={`/${item.path}`} className={`${item.page === currentPage && 'active'}`} onClick={() => handleOnMenuClick(item.page)}>{item.label}</Link></li>);
    }, [currentPage]);

    return <div className={`sidebar--layout ${className}`}>
        <Header />

        <Container>
            <Row className="pt-md-5 pb-md-5 pt-3 pb-3">
                <Col sm={3} xs={12}>
                    <ul className="sidebar--menu list-group">
                        {leftMenuDom}
                    </ul>
                </Col>
                <Col sm={9} xs={12} className="sidebar--content">
                    <Col xs={12} className="p-0 pl-md-4 pr-md-4">
                        {content}
                    </Col>
                </Col>
            </Row>
        </Container>
    </div>;
};

SidebarLayout.propTypes = {
    className: PropTypes.string,
    content: PropTypes.node,
    currentPage: PropTypes.string,
};

export default SidebarLayout;