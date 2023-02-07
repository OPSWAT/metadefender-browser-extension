import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useState, useContext } from 'react';
import { Col, Row } from 'react-bootstrap';

import openSettingsImg from '../../assets/images/how-to/open-settings.png';
import scanWithOpswatImg from '../../assets/images/how-to/right-click.png';

import SidebarLayout from '../../components/common/sidebar-layout/SidebarLayout';
import GAContext from '../../providers/GAProvider';
import UserContext from '../../providers/UserProvider';

import './About.scss';

const LABELS = {
    apikey: 'API Key',
    limitInterval: 'Limit Interval',
    reputationLimit: 'Reputation API Limit',
    preventionLimit: 'Prevention API Limit',
    feedLimit: 'Feed API Limit',
    sandboxLimit: 'Sandbox API Limit',
    paidUser: 'Paid User',
    maxUploadFileSize: 'Maximum File Size',
};

const About = () => {

    const { gaTrackEvent } = useContext(GAContext);
    const { apikeyData } = useContext(UserContext);

    useEffect(() => {
        (async () => {
            gaTrackEvent(['_trackPageview', '/extension/about']);
        })();
    }, [apikeyData]);

    const aboutOpswatFileSecurityDom = <>
        <h3>{chrome.i18n.getMessage('aboutTitle')}</h3>
        <p dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('aboutThankYou') }} />
        <p dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('githubInfo') }} />
        <p dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('chromeExtensionHelp') }} />
    </>;

    const yourMetadefenderApiKeyInfoDom = useMemo(() => {
        if (!apikeyData) {
            return;
        }

        const hasOrganization = !!apikeyData.organization;

        return <>
            <h4>{chrome.i18n.getMessage('aboutApiKeyInfo')}</h4>
            <ul className="file-information info-group label-150">
                {
                    !apikeyData.apikey
                        ? <li><div className='spinner-border text-dark mb-4' role="status" /></li>
                        : Object.keys(LABELS).map((item) => {
                            if (!LABELS[item]) {
                                return;
                            }

                            return <li key={item}>
                                <label>{LABELS[item]}</label>
                                <span>{apikeyData[item]}</span>
                            </li>;
                        })
                }
                {!hasOrganization && <a href="https://www.opswat.com/contact" target="_blank" rel="noreferrer">{chrome.i18n.getMessage('contactOpswat')}</a>}
                {hasOrganization && <p>Your limits are controlled by the organization. <br /><a href="https://id-staging.opswat.com/organization/overview" target="_blank" rel="noreferrer">View organization details</a></p>}
            </ul>

            <p dangerouslySetInnerHTML={{ __html: chrome.i18n.getMessage('aboutMoreAboutMCL') }} />
        </>
    }, [apikeyData]);

    const howToUseDom = <>
        <h4>{chrome.i18n.getMessage('aboutHowToUse')}</h4>

        <Row className="mt-4">
            <Col xs={12} sm={6}>
                <em>{chrome.i18n.getMessage('aboutHowTo1')}</em>
            </Col>
            <Col xs={12} sm={6} className="text-center text-xs-left">
                <img src={scanWithOpswatImg} className="img-fluid" alt="Scan with OPSWAT option" />
            </Col>
        </Row>

        <Row className="mt-4">
            <Col xs={{ span: 12, order: 1 }} sm={{ span: 6, order: 0 }} className="mt-xs-0 mt-4 text-center text-xs-left">
                <img src={openSettingsImg} className="img-fluid" alt="Open Extension Settings" />
            </Col>
            <Col xs={{ span: 12, order: 0 }} sm={{ span: 6, order: 1 }}>
                <em>{chrome.i18n.getMessage('howToOpenSettings')}</em>
            </Col>
        </Row>
    </>;

    const content = <>
        {aboutOpswatFileSecurityDom}
        {yourMetadefenderApiKeyInfoDom}
        {howToUseDom}
    </>;

    return <SidebarLayout
        className='about'
        currentPage='about'
        content={content}
    />;
};

About.propTypes = {
    apikeyData: PropTypes.any
};

export default About;
